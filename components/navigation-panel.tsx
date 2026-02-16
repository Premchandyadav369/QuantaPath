"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import {
  Navigation,
  Clock,
  ArrowUp,
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  RotateCcw,
  MapPin,
  Route,
  ArrowUpRight,
  ArrowDownLeft,
} from "lucide-react"
import type { DeliveryStop, RouteResult, NavigationStep } from "@/lib/types"

interface NavigationPanelProps {
  stops: DeliveryStop[]
  selectedRoute: RouteResult | null
  navigationSteps: NavigationStep[]
  isLoading: boolean
}

export function NavigationPanel({ stops, selectedRoute, navigationSteps, isLoading }: NavigationPanelProps) {
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

  const getDirectionIcon = (direction?: string) => {
    switch (direction) {
      case "forward":
      case "straight":
        return <ArrowUp className="w-4 h-4" />
      case "left":
        return <ArrowLeft className="w-4 h-4" />
      case "right":
        return <ArrowRight className="w-4 h-4" />
      case "sharp-left":
        return <ArrowDownLeft className="w-4 h-4" />
      case "sharp-right":
        return <ArrowUpRight className="w-4 h-4" />
      case "backward":
      case "u-turn":
        return <RotateCcw className="w-4 h-4" />
      default:
        return <ArrowUp className="w-4 h-4" />
    }
  }

  const totalDistance = navigationSteps.reduce((sum, step) => sum + step.distance, 0)
  const totalDuration = navigationSteps.reduce((sum, step) => sum + step.duration, 0)

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Navigation className="w-5 h-5" />
          Turn-by-Turn Navigation
          {isLoading && (
            <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          )}
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
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-medium">
                      {step.from.name} to {step.to.name}
                    </span>
                  </div>

                  {step.turnInstructions && (
                    <div className="mb-2 p-2 bg-muted/20 rounded text-xs space-y-1">
                      {step.turnInstructions.map((turn, turnIndex) => (
                        <div key={turnIndex} className="text-muted-foreground flex items-start gap-2">
                          <div className="mt-0.5">{getDirectionIcon(turn.type)}</div>
                          <span>{turn.instruction} ({turn.distance.toFixed(0)} m)</span>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Route className="w-3 h-3" />
                      {step.distance.toFixed(1)} km
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {Math.round(step.duration)} min
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
