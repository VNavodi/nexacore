const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL
const API_BASE_URLS = API_BASE_URL
  ? [API_BASE_URL]
  : ["http://localhost:8080/api/v1", "http://localhost:8081/api/v1"]

export interface VendorSuppliedProductRequest {
  productName: string
  category: string
}

export interface VendorSuppliedProductResponse {
  id: number
  productName: string
  category: string
}

export interface VendorRequest {
  companyName: string
  phone?: string
  email?: string
  accountName?: string
  bankName?: string
  branchName?: string
  accountNumber?: string
  suppliedProducts: VendorSuppliedProductRequest[]
}

export interface VendorResponse {
  id: number
  companyName: string
  phone?: string
  email?: string
  accountName?: string
  bankName?: string
  branchName?: string
  accountNumber?: string
  suppliedProducts: VendorSuppliedProductResponse[]
  createdAt: string
  updatedAt: string
}

export class VendorAPI {
  private static async requestWithFallback(path: string, init: RequestInit): Promise<Response> {
    let lastResponse: Response | null = null
    let lastError: Error | null = null

    for (let i = 0; i < API_BASE_URLS.length; i++) {
      const baseUrl = API_BASE_URLS[i]
      try {
        const response = await fetch(`${baseUrl}${path}`, init)
        lastResponse = response

        const shouldRetry =
          i < API_BASE_URLS.length - 1 &&
          !API_BASE_URL &&
          (response.status === 403 || response.status === 404 || response.status === 405 || response.status >= 500)

        if (shouldRetry) continue
        return response
      } catch (error) {
        lastError = error instanceof Error ? error : new Error("Network request failed")
        if (i < API_BASE_URLS.length - 1) continue
      }
    }

    if (lastResponse) return lastResponse
    throw lastError ?? new Error("Network request failed")
  }

  private static getAuthHeaders(): Record<string, string> {
    const headers: Record<string, string> = {}
    if (typeof window !== "undefined") {
      const token = localStorage.getItem("token")
      if (token) headers.Authorization = `Bearer ${token}`
    }
    return headers
  }

  private static async getErrorMessage(response: Response, fallback: string): Promise<string> {
    const text = await response.text()
    if (!text) return fallback

    try {
      const parsed = JSON.parse(text)
      if (typeof parsed?.message === "string" && parsed.message.trim()) return parsed.message
      return text
    } catch {
      return text
    }
  }

  static async getAllVendors(): Promise<VendorResponse[]> {
    const response = await this.requestWithFallback("/vendors", {
      method: "GET",
      headers: this.getAuthHeaders(),
    })

    if (!response.ok) {
      const message = await this.getErrorMessage(response, "Failed to fetch vendors")
      throw new Error(message)
    }

    return response.json()
  }

  static async createVendor(data: VendorRequest): Promise<VendorResponse> {
    const response = await this.requestWithFallback("/vendors", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...this.getAuthHeaders(),
      },
      body: JSON.stringify(data),
    })

    if (!response.ok) {
      const message = await this.getErrorMessage(response, "Failed to create vendor")
      throw new Error(message)
    }

    return response.json()
  }

  static async updateVendor(id: number, data: VendorRequest): Promise<VendorResponse> {
    const response = await this.requestWithFallback(`/vendors/${id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        ...this.getAuthHeaders(),
      },
      body: JSON.stringify(data),
    })

    if (!response.ok) {
      const message = await this.getErrorMessage(response, "Failed to update vendor")
      throw new Error(message)
    }

    return response.json()
  }

  static async deleteVendor(id: number): Promise<void> {
    const response = await this.requestWithFallback(`/vendors/${id}`, {
      method: "DELETE",
      headers: this.getAuthHeaders(),
    })

    if (!response.ok) {
      const message = await this.getErrorMessage(response, "Failed to delete vendor")
      throw new Error(message)
    }
  }
}
