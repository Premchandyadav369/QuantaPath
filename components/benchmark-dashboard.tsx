"use client"

import { useState, useEffect, useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Progress } from "@/components/ui/progress"
import { BarChart3, TrendingUp, Clock, Zap, Download, RefreshCw, Target, Award, Activity } from "lucide-react"
import {
  ResponsiveContainer,
  BarChart,
  LineChart,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  Bar,
  Line,
  Cell,
} from "recharts"

interface BenchmarkResult {
  id: string
  timestamp: Date
  problemSize: number
  algorithms: {
    name: string
    solver: "quantum" | "classical"
    tourLength: number
    runtime: number
    feasible: boolean
    parameters?: Record<string, any>
  }[]
  bestLength: number
  quantumAdvantage?: number
}

interface PerformanceMetrics {
  avgQuantumRuntime: number
  avgClassicalRuntime: number
  quantumSuccessRate: number
  classicalSuccessRate: number
  avgQuantumAdvantage: number
  totalBenchmarks: number
}

const COLORS = {
  quantum: "#7B2CBF",
  classical: "#06D6A0",
  advantage: "#FFC300",
}

export function BenchmarkDashboard() {
  const [benchmarkResults, setBenchmarkResults] = useState<BenchmarkResult[]>([])
  const [isRunningBenchmark, setIsRunningBenchmark] = useState(false)
  const [metrics, setMetrics] = useState<PerformanceMetrics | null>(null)

  // Mock benchmark data for demonstration
  useEffect(() => {
    const mockResults: BenchmarkResult[] = [
      {
        id: "bench-1",
        timestamp: new Date(Date.now() - 3600000),
        problemSize: 6,
        algorithms: [
          {
            name: "QAOA p=2",
            solver: "quantum",
            tourLength: 24.7,
            runtime: 1850,
            feasible: true,
            parameters: { p: 2, shots: 1024 },
          },
          {
            name: "Nearest Neighbor + 2-opt",
            solver: "classical",
            tourLength: 26.3,
            runtime: 45,
            feasible: true,
          },
          {
            name: "Simulated Annealing",
            solver: "classical",
            tourLength: 25.1,
            runtime: 120,
            feasible: true,
          },
        ],
        bestLength: 24.7,
        quantumAdvantage: 6.1,
      },
      {
        id: "bench-2",
        timestamp: new Date(Date.now() - 7200000),
        problemSize: 8,
        algorithms: [
          {
            name: "QAOA p=3",
            solver: "quantum",
            tourLength: 32.4,
            runtime: 2850,
            feasible: true,
            parameters: { p: 3, shots: 2048 },
          },
          {
            name: "Nearest Neighbor + 2-opt",
            solver: "classical",
            tourLength: 35.2,
            runtime: 78,
            feasible: true,
          },
          {
            name: "Simulated Annealing",
            solver: "classical",
            tourLength: 33.8,
            runtime: 185,
            feasible: true,
          },
        ],
        bestLength: 32.4,
        quantumAdvantage: 8.0,
      },
      {
        id: "bench-3",
        timestamp: new Date(Date.now() - 10800000),
        problemSize: 10,
        algorithms: [
          {
            name: "QAOA p=2",
            solver: "quantum",
            tourLength: 41.2,
            runtime: 4200,
            feasible: true,
            parameters: { p: 2, shots: 1024 },
          },
          {
            name: "Nearest Neighbor + 2-opt",
            solver: "classical",
            tourLength: 44.8,
            runtime: 125,
            feasible: true,
          },
          {
            name: "Simulated Annealing",
            solver: "classical",
            tourLength: 42.6,
            runtime: 280,
            feasible: true,
          },
        ],
        bestLength: 41.2,
        quantumAdvantage: 8.0,
      },
    ]

    setBenchmarkResults(mockResults)
  }, [])

  useEffect(() => {
    if (benchmarkResults.length === 0) return

    // Calculate metrics
    const totalBenchmarks = benchmarkResults.length
    const quantumResults = benchmarkResults.flatMap((r) => r.algorithms.filter((a) => a.solver === "quantum"))
    const classicalResults = benchmarkResults.flatMap((r) => r.algorithms.filter((a) => a.solver === "classical"))

    const avgQuantumRuntime =
      quantumResults.length > 0 ? quantumResults.reduce((sum, r) => sum + r.runtime, 0) / quantumResults.length : 0
    const avgClassicalRuntime =
      classicalResults.length > 0
        ? classicalResults.reduce((sum, r) => sum + r.runtime, 0) / classicalResults.length
        : 0
    const quantumSuccessRate =
      quantumResults.length > 0
        ? (quantumResults.filter((r) => r.feasible).length / quantumResults.length) * 100
        : 0
    const classicalSuccessRate =
      classicalResults.length > 0
        ? (classicalResults.filter((r) => r.feasible).length / classicalResults.length) * 100
        : 0
    const avgQuantumAdvantage =
      benchmarkResults.length > 0
        ? benchmarkResults.reduce((sum, r) => sum + (r.quantumAdvantage || 0), 0) / totalBenchmarks
        : 0

    setMetrics({
      avgQuantumRuntime,
      avgClassicalRuntime,
      quantumSuccessRate,
      classicalSuccessRate,
      avgQuantumAdvantage,
      totalBenchmarks,
    })
  }, [benchmarkResults])

  const chartData = useMemo(() => {
    return benchmarkResults
      .map((result) => {
        const dataPoint: any = {
          name: `${result.problemSize} stops`,
          problemSize: result.problemSize,
        }
        result.algorithms.forEach((algo) => {
          dataPoint[algo.name] = algo.tourLength
          dataPoint[`${algo.name}_runtime`] = algo.runtime
        })
        return dataPoint
      })
      .sort((a, b) => a.problemSize - b.problemSize)
  }, [benchmarkResults])

  const runBenchmarkSuite = async () => {
    setIsRunningBenchmark(true)

    // Simulate benchmark suite execution
    await new Promise((resolve) => setTimeout(resolve, 3000))

    // Add new mock result
    const newResult: BenchmarkResult = {
      id: `bench-${Date.now()}`,
      timestamp: new Date(),
      problemSize: 7,
      algorithms: [
        {
          name: "QAOA p=2",
          solver: "quantum",
          tourLength: 28.3 + Math.random() * 2,
          runtime: 2000 + Math.random() * 1000,
          feasible: true,
          parameters: { p: 2, shots: 1024 },
        },
        {
          name: "Nearest Neighbor + 2-opt",
          solver: "classical",
          tourLength: 30.1 + Math.random() * 2,
          runtime: 60 + Math.random() * 40,
          feasible: true,
        },
      ],
      bestLength: 28.3,
      quantumAdvantage: 6.0,
    }

    setBenchmarkResults((prev) => [newResult, ...prev])
    setIsRunningBenchmark(false)
  }

  const exportResults = () => {
    const dataStr = JSON.stringify(benchmarkResults, null, 2)
    const dataBlob = new Blob([dataStr], { type: "application/json" })
    const url = URL.createObjectURL(dataBlob)
    const link = document.createElement("a")
    link.href = url
    link.download = "quantapath-benchmark-results.json"
    link.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Benchmark Results</h2>
          <p className="text-muted-foreground">Comprehensive performance analysis of quantum vs classical algorithms</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={exportResults}>
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
          <Button onClick={runBenchmarkSuite} disabled={isRunningBenchmark}>
            {isRunningBenchmark ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                Running...
              </>
            ) : (
              <>
                <RefreshCw className="w-4 h-4 mr-2" />
                Run Benchmark
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      {metrics && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Quantum Advantage</CardTitle>
              <Award className="h-4 w-4 text-accent" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-accent">{metrics.avgQuantumAdvantage.toFixed(1)}%</div>
              <p className="text-xs text-muted-foreground">Average improvement over classical</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
              <Target className="h-4 w-4 text-secondary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-secondary">{metrics.quantumSuccessRate.toFixed(0)}%</div>
              <p className="text-xs text-muted-foreground">Quantum feasible solutions</p>
              <Progress value={metrics.quantumSuccessRate} className="mt-2" />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avg Runtime</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{(metrics.avgQuantumRuntime / 1000).toFixed(1)}s</div>
              <p className="text-xs text-muted-foreground">
                vs {(metrics.avgClassicalRuntime / 1000).toFixed(2)}s classical
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Benchmarks</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metrics.totalBenchmarks}</div>
              <p className="text-xs text-muted-foreground">Completed test runs</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Detailed Results */}
      <Tabs defaultValue="results" className="space-y-4">
        <TabsList>
          <TabsTrigger value="results">Recent Results</TabsTrigger>
          <TabsTrigger value="performance">Performance Analysis</TabsTrigger>
          <TabsTrigger value="comparison">Algorithm Comparison</TabsTrigger>
        </TabsList>

        <TabsContent value="results" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5" />
                Benchmark Results
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {benchmarkResults.map((result) => (
                  <div key={result.id} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <Badge variant="outline">{result.problemSize} stops</Badge>
                        <span className="text-sm text-muted-foreground">{result.timestamp.toLocaleString()}</span>
                      </div>
                      {result.quantumAdvantage && (
                        <Badge className="bg-accent">
                          <TrendingUp className="w-3 h-3 mr-1" />
                          {result.quantumAdvantage.toFixed(1)}% better
                        </Badge>
                      )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {result.algorithms.map((algo, index) => (
                        <div key={index} className="bg-muted/50 rounded-lg p-3">
                          <div className="flex items-center gap-2 mb-2">
                            {algo.solver === "quantum" ? (
                              <Zap className="w-4 h-4 text-accent" />
                            ) : (
                              <BarChart3 className="w-4 h-4 text-secondary" />
                            )}
                            <span className="font-medium text-sm">{algo.name}</span>
                          </div>
                          <div className="space-y-1 text-xs text-muted-foreground">
                            <div className="flex justify-between">
                              <span>Distance:</span>
                              <span className="font-medium">{algo.tourLength.toFixed(1)} km</span>
                            </div>
                            <div className="flex justify-between">
                              <span>Runtime:</span>
                              <span className="font-medium">{algo.runtime}ms</span>
                            </div>
                            <div className="flex justify-between">
                              <span>Status:</span>
                              <Badge variant={algo.feasible ? "default" : "destructive"} className="text-xs h-4">
                                {algo.feasible ? "Valid" : "Invalid"}
                              </Badge>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="performance" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Runtime vs Problem Size</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis yAxisId="left" label={{ value: "Runtime (ms)", angle: -90, position: "insideLeft" }} />
                    <Tooltip
                      formatter={(value, name) => [
                        `${(name as string).includes("runtime") ? `${value}ms` : value}`,
                        (name as string).replace("_runtime", ""),
                      ]}
                    />
                    <Legend />
                    <Line
                      yAxisId="left"
                      type="monotone"
                      dataKey="QAOA p=2_runtime"
                      stroke={COLORS.quantum}
                      strokeWidth={2}
                      name="QAOA p=2"
                    />
                    <Line
                      yAxisId="left"
                      type="monotone"
                      dataKey="Nearest Neighbor + 2-opt_runtime"
                      stroke={COLORS.classical}
                      strokeWidth={2}
                      name="NN + 2-opt"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Solution Quality (Tour Length)</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis label={{ value: "Distance (km)", angle: -90, position: "insideLeft" }} />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="QAOA p=2" fill={COLORS.quantum} name="QAOA p=2" />
                    <Bar dataKey="Nearest Neighbor + 2-opt" fill={COLORS.classical} name="NN + 2-opt" />
                    <Bar dataKey="Simulated Annealing" fill={COLORS.advantage} name="Simulated Annealing" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Performance Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-semibold mb-3 flex items-center gap-2">
                    <Zap className="w-4 h-4 text-accent" />
                    Quantum QAOA
                  </h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Best Performance:</span>
                      <span className="font-medium">6-10 stops</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Avg Advantage:</span>
                      <span className="font-medium text-accent">7.4%</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Success Rate:</span>
                      <span className="font-medium">95%</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Scaling:</span>
                      <span className="font-medium">Exponential</span>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold mb-3 flex items-center gap-2">
                    <BarChart3 className="w-4 h-4 text-secondary" />
                    Classical Algorithms
                  </h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Best Algorithm:</span>
                      <span className="font-medium">Simulated Annealing</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Consistency:</span>
                      <span className="font-medium text-secondary">High</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Success Rate:</span>
                      <span className="font-medium">100%</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Scaling:</span>
                      <span className="font-medium">Polynomial</span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="comparison" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Algorithm Head-to-Head</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-2">Algorithm</th>
                      <th className="text-left p-2">Type</th>
                      <th className="text-left p-2">Avg Distance</th>
                      <th className="text-left p-2">Avg Runtime</th>
                      <th className="text-left p-2">Success Rate</th>
                      <th className="text-left p-2">Best For</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b">
                      <td className="p-2 font-medium">QAOA p=2</td>
                      <td className="p-2">
                        <Badge className="bg-accent text-xs">Quantum</Badge>
                      </td>
                      <td className="p-2">31.4 km</td>
                      <td className="p-2">2.9s</td>
                      <td className="p-2">95%</td>
                      <td className="p-2">6-10 stops</td>
                    </tr>
                    <tr className="border-b">
                      <td className="p-2 font-medium">Simulated Annealing</td>
                      <td className="p-2">
                        <Badge variant="secondary" className="text-xs">
                          Classical
                        </Badge>
                      </td>
                      <td className="p-2">33.8 km</td>
                      <td className="p-2">0.2s</td>
                      <td className="p-2">100%</td>
                      <td className="p-2">Large problems</td>
                    </tr>
                    <tr className="border-b">
                      <td className="p-2 font-medium">Nearest Neighbor + 2-opt</td>
                      <td className="p-2">
                        <Badge variant="secondary" className="text-xs">
                          Classical
                        </Badge>
                      </td>
                      <td className="p-2">35.4 km</td>
                      <td className="p-2">0.08s</td>
                      <td className="p-2">100%</td>
                      <td className="p-2">Speed critical</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Recommendations</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="border-l-4 border-accent pl-4">
                  <h4 className="font-semibold text-accent">For Small Problems (&gt;=10 stops)</h4>
                  <p className="text-sm text-muted-foreground mt-1">
                    Use QAOA with p=2 for best solution quality. Quantum advantage is most pronounced in this range with
                    5-10% better routes on average.
                  </p>
                </div>

                <div className="border-l-4 border-secondary pl-4">
                  <h4 className="font-semibold text-secondary">For Large Problems (&gt;10 stops)</h4>
                  <p className="text-sm text-muted-foreground mt-1">
                    Use Simulated Annealing for best balance of quality and speed. Classical algorithms scale better and
                    maintain high success rates.
                  </p>
                </div>

                <div className="border-l-4 border-muted-foreground pl-4">
                  <h4 className="font-semibold">For Real-Time Applications</h4>
                  <p className="text-sm text-muted-foreground mt-1">
                    Use Nearest Neighbor + 2-opt for sub-100ms response times. Good enough solutions for most practical
                    applications.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
