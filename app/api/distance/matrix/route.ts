import { type NextRequest, NextResponse } from "next/server"
import { DistanceService } from "@/lib/services/distance-service"
import type { DistanceMatrixRequest } from "@/lib/types"

export async function POST(request: NextRequest) {
  try {
    const body: DistanceMatrixRequest = await request.json()

    // Validate request
    if (!body.stops || body.stops.length < 2) {
      return NextResponse.json({ error: "At least 2 stops are required" }, { status: 400 })
    }

    if (body.stops.length > 20) {
      return NextResponse.json({ error: "Maximum 20 stops allowed" }, { status: 400 })
    }

    const distanceService = DistanceService.getInstance()
    const matrix = await distanceService.calculateMatrix(body)

    return NextResponse.json(matrix)
  } catch (error) {
    console.error("Distance matrix calculation error:", error)
    return NextResponse.json({ error: "Failed to calculate distance matrix" }, { status: 500 })
  }
}
