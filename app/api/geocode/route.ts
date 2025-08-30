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

    const apiKey = process.env.GOOGLE_MAPS_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "API key for Google Maps is not configured" },
        { status: 500 }
      );
    }

    const response = await fetch(
      `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(
        query
      )}&key=${apiKey}`
    );

    if (!response.ok) {
      const errorData = await response.json();
      console.error("Google Geocode error:", errorData);
      return NextResponse.json(
        { error: "Failed to fetch geocode data from Google Maps" },
        { status: response.status }
      );
    }

    const data = await response.json();

    if (data.status !== "OK") {
      return NextResponse.json(
        { features: [] },
        { status: 200 }
      );
    }

    // Adapt Google's response to the format expected by the frontend
    const features = data.results.map((result: any) => ({
      type: "Feature",
      geometry: {
        type: "Point",
        coordinates: [result.geometry.location.lng, result.geometry.location.lat],
      },
      properties: {
        name: result.formatted_address,
        // You can add more properties here if needed, like address components
        place_id: result.place_id,
      },
    }));

    return NextResponse.json({ features });
  } catch (error) {
    console.error("Geocode error:", error);
    return NextResponse.json(
      { error: "Failed to process geocode request" },
      { status: 500 }
    );
  }
}
