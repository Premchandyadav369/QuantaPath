"use client"

import { useState, useCallback, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Progress } from "@/components/ui/progress"
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
} from "lucide-react"
import { ApiClient } from "@/lib/services/api-client"
import { AdvancedParameterControls } from "@/components/advanced-parameter-controls"
import { LeafletMap } from "@/components/leaflet-map"
import { ResultsVisualization } from "@/components/results-visualization"
import { NavigationPanel } from "@/components/navigation-panel"
import { CarbonFootprintCalculator } from "@/components/carbon-footprint-calculator"
import { SimulationControls } from "@/components/simulation-controls"
import { OptimizedRouteMap } from "@/components/optimized-route-map"
import type { DeliveryStop, OptimizationRequest, RouteResult } from "@/lib/types"

export function InteractiveMap() {
  const [stops, setStops] = useState<DeliveryStop[]>([
    { id: "depot", name: "Distribution Center", lat: 16.5062, lng: 80.648, isDepot: true },
    { id: "stop1", name: "Electronics Store", lat: 16.515, lng: 80.655 },
    { id: "stop2", name: "Pharmacy", lat: 16.498, lng: 80.642 },
    { id: "stop3", name: "Grocery Market", lat: 16.51, lng: 80.635 },
    { id: "stop4", name: "Restaurant", lat: 16.522, lng: 80.651 },
  ])
  const [processedStops, setProcessedStops] = useState<DeliveryStop[]>(stops)
  const [showOptimizedMap, setShowOptimizedMap] = useState(false)

  const [isDepotMode, setIsDepotMode] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [searchError, setSearchError] = useState<string | null>(null)
  const [searchedLocation, setSearchedLocation] = useState<{ lat: number; lng: number; name: string } | null>(null);
  const mapRef = useRef<any>(null)

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

  const handleMapClick = useCallback(
    (lat: number, lng: number) => {
      if (isOptimizing) return

      if (isDepotMode) {
        // Move depot to new location
        setStops((prev) =>
          prev.map((stop) => (stop.isDepot ? { ...stop, lat, lng, name: "Distribution Center" } : stop)),
        )
        setIsDepotMode(false) // Exit depot mode after placing
        setError(null)
        return
      }

      // Add regular delivery stop
      const newStop: DeliveryStop = {
        id: `stop${Date.now()}`,
        name: `Stop ${stops.filter((s) => !s.isDepot).length + 1}`,
        lat,
        lng,
      }

      setStops((prev) => [...prev, newStop])
      setError(null)
    },
    [stops, isOptimizing, isDepotMode],
  )

  const toggleDepotMode = useCallback(() => {
    if (isOptimizing) return
    setIsDepotMode(!isDepotMode)
    setError(null)
  }, [isOptimizing, isDepotMode])

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
    if (stops.length < 3) {
      setError("Please add at least 2 delivery stops to optimize routes")
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

      setOptimizationStatus("Building distance matrix...")

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
      setSelectedRoute(response.candidates[response.bestIndex])
      setProcessedStops(stops)
      setShowOptimizedMap(true)

      // Clear status after delay
      setTimeout(() => {
        setOptimizationStatus("")
        setOptimizationProgress(0)
      }, 2000)
    } catch (error) {
      console.error("Optimization failed:", error)
      setError(error instanceof Error ? error.message : "Optimization failed")

      // Fallback to mock results for demo
      const mockRoutes: RouteResult[] = [
        {
          solver: "quantum",
          name: `QAOA p=${quantumParams.p}`,
          tour: [0, 1, 2, 3, 0],
          length: 24.7 + Math.random() * 2,
          feasible: true,
          violations: { pos: 0, city: 0 },
          runtimeMs: 1500 + Math.random() * 1000,
          parameters: quantumParams,
        },
      ]

      if (classicalParams.nn) {
        mockRoutes.push({
          solver: "classical",
          name: "Nearest Neighbor + 2-opt",
          tour: [0, 2, 1, 3, 0],
          length: 26.3 + Math.random() * 2,
          feasible: true,
          violations: { pos: 0, city: 0 },
          runtimeMs: 45 + Math.random() * 50,
        })
      }

      if (classicalParams.anneal) {
        mockRoutes.push({
          solver: "classical",
          name: "Simulated Annealing",
          tour: [0, 3, 1, 2, 0],
          length: 25.8 + Math.random() * 2,
          feasible: true,
          violations: { pos: 0, city: 0 },
          runtimeMs: 120 + Math.random() * 100,
        })
      }

      setRoutes(mockRoutes)
      setSelectedRoute(mockRoutes[0])
      setProcessedStops(stops)
      setShowOptimizedMap(true)
      setOptimizationProgress(0)
      setOptimizationStatus("")
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

  const handleSearch = async () => {
    if (!searchQuery) return;
    setSearchError(null);
    setSearchedLocation(null);

    try {
      const response = await fetch(`/api/geocode?query=${encodeURIComponent(searchQuery)}`);
      if (!response.ok) {
        throw new Error("Failed to fetch geocode data");
      }
      const data = await response.json();
      if (data.features && data.features.length > 0) {
        const bestResult = data.features[0];
        const [lng, lat] = bestResult.geometry.coordinates;
        const name = bestResult.properties.name || `${lat.toFixed(4)}, ${lng.toFixed(4)}`;

        setSearchedLocation({ lat, lng, name });

        if (mapRef.current) {
          mapRef.current.setView([lat, lng], 13);
        }
      } else {
        setSearchError("Location not found.");
      }
    } catch (error) {
      console.error("Geocoding error:", error);
      setSearchError("Failed to search for location.");
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

  const addSearchedLocationAsDepot = () => {
    if (!searchedLocation) return;
    setStops((prev) =>
      prev.map((stop) => stop.isDepot ? { ...stop, lat: searchedLocation.lat, lng: searchedLocation.lng, name: searchedLocation.name } : stop)
    );
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
                      <span className="font-semibold">Set Depot:</span> Click the <MapPin className="w-4 h-4 inline-block mx-1" /> button, then click the map to set your starting point.
                    </li>
                    <li>
                      <span className="font-semibold">Optimize:</span> Once you have at least 3 stops, click &quot;Run Optimization&quot;.
                    </li>
                    <li>
                      <span className="font-semibold">Interact:</span> Drag stops to move them, or click the trash icon to remove them.
                    </li>
                  </ul>
                </div>
              </div>
              <div className="flex gap-2 mb-4">
                <Input
                  type="text"
                  placeholder="Search for a town or address..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                />
                <Button onClick={handleSearch} disabled={isOptimizing}>
                  <Search className="w-4 h-4" />
                </Button>
              </div>

              {searchError && !searchedLocation && (
                <div className="mb-4 p-3 bg-destructive/10 border border-destructive/20 rounded-lg flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-destructive" />
                  <span className="text-sm text-destructive">{searchError}</span>
                </div>
              )}

              {searchedLocation && (
                <div className="mb-4 p-3 bg-primary/10 border border-primary/20 rounded-lg flex items-center justify-between gap-2">
                  <div>
                    <p className="text-sm text-primary font-medium">Found: {searchedLocation.name}</p>
                    <p className="text-xs text-primary/80">Add this location to your route.</p>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" onClick={addSearchedLocationAsStop}>Add Stop</Button>
                    <Button size="sm" variant="outline" onClick={addSearchedLocationAsDepot}>Set Depot</Button>
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

              {isDepotMode && (
                <div className="mb-4 p-3 bg-primary/10 border border-primary/20 rounded-lg flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-primary" />
                  <span className="text-sm text-primary font-medium">
                    Depot placement mode active - Click to set new depot location
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

              <div className="relative">
                <LeafletMap
                  stops={stops}
                  routes={routes}
                  selectedRoute={selectedRoute}
                  onMapClick={handleMapClick}
                  onStopRemove={removeStop}
                  onStopMove={handleStopMove}
                  isOptimizing={isOptimizing}
                  isDepotMode={isDepotMode}
                  onMapReady={(map) => (mapRef.current = map)}
                  searchedLocation={searchedLocation}
                  stopsForRoutes={processedStops}
                  simulationTime={simulationTime}
                  isSimulating={isSimulating}
                />

                {/* Map Controls */}
                <div className="absolute top-4 right-4 flex gap-2 z-[1000]">
                  <Button
                    size="sm"
                    variant={isDepotMode ? "default" : "outline"}
                    onClick={toggleDepotMode}
                    disabled={isOptimizing}
                    className={isDepotMode ? "bg-primary text-primary-foreground" : ""}
                  >
                    <MapPin className="w-4 h-4" />
                  </Button>
                  <Button size="sm" variant="outline" onClick={clearStops} disabled={isOptimizing}>
                    <RotateCcw className="w-4 h-4" />
                  </Button>
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
              <CardTitle className="text-lg">Delivery Stops ({stops.length})</CardTitle>
              <p className="text-xs text-muted-foreground">
                Click <MapPin className="w-3 h-3 inline mx-1" /> to change depot location
              </p>
            </CardHeader>
            <CardContent className="space-y-3">
              {stops.map((stop) => (
                <div key={stop.id} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className={`w-3 h-3 rounded-full ${stop.isDepot ? "bg-primary" : "bg-accent"}`} />
                    <div className="flex flex-col">
                      <span className="text-sm font-medium">{stop.name}</span>
                      <span className="text-xs text-muted-foreground">
                        {stop.lat.toFixed(4)}, {stop.lng.toFixed(4)}
                      </span>
                    </div>
                    {stop.isDepot && (
                      <Badge variant="secondary" className="text-xs">
                        Depot
                      </Badge>
                    )}
                  </div>
                  {!stop.isDepot && (
                    <Button size="sm" variant="ghost" onClick={() => removeStop(stop.id)} disabled={isOptimizing}>
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              ))}
              <div className="text-xs text-muted-foreground pt-2 border-t">
                <Plus className="w-3 h-3 inline mr-1" />
                {isDepotMode ? "Click map to set depot" : "Click map to add stops"}
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
            <CardTitle className="flex items-center gap-2">
              <Route className="w-5 h-5" />
              Optimized Route Overview
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              The best route found by the optimization algorithms.
            </p>
          </CardHeader>
          <CardContent>
            <OptimizedRouteMap stops={processedStops} route={selectedRoute} />
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
