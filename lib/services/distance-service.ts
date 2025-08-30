import polyline from "google-polyline";
import type { DeliveryStop, DistanceMatrix, DistanceMatrixRequest } from "@/lib/types"

// Haversine distance calculation for fallback
function haversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371 // Earth's radius in kilometers
  const dLat = ((lat2 - lat1) * Math.PI) / 180
  const dLon = ((lon2 - lon1) * Math.PI) / 180
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) * Math.sin(dLon / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c
}

function getCoordinates(stop: DeliveryStop): { lat: number; lng: number } {
  return { lat: stop.lat, lng: stop.lng }
}

export interface RouteSegment {
  fromStop: DeliveryStop
  toStop: DeliveryStop
  distance: number
  duration: number
  geometry: [number, number][]
  instructions: TurnInstruction[]
}

export interface TurnInstruction {
  type: "straight" | "left" | "right" | "sharp-left" | "sharp-right" | "u-turn"
  instruction: string
  distance: number
  duration: number
  coordinate: [number, number]
}

export interface DetailedRoute {
  segments: RouteSegment[]
  totalDistance: number
  totalDuration: number
  geometry: [number, number][]
}

export class DistanceService {
  private static instance: DistanceService
  private cache = new Map<string, DistanceMatrix>()

  static getInstance(): DistanceService {
    if (!DistanceService.instance) {
      DistanceService.instance = new DistanceService()
    }
    return DistanceService.instance
  }

  async calculateMatrix(request: DistanceMatrixRequest): Promise<DistanceMatrix> {
    const cacheKey = JSON.stringify(request)

    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey)!
    }

    let matrix: DistanceMatrix

    switch (request.source) {
      case "google":
        matrix = await this.calculateGoogleMatrix(request)
        break
      case "haversine":
      default:
        matrix = await this.calculateHaversineMatrix(request)
        break
    }

    this.cache.set(cacheKey, matrix)
    return matrix
  }

  private async calculateGoogleMatrix(request: DistanceMatrixRequest): Promise<DistanceMatrix> {
    const apiKey = "AIzaSyCU4fXg2nd8GS4TISLrRAnES3_6ZQ01a9U"

    try {
      const origins = request.stops
        .map((stop) => {
          const coords = getCoordinates(stop)
          return `${coords.lat},${coords.lng}`
        })
        .join("|")

      const destinations = origins // Same for TSP

      const url = `https://maps.googleapis.com/maps/api/distancematrix/json?origins=${origins}&destinations=${destinations}&units=metric&key=${apiKey}`

      const response = await fetch(url)
      const data = await response.json()

      if (data.status !== "OK") {
        throw new Error(`Google API error: ${data.status}`)
      }

      const distances: number[][] = []
      const durations: number[][] = []

      data.rows.forEach((row: any, i: number) => {
        distances[i] = []
        durations[i] = []

        row.elements.forEach((element: any, j: number) => {
          if (element.status === "OK") {
            distances[i][j] = element.distance.value / 1000 // Convert to km
            durations[i][j] = element.duration.value / 60 // Convert to minutes
          } else {
            // Fallback to Haversine for failed elements
            const coords1 = getCoordinates(request.stops[i])
            const coords2 = getCoordinates(request.stops[j])
            distances[i][j] = haversineDistance(coords1.lat, coords1.lng, coords2.lat, coords2.lng)
            durations[i][j] = distances[i][j] * 2 // Rough estimate: 30 km/h average
          }
        })
      })

      return {
        distances,
        durations,
        units: "km",
        source: "google",
      }
    } catch (error) {
      console.warn("Google Maps API failed, falling back to Haversine distance:", error)
      return this.calculateHaversineMatrix(request)
    }
  }

  private async calculateHaversineMatrix(request: DistanceMatrixRequest): Promise<DistanceMatrix> {
    const stops = request.stops
    const distances: number[][] = []
    const durations: number[][] = []

    for (let i = 0; i < stops.length; i++) {
      distances[i] = []
      durations[i] = []

      const coords1 = getCoordinates(stops[i])

      for (let j = 0; j < stops.length; j++) {
        if (i === j) {
          distances[i][j] = 0
          durations[i][j] = 0
        } else {
          const coords2 = getCoordinates(stops[j])
          const distance = haversineDistance(coords1.lat, coords1.lng, coords2.lat, coords2.lng)
          distances[i][j] = distance
          durations[i][j] = distance * 2 // Rough estimate: 30 km/h average speed
        }
      }
    }

    return {
      distances,
      durations,
      units: "km",
      source: "haversine",
    }
  }


  clearCache(): void {
    this.cache.clear()
  }
}
