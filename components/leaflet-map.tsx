"use client"

import { useEffect, useRef, useState } from "react"
import type { DeliveryStop, RouteResult } from "@/lib/types"

interface LeafletMapProps {
  stops: DeliveryStop[]
  routes: RouteResult[]
  selectedRoute: RouteResult | null
  onMapClick: (lat: number, lng: number) => void
  onStopRemove: (id: string) => void
  onStopMove: (id: string, lat: number, lng: number) => void;
  isOptimizing: boolean
  isDepotMode?: boolean // Added depot mode prop
  onMapReady?: (map: any) => void;
  searchedLocation?: { lat: number; lng: number; name: string } | null;
}

export function LeafletMap({
  stops,
  routes,
  selectedRoute,
  onMapClick,
  onStopRemove,
  onStopMove,
  isOptimizing,
  isDepotMode = false, // Added depot mode with default value
  onMapReady,
  searchedLocation,
}: LeafletMapProps) {
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<any>(null)
  const markersRef = useRef<any[]>([])
  const routeLinesRef = useRef<any[]>([])
  const searchedMarkerRef = useRef<any>(null)
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
    if (onMapReady) {
      onMapReady(map);
    }

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove()
        mapInstanceRef.current = null
      }
    }
  }, [isLoaded, onMapClick, isOptimizing, onMapReady])

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

      const marker = L.marker([stop.lat, stop.lng], {
        icon,
        draggable: !isDepot && !isOptimizing,
       }).addTo(map)

      // Handle remove button click
      if (!isDepot && !isOptimizing) {
        marker.on("click", (e: any) => {
          e.originalEvent.stopPropagation()
          if (e.originalEvent.target.classList.contains("marker-remove")) {
            onStopRemove(stop.id)
          }
        })

        marker.on('dragend', (e: any) => {
          const { lat, lng } = e.target.getLatLng();
          onStopMove(stop.id, lat, lng);
        });
      }

      markersRef.current.push(marker)
    })

    // Fit map to show all markers
    if (stops.length > 0) {
      const group = new L.featureGroup(markersRef.current)
      map.fitBounds(group.getBounds().pad(0.1))
    }
  }, [stops, isLoaded, onStopRemove, isOptimizing, isDepotMode]) // Added isDepotMode dependency

  // Effect to show searched location marker
  useEffect(() => {
    if (!mapInstanceRef.current || !isLoaded) return;
    const L = window.L;
    const map = mapInstanceRef.current;

    // Clear existing searched marker
    if (searchedMarkerRef.current) {
      map.removeLayer(searchedMarkerRef.current);
      searchedMarkerRef.current = null;
    }

    if (searchedLocation) {
      const icon = L.divIcon({
        className: 'custom-marker searched-marker',
        html: `
          <div class="marker-content">
            <div class="marker-pin"></div>
            <div class="marker-label">${searchedLocation.name}</div>
          </div>
        `,
        iconSize: [40, 40],
        iconAnchor: [20, 35],
      });

      const marker = L.marker([searchedLocation.lat, searchedLocation.lng], { icon }).addTo(map);
      searchedMarkerRef.current = marker;
    }
  }, [searchedLocation, isLoaded]);

  // Update routes when routes change
  useEffect(() => {
    if (!mapInstanceRef.current || !isLoaded) return;

    const L = window.L;
    const map = mapInstanceRef.current;

    // Clear existing route lines
    routeLinesRef.current.forEach((line) => map.removeLayer(line));
    routeLinesRef.current = [];

    const fetchAndDrawRoute = async (route) => {
      const color = getRouteColor(route.solver, route.name);
      const isSelected = selectedRoute?.name === route.name;

      if (!isSelected) {
        // Draw non-selected routes as straight lines
        const routeCoords = route.tour
          .map((stopIndex) => {
            const stop = stops[stopIndex];
            return stop ? [stop.lat, stop.lng] : null;
          })
          .filter(Boolean);

        if (routeCoords.length < 2) return;

        const dashArray = route.name.includes("Simulated") ? "10,5" : route.solver === "classical" ? "5,5" : undefined;
        const polyline = L.polyline(routeCoords, {
          color,
          weight: 2,
          opacity: 0.6,
          dashArray,
        }).addTo(map);
        routeLinesRef.current.push(polyline);
        return;
      }

      // For selected route, fetch and draw the real road path
      for (let i = 0; i < route.tour.length - 1; i++) {
        const startStop = stops[route.tour[i]];
        const endStop = stops[route.tour[i + 1]];

        if (!startStop || !endStop) continue;

        const coordinates = [
          [startStop.lng, startStop.lat],
          [endStop.lng, endStop.lat],
        ];

        try {
          const response = await fetch("/api/directions", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ coordinates }),
          });

          if (!response.ok) {
            throw new Error(`Failed to fetch directions: ${response.statusText}`);
          }

          const geojson = await response.json();
          const routeLayer = L.geoJSON(geojson, {
            style: {
              color,
              weight: 4,
              opacity: 1,
            },
          }).addTo(map);
          routeLinesRef.current.push(routeLayer);

          // Add arrow
          if (geojson.features && geojson.features[0] && geojson.features[0].geometry.coordinates) {
            const coords = geojson.features[0].geometry.coordinates;
            if (coords.length > 1) {
              const midIndex = Math.floor(coords.length / 2);
              const start = [coords[midIndex-1][1], coords[midIndex-1][0]];
              const end = [coords[midIndex][1], coords[midIndex][0]];
              const bearing = calculateBearing(start[0], start[1], end[0], end[1]);
              const arrowIcon = L.divIcon({
                className: "route-arrow",
                html: `<div class="arrow-icon" style="transform: rotate(${bearing}deg)">➤</div>`,
                iconSize: [20, 20],
                iconAnchor: [10, 10],
              });
              const arrowMarker = L.marker([(start[0] + end[0]) / 2, (start[1] + end[1]) / 2], { icon: arrowIcon }).addTo(map);
              routeLinesRef.current.push(arrowMarker);
            }
          }

        } catch (error) {
          console.error("Error fetching route geometry:", error);
          // Fallback to straight line
          const routeCoords = [[startStop.lat, startStop.lng], [endStop.lat, endStop.lng]];
          const polyline = L.polyline(routeCoords, {
            color: "red", // Indicate error
            weight: 4,
            opacity: 1,
          }).addTo(map);
          routeLinesRef.current.push(polyline);
        }
      }
    };

    routes.forEach((route) => {
      if (!route.feasible || route.tour.length === 0) return;
      fetchAndDrawRoute(route);
    });
  }, [routes, selectedRoute, stops, isLoaded]);

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
        
        .searched-marker .marker-pin {
          background-color: #FFD700; /* Gold */
          animation: pulse-search 1.5s infinite;
        }

        @keyframes pulse-search {
          0% { transform: scale(1); box-shadow: 0 0 0 0 rgba(255, 215, 0, 0.7); }
          70% { transform: scale(1); box-shadow: 0 0 0 10px rgba(255, 215, 0, 0); }
          100% { transform: scale(1); box-shadow: 0 0 0 0 rgba(255, 215, 0, 0); }
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
