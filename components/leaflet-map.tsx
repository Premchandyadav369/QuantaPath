"use client"

import { useEffect, useRef, useState } from "react"
import type { DeliveryStop, RouteResult } from "@/lib/types"

interface LeafletMapProps {
  stops: DeliveryStop[]
  routes: RouteResult[]
  selectedRoute: RouteResult | null
  onMapClick: (lat: number, lng: number) => void
  onStopRemove: (id: string) => void
  isOptimizing: boolean
  isDepotMode?: boolean // Added depot mode prop
}

export function LeafletMap({
  stops,
  routes,
  selectedRoute,
  onMapClick,
  onStopRemove,
  isOptimizing,
  isDepotMode = false, // Added depot mode with default value
}: LeafletMapProps) {
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

    // Initialize map centered on Amaravati, India
    const map = L.map(mapRef.current).setView([16.5062, 80.648], 12)

    // Add OpenStreetMap tiles
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(map)

    // Handle map clicks
    map.on("click", (e: any) => {
      if (!isOptimizing) {
        onMapClick(e.latlng.lat, e.latlng.lng)
      }
    })

    mapInstanceRef.current = map

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove()
        mapInstanceRef.current = null
      }
    }
  }, [isLoaded, onMapClick, isOptimizing])

  useEffect(() => {
    if (!mapInstanceRef.current || !isLoaded) return

    const mapContainer = mapInstanceRef.current.getContainer()
    if (isDepotMode) {
      mapContainer.style.cursor = "crosshair"
    } else {
      mapContainer.style.cursor = ""
    }
  }, [isDepotMode, isLoaded])

  // Update markers when stops change
  useEffect(() => {
    if (!mapInstanceRef.current || !isLoaded) return

    const L = window.L
    const map = mapInstanceRef.current

    // Clear existing markers
    markersRef.current.forEach((marker) => map.removeLayer(marker))
    markersRef.current = []

    // Add new markers
    stops.forEach((stop) => {
      const isDepot = stop.isDepot

      // Create custom icon
      const icon = L.divIcon({
        className: `custom-marker ${isDepot ? "depot-marker" : "stop-marker"} ${isDepotMode && isDepot ? "depot-highlight" : ""}`, // Added depot highlight class
        html: `
          <div class="marker-content">
            <div class="marker-pin ${isDepot ? "depot-pin" : "stop-pin"}"></div>
            <div class="marker-label">${stop.name}</div>
            ${!isDepot && !isOptimizing ? '<div class="marker-remove">×</div>' : ""}
          </div>
        `,
        iconSize: [40, 40],
        iconAnchor: [20, 35],
      })

      const marker = L.marker([stop.lat, stop.lng], { icon }).addTo(map)

      // Handle remove button click
      if (!isDepot && !isOptimizing) {
        marker.on("click", (e: any) => {
          e.originalEvent.stopPropagation()
          if (e.originalEvent.target.classList.contains("marker-remove")) {
            onStopRemove(stop.id)
          }
        })
      }

      markersRef.current.push(marker)
    })

    // Fit map to show all markers
    if (stops.length > 0) {
      const group = new L.featureGroup(markersRef.current)
      map.fitBounds(group.getBounds().pad(0.1))
    }
  }, [stops, isLoaded, onStopRemove, isOptimizing, isDepotMode]) // Added isDepotMode dependency

  // Update routes when routes change
  useEffect(() => {
    if (!mapInstanceRef.current || !isLoaded) return

    const L = window.L
    const map = mapInstanceRef.current

    // Clear existing route lines
    routeLinesRef.current.forEach((line) => map.removeLayer(line))
    routeLinesRef.current = []

    // Add new route lines with direction arrows
    routes.forEach((route) => {
      if (!route.feasible || route.tour.length === 0) return

      const routeCoords = route.tour
        .map((stopIndex) => {
          const stop = stops[stopIndex]
          return stop ? [stop.lat, stop.lng] : null
        })
        .filter(Boolean)

      if (routeCoords.length < 2) return

      const color = getRouteColor(route.solver, route.name)
      const isSelected = selectedRoute?.name === route.name
      const dashArray = route.name.includes("Simulated") ? "10,5" : route.solver === "classical" ? "5,5" : undefined

      const polyline = L.polyline(routeCoords, {
        color,
        weight: isSelected ? 4 : 2,
        opacity: isSelected ? 1 : 0.6,
        dashArray,
      }).addTo(map)

      if (isSelected && routeCoords.length > 1) {
        for (let i = 0; i < routeCoords.length - 1; i++) {
          const start = routeCoords[i]
          const end = routeCoords[i + 1]

          // Calculate midpoint for arrow placement
          const midLat = (start[0] + end[0]) / 2
          const midLng = (start[1] + end[1]) / 2

          // Calculate bearing for arrow rotation
          const bearing = calculateBearing(start[0], start[1], end[0], end[1])

          // Create arrow marker
          const arrowIcon = L.divIcon({
            className: "route-arrow",
            html: `<div class="arrow-icon" style="transform: rotate(${bearing}deg)">➤</div>`,
            iconSize: [20, 20],
            iconAnchor: [10, 10],
          })

          const arrowMarker = L.marker([midLat, midLng], { icon: arrowIcon }).addTo(map)
          routeLinesRef.current.push(arrowMarker)
        }
      }

      routeLinesRef.current.push(polyline)
    })
  }, [routes, selectedRoute, stops, isLoaded])

  const getRouteColor = (solver: "quantum" | "classical", name: string) => {
    if (solver === "quantum") return "#7B2CBF"
    if (name.includes("Simulated")) return "#06D6A0"
    return "#0D1B2A"
  }

  const calculateBearing = (lat1: number, lng1: number, lat2: number, lng2: number): number => {
    const dLng = ((lng2 - lng1) * Math.PI) / 180
    const lat1Rad = (lat1 * Math.PI) / 180
    const lat2Rad = (lat2 * Math.PI) / 180

    const y = Math.sin(dLng) * Math.cos(lat2Rad)
    const x = Math.cos(lat1Rad) * Math.sin(lat2Rad) - Math.sin(lat1Rad) * Math.cos(lat2Rad) * Math.cos(dLng)

    return ((Math.atan2(y, x) * 180) / Math.PI + 360) % 360
  }

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
          transition: all 0.2s ease;
        }
        
        .depot-pin {
          background-color: #0D1B2A;
          width: 24px;
          height: 24px;
        }
        
        .stop-pin {
          background-color: #7B2CBF;
        }
        
        /* Added depot highlight styles */
        .depot-highlight .depot-pin {
          animation: pulse 1.5s infinite;
          border-color: #7B2CBF;
          border-width: 3px;
        }
        
        @keyframes pulse {
          0% { transform: scale(1); }
          50% { transform: scale(1.1); }
          100% { transform: scale(1); }
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
        
        /* Enhanced depot label in depot mode */
        .depot-highlight .marker-label {
          background: rgba(123, 44, 191, 0.1);
          border-color: #7B2CBF;
          color: #7B2CBF;
          font-weight: 600;
        }
        
        .marker-remove {
          position: absolute;
          top: -8px;
          right: -8px;
          width: 16px;
          height: 16px;
          background: #ef4444;
          color: white;
          border-radius: 50%;
          font-size: 12px;
          line-height: 16px;
          cursor: pointer;
          font-weight: bold;
        }
        
        .marker-remove:hover {
          background: #dc2626;
        }
        
        /* Added styles for route direction arrows */
        .route-arrow {
          background: transparent;
          border: none;
          pointer-events: none;
        }
        
        .arrow-icon {
          color: #7B2CBF;
          font-size: 16px;
          font-weight: bold;
          text-shadow: 1px 1px 2px rgba(255,255,255,0.8);
          display: flex;
          align-items: center;
          justify-content: center;
          width: 20px;
          height: 20px;
        }
        
        /* Enhanced route visualization */
        .leaflet-interactive {
          cursor: crosshair;
        }
      `}</style>
    </>
  )
}

// Add type declaration for Leaflet
declare global {
  interface Window {
    L: any
  }
}
