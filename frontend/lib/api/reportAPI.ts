import { authFetch, getAuthHeaders } from "@/lib/auth-fetch"

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL
const API_BASE_URLS = API_BASE_URL
  ? [API_BASE_URL]
  : ["http://localhost:8080/api/v1", "http://localhost:8081/api/v1"]

export interface SalesSummaryResponse {
  date: string;
  invoiceCount: number;
  totalAmount: number;
}

export class ReportAPI {
  private static async requestWithFallback(path: string, init: RequestInit): Promise<Response> {
    let lastResponse: Response | null = null
    let lastError: Error | null = null

    for (let i = 0; i < API_BASE_URLS.length; i++) {
      const baseUrl = API_BASE_URLS[i]
      try {
        const response = await authFetch(`${baseUrl}${path}`, init)
        lastResponse = response

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

  static async getSalesSummary(): Promise<SalesSummaryResponse[]> {
    const response = await this.requestWithFallback("/invoices/summary", {
      method: "GET",
      headers: getAuthHeaders(),
    })

    if (!response.ok) {
      throw new Error("Failed to fetch sales summary")
    }

    return response.json()
  }
}
