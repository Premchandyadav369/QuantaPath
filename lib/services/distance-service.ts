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

interface OpenRouteServiceInstruction {
  distance: number;
  duration: number;
  instruction: string;
  type: number;
  way_points: [number, number];
  coordinate: [number, number];
}

interface OpenRouteServiceSegment {
  distance: number;
  duration: number;
  steps: OpenRouteServiceInstruction[];
}

interface OpenRouteServiceProperties {
  segments: OpenRouteServiceSegment[];
  summary: {
    distance: number;
    duration: number;
  };
}

interface OpenRouteServiceFeature {
  geometry: {
    coordinates: [number, number][];
  };
  properties: OpenRouteServiceProperties;
}

interface OpenRouteServiceResponse {
  features: OpenRouteServiceFeature[];
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
      case "openrouteservice":
        matrix = await this.calculateOpenRouteMatrix(request)
        break
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
    const apiKey = process.env.GOOGLE_MAPS_API_KEY

    if (!apiKey) {
      console.warn("Google Maps API key not found, falling back to OpenRouteService")
      return this.calculateOpenRouteMatrix(request)
    }

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

      interface GoogleDistanceMatrixElement {
        status: string;
        distance: {
          value: number;
        };
        duration: {
          value: number;
        };
      }

      interface GoogleDistanceMatrixRow {
        elements: GoogleDistanceMatrixElement[];
      }

