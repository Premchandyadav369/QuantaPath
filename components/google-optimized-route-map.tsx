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

function RoutePolyline({ route, stops }: { route: RouteResult; stops: DeliveryStop[] }) {
  const map = useMap()
  const [polyline, setPolyline] = useState<google.maps.Polyline | null>(null)

  useEffect(() => {
    if (!map || !route) {
      return
    }

    if (polyline) {
      polyline.setMap(null)
    }

    const fetchAndDrawRoute = async () => {
      const tourStops = route.tour
        .map((stopIndex) => stops[stopIndex])
        .filter(Boolean)
      if (tourStops.length < 2) return

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
          // Fallback to straight line for this segment
          fullPath = [
            ...fullPath,
            { lat: startStop.lat, lng: startStop.lng },
            { lat: endStop.lat, lng: endStop.lng },
          ]
        }
      }

      const newPolyline = new google.maps.Polyline({
        path: fullPath,
        strokeColor: "#7B2CBF",
        strokeOpacity: 0.8,
        strokeWeight: 4,
      })
      newPolyline.setMap(map)
      setPolyline(newPolyline)
    }

    fetchAndDrawRoute()

    return () => {
      if (polyline) {
        polyline.setMap(null)
      }
    }
  }, [map, route, stops, polyline])

  return null
}

export function GoogleOptimizedRouteMap({
  stops,
  route,
}: GoogleOptimizedRouteMapProps) {
  const apiKey = "AIzaSyCU4fXg2nd8GS4TISLrRAnES3_6ZQ01a9U"

  const position = { lat: 16.5062, lng: 80.648 }

  return (
    <APIProvider apiKey={apiKey}>
      <Map
        defaultCenter={position}
        defaultZoom={12}
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
        {route && <RoutePolyline route={route} stops={stops} />}
      </Map>
    </APIProvider>
  )
}
