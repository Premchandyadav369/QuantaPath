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
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY

    if (!apiKey) {
      console.warn("Google Maps API key not found, falling back to Haversine distance")
      return this.calculateHaversineMatrix(request)
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

  async getDetailedRoute(stops: DeliveryStop[], tour: number[]): Promise<DetailedRoute> {
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

    if (!apiKey) {
      console.warn("Google Maps API key not found, using fallback routing");
      return this.getFallbackDetailedRoute(stops, tour);
    }

    if (tour.length < 2) {
      return this.getFallbackDetailedRoute(stops, tour);
    }

    try {
      const tourStops = tour.map(i => stops[i]);
      const origin = `${tourStops[0].lat},${tourStops[0].lng}`;
      const destination = `${tourStops[tourStops.length - 1].lat},${tourStops[tourStops.length - 1].lng}`;
      const waypoints = tourStops
        .slice(1, -1)
        .map(stop => `${stop.lat},${stop.lng}`)
        .join("|");

      const url = `https://maps.googleapis.com/maps/api/directions/json?origin=${origin}&destination=${destination}&waypoints=${waypoints}&key=${apiKey}`;

      const response = await fetch(url);
      const data = await response.json();

      if (data.status !== "OK") {
        throw new Error(`Google Directions API error: ${data.status} - ${data.error_message || ''}`);
      }

      return this.parseGoogleDirectionsResponse(data, tourStops);
    } catch (error) {
      console.warn("Google Directions API failed, using fallback:", error);
      return this.getFallbackDetailedRoute(stops, tour);
    }
  }

  private parseGoogleDirectionsResponse(data: any, tourStops: DeliveryStop[]): DetailedRoute {
    const route = data.routes[0];
    if (!route) {
      throw new Error("No route found in Google Directions response");
    }

    const fullGeometry = polyline.decode(route.overview_polyline.points).map(p => [p[1], p[0]]);
    let totalDistance = 0;
    let totalDuration = 0;
    const routeSegments: RouteSegment[] = [];

    route.legs.forEach((leg: any, legIndex: number) => {
      totalDistance += leg.distance.value;
      totalDuration += leg.duration.value;

      const fromStop = tourStops[legIndex];
      const toStop = tourStops[legIndex + 1];

      const legGeometry = leg.steps.flatMap(step => polyline.decode(step.polyline.points).map(p => [p[1], p[0]]));

      const instructions = leg.steps.map((step: any): TurnInstruction => ({
        type: this.mapGoogleInstructionType(step.maneuver),
        instruction: step.html_instructions.replace(/<[^>]*>/g, ""), // Strip HTML tags
        distance: step.distance.value / 1000, // to km
        duration: step.duration.value / 60, // to minutes
        coordinate: [step.start_location.lng, step.start_location.lat],
      }));

      routeSegments.push({
        fromStop,
        toStop,
        distance: leg.distance.value / 1000, // to km
        duration: leg.duration.value / 60, // to minutes
        geometry: legGeometry,
        instructions,
      });
    });

    return {
      segments: routeSegments,
      totalDistance: totalDistance / 1000, // to km
      totalDuration: totalDuration / 60, // to minutes
      geometry: fullGeometry,
    };
  }

  private mapGoogleInstructionType(maneuver?: string): TurnInstruction['type'] {
    if (!maneuver) return 'straight';
    if (maneuver.includes('turn-sharp-left')) return 'sharp-left';
    if (maneuver.includes('turn-slight-left')) return 'left';
    if (maneuver.includes('merge')) return 'straight';
    if (maneuver.includes('roundabout-left')) return 'left';
    if (maneuver.includes('turn-left')) return 'left';
    if (maneuver.includes('turn-sharp-right')) return 'sharp-right';
    if (maneuver.includes('turn-slight-right')) return 'right';
    if (maneuver.includes('roundabout-right')) return 'right';
    if (maneuver.includes('turn-right')) return 'right';
    if (maneuver.includes('uturn')) return 'u-turn';
    return 'straight';
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
