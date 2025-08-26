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
      const errorData = await response.text();
      console.error("Google Maps Geocode error:", errorData);
      return NextResponse.json(
        { error: "Failed to fetch geocode data from Google Maps" },
        { status: response.status }
      );
    }

    const data = await response.json();

    if (data.status !== "OK") {
      console.error("Google Maps Geocode API status error:", data.status, data.error_message);
      return NextResponse.json(
        { error: `Google Maps Geocoding API error: ${data.status}` },
        { status: 500 }
      );
    }

    // Transform Google's response to GeoJSON FeatureCollection
    const features = data.results.map((result: any) => ({
      type: "Feature",
      geometry: {
        type: "Point",
        coordinates: [result.geometry.location.lng, result.geometry.location.lat],
      },
      properties: {
        label: result.formatted_address,
        ...result, // include other properties from Google
      },
    }));

    const featureCollection = {
      type: "FeatureCollection",
      features,
    };

    return NextResponse.json(featureCollection);
  } catch (error) {
    console.error("Geocode error:", error);
    return NextResponse.json(
      { error: "Failed to process geocode request" },
      { status: 500 }
    );
  }
}
