import { type NextRequest, NextResponse } from "next/server";
import polyline from "google-polyline";

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

    const apiKey = process.env.GOOGLE_MAPS_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "API key for Google Maps is not configured" },
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
        },
        { status: 200 }
      );
    }

    const route = data.routes[0];
    const leg = route.legs[0];
    const steps = leg.steps;

    const detailedPolyline = steps.flatMap(step => polyline.decode(step.polyline.points));

    const geojsonFeature = {
      type: "Feature",
      properties: {},
      geometry: {
        type: "LineString",
        coordinates: detailedPolyline.map((p) => [p[1], p[0]]), // map to [lng, lat]
      },
    };

    return NextResponse.json({
      type: "FeatureCollection",
      features: [geojsonFeature],
    });
  } catch (error) {
    console.error("Directions error:", error);
    return NextResponse.json(
      { error: "Failed to process directions request" },
      { status: 500 }
    );
  }
}
