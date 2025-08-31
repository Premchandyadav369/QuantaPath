import type { OptimizationRequest, OptimizationResponse, DistanceMatrixRequest, DistanceMatrix } from "@/lib/types"

export class ApiClient {
  private static instance: ApiClient
  private baseUrl: string

  constructor(baseUrl = "") {
    this.baseUrl = baseUrl
  }

  static getInstance(): ApiClient {
    if (!ApiClient.instance) {
      ApiClient.instance = new ApiClient()
    }
    return ApiClient.instance
  }

  async calculateDistanceMatrix(request: DistanceMatrixRequest): Promise<DistanceMatrix> {
    const response = await fetch(`${this.baseUrl}/api/distance/matrix`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(request),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || "Failed to calculate distance matrix")
    }

    return response.json()
  }

  async geocode(address: string): Promise<any[]> {
    const response = await fetch(`${this.baseUrl}/api/geocode`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ address }),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || "Failed to geocode address")
    }

    return response.json()
  }

  async optimizeRoutes(request: OptimizationRequest): Promise<OptimizationResponse> {
    const response = await fetch(`${this.baseUrl}/api/optimize`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(request),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || "Failed to optimize routes")
    }

    return response.json()
  }
}
