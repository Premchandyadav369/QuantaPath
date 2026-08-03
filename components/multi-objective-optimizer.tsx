"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer } from 'recharts'

export function MultiObjectiveOptimizer() {
  const [weights, setWeights] = useState({
    time: 50,
    cost: 50,
    fuel: 50,
    co2: 50,
    safety: 50
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setWeights({
      ...weights,
      [e.target.name]: parseInt(e.target.value, 10)
    })
  }

  const chartData = [
    { subject: 'Time', A: weights.time, fullMark: 100 },
    { subject: 'Cost', A: weights.cost, fullMark: 100 },
    { subject: 'Fuel', A: weights.fuel, fullMark: 100 },
    { subject: 'CO2', A: weights.co2, fullMark: 100 },
    { subject: 'Safety', A: weights.safety, fullMark: 100 },
  ]

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Multi-Objective Optimizer</CardTitle>
        <CardDescription>Adjust sliders to see trade-offs in route optimization</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col md:flex-row gap-8">
        <div className="flex-1 space-y-6">
          {Object.entries(weights).map(([key, value]) => (
            <div key={key} className="space-y-2">
              <div className="flex justify-between">
                <label className="text-sm font-medium capitalize">{key}</label>
                <span className="text-sm text-muted-foreground">{value}%</span>
              </div>
              <input
                type="range"
                name={key}
                min="0"
                max="100"
                value={value}
                onChange={handleChange}
                className="w-full accent-accent"
              />
            </div>
          ))}
        </div>

        <div className="flex-1 min-h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <RadarChart cx="50%" cy="50%" outerRadius="80%" data={chartData}>
              <PolarGrid />
              <PolarAngleAxis dataKey="subject" />
              <PolarRadiusAxis angle={30} domain={[0, 100]} />
              <Radar name="Optimization Weights" dataKey="A" stroke="#8884d8" fill="#8884d8" fillOpacity={0.6} />
            </RadarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
}
