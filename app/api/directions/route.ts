import { type NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { coordinates } = body;

    if (!coordinates || coordinates.length < 2) {
      return NextResponse.json(
        { error: "At least two coordinates are required" },
        { status: 400 }
      );
    }

    const apiKey = process.env.OPENROUTE_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "API key for OpenRouteService is not configured" },
        { status: 500 }
      );
    }

    const response = await fetch(
      "https://api.openrouteservice.org/v2/directions/driving-car/geojson",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: apiKey,
        },
        body: JSON.stringify({ coordinates }),
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      console.error("OpenRouteService error:", errorData);
      return NextResponse.json(
        { error: "Failed to fetch directions from OpenRouteService" },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Directions error:", error);
    return NextResponse.json(
      { error: "Failed to process directions request" },
      { status: 500 }
    );
  }
}
