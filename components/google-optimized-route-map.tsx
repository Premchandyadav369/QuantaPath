"use client";

import { useEffect, useState } from "react";
import type { DeliveryStop, RouteResult } from "@/lib/types";
import GoogleMapWrapper from "@/components/google-map";

interface GoogleOptimizedRouteMapProps {
  stops: DeliveryStop[];
  route: RouteResult | null;
}

export function GoogleOptimizedRouteMap({ stops, route }: GoogleOptimizedRouteMapProps) {
  const [routeGeometry, setRouteGeometry] = useState<[number, number][] | null>(null);

  useEffect(() => {
    if (!route) {
      setRouteGeometry(null);
      return;
    }

    const fetchRouteGeometry = async () => {
      const fullGeometry: [number, number][] = [];
      const tourStops = route.tour.map(i => stops[i]).filter(Boolean);

      for (let i = 0; i < tourStops.length - 1; i++) {
        const start = tourStops[i];
        const end = tourStops[i+1];
        if (!start || !end) continue;

        try {
          const response = await fetch('/api/directions', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ coordinates: [[start.lng, start.lat], [end.lng, end.lat]] }),
          });
          const data = await response.json();
          if (data.features && data.features[0]) {
            fullGeometry.push(...data.features[0].geometry.coordinates);
          }
        } catch (error) {
          console.error("Error fetching directions for segment:", error);
        }
      }
      setRouteGeometry(fullGeometry);
    };

    fetchRouteGeometry();
  }, [route, stops]);

  return (
    <div className="h-[400px] w-full">
      <GoogleMapWrapper
        stops={stops}
        optimizedTour={route?.tour}
        routeGeometry={routeGeometry}
      />
    </div>
  );
}
