"use client"

import { useEffect, useRef, useState } from "react"
import type { DeliveryStop, RouteResult } from "@/lib/types"

const routeColors = ["#FF5733", "#33FF57", "#3357FF", "#FF33A1", "#A133FF", "#33FFA1"];

interface LeafletMapProps {
  stops: DeliveryStop[]
  routes: RouteResult[]
  stopsForRoutes: DeliveryStop[]
  selectedRoute: RouteResult | null
  onMapClick: (lat: number, lng: number) => void
  onStopRemove: (id: string) => void
  onStopMove: (id: string, lat: number, lng: number) => void;
  isOptimizing: boolean
  isDepotMode?: boolean
  onMapReady?: (map: any) => void;
  searchedLocation?: { lat: number; lng: number; name: string } | null;
  simulationTime: number;
  isSimulating: boolean;
}

export function LeafletMap({
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
}: LeafletMapProps) {
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<any>(null)
  const markersRef = useRef<any[]>([])
  const routeLinesRef = useRef<any[]>([])
  const arrowMarkersRef = useRef<any[]>([])
  const searchedMarkerRef = useRef<any>(null)
  const vehicleMarkerRef = useRef<any>(null)
  const [isLoaded, setIsLoaded] = useState(false)
  const [routePolyline, setRoutePolyline] = useState<any>(null)

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
      const isChargingStation = stop.isChargingStation

      const hubs = stops.filter(s => s.isDepot);
      let color = "#7B2CBF"; // Default color
      if (isChargingStation) {
        color = "#F5A623"; // Gold color for charging stations
      } else if (!isDepot && stop.hubId) {
        const hubIndex = hubs.findIndex(h => h.id === stop.hubId);
        if (hubIndex !== -1) {
          color = routeColors[hubIndex % routeColors.length];
        }
      }

      // Create custom icon
      const icon = L.divIcon({
        className: `custom-marker ${isDepot ? "depot-marker" : isChargingStation ? "charger-marker" : "stop-marker"}`,
        html: `
          <div class="marker-content">
             <div class="marker-pin ${isDepot ? "depot-pin" : "stop-pin"}" style="background-color: ${color};">
              ${isChargingStation ? "⚡️" : ""}
            </div>
            <div class="marker-label">${stop.name}</div>
            ${!isDepot && !isChargingStation && !isOptimizing ? '<div class="marker-remove">×</div>' : ""}
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
  }, [stops, isLoaded, onStopRemove, onStopMove, isOptimizing, isDepotMode])

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
    setRoutePolyline(null);

    const drawRoute = async (route) => {
      const color = getRouteColor(route.solver, route.name);
      const isSelected = selectedRoute?.name === route.name;

      // Handle VRP routes (multiple polylines)
      if (route.isVRP && Array.isArray(route.tour[0])) {
        if (isSelected) {
          (route.tour as number[][]).forEach((vehicleTour, index) => {
            const tourStops = vehicleTour.map(stopIndex => stopsForRoutes[stopIndex]).filter(Boolean);
            if (tourStops.length < 2) return;

            const routeCoords = tourStops.map(stop => [stop.lat, stop.lng]);
            const vehicleColor = routeColors[index % routeColors.length];
            const polyline = L.polyline(routeCoords, { color: vehicleColor, weight: 4, opacity: 0.8 }).addTo(map);
            routeLinesRef.current.push(polyline);
          });
        } else {
           // Draw non-selected VRP routes as simplified straight lines
          (route.tour as number[][]).forEach((vehicleTour, index) => {
            const tourStops = vehicleTour.map(stopIndex => stopsForRoutes[stopIndex]).filter(Boolean);
            if (tourStops.length < 2) return;
            const routeCoords = tourStops.map(stop => [stop.lat, stop.lng]);
            const vehicleColor = routeColors[index % routeColors.length];
            const polyline = L.polyline(routeCoords, { color: vehicleColor, weight: 2, opacity: 0.6, dashArray: "5,5" }).addTo(map);
            routeLinesRef.current.push(polyline);
          });
        }
        return; // End drawing for this VRP route
      }

      // Handle standard TSP routes (single polyline)
      if (isSelected) {
        const tourStops = (route.tour as number[]).map(stopIndex => stopsForRoutes[stopIndex]).filter(Boolean);
        if (tourStops.length < 2) return;

        let fullPolylineCoords = [];
        let hasError = false;

        for (let i = 0; i < tourStops.length - 1; i++) {
            const startStop = tourStops[i];
            const endStop = tourStops[i+1];
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

                if (geojson.features?.[0]?.geometry?.coordinates) {
                    const segmentCoords = geojson.features[0].geometry.coordinates;
                    fullPolylineCoords.push(...(i === 0 ? segmentCoords : segmentCoords.slice(1)));
                }

            } catch (error) {
                hasError = true;
                console.error("Error fetching route segment, falling back to straight line for segment:", error);
                const routeCoords = [[startStop.lat, startStop.lng], [endStop.lat, endStop.lng]];
                const polyline = L.polyline(routeCoords, { color: "red", weight: 4, opacity: 1 }).addTo(map);
                routeLinesRef.current.push(polyline);
            }
        }

        if (fullPolylineCoords.length > 0 && !hasError) {
            setRoutePolyline({
                type: "FeatureCollection",
                features: [{
                    type: "Feature",
                    properties: {},
                    geometry: { type: "LineString", coordinates: fullPolylineCoords }
                }]
            });
        } else if (hasError) {
            // Fallback for simulation polyline
            const fallbackCoords = tourStops.map(stop => [stop.lng, stop.lat]);
            setRoutePolyline({
                type: "FeatureCollection",
                features: [{
                    type: "Feature",
                    properties: {},
                    geometry: { type: "LineString", coordinates: fallbackCoords }
                }]
            });
        }

      } else {
        // Draw non-selected routes as straight lines
        const routeCoords = (route.tour as number[]).map(stopIndex => {
          const stop = stopsForRoutes[stopIndex];
          return stop ? [stop.lat, stop.lng] : null;
        }).filter(Boolean);

        if (routeCoords.length < 2) return;

        const dashArray = route.name.includes("Simulated") ? "10,5" : route.solver === "classical" ? "5,5" : undefined;
        const polyline = L.polyline(routeCoords, { color, weight: 2, opacity: 0.6, dashArray }).addTo(map);
        routeLinesRef.current.push(polyline);
      }
    };

    routes.forEach((route) => {
      if (!route.feasible || route.tour.length === 0) return;
      drawRoute(route);
    });
  }, [routes, selectedRoute, stopsForRoutes, isLoaded]);

  // Effect for simulating vehicle movement
  useEffect(() => {
    if (!mapInstanceRef.current || !isLoaded) return;
    const L = window.L;
    const map = mapInstanceRef.current;

    // Clean up vehicle marker if not simulating or no polyline
    if (!isSimulating || !routePolyline || simulationTime === 0) {
      if (vehicleMarkerRef.current) {
        map.removeLayer(vehicleMarkerRef.current);
        vehicleMarkerRef.current = null;
      }
      return;
    }

    const getPointAtDistance = (coords, distance) => {
      let totalDistance = 0;
      for (let i = 0; i < coords.length - 1; i++) {
        const start = L.latLng(coords[i][1], coords[i][0]);
        const end = L.latLng(coords[i + 1][1], coords[i + 1][0]);
        const segmentDist = start.distanceTo(end);
        if (totalDistance + segmentDist >= distance) {
          const ratio = (distance - totalDistance) / segmentDist;
          const lat = start.lat + (end.lat - start.lat) * ratio;
          const lng = start.lng + (end.lng - start.lng) * ratio;
          return L.latLng(lat, lng);
        }
        totalDistance += segmentDist;
      }
      const lastPoint = coords[coords.length - 1];
      return L.latLng(lastPoint[1], lastPoint[0]);
    };

    const coords = routePolyline.features[0].geometry.coordinates;
    let totalRouteDistance = 0;
    for (let i = 0; i < coords.length - 1; i++) {
      totalRouteDistance += L.latLng(coords[i][1], coords[i][0]).distanceTo(L.latLng(coords[i+1][1], coords[i+1][0]));
    }

    const currentDist = simulationTime * totalRouteDistance;
    const point = getPointAtDistance(coords, currentDist);

    if (!vehicleMarkerRef.current) {
      const vehicleIcon = L.divIcon({
        className: 'vehicle-marker',
        html: '🚚',
        iconSize: [32, 32],
        iconAnchor: [16, 16],
      });
      vehicleMarkerRef.current = L.marker(point, { icon: vehicleIcon, zIndexOffset: 1000 }).addTo(map);
    } else {
      vehicleMarkerRef.current.setLatLng(point);
    }

  }, [simulationTime, isSimulating, routePolyline, isLoaded]);

  // Effect for drawing route direction arrows
  useEffect(() => {
    if (!mapInstanceRef.current || !isLoaded || !routePolyline || !selectedRoute) {
      arrowMarkersRef.current.forEach((marker) => mapInstanceRef.current.removeLayer(marker));
      arrowMarkersRef.current = [];
      return;
    };

    const L = window.L;
    const map = mapInstanceRef.current;

    // Clear existing arrows
    arrowMarkersRef.current.forEach((marker) => map.removeLayer(marker));
    arrowMarkersRef.current = [];

    const coords = routePolyline.features[0].geometry.coordinates;
    const arrowInterval = 200; // meters
    let totalDistance = 0;

    for (let i = 0; i < coords.length - 1; i++) {
      const start = L.latLng(coords[i][1], coords[i][0]);
      const end = L.latLng(coords[i + 1][1], coords[i + 1][0]);
      const segmentDist = start.distanceTo(end);

      if (segmentDist === 0) continue;

      const bearing = calculateBearing(start.lat, start.lng, end.lat, end.lng);

      let distanceCovered = 0;
      while (distanceCovered < segmentDist) {
        if (totalDistance % arrowInterval < (totalDistance - segmentDist) % arrowInterval) {
           const point = L.latLng(
            start.lat + (end.lat - start.lat) * (distanceCovered / segmentDist),
            start.lng + (end.lng - start.lng) * (distanceCovered / segmentDist)
          );

          const arrowIcon = L.divIcon({
            className: 'route-arrow',
            html: `<div style="transform: rotate(${bearing}deg); font-size: 1.5em; color: ${getRouteColor(selectedRoute.solver, selectedRoute.name)};">➤</div>`,
            iconSize: [20, 20],
            iconAnchor: [10, 10],
          });

          const arrow = L.marker(point, { icon: arrowIcon }).addTo(map);
          arrowMarkersRef.current.push(arrow);
        }
        distanceCovered += 20; // check every 20m
        totalDistance += 20;
      }
    }
  }, [routePolyline, selectedRoute, isLoaded]); // Rerun when polyline or selected route changes

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

        .vehicle-marker {
          font-size: 28px;
          text-shadow: 0 0 6px white, 0 0 3px white;
          transition: transform 0.1s linear;
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
