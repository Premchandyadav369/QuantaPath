"use client"

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip } from 'recharts'
import { Leaf, Wind, Droplets } from "lucide-react"

const emissionsData = [
  { name: 'Vehicle Fleet (Diesel)', value: 400 },
  { name: 'Vehicle Fleet (EV)', value: 50 },
  { name: 'Warehouse Operations', value: 200 },
]

const COLORS = ['#ef4444', '#10b981', '#3b82f6']

export function SustainabilityDashboard() {
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Leaf className="w-6 h-6 text-green-500" />
          Sustainability Dashboard
        </CardTitle>
        <CardDescription>Environmental impact and ESG metrics</CardDescription>
      </CardHeader>
      <CardContent className="grid md:grid-cols-2 gap-8">

        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 bg-muted/30 rounded-lg border">
              <div className="flex items-center gap-2 mb-2 text-muted-foreground">
                <Wind className="w-4 h-4" />
                <span className="text-sm font-medium">CO₂ Emissions</span>
              </div>
              <p className="text-2xl font-bold text-destructive">2.4t</p>
              <p className="text-xs text-green-500">-12% vs last month (Quantum optimized)</p>
            </div>

            <div className="p-4 bg-muted/30 rounded-lg border">
              <div className="flex items-center gap-2 mb-2 text-muted-foreground">
                <Droplets className="w-4 h-4" />
                <span className="text-sm font-medium">Fuel Usage</span>
              </div>
              <p className="text-2xl font-bold">840 L</p>
              <p className="text-xs text-green-500">-8% via route consolidation</p>
            </div>
          </div>

          <div className="p-4 bg-green-500/10 border-green-500/20 border rounded-lg">
            <h4 className="font-semibold text-green-700 dark:text-green-400 mb-1">ESG Score</h4>
            <div className="flex items-baseline gap-2">
              <span className="text-4xl font-bold text-green-600 dark:text-green-500">A-</span>
              <span className="text-sm text-muted-foreground">Top 15% in Logistics</span>
            </div>
          </div>
        </div>

        <div className="flex flex-col items-center">
          <h3 className="text-sm font-medium mb-4">Emissions Breakdown (kg CO₂)</h3>
          <div className="w-full h-[200px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={emissionsData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {emissionsData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <RechartsTooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex gap-4 text-xs mt-4">
            {emissionsData.map((entry, index) => (
              <div key={index} className="flex items-center gap-1">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[index] }} />
                <span>{entry.name}</span>
              </div>
            ))}
          </div>
        </div>

      </CardContent>
    </Card>
  )
}
