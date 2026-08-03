"use client"

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Download, FileText, FlaskConical, BarChart2 } from "lucide-react"

export function ResearchBenchmarkMode() {
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FlaskConical className="w-6 h-6 text-purple-500" />
          Research & Benchmark Mode
        </CardTitle>
        <CardDescription>Deep statistical comparisons and exportable reports for academia/enterprise</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">

        <div className="grid md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <h4 className="font-semibold text-lg flex items-center gap-2">
              <BarChart2 className="w-5 h-5 text-muted-foreground" />
              Statistical Summary (n=1000 runs)
            </h4>
            <div className="border rounded-lg p-4 bg-muted/20 space-y-3">
              <div className="flex justify-between items-center border-b pb-2">
                <span className="text-sm font-medium">Mean Optimality Gap</span>
                <span className="font-bold text-green-500">2.1%</span>
              </div>
              <div className="flex justify-between items-center border-b pb-2">
                <span className="text-sm font-medium">Standard Deviation</span>
                <span className="font-bold">0.45</span>
              </div>
              <div className="flex justify-between items-center border-b pb-2">
                <span className="text-sm font-medium">P-Value (vs Classical SA)</span>
                <span className="font-bold text-accent">&lt; 0.001</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Scalability Limit</span>
                <span className="font-bold">120 Nodes</span>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <h4 className="font-semibold text-lg flex items-center gap-2">
              <FileText className="w-5 h-5 text-muted-foreground" />
              Ablation Studies
            </h4>
            <div className="space-y-2">
              <div className="p-3 border rounded-lg hover:bg-muted/50 cursor-pointer transition-colors flex justify-between items-center">
                <span className="text-sm">w/o Warm Start (QAOA Base)</span>
                <span className="text-xs text-destructive">-15% performance</span>
              </div>
              <div className="p-3 border rounded-lg hover:bg-muted/50 cursor-pointer transition-colors flex justify-between items-center">
                <span className="text-sm">w/o CVaR Sampling</span>
                <span className="text-xs text-destructive">-8% convergence rate</span>
              </div>
              <div className="p-3 border rounded-lg hover:bg-muted/50 cursor-pointer transition-colors flex justify-between items-center">
                <span className="text-sm">w/o Classical Post-processing</span>
                <span className="text-xs text-destructive">-22% solution quality</span>
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 pt-4 border-t">
          <Button className="flex-1 bg-purple-600 hover:bg-purple-700">
            <Download className="w-4 h-4 mr-2" />
            Export Raw Data (CSV)
          </Button>
          <Button variant="outline" className="flex-1">
            <FileText className="w-4 h-4 mr-2" />
            Generate PDF Report
          </Button>
        </div>

      </CardContent>
    </Card>
  )
}
