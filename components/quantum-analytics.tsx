"use client"

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar } from 'recharts'

const convergenceData = [
  { iteration: 1, qaoa: 100, sa: 120 },
  { iteration: 10, qaoa: 80, sa: 110 },
  { iteration: 20, qaoa: 65, sa: 95 },
  { iteration: 30, qaoa: 55, sa: 85 },
  { iteration: 40, qaoa: 52, sa: 80 },
  { iteration: 50, qaoa: 50, sa: 78 },
]

const executionData = [
  { name: 'HAWS-QAOA', time: 1.2 },
  { name: 'Simulated Annealing', time: 2.5 },
  { name: 'Nearest Neighbor', time: 0.1 },
]

export function QuantumAnalyticsDashboard() {
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Quantum Analytics Dashboard</CardTitle>
        <CardDescription>Convergence, approximation ratio, and execution time</CardDescription>
      </CardHeader>
      <CardContent className="grid md:grid-cols-2 gap-8">

        {/* Convergence Chart */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-center">Cost Convergence</h3>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={convergenceData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="iteration" label={{ value: 'Iterations', position: 'insideBottom', offset: -5 }} />
                <YAxis label={{ value: 'Cost', angle: -90, position: 'insideLeft' }} />
                <Tooltip />
                <Legend verticalAlign="top" height={36}/>
                <Line type="monotone" dataKey="qaoa" stroke="#8884d8" name="HAWS-QAOA" strokeWidth={2} />
                <Line type="monotone" dataKey="sa" stroke="#82ca9d" name="Classical SA" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Execution Time Chart */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-center">Execution Time (ms)</h3>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={executionData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="time" fill="#8884d8" name="Time (ms)" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

      </CardContent>
    </Card>
  )
}
