import { type NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get("query");

    if (!query) {
      return NextResponse.json(
        { error: "Query parameter is required" },
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
      `https://api.openrouteservice.org/geocode/search?api_key=${apiKey}&text=${query}`
    );

    if (!response.ok) {
      const errorData = await response.json();
      console.error("OpenRouteService geocode error:", errorData);
      return NextResponse.json(
        { error: "Failed to fetch geocode data from OpenRouteService" },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Geocode error:", error);
    return NextResponse.json(
      { error: "Failed to process geocode request" },
      { status: 500 }
    );
  }
}
