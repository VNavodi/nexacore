import { authFetch, getAuthHeaders } from "@/lib/auth-fetch"

// API Base URL - prefer env var; fallback supports local Spring on 8081.
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL
const API_BASE_URLS = API_BASE_URL
  ? [API_BASE_URL]
  : ["http://localhost:8080/api/v1", "http://localhost:8081/api/v1"]

export interface CustomAttribute {
  key: string;
  value: string;
}

export interface ProductRequest {
  sku: string;
  name: string;
  category: string;
  costPrice: number;
  sellingPrice: number;
  openingStock: number;
  reorderLevel: number;
}

export interface StockAdjustmentRequest {
  sku: string;
  quantity: number;
  operation: string;
  reason?: string;
  notes?: string;
}


export interface ProductResponse {
  id: number;
  sku: string;
  name: string;
  category: string;
  costPrice: number;
  sellingPrice: number;
  reorderLevel: number;
  stockOnHand: number;
  createdAt: string;
  updatedAt: string;
}

export class ProductAPI {
  private static async requestWithFallback(path: string, init: RequestInit): Promise<Response> {
    let lastResponse: Response | null = null
    let lastError: Error | null = null

    for (let i = 0; i < API_BASE_URLS.length; i++) {
      const baseUrl = API_BASE_URLS[i]
      try {
        const response = await authFetch(`${baseUrl}${path}`, init)
        lastResponse = response

        // Retry next base URL only when first local URL is forbidden/unavailable.
        const shouldRetry =
          i < API_BASE_URLS.length - 1 &&
          !API_BASE_URL &&
          (response.status === 403 || response.status === 404 || response.status === 405 || response.status >= 500)

        if (shouldRetry) {
          continue
        }
        return response
      } catch (error) {
        lastError = error instanceof Error ? error : new Error("Network request failed")
        if (i < API_BASE_URLS.length - 1) {
          continue
        }
      }
    }

    if (lastResponse) {
      return lastResponse
    }
    throw lastError ?? new Error("Network request failed")
  }

  private static async getErrorMessage(response: Response, fallback: string): Promise<string> {
    const text = await response.text()
    if (!text) return fallback

    try {
      const parsed = JSON.parse(text)
      if (typeof parsed?.message === "string" && parsed.message.trim()) {
        return parsed.message
      }
      return text
    } catch {
      return text
    }
  }

  /**
   * Create a new product
   */
  static async createProduct(data: ProductRequest): Promise<ProductResponse> {
    const response = await this.requestWithFallback("/products", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...getAuthHeaders(),
      },
      body: JSON.stringify(data),
    })

    if (response.ok) {
      return response.json()
    }

    // Backward compatibility for older backend contract
    if (response.status === 400 || response.status === 403) {
      const legacyPayload = {
        sku: data.sku,
        name: data.name,
        category: data.category,
        price: data.sellingPrice,
        stockQuantity: data.openingStock,
      }

      const retryResponse = await this.requestWithFallback("/products", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...getAuthHeaders(),
        },
        body: JSON.stringify(legacyPayload),
      })

      if (retryResponse.ok) {
        return retryResponse.json()
      }

      const retryMessage = await this.getErrorMessage(retryResponse, "Failed to create product")
      throw new Error(retryMessage)
    }

    if (!response.ok) {
      const message = await this.getErrorMessage(response, "Failed to create product")
      throw new Error(message)
    }

    return response.json()
  }

  /**
   * Update an existing product
   */
  static async updateProduct(
    id: number,
    data: ProductRequest
  ): Promise<ProductResponse> {
    const response = await this.requestWithFallback(`/products/${id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        ...getAuthHeaders(),
      },
      body: JSON.stringify(data),
    })

    if (!response.ok) {
      const message = await this.getErrorMessage(response, "Failed to update product")
      throw new Error(message)
    }

    return response.json()
  }

  /**
   * Get all products
   */
  static async getAllProducts(): Promise<ProductResponse[]> {
    const response = await this.requestWithFallback("/products", {
      method: "GET",
      headers: getAuthHeaders(),
    })

    if (!response.ok) {
      const message = await this.getErrorMessage(response, "Failed to fetch products")
      throw new Error(message)
    }

    return response.json()
  }

  /**
   * Get product by ID
   */
  static async getProductById(id: number): Promise<ProductResponse> {
    const response = await this.requestWithFallback(`/products/${id}`, {
      method: "GET",
      headers: getAuthHeaders(),
    })

    if (!response.ok) {
      const message = await this.getErrorMessage(response, "Product not found")
      throw new Error(message)
    }

    return response.json()
  }

  /**
   * Delete product
   */
  static async deleteProduct(id: number): Promise<void> {
    const response = await this.requestWithFallback(`/products/${id}`, {
      method: "DELETE",
      headers: getAuthHeaders(),
    })

    if (!response.ok) {
      const message = await this.getErrorMessage(response, "Failed to delete product")
      throw new Error(message)
    }
  }

  /**
   * Get products by category
   */
  static async getProductsByCategory(
    category: string
  ): Promise<ProductResponse[]> {
    const response = await this.requestWithFallback(`/products/category/${category}`, {
      method: "GET",
      headers: getAuthHeaders(),
    })

    if (!response.ok) {
      const message = await this.getErrorMessage(response, "Failed to fetch products by category")
      throw new Error(message)
    }

    return response.json()
  }

  /**
   * Get low stock products
   */
  static async getLowStockProducts(): Promise<ProductResponse[]> {
    const response = await this.requestWithFallback("/products/low-stock", {
      method: "GET",
      headers: getAuthHeaders(),
    })

    if (!response.ok) {
      const message = await this.getErrorMessage(response, "Failed to fetch low stock products")
      throw new Error(message)
    }

    return response.json()
  }
  /**
   * Adjust stock for a product
   */
  static async adjustStock(data: StockAdjustmentRequest): Promise<ProductResponse> {
    const response = await this.requestWithFallback("/inventory/stock-adjustments", {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        ...getAuthHeaders(),
      },
      body: JSON.stringify(data),
    })

    if (!response.ok) {
      const message = await this.getErrorMessage(response, "Failed to adjust stock")
      throw new Error(message)
    }

    return response.json()
  }
}
