import { type NextRequest, NextResponse } from "next/server"
import { DistanceService } from "@/lib/services/distance-service"
import { QuantumService } from "@/lib/services/quantum-service"
import { ClassicalService } from "@/lib/services/classical-service"
import type { OptimizationRequest, OptimizationResponse, RouteResult } from "@/lib/types"

export async function POST(request: NextRequest) {
  try {
    const body: OptimizationRequest = await request.json()
    const { stops, optimizeFor, distanceSource, quantum, classical, seed } = body

    // 1. Validate request
    if (!stops || stops.length < 3) {
      return NextResponse.json({ error: "At least 1 hub and 2 stops are required" }, { status: 400 })
    }
    if (stops.length > 20) {
      return NextResponse.json({ error: "Maximum 20 locations allowed for demo" }, { status: 400 })
    }
    const hubs = stops.filter((s) => s.isDepot)
    const deliveryStops = stops.filter((s) => !s.isDepot)
    if (hubs.length === 0) {
      return NextResponse.json({ error: "At least one hub is required" }, { status: 400 })
    }

    // 2. Calculate master distance matrix for all locations
    const distanceService = DistanceService.getInstance()
    const allLocations = [...deliveryStops, ...hubs]
    const masterMatrix = await distanceService.calculateMatrix({
      stops: allLocations,
      mode: optimizeFor,
      source: distanceSource,
    })

    // 3. Assign delivery stops to the nearest hub
    const deliveryStopCount = deliveryStops.length
    const hubCount = hubs.length
    const stopsWithHubs = deliveryStops.map((stop, stopIndex) => {
      let nearestHubId = ""
      let minDistance = Infinity
      hubs.forEach((hub, hubIndex) => {
        // Extract distance from master matrix
        // The first deliveryStopCount rows are for delivery stops
        // The last hubCount columns are for hubs
        const distance = masterMatrix.distances[stopIndex][deliveryStopCount + hubIndex]
        if (distance < minDistance) {
          minDistance = distance
          nearestHubId = hub.id
        }
      })
      return { ...stop, hubId: nearestHubId }
    })

    const stopsByHub: Record<string, typeof stopsWithHubs> = {}
    stopsWithHubs.forEach((stop) => {
      if (!stopsByHub[stop.hubId!]) {
        stopsByHub[stop.hubId!] = []
      }
      stopsByHub[stop.hubId!].push(stop)
    })

    // 4. Run optimization for each hub group
    const allCandidates: RouteResult[] = []
    for (const hubId in stopsByHub) {
      const hub = hubs.find((h) => h.id === hubId)!
      const groupStops = [hub, ...stopsByHub[hubId]]
      const groupIndices = groupStops.map((stop) => allLocations.findIndex((s) => s.id === stop.id))

      // Extract sub-matrix for this group
      const groupMatrix: number[][] = groupIndices.map((i) => groupIndices.map((j) => masterMatrix.distances[i][j]))

      // Run solvers
      const candidates: RouteResult[] = []
      if (quantum.use) {
        const quantumService = QuantumService.getInstance()
        const quantumResult = await quantumService.solveQAOA(groupMatrix, quantum)
        candidates.push({ ...quantumResult, hubId })
      }
      const classicalService = ClassicalService.getInstance()
      const classicalResults = await classicalService.solveClassical(groupMatrix, classical)
      candidates.push(...classicalResults.map((r) => ({ ...r, hubId })))

      allCandidates.push(...candidates)
    }

    // 5. Find best overall result and respond
    const validCandidates = allCandidates.filter((c) => c.feasible)
    const bestIndex =
      validCandidates.length > 0
        ? allCandidates.indexOf(validCandidates.reduce((best, current) => (current.length < best.length ? current : best)))
        : -1

    const response: OptimizationResponse = {
      distanceUnits: masterMatrix.units,
      candidates: allCandidates,
      bestIndex,
      // Include hub assignments in the response for the frontend
      stopsWithHubs: stopsWithHubs,
      diagnostics: {
        feasibilityRate: allCandidates.length > 0 ? validCandidates.length / allCandidates.length : 0,
        distanceSource: masterMatrix.source,
        warnings: masterMatrix.source === 'haversine' ? ['API keys not configured, using less accurate Haversine distance.'] : [],
      },
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error("Optimization error:", error)
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred"
    return NextResponse.json({ error: `Failed to optimize routes: ${errorMessage}` }, { status: 500 })
  }
}
