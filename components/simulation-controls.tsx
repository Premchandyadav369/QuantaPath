"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"
import { Label } from "@/components/ui/label"
import { Play, Pause, Rabbit, Snail, RotateCcw } from "lucide-react"

interface SimulationControlsProps {
  isSimulating: boolean
  simulationSpeed: number
  onToggleSimulation: () => void
  onSpeedChange: (speed: number) => void
  onResetSimulation: () => void
  isOptimizing: boolean
  selectedRoute: boolean
}

export function SimulationControls({
  isSimulating,
  simulationSpeed,
  onToggleSimulation,
  onSpeedChange,
  onResetSimulation,
  isOptimizing,
  selectedRoute,
}: SimulationControlsProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Live Simulation</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-4">
          <Button onClick={onToggleSimulation} size="lg" disabled={isOptimizing || !selectedRoute}>
            {isSimulating ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
          </Button>
          <div className="flex-grow space-y-2">
            <Label htmlFor="speed-slider">Speed</Label>
            <div className="flex items-center gap-2">
              <Snail className="w-4 h-4 text-muted-foreground" />
              <Slider
                id="speed-slider"
                min={1}
                max={10}
                step={1}
                value={[simulationSpeed]}
                onValueChange={(value) => onSpeedChange(value[0])}
                disabled={isOptimizing}
              />
              <Rabbit className="w-4 h-4 text-muted-foreground" />
            </div>
          </div>
        </div>
        <Button onClick={onResetSimulation} variant="outline" className="w-full" disabled={isOptimizing}>
          <RotateCcw className="w-4 h-4 mr-2" />
          Reset Simulation
        </Button>
      </CardContent>
    </Card>
  )
}