      data.rows.forEach((row: GoogleDistanceMatrixRow, i: number) => {
        distances[i] = []
        durations[i] = []

        row.elements.forEach((element: GoogleDistanceMatrixElement, j: number) => {
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
      console.warn("Google Maps API failed, falling back to OpenRouteService:", error)
      return this.calculateOpenRouteMatrix(request)
    }
  }

  private async calculateOpenRouteMatrix(request: DistanceMatrixRequest): Promise<DistanceMatrix> {
    const apiKey = process.env.OPENROUTE_API_KEY

    if (!apiKey) {
      console.warn("OpenRoute API key not found, falling back to Haversine")
      return this.calculateHaversineMatrix(request)
    }

    try {
      const coordinates = request.stops.map((stop) => {
        const coords = getCoordinates(stop)
        return [coords.lng, coords.lat] // OpenRoute uses [lng, lat] format
      })

      const response = await fetch("https://api.openrouteservice.org/v2/matrix/driving-car", {
        method: "POST",
        headers: {
          Authorization: apiKey,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          locations: coordinates,
          metrics: ["distance", "duration"],
          units: "km",
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(`OpenRoute API error: ${data.error?.message || response.statusText}`)
      }

      return {
        distances: data.distances,
        durations: data.durations?.map((row: number[]) => row.map((d: number) => d / 60)), // Convert to minutes
        units: "km",
        source: "openrouteservice",
      }
    } catch (error) {
      console.warn("OpenRoute API failed, falling back to Haversine:", error)
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

  async getDetailedRoute(stops: DeliveryStop[], tour: number[]): Promise<DetailedRoute> {
    const apiKey = process.env.OPENROUTE_API_KEY

    if (!apiKey) {
      console.warn("OpenRoute API key not found, using fallback routing")
      return this.getFallbackDetailedRoute(stops, tour)
    }

    try {
      const coordinates = tour.map((index) => {
        const stop = stops[index]
        return [stop.lng, stop.lat] // OpenRoute uses [lng, lat] format
      })

      const response = await fetch("https://api.openrouteservice.org/v2/directions/driving-car/geojson", {
        method: "POST",
        headers: {
          Authorization: apiKey,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          coordinates,
          instructions: true,
          geometry: true,
          elevation: false,
          extra_info: ["steepness", "surface"],
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(`OpenRoute Directions API error: ${data.error?.message || response.statusText}`)
      }

      return this.parseOpenRouteResponse(data, stops, tour)
    } catch (error) {
      console.warn("OpenRoute Directions API failed, using fallback:", error)
      return this.getFallbackDetailedRoute(stops, tour)
    }
  }

  private parseOpenRouteResponse(data: OpenRouteServiceResponse, stops: DeliveryStop[], tour: number[]): DetailedRoute {
    const feature = data.features[0]
    const geometry = feature.geometry.coordinates
    const properties = feature.properties
    const segments = properties.segments || []
    const instructions = properties.segments?.flatMap((seg) => seg.steps || []) || []

    const routeSegments: RouteSegment[] = []
    let segmentIndex = 0

    for (let i = 0; i < tour.length - 1; i++) {
      const fromStop = stops[tour[i]]
      const toStop = stops[tour[i + 1]]

      const segment = segments[segmentIndex] || {}
      const segmentInstructions = this.extractInstructionsForSegment(instructions, segmentIndex)

      routeSegments.push({
        fromStop,
        toStop,
        distance: (segment.distance || 0) / 1000, // Convert to km
        duration: (segment.duration || 0) / 60, // Convert to minutes
        geometry: geometry.slice(segment.geometry_start || 0, segment.geometry_end || geometry.length),
        instructions: segmentInstructions,
      })

      segmentIndex++
    }

    return {
      segments: routeSegments,
      totalDistance: (properties.summary?.distance || 0) / 1000,
      totalDuration: (properties.summary?.duration || 0) / 60,
      geometry,
    }
  }

  private extractInstructionsForSegment(instructions: OpenRouteServiceInstruction[], segmentIndex: number): TurnInstruction[] {
    return instructions
      .filter((inst) => inst.way_points?.[0] >= segmentIndex)
      .slice(0, 5) // Limit to 5 instructions per segment
      .map((inst) => ({
        type: this.mapInstructionType(inst.type),
        instruction: inst.instruction || "Continue straight",
        distance: (inst.distance || 0) / 1000,
        duration: (inst.duration || 0) / 60,
        coordinate: inst.coordinate || [0, 0],
      }))
  }

  private mapInstructionType(type: number): TurnInstruction["type"] {
    const typeMap: { [key: number]: TurnInstruction["type"] } = {
      0: "straight",
      1: "right",
      2: "sharp-right",
      3: "u-turn",
      4: "sharp-left",
      5: "left",
      6: "straight",
      7: "straight",
      8: "straight",
      9: "straight",
      10: "straight",
      11: "straight",
      12: "straight",
    }
    return typeMap[type] || "straight"
  }

  private getFallbackDetailedRoute(stops: DeliveryStop[], tour: number[]): DetailedRoute {
    const segments: RouteSegment[] = []
    let totalDistance = 0
    let totalDuration = 0
    const geometry: [number, number][] = []

    for (let i = 0; i < tour.length - 1; i++) {
      const fromStop = stops[tour[i]]
      const toStop = stops[tour[i + 1]]

      const distance = haversineDistance(fromStop.lat, fromStop.lng, toStop.lat, toStop.lng)
      const duration = distance * 2 // 30 km/h average speed

      // Generate simple straight-line geometry
      const segmentGeometry: [number, number][] = [
        [fromStop.lng, fromStop.lat],
        [toStop.lng, toStop.lat],
      ]

      // Generate simple turn instruction
      const bearing = this.calculateBearing(fromStop, toStop)
      const instruction = this.generateTurnInstruction(
        bearing,
        i > 0 ? this.calculateBearing(stops[tour[i - 1]], fromStop) : 0,
      )

      segments.push({
        fromStop,
        toStop,
        distance,
        duration,
        geometry: segmentGeometry,
        instructions: [instruction],
      })

      totalDistance += distance
      totalDuration += duration
      geometry.push(...segmentGeometry)
    }

    return {
      segments,
      totalDistance,
      totalDuration,
      geometry,
    }
  }

  private calculateBearing(from: DeliveryStop, to: DeliveryStop): number {
    const dLon = ((to.lng - from.lng) * Math.PI) / 180
    const lat1 = (from.lat * Math.PI) / 180
    const lat2 = (to.lat * Math.PI) / 180

    const y = Math.sin(dLon) * Math.cos(lat2)
    const x = Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLon)

    return ((Math.atan2(y, x) * 180) / Math.PI + 360) % 360
  }

  private generateTurnInstruction(currentBearing: number, previousBearing: number): TurnInstruction {
    const angleDiff = ((currentBearing - previousBearing + 540) % 360) - 180

    let type: TurnInstruction["type"] = "straight"
    let instruction = "Continue straight"

    if (Math.abs(angleDiff) > 150) {
      type = "u-turn"
      instruction = "Make a U-turn"
    } else if (angleDiff > 45) {
      type = angleDiff > 120 ? "sharp-right" : "right"
      instruction = angleDiff > 120 ? "Turn sharp right" : "Turn right"
    } else if (angleDiff < -45) {
      type = angleDiff < -120 ? "sharp-left" : "left"
      instruction = angleDiff < -120 ? "Turn sharp left" : "Turn left"
    }

    return {
      type,
      instruction,
      distance: 0,
      duration: 0,
      coordinate: [0, 0],
    }
  }

  clearCache(): void {
    this.cache.clear()
  }
}
