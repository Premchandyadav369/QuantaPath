"use client"

import {
  Map,
  AdvancedMarker,
  Pin,
  useMap,
} from "@vis.gl/react-google-maps"
import type { DeliveryStop, RouteResult } from "@/lib/types"
import { useEffect, useState } from "react"

function RoutePolylines({
  routes,
  stops,
  selectedRoute,
}: {
  routes: RouteResult[]
  stops: DeliveryStop[]
  selectedRoute: RouteResult | null
}) {
  const map = useMap()

  useEffect(() => {
    if (!map) return

    const newPolylines: google.maps.Polyline[] = []

    const fetchAndDrawRoute = async (route: RouteResult) => {
      const tourStops = route.tour
        .map((stopIndex) => stops[stopIndex])
        .filter(Boolean)
      if (tourStops.length < 2) return

      const isSelected = selectedRoute?.name === route.name
      const color =
        route.solver === "quantum"
          ? "#7B2CBF"
          : route.name.includes("Simulated")
          ? "#06D6A0"
          : "#0D1B2A"

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

      const polyline = new google.maps.Polyline({
        path: fullPath,
        strokeColor: color,
        strokeOpacity: isSelected ? 1.0 : 0.6,
        strokeWeight: isSelected ? 4 : 2,
        zIndex: isSelected ? 1 : 0,
      })

      polyline.setMap(map)
      newPolylines.push(polyline)
    }

    routes.forEach(fetchAndDrawRoute)

    return () => {
      newPolylines.forEach((p) => p.setMap(null))
    }
  }, [map, routes, stops, selectedRoute])

  return null
}

function MapInner({
  onMapReady,
}: {
  onMapReady?: (map: google.maps.Map | null) => void
}) {
  const map = useMap()

  useEffect(() => {
    if (onMapReady && map) {
      onMapReady(map)
    }
  }, [map, onMapReady])

  return null
}

export function GoogleMap({
  stops,
  routes,
  stopsForRoutes,
  selectedRoute,
  onMapClick,
  onStopRemove,
  onStopMove,
  isOptimizing,
  isDepotMode = false,
  onMapReady,
  searchedLocation,
  simulationTime,
  isSimulating,
}: {
  stops: DeliveryStop[]
  routes: RouteResult[]
  stopsForRoutes: DeliveryStop[]
  selectedRoute: RouteResult | null
  onMapClick: (lat: number, lng: number) => void
  onStopRemove: (id: string) => void
  onStopMove: (id: string, lat: number, lng: number) => void
  isOptimizing: boolean
  isDepotMode?: boolean
  onMapReady?: (map: google.maps.Map | null) => void
  searchedLocation?: { lat: number; lng: number; name: string } | null
  simulationTime: number
  isSimulating: boolean
}) {
  const position = { lat: 16.5062, lng: 80.648 }

  return (
    <Map
      defaultCenter={position}
      defaultZoom={12}
      mapId="a3b4c5d6e7f8g9h0"
      gestureHandling={"greedy"}
      disableDefaultUI={true}
      onClick={(e) =>
        onMapClick(e.detail.latLng?.lat ?? 0, e.detail.latLng?.lng ?? 0)
      }
    >
      <MapInner onMapReady={onMapReady} />
      {stops.map((stop) => (
        <AdvancedMarker
          key={stop.id}
          position={{ lat: stop.lat, lng: stop.lng }}
          draggable={!stop.isDepot && !isOptimizing}
          onDragEnd={(e) =>
            onStopMove(
              stop.id,
              e.latLng?.lat() ?? 0,
              e.latLng?.lng() ?? 0
            )
          }
        >
          <Pin
            background={stop.isDepot ? "#0D1B2A" : "#7B2CBF"}
            borderColor={"white"}
            glyphColor={"white"}
          />
        </AdvancedMarker>
      ))}
      <RoutePolylines
        routes={routes}
        stops={stopsForRoutes}
        selectedRoute={selectedRoute}
      />
    </Map>
  )
}
