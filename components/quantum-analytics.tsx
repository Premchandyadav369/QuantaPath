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
    <div className="grid md:grid-cols-2 gap-6 w-full h-full">
      {/* Convergence Chart */}
      <Card className="flex flex-col bg-card/50 backdrop-blur-md border-border/50 shadow-xl overflow-hidden h-full min-h-[400px]">
        <CardHeader>
          <CardTitle className="text-lg">Cost Convergence</CardTitle>
          <CardDescription>Optimization cost over iterations.</CardDescription>
        </CardHeader>
        <CardContent className="flex-1 w-full min-h-0">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={convergenceData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--muted))" />
              <XAxis dataKey="iteration" stroke="hsl(var(--muted-foreground))" tick={{ fill: 'hsl(var(--foreground))' }} />
              <YAxis stroke="hsl(var(--muted-foreground))" tick={{ fill: 'hsl(var(--foreground))' }} />
              <Tooltip
                 contentStyle={{ backgroundColor: 'hsl(var(--background))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }}
              />
              <Legend verticalAlign="top" height={36} wrapperStyle={{ paddingTop: '10px' }} />
              <Line type="monotone" dataKey="qaoa" stroke="hsl(var(--chart-1))" name="HAWS-QAOA" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
              <Line type="monotone" dataKey="sa" stroke="hsl(var(--chart-2))" name="Classical SA" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Execution Time Chart */}
      <Card className="flex flex-col bg-card/50 backdrop-blur-md border-border/50 shadow-xl overflow-hidden h-full min-h-[400px]">
        <CardHeader>
          <CardTitle className="text-lg">Execution Time (ms)</CardTitle>
          <CardDescription>Comparison of solver execution runtimes.</CardDescription>
        </CardHeader>
        <CardContent className="flex-1 w-full min-h-0">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={executionData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--muted))" vertical={false} />
              <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" tick={{ fill: 'hsl(var(--foreground))' }} />
              <YAxis stroke="hsl(var(--muted-foreground))" tick={{ fill: 'hsl(var(--foreground))' }} />
              <Tooltip
                 cursor={{ fill: 'hsl(var(--muted))', opacity: 0.2 }}
                 contentStyle={{ backgroundColor: 'hsl(var(--background))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }}
              />
              <Bar dataKey="time" fill="hsl(var(--chart-4))" name="Time (ms)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  )
}
