"use client"

import {
  GoogleMap,
  useLoadScript,
  Marker,
  Polyline,
} from "@react-google-maps/api"
import { useCallback, useMemo } from "react"
import type { DeliveryStop, RouteResult } from "@/lib/types"

const routeColors = ["#FF5733", "#33FF57", "#3357FF", "#FF33A1", "#A133FF", "#33FFA1"];

interface GoogleMapProps {
  stops: DeliveryStop[]
  routes: RouteResult[]
  stopsForRoutes: DeliveryStop[]
  selectedRoute: RouteResult | null
  onMapClick: (lat: number, lng: number) => void
  onStopRemove: (id: string) => void
  onStopMove: (id: string, lat: number, lng: number) => void;
  isOptimizing: boolean
  isDepotMode?: boolean
  searchedLocation?: { lat: number; lng: number; name: string } | null;
  simulationTime: number;
  isSimulating: boolean;
}

export function GoogleMapComponent({
  stops,
  routes,
  stopsForRoutes,
  selectedRoute,
  onMapClick,
  onStopRemove,
  onStopMove,
  isOptimizing,
  isDepotMode = false,
  searchedLocation,
  simulationTime,
  isSimulating,
}: GoogleMapProps) {
  const { isLoaded } = useLoadScript({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY!,
  })

  const center = useMemo(() => ({ lat: 16.5062, lng: 80.648 }), [])

  const mapOptions = useMemo<google.maps.MapOptions>(
    () => ({
      disableDefaultUI: true,
      clickableIcons: true,
      scrollwheel: false,
    }),
    [],
  )

  const handleMapClick = useCallback(
    (e: google.maps.MapMouseEvent) => {
      if (e.latLng && !isOptimizing) {
        onMapClick(e.latLng.lat(), e.latLng.lng())
      }
    },
    [onMapClick, isOptimizing],
  )

  const handleMarkerDragEnd = useCallback(
    (e: google.maps.MapMouseEvent, stopId: string) => {
      if (e.latLng && !isOptimizing) {
        onStopMove(stopId, e.latLng.lat(), e.latLng.lng())
      }
    },
    [onStopMove, isOptimizing],
  )

  if (!isLoaded) {
    return <div>Loading...</div>
  }

  return (
    <GoogleMap
      options={mapOptions}
      zoom={12}
      center={center}
      mapTypeId={google.maps.MapTypeId.ROADMAP}
      mapContainerStyle={{ width: "100%", height: "400px" }}
      onClick={handleMapClick}
    >
      {stops.map((stop) => (
        <Marker
          key={stop.id}
          position={{ lat: stop.lat, lng: stop.lng }}
          label={stop.name}
          draggable={!stop.isDepot && !isOptimizing}
          onDragEnd={(e) => handleMarkerDragEnd(e, stop.id)}
          onClick={() => {
            if (!stop.isDepot && !isOptimizing) {
              onStopRemove(stop.id)
            }
          }}
        />
      ))}

      {searchedLocation && (
        <Marker
          position={{ lat: searchedLocation.lat, lng: searchedLocation.lng }}
          label={searchedLocation.name}
          icon={{
            path: google.maps.SymbolPath.CIRCLE,
            scale: 10,
            fillColor: "#FFD700",
            fillOpacity: 1,
            strokeWeight: 2,
            strokeColor: "white",
          }}
        />
      )}

      {routes.map((route, index) => {
        const routeCoords = route.tour
          .map((stopIndex) => {
            const stop = stopsForRoutes[stopIndex]
            return stop ? { lat: stop.lat, lng: stop.lng } : null
          })
          .filter((c): c is { lat: number; lng: number } => c !== null)

        return (
          <Polyline
            key={route.name}
            path={routeCoords}
            options={{
              strokeColor: routeColors[index % routeColors.length],
              strokeOpacity: selectedRoute?.name === route.name ? 1 : 0.5,
              strokeWeight: selectedRoute?.name === route.name ? 4 : 2,
            }}
          />
        )
      })}
    </GoogleMap>
  )
}
