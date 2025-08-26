import { type NextRequest, NextResponse } from "next/server"
import { DistanceService } from "@/lib/services/distance-service"
import { QuantumService } from "@/lib/services/quantum-service"
import { ClassicalService } from "@/lib/services/classical-service"
import { ClusteringService } from "@/lib/services/clustering-service"
import { EVRoutingService } from "@/lib/services/ev-routing-service"
import type { OptimizationRequest, OptimizationResponse, RouteResult, DeliveryStop } from "@/lib/types"

async function addChargingStopsIfNeeded(
  tour: number[],
  allStops: DeliveryStop[],
  distanceMatrix: number[][],
  evRange: number,
): Promise<{ newTour: number[]; newStops: DeliveryStop[]; addedChargers: DeliveryStop[] }> {
  if (tour.length < 2) return { newTour: tour, newStops: allStops, addedChargers: [] }

  const evService = EVRoutingService.getInstance()
  let newTour = [...tour]
  let newStops = [...allStops]
  let addedChargers: DeliveryStop[] = []
  let tourModified = true
  let iteration = 0

  while(tourModified && iteration < 5) { // Limit iterations to prevent infinite loops
    tourModified = false
    iteration++

    for (let i = 0; i < newTour.length - 1; i++) {
      const fromIndex = newTour[i]
      const toIndex = newTour[i + 1]
      const distance = distanceMatrix[fromIndex][toIndex]

      if (distance > evRange) {
        const fromStop = newStops[fromIndex]
        const toStop = newStops[toIndex]

        // Find midpoint to search for a charger
        const midLat = (fromStop.lat + toStop.lat) / 2
        const midLng = (fromStop.lng + toStop.lng) / 2

        const chargers = await evService.findChargingStations(midLat, midLng)

        if (chargers.length > 0) {
          const bestCharger = chargers[0] // Use the first one found
          const chargerStop: DeliveryStop = {
            id: `charger-${Date.now()}`,
            name: bestCharger.name,
            lat: bestCharger.lat,
            lng: bestCharger.lng,
            isChargingStation: true,
          }

          // This is a simplified approach for a hackathon. A real implementation
          // would require re-calculating the distance matrix and re-optimizing.
          // Here, we just insert the stop into the tour and the list of stops.
          newStops.push(chargerStop)
          addedChargers.push(chargerStop)
          const newStopIndex = newStops.length - 1
          newTour.splice(i + 1, 0, newStopIndex)

          tourModified = true
          break // Restart the loop since the tour has changed
        }
      }
    }
  }

  return { newTour, newStops, addedChargers }
}


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
      useTraffic: classical.useTraffic,
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

      // --- VRP Logic ---
      if (classical.vehicles > 1) {
        const classicalService = ClassicalService.getInstance()
        const clusteringService = ClusteringService.getInstance()

        const vehicleClusters = clusteringService.groupIntoClusters(stopsByHub[hubId], classical.vehicles)

        const vehicleTours: number[][] = []
        let totalLength = 0
        let totalRuntime = 0

        for (const vehicleCluster of vehicleClusters) {
          if (vehicleCluster.length === 0) continue

          const vehicleStops = [hub, ...vehicleCluster]
          const vehicleStopIndices = vehicleStops.map((stop) => allLocations.findIndex((s) => s.id === stop.id))
          const vehicleMatrix = vehicleStopIndices.map((i) => vehicleStopIndices.map((j) => masterMatrix.distances[i][j]))

          // For VRP, we'll use the fastest classical solver for each sub-problem
          const vehicleClassicalParams = { ...classical, nn: true, anneal: false, ortools: false }
          const classicalResults = await classicalService.solveClassical(vehicleMatrix, vehicleClassicalParams)

          if (classicalResults.length > 0) {
            const bestTour = classicalResults.reduce((best, current) => current.length < best.length ? current : best)
            // The tour is in terms of indices within the vehicleMatrix. We need to map it back to the master indices.
            const masterIndexTour = bestTour.tour.map((idx) => vehicleStopIndices[idx])

            vehicleTours.push(masterIndexTour)
            totalLength += bestTour.length
            totalRuntime += bestTour.runtimeMs
          }
        }

        if (vehicleTours.length > 0) {
          const vrpResult: RouteResult = {
            solver: "classical",
            name: `VRP (${classical.vehicles} vehicles)`,
            tour: vehicleTours,
            length: totalLength,
            feasible: true,
            violations: { pos: 0, city: 0 },
            runtimeMs: totalRuntime,
            hubId,
            isVRP: true,
          }
          allCandidates.push(vrpResult)
        }

        // Also run a single TSP for comparison if selected
        if (quantum.use || classical.nn || classical.anneal) {
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

      } else {
        // --- Standard TSP Logic ---
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
    }

    // 5. Post-process for EV Routing if enabled
    if (classical.evMode) {
      for (const candidate of allCandidates) {
        if (candidate.isVRP || candidate.solver === 'quantum') continue // Skip VRP and quantum for now

        const { newTour, newStops, addedChargers } = await addChargingStopsIfNeeded(
          candidate.tour as number[],
          allLocations,
          masterMatrix.distances,
          classical.evRange,
        )

        if (addedChargers.length > 0) {
          // A simple length recalculation for the new tour
          let newLength = 0
          for (let i = 0; i < newTour.length - 1; i++) {
             // This requires a new distance matrix or direct lookups.
             // For simplicity, we'll approximate, as the matrix is based on original stops.
             // This is a limitation of the simplified hackathon approach.
             newLength += masterMatrix.distances[newTour[i]]?.[newTour[i+1]] || 0
          }

          candidate.tour = newTour
          // In a real app, you'd recalculate length properly.
          // For now, we are not updating the length to avoid complexity.
          candidate.name = `${candidate.name} (EV)`;

          // Add chargers to the list of stops to be returned to the frontend
          stopsWithHubs.push(...addedChargers);
        }
      }
    }


    // 6. Find best overall result and respond
    const validCandidates = allCandidates.filter((c) => c.feasible)
    const bestIndex =
      validCandidates.length > 0
        ? allCandidates.indexOf(validCandidates.reduce((best, current) => (current.length < best.length ? current : best)))
        : -1

    const response: OptimizationResponse = {
      distanceUnits: masterMatrix.units,
      candidates: allCandidates,
      bestIndex,
      // Include hub assignments and added chargers in the response
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
