"use client";

import { GoogleMap, useJsApiLoader, Marker, Polyline } from "@react-google-maps/api";
import { useTheme } from "next-themes";
import type { DeliveryStop } from "@/lib/types";

const containerStyle = {
  width: "100%",
  height: "100%",
};

const defaultCenter = {
  lat: 48.8566,
  lng: 2.3522,
};

// You can find more themes at https://snazzymaps.com/
const darkMapStyle = [
  { elementType: "geometry", stylers: [{ color: "#242f3e" }] },
  { elementType: "labels.text.stroke", stylers: [{ color: "#242f3e" }] },
  { elementType: "labels.text.fill", stylers: [{ color: "#746855" }] },
  {
    featureType: "administrative.locality",
    elementType: "labels.text.fill",
    stylers: [{ color: "#d59563" }],
  },
  {
    featureType: "poi",
    elementType: "labels.text.fill",
    stylers: [{ color: "#d59563" }],
  },
  {
    featureType: "poi.park",
    elementType: "geometry",
    stylers: [{ color: "#263c3f" }],
  },
  {
    featureType: "poi.park",
    elementType: "labels.text.fill",
    stylers: [{ color: "#6b9a76" }],
  },
  {
    featureType: "road",
    elementType: "geometry",
    stylers: [{ color: "#38414e" }],
  },
  {
    featureType: "road",
    elementType: "geometry.stroke",
    stylers: [{ color: "#212a37" }],
  },
  {
    featureType: "road",
    elementType: "labels.text.fill",
    stylers: [{ color: "#9ca5b3" }],
  },
  {
    featureType: "road.highway",
    elementType: "geometry",
    stylers: [{ color: "#746855" }],
  },
  {
    featureType: "road.highway",
    elementType: "geometry.stroke",
    stylers: [{ color: "#1f2835" }],
  },
  {
    featureType: "road.highway",
    elementType: "labels.text.fill",
    stylers: [{ color: "#f3d19c" }],
  },
  {
    featureType: "transit",
    elementType: "geometry",
    stylers: [{ color: "#2f3948" }],
  },
  {
    featureType: "transit.station",
    elementType: "labels.text.fill",
    stylers: [{ color: "#d59563" }],
  },
  {
    featureType: "water",
    elementType: "geometry",
    stylers: [{ color: "#17263c" }],
  },
  {
    featureType: "water",
    elementType: "labels.text.fill",
    stylers: [{ color: "#515c6d" }],
  },
  {
    featureType: "water",
    elementType: "labels.text.stroke",
    stylers: [{ color: "#17263c" }],
  },
];

interface GoogleMapProps {
  stops: DeliveryStop[];
  optimizedTour?: number[] | null;
  routeGeometry?: [number, number][] | null;
  onMapClick?: (lat: number, lng: number) => void;
}

export default function GoogleMapWrapper({ stops, optimizedTour, routeGeometry, onMapClick }: GoogleMapProps) {
  const { resolvedTheme } = useTheme();

  const { isLoaded } = useJsApiLoader({
    id: "google-map-script",
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "",
  });

  const mapOptions = {
    styles: resolvedTheme === "dark" ? darkMapStyle : undefined,
    disableDefaultUI: true,
    zoomControl: true,
  };

  const bounds = new window.google.maps.LatLngBounds();
  stops.forEach(stop => {
    bounds.extend(new window.google.maps.LatLng(stop.lat, stop.lng));
  });

  return isLoaded ? (
    <GoogleMap
      mapContainerStyle={containerStyle}
      center={defaultCenter}
      zoom={10}
      options={mapOptions}
      onLoad={map => {
        if (stops.length > 0) {
          map.fitBounds(bounds);
        }
      }}
      onClick={(e) => {
        if (e.latLng && onMapClick) {
          onMapClick(e.latLng.lat(), e.latLng.lng());
        }
      }}
    >
      {stops.map((stop, index) => (
        <Marker key={stop.id} position={{ lat: stop.lat, lng: stop.lng }} label={`${index + 1}`} />
      ))}
      {optimizedTour && routeGeometry && (
        <Polyline
          path={routeGeometry.map(coord => ({ lat: coord[1], lng: coord[0] }))}
          options={{
            strokeColor: "#FF0000",
            strokeOpacity: 0.8,
            strokeWeight: 2,
          }}
        />
      )}
    </GoogleMap>
  ) : (
    <div className="flex h-full w-full items-center justify-center bg-gray-200">
      Loading map...
    </div>
  );
}
