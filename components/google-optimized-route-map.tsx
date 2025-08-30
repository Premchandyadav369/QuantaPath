"use client"

import {
  APIProvider,
  Map,
  AdvancedMarker,
  Pin,
  useMap,
} from "@vis.gl/react-google-maps"
import type { DeliveryStop, RouteResult } from "@/lib/types"
import { useEffect, useState } from "react"

interface GoogleOptimizedRouteMapProps {
  stops: DeliveryStop[]
  routes: RouteResult[]
}

const algorithmColors: { [key: string]: string } = {
  quantum: "#7B2CBF", // Purple
  classical: "#0D1B2A", // Dark Blue
  simulated: "#06D6A0", // Teal
}

function getRouteColor(solver: "quantum" | "classical", name: string) {
  if (name.includes("Simulated")) {
    return algorithmColors.simulated
  }
  return algorithmColors[solver] || "#0D1B2A"
}

function RoutePolylines({ routes, stops }: { routes: RouteResult[]; stops: DeliveryStop[] }) {
  const map = useMap()
  const [polylines, setPolylines] = useState<google.maps.Polyline[]>([])

  useEffect(() => {
    if (!map) return

    polylines.forEach((p) => p.setMap(null))

    const fetchAndDrawRoutes = async () => {
      const newPolylines = await Promise.all(
        routes.map(async (route) => {
          const tourStops = route.tour
            .map((stopIndex) => stops[stopIndex])
            .filter(Boolean)
          if (tourStops.length < 2) return null

          let fullPath: google.maps.LatLngLiteral[] = []

          for (let i = 0; i < tourStops.length - 1; i++) {
            const startStop = tourStops[i]
            const endStop = tourStops[i + 1]
            const coordinates = [
              [startStop.lng, startStop.lat],
              [endStop.lng, endStop.lat],
            ]

            try {
              const response = await fetch("/api/directions", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ coordinates }),
              })

              if (!response.ok)
                throw new Error(
                  `Failed to fetch directions: ${response.statusText}`
                )

              const geojson = await response.json()
              if (geojson.features && geojson.features.length > 0) {
                const newCoords = geojson.features[0].geometry.coordinates.map(
                  (c: any) => ({ lat: c[1], lng: c[0] })
                )
                fullPath = [...fullPath, ...newCoords]
              }
            } catch (error) {
              console.error(
                "Error fetching route segment, falling back to straight line for segment:",
                error
              )
              fullPath = [
                ...fullPath,
                { lat: startStop.lat, lng: startStop.lng },
                { lat: endStop.lat, lng: endStop.lng },
              ]
            }
          }

          const color = getRouteColor(route.solver, route.name)
          const newPolyline = new google.maps.Polyline({
            path: fullPath,
            strokeColor: color,
            strokeOpacity: 0.8,
            strokeWeight: 4,
          })
          newPolyline.setMap(map)
          return newPolyline
        })
      )
      setPolylines(newPolylines.filter(Boolean) as google.maps.Polyline[])
    }

    fetchAndDrawRoutes()

    return () => {
      polylines.forEach((p) => p.setMap(null))
    }
  }, [map, routes, stops])

  return null
}

export function GoogleOptimizedRouteMap({
  stops,
  routes,
}: GoogleOptimizedRouteMapProps) {
  const apiKey = "AIzaSyCU4fXg2nd8GS4TISLrRAnES3_6ZQ01a9U"

  const position = { lat: 16.5062, lng: 80.648 }

  return (
    <APIProvider apiKey={apiKey} libraries={["places"]}>
      <Map
        defaultCenter={position}
        defaultZoom={12}
        mapId="a3b4c5d6e7f8g9h0"
        gestureHandling={"greedy"}
        disableDefaultUI={true}
      >
        {stops.map((stop) => (
          <AdvancedMarker
            key={stop.id}
            position={{ lat: stop.lat, lng: stop.lng }}
          >
            <Pin
              background={stop.isDepot ? "#0D1B2A" : "#7B2CBF"}
              borderColor={"white"}
              glyphColor={"white"}
            />
          </AdvancedMarker>
        ))}
        <RoutePolylines routes={routes} stops={stops} />
      </Map>
    </APIProvider>
  )
}
