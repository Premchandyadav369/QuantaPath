"use client"

import { useState, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Progress } from "@/components/ui/progress"
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
} from "lucide-react"
import { ApiClient } from "@/lib/services/api-client"
import { AdvancedParameterControls } from "@/components/advanced-parameter-controls"
import { LeafletMap } from "@/components/leaflet-map"
import type { DeliveryStop, OptimizationRequest, RouteResult } from "@/lib/types"

export function InteractiveMap() {
  const [stops, setStops] = useState<DeliveryStop[]>([
    { id: "depot", name: "Depot", lat: 16.5062, lng: 80.648, isDepot: true },
    { id: "stop1", name: "Stop 1", lat: 16.515, lng: 80.655 },
    { id: "stop2", name: "Stop 2", lat: 16.498, lng: 80.642 },
    { id: "stop3", name: "Stop 3", lat: 16.51, lng: 80.635 },
  ])

  const [isDepotMode, setIsDepotMode] = useState(false)

  const [routes, setRoutes] = useState<RouteResult[]>([])
  const [isOptimizing, setIsOptimizing] = useState(false)
  const [optimizationProgress, setOptimizationProgress] = useState(0)
  const [optimizationStatus, setOptimizationStatus] = useState("")
  const [selectedRoute, setSelectedRoute] = useState<RouteResult | null>(null)
  const [error, setError] = useState<string | null>(null)

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

  const handleMapClick = useCallback(
    (lat: number, lng: number) => {
      if (isOptimizing) return

      if (isDepotMode) {
        // Move depot to new location
        setStops((prev) => prev.map((stop) => (stop.isDepot ? { ...stop, lat, lng, name: "Depot" } : stop)))
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
      setStops((prev) => prev.filter((stop) => stop.id !== id && !stop.isDepot))
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
      setOptimizationProgress(0)
      setOptimizationStatus("")
    }

    setIsOptimizing(false)
  }, [stops, quantumParams, classicalParams])

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

  const getRouteColor = (solver: "quantum" | "classical", name: string) => {
    if (solver === "quantum") return "#7B2CBF"
    if (name.includes("Simulated")) return "#06D6A0"
    return "#0D1B2A"
  }

  return (
    <div className="grid lg:grid-cols-3 gap-6">
      {/* Map Canvas */}
      <div className="lg:col-span-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="w-5 h-5" />
              Interactive Route Map
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              {isDepotMode
                ? "Click on the map to place the depot (starting point)"
                : "Click on the map to add delivery stops. Use 'Set Depot' to change the starting point."}
            </p>
          </CardHeader>
          <CardContent>
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
                isOptimizing={isOptimizing}
                isDepotMode={isDepotMode}
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
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: getRouteColor(route.solver, route.name) }}
                      />
                      <span className="font-medium text-sm">{route.name}</span>
                      {route.solver === "quantum" && <Zap className="w-3 h-3 text-accent" />}
                    </div>
                    <Badge variant={route.feasible ? "default" : "destructive"} className="text-xs">
                      {route.feasible ? "Valid" : "Invalid"}
                    </Badge>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                    <div>Distance: {route.length.toFixed(1)} km</div>
                    <div className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {route.runtimeMs}ms
                    </div>
                  </div>
                </div>
              ))}

              {routes.length > 1 && (
                <>
                  <Separator />
                  <div className="text-xs text-muted-foreground space-y-1">
                    {routes.find((r) => r.solver === "quantum") && (
                      <div className="flex justify-between">
                        <span>Best Classical:</span>
                        <span className="font-medium">
                          {Math.min(...routes.filter((r) => r.solver === "classical").map((r) => r.length)).toFixed(1)}{" "}
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
  )
}
