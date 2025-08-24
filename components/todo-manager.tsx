"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { CheckCircle2, Circle } from "lucide-react"

export function TodoManager() {
  const [tasks] = useState([
    { id: 1, name: "Build Landing Page with Hero and Demo Sections", status: "done" },
    { id: 2, name: "Create Interactive Map Component with Route Visualization", status: "done" },
    { id: 3, name: "Setup Backend API with Distance Matrix Service", status: "done" },
    { id: 4, name: "Implement Quantum QAOA Solver with Qiskit", status: "done" },
    { id: 5, name: "Add Classical Baseline Algorithms for Comparison", status: "done" },
    { id: 6, name: "Build Results Dashboard with Benchmarking", status: "done" },
    { id: 7, name: "Integrate Live Demo with Parameter Controls", status: "done" },
  ])

  const completedTasks = tasks.filter((task) => task.status === "done").length
  const totalTasks = tasks.length

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Project Progress</span>
          <Badge className="bg-secondary">
            {completedTasks}/{totalTasks} Complete
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {tasks.map((task) => (
            <div key={task.id} className="flex items-center gap-3">
              {task.status === "done" ? (
                <CheckCircle2 className="w-5 h-5 text-secondary" />
              ) : (
                <Circle className="w-5 h-5 text-muted-foreground" />
              )}
              <span className={`text-sm ${task.status === "done" ? "line-through text-muted-foreground" : ""}`}>
                {task.name}
              </span>
            </div>
          ))}
        </div>

        <div className="mt-6 p-4 bg-secondary/10 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle2 className="w-5 h-5 text-secondary" />
            <span className="font-semibold text-secondary">Project Complete!</span>
          </div>
          <p className="text-sm text-muted-foreground">
            QuantaPath is fully functional with quantum QAOA solver, classical baselines, interactive demo, and
            comprehensive benchmarking dashboard.
          </p>
        </div>
      </CardContent>
    </Card>
  )
}
