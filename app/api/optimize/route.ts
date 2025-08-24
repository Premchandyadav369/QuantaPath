import { type NextRequest, NextResponse } from "next/server"
import { DistanceService } from "@/lib/services/distance-service"
import { QuantumService } from "@/lib/services/quantum-service"
import { ClassicalService } from "@/lib/services/classical-service"
import type { OptimizationRequest, OptimizationResponse, RouteResult } from "@/lib/types"

export async function POST(request: NextRequest) {
  try {
    const body: OptimizationRequest = await request.json()

    // Validate request
    if (!body.stops || body.stops.length < 3) {
      return NextResponse.json({ error: "At least 3 stops are required (including depot)" }, { status: 400 })
    }

    if (body.stops.length > 15) {
      return NextResponse.json({ error: "Maximum 15 stops allowed for demo" }, { status: 400 })
    }

    // Validate that all stops have lat/lng coordinates
    const invalidStops = body.stops.filter((stop) => !stop.lat || !stop.lng)
    if (invalidStops.length > 0) {
      return NextResponse.json(
        { error: "All stops must have valid latitude and longitude coordinates" },
        { status: 400 },
      )
    }

    // Calculate distance matrix
    const distanceService = DistanceService.getInstance()
    const matrix = await distanceService.calculateMatrix({
      stops: body.stops,
      mode: body.optimizeFor,
      source: body.distanceSource,
    })

    const candidates: RouteResult[] = []

    // Run quantum solver if requested
    if (body.quantum.use) {
      const quantumService = QuantumService.getInstance()
      const quantumResult = await quantumService.solveQAOA(matrix.distances, body.quantum)
      candidates.push(quantumResult)
    }

    const classicalService = ClassicalService.getInstance()
    const classicalResults = await classicalService.solveClassical(matrix.distances, body.classical)
    candidates.push(...classicalResults)

    // Find best result
    const validCandidates = candidates.filter((c) => c.feasible)
    const bestIndex =
      validCandidates.length > 0
        ? candidates.indexOf(validCandidates.reduce((best, current) => (current.length < best.length ? current : best)))
        : 0

    const response: OptimizationResponse = {
      distanceUnits: matrix.units,
      candidates,
      bestIndex,
      diagnostics: {
        feasibilityRate: validCandidates.length / candidates.length,
      },
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error("Optimization error:", error)
    return NextResponse.json({ error: "Failed to optimize routes" }, { status: 500 })
  }
}
