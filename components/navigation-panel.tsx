"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Navigation, Clock, ArrowUp, ArrowDown, ArrowLeft, ArrowRight, RotateCcw, MapPin, Route } from "lucide-react"
import type { DeliveryStop, RouteResult } from "@/lib/types"

interface NavigationStep {
  from: DeliveryStop
  to: DeliveryStop
  distance: number
  duration: number // in minutes
  direction: "forward" | "left" | "right" | "backward"
  bearing: number
  instruction: string
}

interface NavigationPanelProps {
  stops: DeliveryStop[]
  selectedRoute: RouteResult | null
}

export function NavigationPanel({ stops, selectedRoute }: NavigationPanelProps) {
  if (!selectedRoute || stops.length < 2) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Navigation className="w-5 h-5" />
            Turn-by-Turn Navigation
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <Route className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>Select an optimized route to see navigation instructions</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  // Calculate navigation steps from the route
  const calculateNavigationSteps = (): NavigationStep[] => {
    const steps: NavigationStep[] = []
    const tour = selectedRoute.tour

    for (let i = 0; i < tour.length - 1; i++) {
      const fromIndex = tour[i]
      const toIndex = tour[i + 1]
      const from = stops[fromIndex]
      const to = stops[toIndex]

      if (!from || !to) continue

      // Calculate distance using Haversine formula
      const distance = calculateDistance(from.lat, from.lng, to.lat, to.lng)

      // Estimate duration (assuming average speed of 40 km/h in city)
      const duration = (distance / 40) * 60 // minutes

      // Calculate bearing and direction
      const bearing = calculateBearing(from.lat, from.lng, to.lat, to.lng)
      const direction = getDirection(
        bearing,
        i > 0
          ? calculateBearing(
              stops[tour[i - 1]]?.lat || from.lat,
              stops[tour[i - 1]]?.lng || from.lng,
              from.lat,
              from.lng,
            )
          : 0,
      )

      const instruction = generateInstruction(from, to, direction, distance)

      steps.push({
        from,
        to,
        distance,
        duration,
        direction,
        bearing,
        instruction,
      })
    }

    return steps
  }

  const calculateDistance = (lat1: number, lng1: number, lat2: number, lng2: number): number => {
    const R = 6371 // Earth's radius in km
    const dLat = ((lat2 - lat1) * Math.PI) / 180
    const dLng = ((lng2 - lng1) * Math.PI) / 180
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) * Math.sin(dLng / 2)
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
    return R * c
  }

  const calculateBearing = (lat1: number, lng1: number, lat2: number, lng2: number): number => {
    const dLng = ((lng2 - lng1) * Math.PI) / 180
    const lat1Rad = (lat1 * Math.PI) / 180
    const lat2Rad = (lat2 * Math.PI) / 180

    const y = Math.sin(dLng) * Math.cos(lat2Rad)
    const x = Math.cos(lat1Rad) * Math.sin(lat2Rad) - Math.sin(lat1Rad) * Math.cos(lat2Rad) * Math.cos(dLng)

    const bearing = (Math.atan2(y, x) * 180) / Math.PI
    return (bearing + 360) % 360
  }

  const getDirection = (currentBearing: number, previousBearing: number): "forward" | "left" | "right" | "backward" => {
    if (previousBearing === 0) return "forward" // First step

    let angleDiff = currentBearing - previousBearing
    if (angleDiff < 0) angleDiff += 360
    if (angleDiff > 360) angleDiff -= 360

    if (angleDiff >= 315 || angleDiff <= 45) return "forward"
    if (angleDiff > 45 && angleDiff <= 135) return "right"
    if (angleDiff > 135 && angleDiff <= 225) return "backward"
    return "left"
  }

  const generateInstruction = (from: DeliveryStop, to: DeliveryStop, direction: string, distance: number): string => {
    const directionText =
      {
        forward: "Continue straight",
        left: "Turn left",
        right: "Turn right",
        backward: "Make a U-turn",
      }[direction] || "Continue"

    if (from.isDepot) {
      return `Start from ${from.name} and head towards ${to.name}`
    }

    if (to.isDepot) {
      return `${directionText} and return to ${to.name} (${distance.toFixed(1)} km)`
    }

    return `${directionText} towards ${to.name} (${distance.toFixed(1)} km)`
  }

  const getDirectionIcon = (direction: string) => {
    switch (direction) {
      case "forward":
        return <ArrowUp className="w-4 h-4" />
      case "left":
        return <ArrowLeft className="w-4 h-4" />
      case "right":
        return <ArrowRight className="w-4 h-4" />
      case "backward":
        return <RotateCcw className="w-4 h-4" />
      default:
        return <ArrowUp className="w-4 h-4" />
    }
  }

  const navigationSteps = calculateNavigationSteps()
  const totalDistance = navigationSteps.reduce((sum, step) => sum + step.distance, 0)
  const totalDuration = navigationSteps.reduce((sum, step) => sum + step.duration, 0)

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Navigation className="w-5 h-5" />
          Turn-by-Turn Navigation
        </CardTitle>
        <div className="flex gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-1">
            <Route className="w-4 h-4" />
            {totalDistance.toFixed(1)} km
          </div>
          <div className="flex items-center gap-1">
            <Clock className="w-4 h-4" />
            {Math.round(totalDuration)} min
          </div>
          <Badge variant="outline" className="text-xs">
            {selectedRoute.name}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {navigationSteps.map((step, index) => (
            <div key={index}>
              <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
                <div className="flex-shrink-0 mt-0.5">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                    {getDirectionIcon(step.direction)}
                  </div>
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-medium">Step {index + 1}</span>
                    <Badge variant="secondary" className="text-xs">
                      {step.direction}
                    </Badge>
                  </div>

                  <p className="text-sm text-muted-foreground mb-2">{step.instruction}</p>

                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Route className="w-3 h-3" />
                      {step.distance.toFixed(1)} km
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {Math.round(step.duration)} min
                    </div>
                    <div className="flex items-center gap-1">
                      <Navigation className="w-3 h-3" />
                      {Math.round(step.bearing)}°
                    </div>
                  </div>
                </div>
              </div>

              {index < navigationSteps.length - 1 && (
                <div className="flex justify-center py-2">
                  <ArrowDown className="w-4 h-4 text-muted-foreground/50" />
                </div>
              )}
            </div>
          ))}

          {navigationSteps.length > 0 && (
            <>
              <Separator />
              <div className="p-3 rounded-lg bg-accent/10 border border-accent/20">
                <div className="flex items-center gap-2 mb-2">
                  <MapPin className="w-4 h-4 text-accent" />
                  <span className="text-sm font-medium">Route Summary</span>
                </div>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">Total Distance:</span>
                    <div className="font-medium">{totalDistance.toFixed(1)} km</div>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Estimated Time:</span>
                    <div className="font-medium">{Math.round(totalDuration)} minutes</div>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Stops:</span>
                    <div className="font-medium">{navigationSteps.length} locations</div>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Algorithm:</span>
                    <div className="font-medium text-accent">{selectedRoute.solver}</div>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
