import { type NextRequest, NextResponse } from "next/server";
import { decodePolyline } from "@/lib/utils";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    // The request body contains `coordinates`, which is an array of `[lng, lat]` pairs.
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

    const origin = `${coordinates[0][1]},${coordinates[0][0]}`;
    const destination = `${coordinates[coordinates.length - 1][1]},${coordinates[coordinates.length - 1][0]}`;
    const waypoints = coordinates
      .slice(1, -1)
      .map(coord => `${coord[1]},${coord[0]}`)
      .join('|');

    const url = new URL("https://maps.googleapis.com/maps/api/directions/json");
    url.searchParams.set("origin", origin);
    url.searchParams.set("destination", destination);
    if (waypoints) {
        url.searchParams.set("waypoints", waypoints);
    }
    url.searchParams.set("key", apiKey);

    const response = await fetch(url.toString());

    if (!response.ok) {
      const errorData = await response.text();
      console.error("Google Maps Directions error:", errorData);
      return NextResponse.json(
        { error: "Failed to fetch directions from Google Maps" },
        { status: response.status }
      );
    }

    const data = await response.json();

    if (data.status !== "OK") {
        console.error("Google Maps Directions API status error:", data.status, data.error_message);
        return NextResponse.json(
            { error: `Google Maps Directions API error: ${data.status}` },
            { status: 500 }
        );
    }

    // Transform Google's response to a GeoJSON FeatureCollection
    const route = data.routes[0];
    if (!route) {
        return NextResponse.json({ error: "No route found" }, { status: 404 });
    }

    const geometry = decodePolyline(route.overview_polyline.points);

    const feature = {
        type: "Feature",
        properties: {
            // You can add properties from the 'route' object if needed
        },
        geometry: {
            type: "LineString",
            coordinates: geometry,
        },
    };

    const featureCollection = {
        type: "FeatureCollection",
        features: [feature],
    };

    return NextResponse.json(featureCollection);
  } catch (error) {
    console.error("Directions error:", error);
    return NextResponse.json(
      { error: "Failed to process directions request" },
      { status: 500 }
    );
  }
}
