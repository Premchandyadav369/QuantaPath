"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts"
import { Leaf, Zap, DollarSign, TreePine, Award } from "lucide-react"
import { useState } from "react"
import type { RouteResult } from "@/lib/types"

interface VehicleType {
  id: string
  name: string
  co2PerKm: number // kg CO2 per km
  fuelCostPerKm: number // INR per km
  icon: string
}

const vehicleTypes: VehicleType[] = [
  { id: "electric", name: "Electric Van", co2PerKm: 0.05, fuelCostPerKm: 0.08 * 83, icon: "⚡" },
  { id: "hybrid", name: "Hybrid Van", co2PerKm: 0.12, fuelCostPerKm: 0.15 * 83, icon: "🔋" },
  { id: "diesel", name: "Diesel Van", co2PerKm: 0.25, fuelCostPerKm: 0.22 * 83, icon: "⛽" },
  { id: "gasoline", name: "Gasoline Van", co2PerKm: 0.28, fuelCostPerKm: 0.25 * 83, icon: "🚐" },
]

interface CarbonFootprintCalculatorProps {
  routes: RouteResult[]
  selectedRoute: RouteResult | null
}

export function CarbonFootprintCalculator({ routes, selectedRoute }: CarbonFootprintCalculatorProps) {
  const [selectedVehicle, setSelectedVehicle] = useState<string>("diesel")

  if (routes.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Leaf className="w-5 h-5 text-green-600" />
            Environmental Impact Calculator
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <TreePine className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>Run optimization to see environmental impact analysis</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  const vehicle = vehicleTypes.find((v) => v.id === selectedVehicle) || vehicleTypes[2]

  // Calculate environmental metrics for each route
  const environmentalData = routes.map((route) => {
    const co2Emissions = route.length * vehicle.co2PerKm
    const fuelCost = route.length * vehicle.fuelCostPerKm
    const treesNeeded = co2Emissions / 22 // Average tree absorbs 22kg CO2 per year

    return {
      name: route.name.replace(/QAOA p=\d+/, "HAWS-QAOA"),
      solver: route.solver,
      distance: route.length,
      co2Emissions: Number.parseFloat(co2Emissions.toFixed(2)),
      fuelCost: Number.parseFloat(fuelCost.toFixed(2)),
      treesNeeded: Number.parseFloat(treesNeeded.toFixed(1)),
      runtime: route.runtimeMs,
    }
  })

  const bestQuantum = environmentalData.filter((d) => d.solver === "quantum")
  const bestClassical = environmentalData.filter((d) => d.solver === "classical")

  const quantumCO2 = bestQuantum.length > 0 ? Math.min(...bestQuantum.map((d) => d.co2Emissions)) : 0
  const classicalCO2 = bestClassical.length > 0 ? Math.min(...bestClassical.map((d) => d.co2Emissions)) : 0
  const co2Savings = classicalCO2 > 0 ? classicalCO2 - quantumCO2 : 0;
  const co2SavingsPercent = classicalCO2 > 0 ? (co2Savings / classicalCO2) * 100 : 0;

  const quantumCost = bestQuantum.length > 0 ? Math.min(...bestQuantum.map((d) => d.fuelCost)) : 0;
  const classicalCost = bestClassical.length > 0 ? Math.min(...bestClassical.map((d) => d.fuelCost)) : 0;
  const costSavings = classicalCost > 0 ? classicalCost - quantumCost : 0;

  // Annual projections (assuming 250 working days, 5 deliveries per day)
  const annualDeliveries = 250 * 5
  const annualCO2Savings = co2Savings * annualDeliveries
  const annualCostSavings = costSavings * annualDeliveries
  const treesEquivalent = annualCO2Savings / 22

  // Pie chart data for emissions breakdown
  const emissionBreakdown = [
    { name: "Quantum Optimized", value: quantumCO2, color: "#10b981" },
    { name: "CO₂ Saved", value: co2Savings > 0 ? co2Savings : 0, color: "#22c55e" },
  ]

  // Comparison data for different vehicle types
  const vehicleComparison = vehicleTypes.map((vType) => {
    const bestRoute = routes.length > 0 ? Math.min(...routes.map((r) => r.length)) : 0;
    return {
      vehicle: vType.name,
      co2: Number.parseFloat((bestRoute * vType.co2PerKm).toFixed(2)),
      cost: Number.parseFloat((bestRoute * vType.fuelCostPerKm).toFixed(2)),
    }
  })

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Leaf className="w-5 h-5 text-green-600" />
            Environmental Impact Calculator
          </CardTitle>
          <div className="flex gap-2">
            <Badge variant={co2SavingsPercent >= 0 ? "secondary" : "destructive"} className="flex items-center gap-1">
              <TreePine className="w-3 h-3" />
              {co2SavingsPercent >= 0
                ? `${co2SavingsPercent.toFixed(1)}% CO₂ Reduction`
                : `${Math.abs(co2SavingsPercent).toFixed(1)}% CO₂ Increase`
              }
            </Badge>
            <Badge variant="outline">
              {vehicle.icon} {vehicle.name}
            </Badge>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <Label htmlFor="vehicle-select" className="text-sm font-medium">
            Vehicle Type:
          </Label>
          <Select value={selectedVehicle} onValueChange={setSelectedVehicle}>
            <SelectTrigger className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {vehicleTypes.map((vehicle) => (
                <SelectItem key={vehicle.id} value={vehicle.id}>
                  {vehicle.icon} {vehicle.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="impact" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="impact">Impact</TabsTrigger>
            <TabsTrigger value="comparison">Comparison</TabsTrigger>
            <TabsTrigger value="vehicles">Vehicles</TabsTrigger>
            <TabsTrigger value="projections">Projections</TabsTrigger>
          </TabsList>

          <TabsContent value="impact" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* CO2 Emissions Chart */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Leaf className="w-4 h-4 text-green-600" />
                    CO₂ Emissions by Algorithm
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={200}>
                    <BarChart data={environmentalData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" angle={-45} textAnchor="end" height={80} />
                      <YAxis label={{ value: "CO₂ (kg)", angle: -90, position: "insideLeft" }} />
                      <Tooltip formatter={(value) => [`${value} kg`, "CO₂ Emissions"]} />
                      <Bar
                        dataKey="co2Emissions"
                        fill={(entry) => (entry?.solver === "quantum" ? "#10b981" : "#ef4444")}
                        radius={[4, 4, 0, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Emissions Breakdown Pie Chart */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Award className="w-4 h-4 text-green-600" />
                    Quantum Environmental Benefit
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={200}>
                    <PieChart>
                      <Pie
                        data={emissionBreakdown}
                        cx="50%"
                        cy="50%"
                        innerRadius={40}
                        outerRadius={80}
                        dataKey="value"
                        label={({ name, value }) => `${name}: ${value.toFixed(2)}kg`}
                      >
                        {emissionBreakdown.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value) => [`${value} kg`, "CO₂"]} />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>

            {/* Environmental Metrics Summary */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card>
                <CardContent className="p-4">
                  <div className={`text-2xl font-bold ${co2Savings >= 0 ? "text-green-600" : "text-red-600"}`}>{co2Savings.toFixed(2)}</div>
                  <p className="text-xs text-muted-foreground">{co2Savings >= 0 ? "CO₂ Saved (kg)" : "CO₂ Increased (kg)"}</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className={`text-2xl font-bold ${costSavings >= 0 ? "text-blue-600" : "text-red-600"}`}>₹{costSavings.toFixed(2)}</div>
                  <p className="text-xs text-muted-foreground">{costSavings >= 0 ? "Fuel Cost Saved" : "Fuel Cost Increased"}</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className={`text-2xl font-bold ${co2Savings >= 0 ? "text-green-700" : "text-red-700"}`}>{(co2Savings / 22).toFixed(1)}</div>
                  <p className="text-xs text-muted-foreground">{co2Savings >= 0 ? "Trees Equivalent" : "Trees Deficit"}</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className={`text-2xl font-bold ${co2SavingsPercent >= 0 ? "text-purple-600" : "text-red-600"}`}>{co2SavingsPercent.toFixed(1)}%</div>
                  <p className="text-xs text-muted-foreground">{co2SavingsPercent >= 0 ? "Reduction" : "Increase"}</p>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="comparison" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Quantum vs Classical Environmental Impact</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={environmentalData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis yAxisId="left" label={{ value: "CO₂ (kg)", angle: -90, position: "insideLeft" }} />
                    <YAxis
                      yAxisId="right"
                      orientation="right"
                      label={{ value: "Cost (₹)", angle: 90, position: "insideRight" }}
                    />
                    <Tooltip />
                    <Legend />
                    <Bar yAxisId="left" dataKey="co2Emissions" fill="#ef4444" name="CO₂ Emissions (kg)" />
                    <Bar yAxisId="right" dataKey="fuelCost" fill="#3b82f6" name="Fuel Cost (₹)" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="vehicles" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Environmental Impact by Vehicle Type</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={vehicleComparison}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="vehicle" />
                    <YAxis yAxisId="left" label={{ value: "CO₂ (kg)", angle: -90, position: "insideLeft" }} />
                    <YAxis
                      yAxisId="right"
                      orientation="right"
                      label={{ value: "Cost (₹)", angle: 90, position: "insideRight" }}
                    />
                    <Tooltip />
                    <Legend />
                    <Bar yAxisId="left" dataKey="co2" fill="#22c55e" name="CO₂ Emissions (kg)" />
                    <Bar yAxisId="right" dataKey="cost" fill="#3b82f6" name="Fuel Cost (₹)" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="projections" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm flex items-center gap-2">
                    <TreePine className="w-4 h-4 text-green-600" />
                    Annual Environmental Impact
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Annual CO₂ Savings:</span>
                    <span className="font-bold text-green-600">{annualCO2Savings.toFixed(0)} kg</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Trees Equivalent:</span>
                    <span className="font-bold text-green-700">{treesEquivalent.toFixed(0)} trees</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Annual Cost Savings:</span>
                    <span className="font-bold text-blue-600">₹{annualCostSavings.toFixed(0)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Deliveries per Year:</span>
                    <span className="font-bold">{annualDeliveries.toLocaleString()}</span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-sm flex items-center gap-2">
                    <DollarSign className="w-4 h-4 text-blue-600" />
                    ROI & Sustainability Metrics
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Carbon Intensity:</span>
                    <span className="font-bold">
                      {(quantumCO2 / Math.min(...routes.map((r) => r.length))).toFixed(3)} kg/km
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Efficiency Gain:</span>
                    <span className="font-bold text-purple-600">{co2SavingsPercent.toFixed(1)}%</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Cost per km:</span>
                    <span className="font-bold">₹{vehicle.fuelCostPerKm.toFixed(3)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Quantum Advantage:</span>
                    <span className="font-bold text-accent">
                      <Zap className="w-3 h-3 inline mr-1" />
                      Sustainable
                    </span>
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card className="bg-gradient-to-r from-green-50 to-blue-50 border-green-200">
              <CardContent className="p-6">
                <div className="text-center">
                  <TreePine className="w-12 h-12 mx-auto mb-4 text-green-600" />
                  <h3 className="text-lg font-bold text-green-800 mb-2">Environmental Impact Summary</h3>
                  <p className="text-sm text-green-700 mb-4">
                    By using quantum optimization, your delivery fleet could save{" "}
                    <span className="font-bold">{annualCO2Savings.toFixed(0)} kg of CO₂</span> annually, equivalent to
                    planting <span className="font-bold">{treesEquivalent.toFixed(0)} trees</span> and saving{" "}
                    <span className="font-bold">₹{annualCostSavings.toFixed(0)}</span> in fuel costs.
                  </p>
                  <Badge className="bg-green-600 text-white">
                    <Award className="w-3 h-3 mr-1" />
                    Carbon Neutral Ready
                  </Badge>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}
