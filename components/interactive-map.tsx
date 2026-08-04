"use client"

import { useState, useCallback, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Progress } from "@/components/ui/progress"
import dynamic from "next/dynamic"
import { Input } from "@/components/ui/input"
import {
  MapPin,
  Plus,
  Trash2,
  Play,
  RotateCcw,
  Zap,
  Clock,
  AlertCircle,
  CheckCircle2,
  Download,
  Share2,
  Search,
  Heart,
  Info,
  Route,
  CloudRain,
  Flame,
  Leaf,
  History,
  Layers,
  BarChart3,
  TrendingUp,
  SplitSquareHorizontal
} from "lucide-react"
import { ApiClient } from "@/lib/services/api-client"
import * as XLSX from "xlsx"
import { AdvancedParameterControls } from "@/components/advanced-parameter-controls"
import { GoogleMap } from "@/components/google-map"
import { ResultsVisualization } from "@/components/results-visualization"
import { NavigationPanel } from "@/components/navigation-panel"
import { CarbonFootprintCalculator } from "@/components/carbon-footprint-calculator"
import { SimulationControls } from "@/components/simulation-controls"
import { GoogleOptimizedRouteMap } from "@/components/google-optimized-route-map"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import type { DeliveryStop, OptimizationRequest, RouteResult } from "@/lib/types"
import { AIRouteAdvisor } from "@/components/ai-route-advisor"

const DynamicAutocompleteInput = dynamic(
  () => import("@/components/ui/autocomplete-input").then((mod) => mod.AutocompleteInput),
  { ssr: false }
)

