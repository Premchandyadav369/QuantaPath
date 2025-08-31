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

    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "API key is not configured" },
        { status: 500 }
      );
    }

    const origin = coordinates[0].reverse().join(",");
    const destination = coordinates[1].reverse().join(",");

    const url = `https://maps.googleapis.com/maps/api/directions/json?origin=${origin}&destination=${destination}&key=${apiKey}`;

    const response = await fetch(url);

    if (!response.ok) {
      const errorData = await response.json();
      console.error("Google Directions error:", errorData);
      return NextResponse.json(
        { error: "Failed to fetch directions from Google Maps" },
        { status: response.status }
      );
    }

    const data = await response.json();

    if (data.status !== "OK" || !data.routes || data.routes.length === 0) {
      return NextResponse.json(
        {
          type: "FeatureCollection",
          features: [],
          steps: [],
        },
        { status: 200 }
      );
    }

    const route = data.routes[0];
    const leg = route.legs[0];
    const steps = leg.steps;

    const geojsonFeature = {
      type: "Feature",
      properties: {},
      geometry: {
        type: "LineString",
        coordinates: require("google-polyline").decode(route.overview_polyline.points).map((p: number[]) => [p[1], p[0]]),
      },
    };

    return NextResponse.json({
      type: "FeatureCollection",
      features: [geojsonFeature],
      steps: steps,
      distance: leg.distance,
      duration: leg.duration,
    });
  } catch (error) {
    console.error("Directions error:", error);
    return NextResponse.json(
      { error: "Failed to process directions request" },
      { status: 500 }
    );
  }
}
