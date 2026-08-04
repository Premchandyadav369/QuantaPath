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

function AnimatedVehicle({
  path,
  simulationTime,
  color = "#7B2CBF"
}: {
  path: google.maps.LatLngLiteral[]
  simulationTime: number
  color?: string
}) {
  const map = useMap()
  const [marker, setMarker] = useState<google.maps.Marker | null>(null)

  useEffect(() => {
    if (!map || path.length < 2) return

    const svgIcon = {
      path: "M17.402,0H5.643C2.526,0,0,3.467,0,6.584v34.804c0,3.116,2.526,5.644,5.643,5.644h11.759c3.116,0,5.644-2.527,5.644-5.644 V6.584C23.044,3.467,20.518,0,17.402,0z M22.057,14.188v11.665l-2.729,0.351v-4.806L22.057,14.188z M20.625,10.773 c-1.016,3.9-2.219,8.51-2.219,8.51H4.638l-2.222-8.51C2.417,10.773,11.3,7.755,20.625,10.773z M3.748,21.713v4.492l-2.73-0.349 V14.502L3.748,21.713z M1.018,37.938V27.579l2.73,0.343v8.196L1.018,37.938z M2.575,40.882l2.218-3.336h13.771l2.219,3.336H2.575z M19.328,35.805v-7.872l2.729-0.355v10.048L19.328,35.805z",
      fillColor: color,
      fillOpacity: 1,
      strokeWeight: 0,
      rotation: 0,
      scale: 0.5,
      anchor: new google.maps.Point(11.5, 23.5),
    }

    const m = new google.maps.Marker({
      map,
      icon: svgIcon,
      zIndex: 10,
    })
    setMarker(m)

    return () => {
      m.setMap(null)
    }
  }, [map, path, color])

  useEffect(() => {
    if (!marker || path.length < 2) return

    const totalPoints = path.length
    const floatIndex = simulationTime * (totalPoints - 1)
    const index = Math.min(Math.floor(floatIndex), totalPoints - 2)
    const fraction = floatIndex - index

    const p1 = path[index]
    const p2 = path[index + 1]

    const lat = p1.lat + (p2.lat - p1.lat) * fraction
    const lng = p1.lng + (p2.lng - p1.lng) * fraction

    // Calculate heading using basic math since spherical library might not be loaded initially
    let heading = 0;
    if (p2.lng !== p1.lng || p2.lat !== p1.lat) {
        heading = Math.atan2(p2.lng - p1.lng, p2.lat - p1.lat) * 180 / Math.PI;
    }

    const icon = marker.getIcon() as google.maps.Symbol
    if (icon) {
        icon.rotation = heading
        marker.setIcon(icon)
    }

    marker.setPosition({ lat, lng })
  }, [marker, path, simulationTime])

  return null
}

function RoutePolylines({
  routes,
  stops,
  selectedRoute,
  quantumVisualizationMode = false,
  showCarbon = false,
  showHistory = false,
  simulationTime = 0,
  isSimulating = false
}: {
  routes: RouteResult[]
  stops: DeliveryStop[]
  selectedRoute: RouteResult | null
  quantumVisualizationMode?: boolean
  showCarbon?: boolean
  showHistory?: boolean
  simulationTime?: number
  isSimulating?: boolean
}) {
  const map = useMap()
  const [polylines, setPolylines] = useState<google.maps.Polyline[]>([])
  const [routePaths, setRoutePaths] = useState<Record<string, google.maps.LatLngLiteral[]>>({})

  useEffect(() => {
    if (!map) return

    // Clear existing polylines
    polylines.forEach((p) => p.setMap(null))
    const newPolylines: google.maps.Polyline[] = []
    const newRoutePaths: Record<string, google.maps.LatLngLiteral[]> = {}

    const fetchAndDrawRoute = async (route: RouteResult) => {
      const tourStops = route.tour
        .map((stopIndex) => stops[stopIndex])
        .filter(Boolean)
      if (tourStops.length < 2) return

      const isSelected = selectedRoute?.name === route.name
      let color =
        route.solver === "quantum"
          ? "#7B2CBF"
          : route.name.includes("Simulated")
          ? "#06D6A0"
          : "#0D1B2A"

      if (quantumVisualizationMode && route.solver === "quantum") {
          color = "#00f2fe"; // Cyan glow color
      }
      if (showCarbon) {
          color = "#10b981"; // Emerald color for carbon view
      }

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

      const isHistorical = showHistory && !isSelected && route.solver !== 'quantum';

      const polylineOptions: google.maps.PolylineOptions = {
        path: fullPath,
        strokeColor: color,
        strokeOpacity: isHistorical ? 0.2 : (isSelected ? (quantumVisualizationMode ? 0.8 : 1.0) : 0.6),
        strokeWeight: isSelected ? (quantumVisualizationMode ? 6 : 4) : (isHistorical ? 1 : 2),
        zIndex: isSelected ? 1 : 0,
      };

      const polyline = new google.maps.Polyline(polylineOptions)

      polyline.setMap(map)
      newPolylines.push(polyline)
      newRoutePaths[route.name] = fullPath
    }

    Promise.all(routes.map(fetchAndDrawRoute)).then(() => {
        setPolylines(newPolylines)
        setRoutePaths(newRoutePaths)
    })

    return () => {
      newPolylines.forEach((p) => p.setMap(null))
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [map, routes, stops, selectedRoute, quantumVisualizationMode, showCarbon, showHistory])

  return (
    <>
      {isSimulating && selectedRoute && routePaths[selectedRoute.name] && (
        <AnimatedVehicle
            path={routePaths[selectedRoute.name]}
            simulationTime={simulationTime}
            color={selectedRoute.solver === 'quantum' ? '#7B2CBF' : '#0D1B2A'}
        />
      )}
    </>
  )
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
  quantumVisualizationMode = false,
  showHeatmap = false,
  showWeather = false,
  showCarbon = false,
  showHistory = false,
  onMapRightClick,
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
  quantumVisualizationMode?: boolean
  showHeatmap?: boolean
  showWeather?: boolean
  showCarbon?: boolean
  showHistory?: boolean
  onMapRightClick?: (e: google.maps.MapMouseEvent) => void
}) {
  const apiKey = "AIzaSyCU4fXg2nd8GS4TISLrRAnES3_6ZQ01a9U"

  const position = { lat: 16.5062, lng: 80.648 }

  return (
    <APIProvider apiKey={apiKey} libraries={['places']}>
      <Map
        defaultCenter={position}
        defaultZoom={12}
        mapId="a3b4c5d6e7f8g9h0"
        gestureHandling={"greedy"}
        disableDefaultUI={true}
        onClick={(e) =>
          onMapClick(e.detail.latLng?.lat ?? 0, e.detail.latLng?.lng ?? 0)
        }
        onContextmenu={(e) => onMapRightClick && onMapRightClick(e as any)}
        onCameraChanged={(e) => onMapReady && onMapReady(e.map)}
      >
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
          quantumVisualizationMode={quantumVisualizationMode}
          showCarbon={showCarbon}
          showHistory={showHistory}
          simulationTime={simulationTime}
          isSimulating={isSimulating}
        />
        {showWeather && (
          <div className="absolute inset-0 pointer-events-none z-10 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-30 animate-pulse mix-blend-screen" style={{ backgroundColor: 'rgba(0, 50, 100, 0.2)' }} />
        )}
        {showHeatmap && (
           <div className="absolute inset-0 pointer-events-none z-10 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-orange-500/20 via-transparent to-transparent opacity-50 mix-blend-multiply" />
        )}
      </Map>
    </APIProvider>
  )
}