export function InteractiveMap() {
  const [stops, setStops] = useState<DeliveryStop[]>([
    { id: "hub1", name: "Hub 1", lat: 16.5062, lng: 80.648, isDepot: true },
    { id: "hub2", name: "Hub 2", lat: 16.55, lng: 80.7, isDepot: true },
    { id: "stop1", name: "Electronics Store", lat: 16.515, lng: 80.655 },
    { id: "stop2", name: "Pharmacy", lat: 16.498, lng: 80.642 },
    { id: "stop3", name: "Grocery Market", lat: 16.51, lng: 80.635 },
    { id: "stop4", name: "Restaurant", lat: 16.522, lng: 80.651 },
    { id: "stop5", name: "Hardware Store", lat: 16.54, lng: 80.71 },
    { id: "stop6", name: "Bookstore", lat: 16.56, lng: 80.69 },
  ])
  const [processedStops, setProcessedStops] = useState<DeliveryStop[]>(stops)
  const [showOptimizedMap, setShowOptimizedMap] = useState(false)

  const [isHubMode, setIsHubMode] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [searchedLocation, setSearchedLocation] = useState<{ lat: number; lng: number; name: string } | null>(null);
  const mapRef = useRef<google.maps.Map | null>(null)

  const [routes, setRoutes] = useState<RouteResult[]>([
    {
      solver: "quantum",
      name: "HAWS-QAOA p=3",
      tour: [0, 1, 4, 2, 3, 0],
      length: 23.4,
      feasible: true,
      violations: { pos: 0, city: 0 },
      runtimeMs: 1847,
      parameters: {
        use: true,
        p: 3,
        shots: 1024,
        optimizer: "COBYLA" as const,
        penalties: { A: 1000, B: 1000 },
        backend: "aer" as const,
      },
    },
    {
      solver: "classical",
      name: "Nearest Neighbor + 2-opt",
      tour: [0, 2, 1, 4, 3, 0],
      length: 26.8,
      feasible: true,
      violations: { pos: 0, city: 0 },
      runtimeMs: 67,
    },
    {
      solver: "classical",
      name: "Simulated Annealing",
      tour: [0, 3, 2, 1, 4, 0],
      length: 25.1,
      feasible: true,
      violations: { pos: 0, city: 0 },
      runtimeMs: 234,
    },
  ])

  const [isOptimizing, setIsOptimizing] = useState(false)
  const [optimizationProgress, setOptimizationProgress] = useState(0)
  const [optimizationStatus, setOptimizationStatus] = useState("")
  const [selectedRoute, setSelectedRoute] = useState<RouteResult | null>(routes[0])
  const [error, setError] = useState<string | null>(null)
  const [likedRoutes, setLikedRoutes] = useState<string[]>([])
  const [mapType, setMapType] = useState<string>("All Routes")

  // Simulation state
  const [isSimulating, setIsSimulating] = useState(false)
  const [simulationTime, setSimulationTime] = useState(0) // 0 to 1
  const [simulationSpeed, setSimulationSpeed] = useState(5) // 1 to 10

  const [quantumParams, setQuantumParams] = useState({
    use: true,
    p: 2,
    shots: 1024,
    optimizer: "COBYLA" as const,
    penalties: { A: 1000, B: 1000 },
    backend: "aer" as const,
  })

  const [quantumVisualizationMode, setQuantumVisualizationMode] = useState(false);

  // New Map Overlay States
  const [showHeatmap, setShowHeatmap] = useState(false);
  const [showWeather, setShowWeather] = useState(false);
  const [showCarbon, setShowCarbon] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [showLayerMenu, setShowLayerMenu] = useState(false);
  const [showMiniAnalytics, setShowMiniAnalytics] = useState(false);
  const [isSplitScreen, setIsSplitScreen] = useState(false);

  // Context Menu State
  const [contextMenu, setContextMenu] = useState<{ x: number, y: number, lat: number, lng: number } | null>(null);

  const [classicalParams, setClassicalParams] = useState({
    nn: true,
    twoOpt: true,
    anneal: true,
    ortools: false,
    simulatedAnnealingParams: {
      initialTemp: 100,
      coolingRate: 0.995,
      maxIterations: 1000,
    },
  })

  useEffect(() => {
    try {
      const urlParams = new URLSearchParams(window.location.search)
      const configParam = urlParams.get("config")

      if (configParam) {
        const decodedConfig = JSON.parse(atob(configParam))

        if (decodedConfig.stops && Array.isArray(decodedConfig.stops)) {
          const stopsFromConfig: DeliveryStop[] = decodedConfig.stops.map((stop, index) => ({
            id: stop.isDepot ? "depot" : `stop${Date.now()}${index}`,
            name: stop.name,
            lat: stop.lat,
            lng: stop.lng,
            isDepot: stop.isDepot || false,
          }))
          setStops(stopsFromConfig)
        }

        if (decodedConfig.quantum) {
          setQuantumParams(decodedConfig.quantum)
        }

        if (decodedConfig.classical) {
          setClassicalParams(decodedConfig.classical)
        }
      }
    } catch (error) {
      console.error("Failed to parse configuration from URL:", error)
    }
  }, [])

  const handleMapRightClick = useCallback((e: google.maps.MapMouseEvent) => {
      if (!e.latLng || !e.domEvent) return;
      e.domEvent.preventDefault();
      const domEvent = e.domEvent as unknown as MouseEvent;
      setContextMenu({
          x: domEvent.clientX,
          y: domEvent.clientY,
          lat: e.latLng.lat(),
          lng: e.latLng.lng()
      });
  }, []);

  // Close context menu on any map click or outside click
  useEffect(() => {
     const closeMenu = () => setContextMenu(null);
     document.addEventListener('click', closeMenu);
     return () => document.removeEventListener('click', closeMenu);
  }, []);

  const handleMapClick = useCallback(
    (lat: number, lng: number) => {
      if (isOptimizing) return;
      setContextMenu(null);

      const newStop: DeliveryStop = {
        id: `stop${Date.now()}`,
        name: isHubMode
          ? `Hub ${stops.filter(s => s.isDepot).length + 1}`
          : `Stop ${stops.filter(s => !s.isDepot).length + 1}`,
        lat,
        lng,
        isDepot: isHubMode,
      };

      setStops(prev => [...prev, newStop]);
      if (isHubMode) {
        setIsHubMode(false); // Exit hub mode after placing a hub
      }
      setError(null);
    },
    [stops, isOptimizing, isHubMode]
  );

  const toggleHubMode = useCallback(() => {
    if (isOptimizing) return
    setIsHubMode(!isHubMode)
    setError(null)
  }, [isOptimizing, isHubMode])

  const removeStop = useCallback(
    (id: string) => {
      if (isOptimizing) return
      setStops((prev) => prev.filter((stop) => stop.id !== id))
      setError(null)
    },
    [isOptimizing],
  )

  const handleStopMove = useCallback(
    (id: string, lat: number, lng: number) => {
      if (isOptimizing) return
      setStops((prev) =>
        prev.map((stop) => (stop.id === id ? { ...stop, lat, lng } : stop))
      )
      setError(null)
    },
    [isOptimizing],
  )

  const clearStops = useCallback(() => {
    if (isOptimizing) return
    setStops((prev) => prev.filter((stop) => stop.isDepot))
    setRoutes([])
    setSelectedRoute(null)
    setError(null)
  }, [isOptimizing])

  const optimizeRoutes = useCallback(async () => {
    if (stops.filter((s) => !s.isDepot).length < 2) {
      setError("Please add at least 2 delivery stops to optimize routes.")
      return
    }
    if (stops.filter((s) => s.isDepot).length === 0) {
      setError("Please add at least one hub.")
      return
    }

    setIsOptimizing(true)
    setOptimizationProgress(0)
    setOptimizationStatus("Initializing optimization...")
    setError(null)

    try {
      const apiClient = ApiClient.getInstance()

      // Simulate progress updates
      const progressInterval = setInterval(() => {
        setOptimizationProgress((prev) => {
          const newProgress = prev + Math.random() * 15
          if (newProgress >= 90) {
            clearInterval(progressInterval)
            return 90
          }
          return newProgress
        })
      }, 200)

      setOptimizationStatus("Building distance matrix and assigning stops to hubs...")

      const request: OptimizationRequest = {
        stops,
        optimizeFor: "distance",
        distanceSource: "openrouteservice",
        quantum: quantumParams,
        classical: classicalParams,
        seed: 42,
      }

      setOptimizationStatus("Running optimization algorithms...")
      const response = await apiClient.optimizeRoutes(request)
      clearInterval(progressInterval)

      setOptimizationProgress(100)
      setOptimizationStatus("Optimization complete!")

      setRoutes(response.candidates)
      setSelectedRoute(response.bestIndex !== -1 ? response.candidates[response.bestIndex] : null)

      // Update stops with hub assignments from the backend
      const hubs = stops.filter(s => s.isDepot);
      if (response.stopsWithHubs) {
        setProcessedStops([...hubs, ...response.stopsWithHubs]);
      } else {
        setProcessedStops(stops);
      }

      setShowOptimizedMap(true)

      // Clear status after delay
      setTimeout(() => {
        setOptimizationStatus("")
        setOptimizationProgress(0)
      }, 2000)
    } catch (error) {
      console.error("Optimization failed:", error)
      setError(error instanceof Error ? error.message : "Optimization failed")
    }

    setIsOptimizing(false)
  }, [stops, quantumParams, classicalParams])

  // Simulation handlers
  const handleToggleSimulation = () => {
    if (simulationTime >= 1) {
      setSimulationTime(0);
    }
    setIsSimulating(!isSimulating);
  };

  const handleSpeedChange = (speed: number) => {
    setSimulationSpeed(speed);
  };

  const handleResetSimulation = () => {
    setIsSimulating(false);
    setSimulationTime(0);
  };

  // Effect for running the simulation
  useEffect(() => {
    if (isSimulating) {
      const interval = setInterval(() => {
        setSimulationTime(prevTime => {
          const newTime = prevTime + 0.0005 * simulationSpeed;
          if (newTime >= 1) {
            setIsSimulating(false);
            return 1;
          }
          return newTime;
        });
      }, 16); // ~60fps

      return () => clearInterval(interval);
    }
  }, [isSimulating, simulationSpeed]);

  // Reset simulation when selected route changes
  useEffect(() => {
    handleResetSimulation();
  }, [selectedRoute]);

  const exportResults = useCallback(() => {
    const exportData = {
      timestamp: new Date().toISOString(),
      stops,
      parameters: { quantum: quantumParams, classical: classicalParams },
      results: routes,
      selectedRoute: selectedRoute?.name,
    }

    const dataStr = JSON.stringify(exportData, null, 2)
    const dataBlob = new Blob([dataStr], { type: "application/json" })
    const url = URL.createObjectURL(dataBlob)
    const link = document.createElement("a")
    link.href = url
    link.download = `quantapath-results-${new Date().toISOString().split("T")[0]}.json`
    link.click()
    URL.revokeObjectURL(url)
  }, [stops, quantumParams, classicalParams, routes, selectedRoute])

  const handleImportStops = (file: File) => {
    const reader = new FileReader()
    reader.onload = async (e) => {
      try {
        const data = e.target?.result
        const workbook = XLSX.read(data, { type: "array" })
        const sheetName = workbook.SheetNames[0]
        const worksheet = workbook.Sheets[sheetName]
        const json = XLSX.utils.sheet_to_json<any>(worksheet)

        const apiClient = ApiClient.getInstance()

        const newStopsPromises = json.map(async (row, index) => {
          let lat: number, lng: number;

          if (row.Address) {
            const results = await apiClient.geocode(row.Address)
            if (results.length > 0) {
              lat = results[0].lat
              lng = results[0].lng
            } else {
              throw new Error(`Could not geocode address: ${row.Address}`)
            }
          } else {
            lat = parseFloat(row.Latitude)
            lng = parseFloat(row.Longitude)
          }

          if (isNaN(lat) || isNaN(lng)) {
            throw new Error(`Invalid latitude or longitude for row ${index + 2}: ${row.Latitude}, ${row.Longitude}`)
          }

          return {
            id: `stop${Date.now()}${index}`,
            name: row.Name || `Stop ${index + 1}`,
            lat,
            lng,
            isDepot: row["Is Depot"] === "true" || row["Is Depot"] === true,
          }
        })

        const newStops = await Promise.all(newStopsPromises)
        setStops(newStops)
        setError(null)
      } catch (error) {
        console.error("Failed to parse Excel file:", error)
        setError(error instanceof Error ? error.message : "Failed to parse Excel file.")
      }
    }
    reader.readAsArrayBuffer(file)
  }

  const handleExportStopsJson = () => {
    try {
      const dataStr = JSON.stringify(stops, null, 2)
      const dataBlob = new Blob([dataStr], { type: "application/json" })
      const url = URL.createObjectURL(dataBlob)
      const link = document.createElement("a")
      link.href = url
      link.download = `quantapath-stops-${new Date().toISOString().split("T")[0]}.json`
      link.click()
      URL.revokeObjectURL(url)
    } catch (error) {
      console.error("Failed to export stops to JSON:", error)
      setError("Failed to export stops to JSON.")
    }
  }

  const handleExportStops = () => {
    try {
      const dataToExport = stops.map(stop => ({
        Name: stop.name,
        Latitude: stop.lat,
        Longitude: stop.lng,
        "Is Depot": stop.isDepot || false,
      }))

      const worksheet = XLSX.utils.json_to_sheet(dataToExport)
      const workbook = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(workbook, worksheet, "Stops")
      XLSX.writeFile(workbook, `quantapath-stops-${new Date().toISOString().split("T")[0]}.xlsx`)
    } catch (error) {
      console.error("Failed to export stops to Excel:", error)
      setError("Failed to export stops to Excel.")
    }
  }

  const shareConfiguration = useCallback(() => {
    const shareData = {
      stops: stops.map((s) => ({ name: s.name, lat: s.lat, lng: s.lng, isDepot: s.isDepot })),
      quantum: quantumParams,
      classical: classicalParams,
    }

    const encoded = btoa(JSON.stringify(shareData))
    const shareUrl = `${window.location.origin}${window.location.pathname}?config=${encoded}`

    if (navigator.share) {
      navigator.share({
        title: "QuantaPath Configuration",
        text: "Check out this route optimization configuration",
        url: shareUrl,
      })
    } else {
      navigator.clipboard.writeText(shareUrl)
      // Could show a toast notification here
    }
  }, [stops, quantumParams, classicalParams])

  const handlePlaceSelect = (place: google.maps.places.PlaceResult | null) => {
    if (place && place.geometry && place.geometry.location) {
      const lat = place.geometry.location.lat();
      const lng = place.geometry.location.lng();
      const name = place.name || `${lat.toFixed(4)}, ${lng.toFixed(4)}`;

      setSearchQuery(name);
      setSearchedLocation({ lat, lng, name });

      if (mapRef.current) {
        mapRef.current.setCenter({ lat, lng });
        mapRef.current.setZoom(13);
      }
    } else {
      setSearchedLocation(null);
    }
  };

  const handleSearch = async () => {
    if (!searchQuery || !mapRef.current) return;

    if (searchedLocation) {
      mapRef.current.setCenter({ lat: searchedLocation.lat, lng: searchedLocation.lng });
      mapRef.current.setZoom(13);
    } else {
      try {
        const apiClient = ApiClient.getInstance()
        const results = await apiClient.geocode(searchQuery)
        if (results.length > 0) {
          const { lat, lng, name } = results[0]
          setSearchedLocation({ lat, lng, name })
          mapRef.current.setCenter({ lat, lng });
          mapRef.current.setZoom(13);
        } else {
          setError("Location not found.")
        }
      } catch (error) {
        console.error("Geocoding failed:", error)
        setError("Failed to search for location.")
      }
    }
  };

  const addSearchedLocationAsStop = () => {
    if (!searchedLocation) return;
    const newStop: DeliveryStop = {
      id: `stop${Date.now()}`,
      name: searchedLocation.name,
      lat: searchedLocation.lat,
      lng: searchedLocation.lng,
    };
    setStops((prev) => [...prev, newStop]);
    setSearchedLocation(null);
    setSearchQuery("");
  };

  const addSearchedLocationAsHub = () => {
    if (!searchedLocation) return;
    const newHub: DeliveryStop = {
      id: `hub${Date.now()}`,
      name: searchedLocation.name,
      lat: searchedLocation.lat,
      lng: searchedLocation.lng,
      isDepot: true,
    };
    setStops((prev) => [...prev, newHub]);
    setSearchedLocation(null);
    setSearchQuery("");
  };

  const toggleLikeRoute = (routeName: string, e: React.MouseEvent) => {
    e.stopPropagation()
    setLikedRoutes((prev) =>
      prev.includes(routeName) ? prev.filter((r) => r !== routeName) : [...prev, routeName],
    )
  }

  const getRouteColor = (solver: "quantum" | "classical", name: string) => {
    if (solver === "quantum") return "#7B2CBF"
    if (name.includes("Simulated")) return "#06D6A0"
    return "#0D1B2A"
  }

  return (
    <div className="space-y-6">
      {routes.length > 0 && !isOptimizing && (
        <div className="bg-gradient-to-r from-primary/10 to-accent/10 border border-primary/20 rounded-lg p-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-primary/20 rounded-full flex items-center justify-center">
              <Zap className="w-4 h-4 text-primary" />
            </div>
            <div>
              <h3 className="font-semibold text-primary">Live Demo Active</h3>
              <p className="text-sm text-muted-foreground">
                Showing quantum vs classical optimization results for 5 delivery stops.
                <span className="font-medium text-accent"> Quantum achieves 12.7% better efficiency!</span>
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Map Canvas */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="w-5 h-5" />
                Interactive Route Map
                {routes.length > 0 && (
                  <Badge variant="secondary" className="ml-auto">
                    Demo Active
                  </Badge>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="p-3 mb-4 bg-blue-50 border border-blue-200 rounded-lg flex items-start gap-3">
                <Info className="w-5 h-5 text-blue-600 mt-1" />
                <div>
                  <h4 className="font-semibold text-blue-800">How to use the demo:</h4>
                  <ul className="text-sm text-blue-700 list-disc list-inside space-y-1 mt-1">
                    <li>
                      <span className="font-semibold">Add Stops:</span> Click anywhere on the map to add a delivery location.
                    </li>
                    <li>
                      <span className="font-semibold">Add Hub:</span> Click the <MapPin className="w-4 h-4 inline-block mx-1" /> button, then click the map to add a hub.
                    </li>
                    <li>
                      <span className="font-semibold">Optimize:</span> Once you have at least 1 hub and 2 stops, click &quot;Run Optimization&quot;.
                    </li>
                    <li>
                      <span className="font-semibold">Interact:</span> Drag stops to move them, or click the trash icon to remove them.
                    </li>
                  </ul>
                </div>
              </div>
              <div className="flex gap-2 mb-4">
                <DynamicAutocompleteInput onPlaceSelect={handlePlaceSelect} />
                <Button onClick={handleSearch} disabled={isOptimizing}>
                  <Search className="w-4 h-4" />
                </Button>
              </div>

              {searchedLocation && (
                <div className="mb-4 p-3 bg-primary/10 border border-primary/20 rounded-lg flex items-center justify-between gap-2">
                  <div>
                    <p className="text-sm text-primary font-medium">Found: {searchedLocation.name}</p>
                    <p className="text-xs text-primary/80">Add this location to your route.</p>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" onClick={addSearchedLocationAsStop}>Add Stop</Button>
                    <Button size="sm" variant="outline" onClick={addSearchedLocationAsHub}>Set Hub</Button>
                  </div>
                </div>
              )}
              {/* Error Display */}
              {error && (
                <div className="mb-4 p-3 bg-destructive/10 border border-destructive/20 rounded-lg flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-destructive" />
                  <span className="text-sm text-destructive">{error}</span>
                </div>
              )}

              {isHubMode && (
                <div className="mb-4 p-3 bg-primary/10 border border-primary/20 rounded-lg flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-primary" />
                  <span className="text-sm text-primary font-medium">
                    Hub placement mode active - Click map to add a new hub.
                  </span>
                </div>
              )}

              {/* Progress Display */}
              {isOptimizing && (
                <div className="mb-4 p-3 bg-muted/50 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-4 h-4 border-2 border-accent border-t-transparent rounded-full animate-spin" />
                    <span className="text-sm font-medium">{optimizationStatus}</span>
                  </div>
                  <Progress value={optimizationProgress} className="h-2" />
                </div>
              )}

              <div className="relative h-full w-full min-h-[600px] rounded-lg overflow-hidden border border-border">
                <div className={`flex h-full w-full ${isSplitScreen ? 'divide-x divide-border' : ''}`}>
                  <div className={`${isSplitScreen ? 'w-1/2' : 'w-full'} h-full relative`}>
                    {isSplitScreen && (
                       <div className="absolute top-2 left-2 z-20 bg-background/90 backdrop-blur-md rounded px-2 py-1 text-xs font-semibold shadow-md border border-border/50">
                            {selectedRoute?.solver === 'quantum' ? 'Quantum HAWS-QAOA' : 'Primary View'}
                       </div>
                    )}
                    <div className="w-full h-[600px]">
                      <GoogleMap
                        stops={stops}
                        routes={routes}
                        selectedRoute={selectedRoute}
                        onMapClick={handleMapClick}
                        onStopRemove={removeStop}
                        onStopMove={handleStopMove}
                        isOptimizing={isOptimizing}
                        isDepotMode={isHubMode}
                        onMapReady={(map) => (mapRef.current = map)}
                        searchedLocation={searchedLocation}
                        stopsForRoutes={processedStops}
                        simulationTime={simulationTime}
                        isSimulating={isSimulating}
                        quantumVisualizationMode={quantumVisualizationMode}
                        showHeatmap={showHeatmap}
                        showWeather={showWeather}
                        showCarbon={showCarbon}
                        showHistory={showHistory}
                        onMapRightClick={handleMapRightClick}
                      />
                    </div>
                  </div>
                  {isSplitScreen && (
                     <div className="w-1/2 h-full relative">
                        <div className="absolute top-2 left-2 z-20 bg-background/90 backdrop-blur-md rounded px-2 py-1 text-xs font-semibold shadow-md border border-border/50">
                            Classical Baseline
                        </div>
                        <div className="w-full h-[600px]">
                        <GoogleMap
                          stops={stops}
                          routes={routes.filter(r => r.solver === 'classical')}
                          selectedRoute={routes.find(r => r.solver === 'classical') || null}
                          stopsForRoutes={processedStops}
                          onMapClick={() => {}}
                          onStopRemove={() => {}}
                          onStopMove={() => {}}
                          isOptimizing={false}
                          simulationTime={simulationTime}
                          isSimulating={isSimulating}
                        />
                        </div>
                     </div>
                  )}
                </div>

                {/* Context Menu */}
                {contextMenu && (
                    <div
                        className="fixed z-50 w-48 bg-background/95 backdrop-blur-md border border-border/50 rounded-lg shadow-xl p-1 overflow-hidden"
                        style={{ top: contextMenu.y, left: contextMenu.x }}
                    >
                        <Button
                            variant="ghost"
                            className="w-full justify-start text-sm h-8"
                            onClick={(e) => { e.stopPropagation(); setStops(prev => [...prev, { id: `stop${Date.now()}`, name: `Stop ${prev.length + 1}`, lat: contextMenu.lat, lng: contextMenu.lng, isDepot: false }]); setContextMenu(null); }}
                        >
                            <MapPin className="w-3 h-3 mr-2 text-accent" /> Add Stop Here
                        </Button>
                        <Button
                            variant="ghost"
                            className="w-full justify-start text-sm h-8"
                            onClick={(e) => { e.stopPropagation(); setStops(prev => [...prev, { id: `hub${Date.now()}`, name: `Hub ${prev.filter(s=>s.isDepot).length + 1}`, lat: contextMenu.lat, lng: contextMenu.lng, isDepot: true }]); setContextMenu(null); }}
                        >
                            <MapPin className="w-3 h-3 mr-2 text-primary" /> Add Hub Here
                        </Button>
                        <Separator className="my-1" />
                        <Button
                            variant="ghost"
                            className="w-full justify-start text-sm h-8"
                            onClick={(e) => { e.stopPropagation(); optimizeRoutes(); setContextMenu(null); }}
                            disabled={stops.length < 3 || isOptimizing}
                        >
                            <Play className="w-3 h-3 mr-2" /> Optimize From Here
                        </Button>
                    </div>
                )}

                {/* Interactive Route Comparison Checklist */}
                {routes.length > 1 && (
                    <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-10 bg-background/90 backdrop-blur-md border border-border/50 rounded-full px-4 py-2 shadow-xl flex gap-4 items-center">
                        <span className="text-xs font-semibold uppercase text-muted-foreground mr-2">Compare:</span>
                        {routes.map((route) => (
                             <label key={route.name} className="flex items-center gap-2 cursor-pointer group">
                                 <input
                                     type="radio"
                                     name="route-compare"
                                     checked={selectedRoute?.name === route.name}
                                     onChange={() => setSelectedRoute(route)}
                                     className="sr-only"
                                 />
                                 <div className={`w-3 h-3 rounded-full border border-border/50 transition-all ${selectedRoute?.name === route.name ? 'ring-2 ring-offset-2 ring-offset-background' : 'group-hover:scale-110'}`} style={{ backgroundColor: getRouteColor(route.solver, route.name), '--tw-ring-color': getRouteColor(route.solver, route.name) } as React.CSSProperties} />
                                 <span className={`text-xs font-medium transition-colors ${selectedRoute?.name === route.name ? 'text-foreground' : 'text-muted-foreground'}`}>{route.solver === 'quantum' ? 'Quantum' : route.name.includes('Simulated') ? 'SA' : 'NN'}</span>
                             </label>
                        ))}
                    </div>
                )}

                {/* Floating Map Controls */}
                <div className="absolute top-4 right-4 flex flex-col gap-2 z-10 items-end">
                  {/* Live Statistics Overlay (KPI Widgets) */}
                  {selectedRoute && (
                     <div className="flex gap-2 mb-2 w-full justify-end">
                         <div className="bg-background/80 backdrop-blur-md border border-border/50 rounded-xl px-3 py-1 shadow-md flex items-center gap-2">
                             <TrendingUp className="w-4 h-4 text-emerald-500" />
                             <span className="text-xs font-bold">{selectedRoute.length.toFixed(1)} km</span>
                         </div>
                         <div className="bg-background/80 backdrop-blur-md border border-border/50 rounded-xl px-3 py-1 shadow-md flex items-center gap-2">
                             <Clock className="w-4 h-4 text-blue-500" />
                             <span className="text-xs font-bold">{selectedRoute.runtimeMs} ms</span>
                         </div>
                     </div>
                  )}

                  <div className="flex flex-col gap-2">
                  <Button
                    size="icon"
                    variant={isHubMode ? "default" : "secondary"}
                    onClick={toggleHubMode}
                    disabled={isOptimizing}
                    className="rounded-full shadow-lg backdrop-blur-md bg-background/80"
                  >
                    <MapPin className="w-4 h-4" />
                  </Button>
                  <Button size="icon" variant="secondary" onClick={clearStops} disabled={isOptimizing} className="rounded-full shadow-lg backdrop-blur-md bg-background/80">
                    <RotateCcw className="w-4 h-4" />
                  </Button>
                  <Button size="icon" variant={quantumVisualizationMode ? "default" : "secondary"} onClick={() => setQuantumVisualizationMode(!quantumVisualizationMode)} className="rounded-full shadow-lg backdrop-blur-md bg-background/80" title="Toggle Quantum Visualization Mode">
                     <Zap className={quantumVisualizationMode ? "w-4 h-4 text-accent" : "w-4 h-4"} />
                  </Button>
                  <div className="relative">
                      <Button size="icon" variant={showLayerMenu ? "default" : "secondary"} onClick={() => setShowLayerMenu(!showLayerMenu)} className="rounded-full shadow-lg backdrop-blur-md bg-background/80" title="Map Layers">
                         <Layers className="w-4 h-4" />
                      </Button>
                      {showLayerMenu && (
                          <div className="absolute top-0 right-12 bg-background/90 backdrop-blur-md border border-border/50 rounded-xl p-2 shadow-xl flex gap-2 w-max">
                              <Button size="icon" variant={showHeatmap ? "default" : "ghost"} onClick={() => setShowHeatmap(!showHeatmap)} title="Toggle Heatmap" className="h-8 w-8 rounded-full">
                                  <Flame className={showHeatmap ? "w-4 h-4 text-orange-500" : "w-4 h-4"} />
                              </Button>
                              <Button size="icon" variant={showWeather ? "default" : "ghost"} onClick={() => setShowWeather(!showWeather)} title="Toggle Weather" className="h-8 w-8 rounded-full">
                                  <CloudRain className={showWeather ? "w-4 h-4 text-blue-400" : "w-4 h-4"} />
                              </Button>
                              <Button size="icon" variant={showCarbon ? "default" : "ghost"} onClick={() => setShowCarbon(!showCarbon)} title="Toggle Carbon Overlay" className="h-8 w-8 rounded-full">
                                  <Leaf className={showCarbon ? "w-4 h-4 text-emerald-500" : "w-4 h-4"} />
                              </Button>
                              <Button size="icon" variant={showHistory ? "default" : "ghost"} onClick={() => setShowHistory(!showHistory)} title="Toggle Route History" className="h-8 w-8 rounded-full">
                                  <History className="w-4 h-4" />
                              </Button>
                          </div>
                      )}
                  </div>
                  <Button size="icon" variant={isSplitScreen ? "default" : "secondary"} onClick={() => setIsSplitScreen(!isSplitScreen)} className="rounded-full shadow-lg backdrop-blur-md bg-background/80" title="Toggle Split Screen">
                     <SplitSquareHorizontal className="w-4 h-4" />
                  </Button>
                  <Button size="icon" variant={showMiniAnalytics ? "default" : "secondary"} onClick={() => setShowMiniAnalytics(!showMiniAnalytics)} className="rounded-full shadow-lg backdrop-blur-md bg-background/80 mt-auto" title="Mini Analytics Panel">
                     <BarChart3 className="w-4 h-4" />
                  </Button>
                  </div>
                </div>

                {/* Mini Analytics Panel */}
                {showMiniAnalytics && selectedRoute && (
                    <div className="absolute bottom-20 right-4 z-10 w-80 bg-background/90 backdrop-blur-md border border-border/50 rounded-xl p-4 shadow-xl">
                        <div className="flex items-center justify-between mb-3 border-b border-border/50 pb-2">
                            <h4 className="font-semibold text-sm">Convergence Analytics</h4>
                            <BarChart3 className="w-4 h-4 text-muted-foreground" />
                        </div>
                        <div className="h-32 w-full flex items-end justify-between px-2 pb-2 border-l border-b border-border/50 relative">
                             {/* Mock convergence graph bars */}
                             {[100, 80, 65, 55, 52, 50].map((val, i) => (
                                 <div key={i} className="w-4 bg-accent/80 rounded-t-sm" style={{ height: `${val}%` }} title={`Iter ${i*10}: Cost ${val}`} />
                             ))}
                             <span className="absolute -left-6 top-0 text-[10px] text-muted-foreground">100</span>
                             <span className="absolute -left-6 bottom-0 text-[10px] text-muted-foreground">50</span>
                        </div>
                        <p className="text-[10px] text-center text-muted-foreground mt-2">Iterations (x10)</p>
                    </div>
                )}

                {/* Floating Route Inspector */}
                {selectedRoute && (
                    <div className="absolute top-4 left-4 z-10 w-64 bg-background/80 backdrop-blur-md border border-border/50 rounded-xl p-4 shadow-xl">
                        <div className="flex items-center gap-2 mb-2 border-b border-border/50 pb-2">
                           <div className="w-3 h-3 rounded-full mt-1" style={{ backgroundColor: getRouteColor(selectedRoute.solver, selectedRoute.name) }} />
                           <h4 className="font-semibold text-sm truncate">{selectedRoute.name}</h4>
                        </div>
                        <div className="space-y-2 text-sm text-muted-foreground">
                            <div className="flex justify-between items-center">
                                <span>Distance:</span>
                                <span className="font-medium text-foreground">{selectedRoute.length.toFixed(1)} km</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span>Runtime:</span>
                                <span className="font-medium text-foreground">{selectedRoute.runtimeMs} ms</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span>Optimization:</span>
                                <span className="font-medium text-foreground">
                                   {selectedRoute.solver === 'quantum' ? 'HAWS-QAOA' : 'Classical'}
                                </span>
                            </div>
                        </div>
                    </div>
                )}

                {/* Time Slider */}
                <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 z-10 w-[80%] max-w-md bg-background/80 backdrop-blur-md border border-border/50 rounded-xl px-6 py-3 shadow-xl">
                     <div className="flex items-center gap-4">
                         <span className="text-xs font-medium text-muted-foreground whitespace-nowrap">00:00</span>
                         <input
                            type="range"
                            min="0"
                            max="100"
                            value={simulationTime * 100}
                            onChange={(e) => {
                              const time = Number(e.target.value) / 100;
                              handleToggleSimulation(true);
                              setTimeout(() => setSimulationTime(time), 0);
                            }}
                            className="w-full h-1 bg-muted rounded-lg appearance-none cursor-pointer accent-primary"
                            title="Time slider (Simulation)"
                         />
                         <span className="text-xs font-medium text-muted-foreground whitespace-nowrap">23:59</span>
                     </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Control Panel */}
        <div className="space-y-6">
          {/* Stops List */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Hubs & Stops</CardTitle>
              <p className="text-xs text-muted-foreground">
                Click <MapPin className="w-3 h-3 inline mx-1" /> to add new hubs
              </p>
            </CardHeader>
            <CardContent className="space-y-3">
              <h4 className="text-sm font-medium">Hubs ({stops.filter(s => s.isDepot).length})</h4>
              {stops.filter(s => s.isDepot).map((hub) => (
                <div key={hub.id} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-primary" />
                    <div className="flex flex-col">
                      <span className="text-sm font-medium">{hub.name}</span>
                      <span className="text-xs text-muted-foreground">
                        {hub.lat.toFixed(4)}, {hub.lng.toFixed(4)}
                      </span>
                    </div>
                  </div>
                  <Button size="sm" variant="ghost" onClick={() => removeStop(hub.id)} disabled={isOptimizing}>
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              ))}
              <Separator />
              <h4 className="text-sm font-medium">Stops ({stops.filter(s => !s.isDepot).length})</h4>
              {stops.filter(s => !s.isDepot).map((stop) => (
                <div key={stop.id} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-accent" />
                    <div className="flex flex-col">
                      <span className="text-sm font-medium">{stop.name}</span>
                      <span className="text-xs text-muted-foreground">
                        {stop.lat.toFixed(4)}, {stop.lng.toFixed(4)}
                      </span>
                    </div>
                  </div>
                  <Button size="sm" variant="ghost" onClick={() => removeStop(stop.id)} disabled={isOptimizing}>
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              ))}
              <div className="text-xs text-muted-foreground pt-2 border-t">
                <Plus className="w-3 h-3 inline mr-1" />
                {isHubMode ? "Click map to set a new hub" : "Click map to add stops"}
              </div>
            </CardContent>
          </Card>

          {/* Advanced Parameter Controls */}
          <AdvancedParameterControls
            quantumParams={quantumParams}
            classicalParams={classicalParams}
            onQuantumParamsChange={setQuantumParams}
            onClassicalParamsChange={setClassicalParams}
            onReset={clearStops}
            onExport={exportResults}
            onShare={shareConfiguration}
            isOptimizing={isOptimizing}
            onImportStops={handleImportStops}
            onExportStops={handleExportStops}
            onExportStopsJson={handleExportStopsJson}
          />

          {/* Optimization Button */}
          <Button onClick={optimizeRoutes} disabled={stops.length < 3 || isOptimizing} className="w-full" size="lg">
            {isOptimizing ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                Optimizing...
              </>
            ) : (
              <>
                <Play className="w-4 h-4 mr-2" />
                Run Optimization
              </>
            )}
          </Button>

          {/* Simulation Controls */}
          {routes.length > 0 && (
            <SimulationControls
              isSimulating={isSimulating}
              simulationSpeed={simulationSpeed}
              onToggleSimulation={handleToggleSimulation}
              onSpeedChange={handleSpeedChange}
              onResetSimulation={handleResetSimulation}
              isOptimizing={isOptimizing}
              selectedRoute={!!selectedRoute}
            />
          )}

          {/* Results */}
          {routes.length > 0 && (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5 text-secondary" />
                    Results ({routes.length})
                  </CardTitle>
                  <div className="flex gap-1">
                    <Button size="sm" variant="outline" onClick={shareConfiguration}>
                      <Share2 className="w-3 h-3" />
                    </Button>
                    <Button size="sm" variant="outline" onClick={exportResults}>
                      <Download className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {routes.map((route) => (
                  <div
                    key={route.name}
                    className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                      selectedRoute?.name === route.name
                        ? "border-accent bg-accent/10"
                        : "border-border hover:bg-muted/50"
                    }`}
                    onClick={() => setSelectedRoute(route)}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <div
                          className="w-3 h-3 rounded-full mt-1"
                          style={{ backgroundColor: getRouteColor(route.solver, route.name) }}
                        />
                        <div className="flex-grow">
                          <span className="font-medium text-sm">{route.name}</span>
                          {route.solver === "quantum" && <Zap className="w-3 h-3 text-accent inline-block ml-1" />}
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <Badge variant={route.feasible ? "default" : "destructive"} className="text-xs">
                          {route.feasible ? "Valid" : "Invalid"}
                        </Badge>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="w-6 h-6"
                          onClick={(e) => toggleLikeRoute(route.name, e)}
                        >
                          <Heart
                            className={`w-4 h-4 ${
                              likedRoutes.includes(route.name) ? "text-red-500 fill-current" : "text-muted-foreground"
                            }`}
                          />
                        </Button>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground pl-5">
                      <div>Distance: {route.length.toFixed(1)} km</div>
                      <div className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {route.runtimeMs}ms
                      </div>
                    </div>
                  </div>
                ))}

                {routes.length > 0 && (
                  <div className="text-xs text-muted-foreground pt-2 border-t">
                    Liked routes: {likedRoutes.length}
                  </div>
                )}

                {selectedRoute?.solver === "quantum" && (
                  <AIRouteAdvisor routeData={selectedRoute} />
                )}

                {routes.length > 1 && (
                  <>
                    <Separator />
                    <div className="text-xs text-muted-foreground space-y-1">
                      {routes.find((r) => r.solver === "quantum") && (
                        <div className="flex justify-between">
                          <span>Best Classical:</span>
                          <span className="font-medium">
                            {Math.min(...routes.filter((r) => r.solver === "classical").map((r) => r.length)).toFixed(
                              1,
                            )}{" "}
                            km
                          </span>
                        </div>
                      )}
                      <div className="flex justify-between">
                        <span>Best Overall:</span>
                        <span className="font-medium text-accent">
                          {Math.min(...routes.map((r) => r.length)).toFixed(1)} km
                        </span>
                      </div>
                      {routes.find((r) => r.solver === "quantum") && (
                        <div className="flex justify-between">
                          <span>Quantum Advantage:</span>
                          <span className="font-medium text-accent">
                            {(
                              ((Math.min(...routes.filter((r) => r.solver === "classical").map((r) => r.length)) -
                                Math.min(...routes.filter((r) => r.solver === "quantum").map((r) => r.length))) /
                                Math.min(...routes.filter((r) => r.solver === "classical").map((r) => r.length))) *
                              100
                            ).toFixed(1)}
                            %
                          </span>
                        </div>
                      )}
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <ResultsVisualization routes={routes} selectedRoute={selectedRoute} />
        <NavigationPanel stops={processedStops} selectedRoute={selectedRoute} />
      </div>

      {showOptimizedMap && selectedRoute && (
        <Card className="mt-6">
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle className="flex items-center gap-2">
                <Route className="w-5 h-5" />
                Optimized Route Overview
              </CardTitle>
              <Select value={mapType} onValueChange={setMapType}>
                <SelectTrigger className="w-[280px]">
                  <SelectValue placeholder="Select map type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="All Routes">All Routes</SelectItem>
                  {routes.map((route) => (
                    <SelectItem key={route.name} value={route.name}>
                      {route.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <p className="text-sm text-muted-foreground">
              The best route found by the optimization algorithms.
            </p>
          </CardHeader>
          <CardContent>
            <GoogleOptimizedRouteMap
              stops={processedStops}
              routes={
                mapType === "All Routes"
                  ? routes
                  : routes.filter(r => r.name === mapType)
              }
            />
          </CardContent>
        </Card>
      )}

      {routes.length > 0 && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">🌱</div>
              Environmental Impact Analysis
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              Carbon footprint and sustainability metrics for optimized routes
            </p>
          </CardHeader>
          <CardContent>
            <CarbonFootprintCalculator routes={routes} selectedRoute={selectedRoute} stops={processedStops} />
          </CardContent>
        </Card>
      )}
    </div>
  )
}
