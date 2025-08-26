import { type NextRequest, NextResponse } from "next/server"
import { DistanceService } from "@/lib/services/distance-service"
import { ClassicalService } from "@/lib/services/classical-service"
import type { DeliveryStop, RouteResult } from "@/lib/types"

// Simplified request format for the public API
interface PublicApiRequest {
  locations: Array<{
    lat: number
    lng: number
    name?: string
    isDepot?: boolean
  }>
  vehicles?: number
  solver?: "fast" | "balanced" // Simple solver presets
}

// Simplified response format
interface PublicApiResponse {
  total_distance: number
  units: "km" | "miles"
  tours: Array<Array<{ lat: number; lng: number; name: string }>>
  solver_used: string
  runtime_ms: number
}

export async function POST(request: NextRequest) {
  try {
    const body: PublicApiRequest = await request.json()

    // 1. Validate request
    if (!body.locations || body.locations.length < 2) {
      return NextResponse.json({ error: "At least 2 locations are required" }, { status: 400 })
    }
    const hubs = body.locations.filter((l) => l.isDepot)
    if (hubs.length === 0) {
      // If no depot is specified, assume the first location is the depot
      body.locations[0].isDepot = true
    }

    const stops: DeliveryStop[] = body.locations.map((loc, i) => ({
      id: `loc-${i}`,
      name: loc.name || `Location ${i + 1}`,
      ...loc,
    }))

    // 2. Calculate distance matrix
    const distanceService = DistanceService.getInstance()
    const matrix = await distanceService.calculateMatrix({
      stops,
      mode: "distance",
      source: "openrouteservice", // Use the most reliable source for the public API
    })

    // 3. Set up and run solver
    const classicalService = ClassicalService.getInstance()
    const numVehicles = body.vehicles || 1

    // Use a fixed set of robust classical parameters for the public API
    const classicalParams = {
      nn: body.solver === "fast", // Nearest neighbor is fast
      anneal: body.solver === "balanced", // Simulated annealing is more balanced
      twoOpt: true,
      ortools: false,
      vehicles: numVehicles,
      useTraffic: false, // Traffic data could be a premium feature in the future
    }

    // This simplified API will only use the classical VRP/TSP logic for now.
    // The core logic is similar to the main optimize route, but simplified.
    const hub = stops.find(s => s.isDepot)!
    const deliveryStops = stops.filter(s => !s.isDepot)

    let bestResult: RouteResult | null = null

    if (numVehicles > 1 && deliveryStops.length > 0) {
      // VRP logic (simplified from the main route)
      // In a real app, this logic would be shared, not duplicated.
      // For the hackathon, this is a quick way to create a separate API.
      const { ClusteringService } = await import("@/lib/services/clustering-service")
      const clusteringService = ClusteringService.getInstance()
      const clusters = clusteringService.groupIntoClusters(deliveryStops, numVehicles)

      const vehicleTours: number[][] = []
      let totalLength = 0, totalRuntime = 0

      for (const cluster of clusters) {
        if (cluster.length === 0) continue
        const clusterStops = [hub, ...cluster]
        const clusterIndices = clusterStops.map(s => stops.indexOf(s))
        const clusterMatrix = clusterIndices.map(i => clusterIndices.map(j => matrix.distances[i][j]))

        const results = await classicalService.solveClassical(clusterMatrix, { ...classicalParams, vehicles: 1 })
        if (results.length > 0) {
          const bestSubTour = results.reduce((a, b) => a.length < b.length ? a : b)
          vehicleTours.push(bestSubTour.tour.map(i => clusterIndices[i]))
          totalLength += bestSubTour.length
          totalRuntime += bestSubTour.runtimeMs
        }
      }
      bestResult = { name: `VRP (${numVehicles} vehicles)`, solver: 'classical', tour: vehicleTours, length: totalLength, runtimeMs: totalRuntime, feasible: true, violations: {pos:0, city:0}, isVRP: true }
    } else {
      // TSP logic
      const results = await classicalService.solveClassical(matrix.distances, classicalParams)
       if (results.length > 0) {
          bestResult = results.reduce((a, b) => a.length < b.length ? a : b)
       }
    }

    if (!bestResult) {
      return NextResponse.json({ error: "Could not find a valid route." }, { status: 500 })
    }

    // 4. Format the public response
    const formatTour = (tour: number[] | number[][]): Array<Array<{ lat: number; lng: number; name: string }>> => {
        const tours = bestResult!.isVRP ? (tour as number[][]) : [tour as number[]];
        return tours.map(t => t.map(index => {
            const stop = stops[index];
            return { lat: stop.lat, lng: stop.lng, name: stop.name };
        }));
    };

    const response: PublicApiResponse = {
      total_distance: bestResult.length,
      units: matrix.units,
      tours: formatTour(bestResult.tour),
      solver_used: bestResult.name,
      runtime_ms: bestResult.runtimeMs,
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error("Public API error:", error)
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred"
    return NextResponse.json({ error: `API error: ${errorMessage}` }, { status: 500 })
  }
}
