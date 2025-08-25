"use client"

import { useEffect, useRef, useState } from "react"
import type { DeliveryStop, RouteResult } from "@/lib/types"

interface OptimizedRouteMapProps {
  stops: DeliveryStop[]
  route: RouteResult | null
}

export function OptimizedRouteMap({ stops, route }: OptimizedRouteMapProps) {
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<any>(null)
  const markersRef = useRef<any[]>([])
  const routeLinesRef = useRef<any[]>([])
  const [isLoaded, setIsLoaded] = useState(false)

  // Load Leaflet dynamically
  useEffect(() => {
    const loadLeaflet = async () => {
      if (typeof window === "undefined") return

      // Load Leaflet CSS
      if (!document.querySelector('link[href*="leaflet.css"]')) {
        const link = document.createElement("link")
        link.rel = "stylesheet"
        link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"
        document.head.appendChild(link)
      }

      // Load Leaflet JS
      if (!window.L) {
        const script = document.createElement("script")
        script.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"
        script.onload = () => setIsLoaded(true)
        document.head.appendChild(script)
      } else {
        setIsLoaded(true)
      }
    }

    loadLeaflet()
  }, [])

  // Initialize map
  useEffect(() => {
    if (!isLoaded || !mapRef.current || mapInstanceRef.current) return

    const L = window.L
    const map = L.map(mapRef.current).setView([16.5062, 80.648], 12)

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(map)

    mapInstanceRef.current = map

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove()
        mapInstanceRef.current = null
      }
    }
  }, [isLoaded])

  // Update markers and route
  useEffect(() => {
    if (!mapInstanceRef.current || !isLoaded || !route) return

    const L = window.L
    const map = mapInstanceRef.current

    // Clear existing markers and routes
    markersRef.current.forEach((marker) => map.removeLayer(marker))
    markersRef.current = []
    routeLinesRef.current.forEach((line) => map.removeLayer(line))
    routeLinesRef.current = []

    // Add new markers
    stops.forEach((stop) => {
      const isDepot = stop.isDepot
      const icon = L.divIcon({
        className: `custom-marker ${isDepot ? "depot-marker" : "stop-marker"}`,
        html: `
          <div class="marker-content">
            <div class="marker-pin ${isDepot ? "depot-pin" : "stop-pin"}"></div>
            <div class="marker-label">${stop.name}</div>
          </div>
        `,
        iconSize: [40, 40],
        iconAnchor: [20, 35],
      })

      const marker = L.marker([stop.lat, stop.lng], { icon }).addTo(map)
      markersRef.current.push(marker)
    })

    // Draw the route
    const drawRoute = async () => {
      const color = "#7B2CBF"; // Optimized route color
      const tourStops = route.tour.map(stopIndex => stops[stopIndex]).filter(Boolean);
      if (tourStops.length < 2) return;

      for (let i = 0; i < tourStops.length - 1; i++) {
          const startStop = tourStops[i];
          const endStop = tourStops[i+1];
          // Add a check to ensure stops are defined
          if (!startStop || !endStop) continue;

          const coordinates = [[startStop.lng, startStop.lat], [endStop.lng, endStop.lat]];

          try {
              const response = await fetch("/api/directions", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ coordinates }),
              });

              if (!response.ok) throw new Error(`Failed to fetch directions: ${response.statusText}`);

              const geojson = await response.json();
              const routeLayer = L.geoJSON(geojson, {
                  style: { color, weight: 4, opacity: 1 },
              }).addTo(map);
              routeLinesRef.current.push(routeLayer);

          } catch (error) {
              console.error("Error fetching route segment, falling back to straight line for segment:", error);
              const routeCoords = [[startStop.lat, startStop.lng], [endStop.lat, endStop.lng]];
              const polyline = L.polyline(routeCoords, { color: "red", weight: 4, opacity: 1 }).addTo(map);
              routeLinesRef.current.push(polyline);
          }
      }
    };

    drawRoute();

    // Fit map to show all markers
    if (markersRef.current.length > 0) {
      const group = new L.featureGroup(markersRef.current)
      map.fitBounds(group.getBounds().pad(0.1))
    }
  }, [stops, route, isLoaded])

  return (
    <>
      <div ref={mapRef} className="w-full h-[400px] rounded-lg border" />
      <style jsx global>{`
        .custom-marker {
          background: transparent;
          border: none;
        }
        .marker-content {
          position: relative;
          text-align: center;
        }
        .marker-pin {
          width: 20px;
          height: 20px;
          border-radius: 50%;
          border: 2px solid white;
          margin: 0 auto;
          box-shadow: 0 2px 4px rgba(0,0,0,0.3);
        }
        .depot-pin {
          background-color: #0D1B2A;
          width: 24px;
          height: 24px;
        }
        .stop-pin {
          background-color: #7B2CBF;
        }
        .marker-label {
          background: rgba(255,255,255,0.9);
          padding: 2px 6px;
          border-radius: 4px;
          font-size: 11px;
          font-weight: 500;
          margin-top: 2px;
          border: 1px solid #ddd;
          white-space: nowrap;
        }
      `}</style>
    </>
  )
}

declare global {
  interface Window {
    L: any
  }
}
