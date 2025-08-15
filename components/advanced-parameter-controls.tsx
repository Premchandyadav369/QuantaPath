"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Slider } from "@/components/ui/slider"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Settings, Zap, BarChart3, Info, Download, Share2, RotateCcw } from "lucide-react"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

interface QuantumParams {
  use: boolean
  p: number
  shots: number
  optimizer: "COBYLA" | "SPSA" | "NELDER_MEAD"
  penalties: { A: number; B: number }
  backend: "aer" | "real"
}

interface ClassicalParams {
  nn: boolean
  twoOpt: boolean
  anneal: boolean
  ortools: boolean
  simulatedAnnealingParams: {
    initialTemp: number
    coolingRate: number
    maxIterations: number
  }
}

interface AdvancedParameterControlsProps {
  quantumParams: QuantumParams
  classicalParams: ClassicalParams
  onQuantumParamsChange: (params: QuantumParams) => void
  onClassicalParamsChange: (params: ClassicalParams) => void
  onReset: () => void
  onExport: () => void
  onShare: () => void
  isOptimizing: boolean
}

export function AdvancedParameterControls({
  quantumParams,
  classicalParams,
  onQuantumParamsChange,
  onClassicalParamsChange,
  onReset,
  onExport,
  onShare,
  isOptimizing,
}: AdvancedParameterControlsProps) {
  const [activeTab, setActiveTab] = useState("quantum")

  const updateQuantumParam = <K extends keyof QuantumParams>(key: K, value: QuantumParams[K]) => {
    onQuantumParamsChange({ ...quantumParams, [key]: value })
  }

  const updateClassicalParam = <K extends keyof ClassicalParams>(key: K, value: ClassicalParams[K]) => {
    onClassicalParamsChange({ ...classicalParams, [key]: value })
  }

  const updateSAParam = <K extends keyof ClassicalParams["simulatedAnnealingParams"]>(
    key: K,
    value: ClassicalParams["simulatedAnnealingParams"][K],
  ) => {
    onClassicalParamsChange({
      ...classicalParams,
      simulatedAnnealingParams: {
        ...classicalParams.simulatedAnnealingParams,
        [key]: value,
      },
    })
  }

  const resetToDefaults = () => {
    onQuantumParamsChange({
      use: true,
      p: 2,
      shots: 1024,
      optimizer: "COBYLA",
      penalties: { A: 1000, B: 1000 },
      backend: "aer",
    })
    onClassicalParamsChange({
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
    onReset()
  }

  return (
    <TooltipProvider>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Settings className="w-5 h-5" />
              Advanced Parameters
            </CardTitle>
            <div className="flex gap-2">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button size="sm" variant="outline" onClick={onShare} disabled={isOptimizing}>
                    <Share2 className="w-4 h-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Share configuration</TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button size="sm" variant="outline" onClick={onExport} disabled={isOptimizing}>
                    <Download className="w-4 h-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Export results</TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button size="sm" variant="outline" onClick={resetToDefaults} disabled={isOptimizing}>
                    <RotateCcw className="w-4 h-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Reset to defaults</TooltipContent>
              </Tooltip>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="quantum" className="flex items-center gap-2">
                <Zap className="w-4 h-4" />
                Quantum
              </TabsTrigger>
              <TabsTrigger value="classical" className="flex items-center gap-2">
                <BarChart3 className="w-4 h-4" />
                Classical
              </TabsTrigger>
            </TabsList>

            <TabsContent value="quantum" className="space-y-4 mt-4">
              <div className="space-y-4">
                {/* Enable Quantum */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Label htmlFor="quantum-enable">Enable QAOA</Label>
                    <Tooltip>
                      <TooltipTrigger>
                        <Info className="w-3 h-3 text-muted-foreground" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Quantum Approximate Optimization Algorithm</p>
                      </TooltipContent>
                    </Tooltip>
                  </div>
                  <Switch
                    id="quantum-enable"
                    checked={quantumParams.use}
                    onCheckedChange={(checked) => updateQuantumParam("use", checked)}
                    disabled={isOptimizing}
                  />
                </div>

                {quantumParams.use && (
                  <>
                    <Separator />

                    {/* QAOA Depth (p) */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label>QAOA Depth (p)</Label>
                        <Badge variant="outline">{quantumParams.p}</Badge>
                      </div>
                      <Slider
                        value={[quantumParams.p]}
                        onValueChange={([value]) => updateQuantumParam("p", value)}
                        min={1}
                        max={5}
                        step={1}
                        disabled={isOptimizing}
                        className="w-full"
                      />
                      <p className="text-xs text-muted-foreground">
                        Higher values may find better solutions but take longer
                      </p>
                    </div>

                    {/* Shots */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label>Shots</Label>
                        <Badge variant="outline">{quantumParams.shots.toLocaleString()}</Badge>
                      </div>
                      <Slider
                        value={[Math.log2(quantumParams.shots)]}
                        onValueChange={([value]) => updateQuantumParam("shots", Math.pow(2, value))}
                        min={8} // 2^8 = 256
                        max={14} // 2^14 = 16384
                        step={1}
                        disabled={isOptimizing}
                        className="w-full"
                      />
                      <p className="text-xs text-muted-foreground">More shots improve accuracy but increase runtime</p>
                    </div>

                    {/* Optimizer */}
                    <div className="space-y-2">
                      <Label>Classical Optimizer</Label>
                      <Select
                        value={quantumParams.optimizer}
                        onValueChange={(value: QuantumParams["optimizer"]) => updateQuantumParam("optimizer", value)}
                        disabled={isOptimizing}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="COBYLA">COBYLA (Recommended)</SelectItem>
                          <SelectItem value="SPSA">SPSA (Noisy)</SelectItem>
                          <SelectItem value="NELDER_MEAD">Nelder-Mead</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Backend */}
                    <div className="space-y-2">
                      <Label>Quantum Backend</Label>
                      <Select
                        value={quantumParams.backend}
                        onValueChange={(value: QuantumParams["backend"]) => updateQuantumParam("backend", value)}
                        disabled={isOptimizing}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="aer">Aer Simulator (Fast)</SelectItem>
                          <SelectItem value="real">Real Quantum (Slow)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Penalty Parameters */}
                    <div className="space-y-3">
                      <Label>Constraint Penalties</Label>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <Label className="text-xs">Position (A)</Label>
                          <Input
                            type="number"
                            value={quantumParams.penalties.A}
                            onChange={(e) =>
                              updateQuantumParam("penalties", {
                                ...quantumParams.penalties,
                                A: Number(e.target.value),
                              })
                            }
                            disabled={isOptimizing}
                            className="h-8"
                          />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs">City (B)</Label>
                          <Input
                            type="number"
                            value={quantumParams.penalties.B}
                            onChange={(e) =>
                              updateQuantumParam("penalties", {
                                ...quantumParams.penalties,
                                B: Number(e.target.value),
                              })
                            }
                            disabled={isOptimizing}
                            className="h-8"
                          />
                        </div>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Higher penalties enforce constraints more strictly
                      </p>
                    </div>
                  </>
                )}
              </div>
            </TabsContent>

            <TabsContent value="classical" className="space-y-4 mt-4">
              <div className="space-y-4">
                {/* Algorithm Selection */}
                <div className="space-y-3">
                  <Label>Classical Algorithms</Label>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="nn-algo" className="text-sm">
                        Nearest Neighbor + 2-opt
                      </Label>
                      <Switch
                        id="nn-algo"
                        checked={classicalParams.nn}
                        onCheckedChange={(checked) => updateClassicalParam("nn", checked)}
                        disabled={isOptimizing}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label htmlFor="sa-algo" className="text-sm">
                        Simulated Annealing
                      </Label>
                      <Switch
                        id="sa-algo"
                        checked={classicalParams.anneal}
                        onCheckedChange={(checked) => updateClassicalParam("anneal", checked)}
                        disabled={isOptimizing}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label htmlFor="ortools-algo" className="text-sm">
                        OR-Tools (Exact)
                      </Label>
                      <Switch
                        id="ortools-algo"
                        checked={classicalParams.ortools}
                        onCheckedChange={(checked) => updateClassicalParam("ortools", checked)}
                        disabled={isOptimizing}
                      />
                    </div>
                  </div>
                </div>

                {/* Simulated Annealing Parameters */}
                {classicalParams.anneal && (
                  <>
                    <Separator />
                    <div className="space-y-3">
                      <Label>Simulated Annealing Parameters</Label>

                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <Label className="text-sm">Initial Temperature</Label>
                          <Badge variant="outline">{classicalParams.simulatedAnnealingParams.initialTemp}</Badge>
                        </div>
                        <Slider
                          value={[classicalParams.simulatedAnnealingParams.initialTemp]}
                          onValueChange={([value]) => updateSAParam("initialTemp", value)}
                          min={10}
                          max={500}
                          step={10}
                          disabled={isOptimizing}
                          className="w-full"
                        />
                      </div>

                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <Label className="text-sm">Cooling Rate</Label>
                          <Badge variant="outline">{classicalParams.simulatedAnnealingParams.coolingRate}</Badge>
                        </div>
                        <Slider
                          value={[classicalParams.simulatedAnnealingParams.coolingRate * 1000]}
                          onValueChange={([value]) => updateSAParam("coolingRate", value / 1000)}
                          min={990}
                          max={999}
                          step={1}
                          disabled={isOptimizing}
                          className="w-full"
                        />
                      </div>

                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <Label className="text-sm">Max Iterations</Label>
                          <Badge variant="outline">{classicalParams.simulatedAnnealingParams.maxIterations}</Badge>
                        </div>
                        <Slider
                          value={[classicalParams.simulatedAnnealingParams.maxIterations]}
                          onValueChange={([value]) => updateSAParam("maxIterations", value)}
                          min={100}
                          max={5000}
                          step={100}
                          disabled={isOptimizing}
                          className="w-full"
                        />
                      </div>
                    </div>
                  </>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </TooltipProvider>
  )
}
