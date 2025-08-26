import type { DeliveryStop } from "@/lib/types"

export interface ChargingStation {
  lat: number
  lng: number
  name: string
  address: string
  country: string
  num_connectors: number
}

export class EVRoutingService {
  private static instance: EVRoutingService

  static getInstance(): EVRoutingService {
    if (!EVRoutingService.instance) {
      EVRoutingService.instance = new EVRoutingService()
    }
    return EVRoutingService.instance
  }

  /**
   * Finds EV charging stations near a given geographic coordinate.
   * @param lat The latitude of the search center.
   * @param lng The longitude of the search center.
   * @param distance The search radius in kilometers.
   * @returns A promise that resolves to an array of charging stations.
   */
  async findChargingStations(lat: number, lng: number, distance: number = 10): Promise<ChargingStation[]> {
    const apiKey = process.env.NEXT_PUBLIC_APININJAS_EV_API_KEY

    if (!apiKey) {
      console.error("API Ninjas EV Charger API key is not configured.")
      // In a real app, you might want to return a specific error or an empty array.
      // For the hackathon, we'll log the error and return an empty array.
      return []
    }

    const url = `https://api.api-ninjas.com/v1/evcharger?lat=${lat}&lon=${lng}&distance=${distance}`

    try {
      const response = await fetch(url, {
        headers: {
          "X-Api-Key": apiKey,
        },
      })

      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`API Ninjas API error: ${response.status} ${errorText}`)
      }

      const data = await response.json()

      // Map the API response to our simplified ChargingStation interface
      return data.map((station: any) => ({
        lat: station.latitude,
        lng: station.longitude,
        name: station.name || "Unnamed Station",
        address: station.address || "No address provided",
        country: station.country || "N/A",
        num_connectors: station.connections?.reduce((sum: number, conn: any) => sum + (conn.num_connectors || 0), 0) || 0,
      }))

    } catch (error) {
      console.error("Failed to fetch charging stations:", error)
      return []
    }
  }
}
