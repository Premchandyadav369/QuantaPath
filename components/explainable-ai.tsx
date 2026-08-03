"use client"

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { ShieldAlert, BrainCircuit, Activity } from "lucide-react"

export function ExplainableAI() {
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BrainCircuit className="w-6 h-6 text-accent" />
          Explainable Quantum AI
        </CardTitle>
        <CardDescription>Insights into optimization reasoning and confidence scores</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">

        <div className="grid sm:grid-cols-3 gap-4">
          <div className="p-4 border rounded-lg bg-muted/30">
            <div className="flex items-center gap-2 mb-2">
              <Activity className="w-4 h-4 text-green-500" />
              <h4 className="font-semibold text-sm">Overall Confidence</h4>
            </div>
            <p className="text-3xl font-bold">94.2%</p>
            <p className="text-xs text-muted-foreground mt-1">Based on CVaR sampling</p>
          </div>
          <div className="p-4 border rounded-lg bg-muted/30">
            <div className="flex items-center gap-2 mb-2">
              <ShieldAlert className="w-4 h-4 text-yellow-500" />
              <h4 className="font-semibold text-sm">Constraint Violations</h4>
            </div>
            <p className="text-3xl font-bold">0</p>
            <p className="text-xs text-muted-foreground mt-1">All hard constraints met</p>
          </div>
          <div className="p-4 border rounded-lg bg-muted/30">
            <div className="flex items-center gap-2 mb-2">
              <BrainCircuit className="w-4 h-4 text-accent" />
              <h4 className="font-semibold text-sm">Entanglement Impact</h4>
            </div>
            <p className="text-3xl font-bold">High</p>
            <p className="text-xs text-muted-foreground mt-1">Strong global correlations found</p>
          </div>
        </div>

        <div className="space-y-4">
          <h4 className="font-semibold border-b pb-2">Edge Importance (Decision Reasoning)</h4>
          <div className="space-y-3">
            {[
              { edge: "Warehouse A → Sector 4", importance: 88, reason: "Crucial link to bypass major traffic artery" },
              { edge: "Sector 4 → Delivery Hub B", importance: 75, reason: "Optimized for EV battery constraints" },
              { edge: "Delivery Hub B → Sector 9", importance: 45, reason: "Standard route, low variability" },
            ].map((item, i) => (
              <div key={i} className="flex flex-col gap-1">
                <div className="flex justify-between text-sm">
                  <span className="font-medium">{item.edge}</span>
                  <span className="text-accent">{item.importance}% importance</span>
                </div>
                <div className="w-full bg-muted rounded-full h-2">
                  <div
                    className="bg-accent h-2 rounded-full"
                    style={{ width: `${item.importance}%` }}
                  />
                </div>
                <p className="text-xs text-muted-foreground">{item.reason}</p>
              </div>
            ))}
          </div>
        </div>

      </CardContent>
    </Card>
  )
}
