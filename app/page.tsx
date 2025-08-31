"use client"

import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase"
import type { Session } from "@supabase/supabase-js"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ArrowRight, MapPin, Zap, BarChart3, Truck, Clock, Route, Cpu, GitBranch, Github, Linkedin } from "lucide-react"
import { AuthComponent } from "@/components/auth"
import { InteractiveMap } from "@/components/interactive-map"
import { SavedRoutes } from "@/components/saved-routes"
import { BenchmarkDashboard } from "@/components/benchmark-dashboard"
import { EfficiencyComparison } from "@/components/efficiency-comparison"
import { CarbonFootprintCalculator } from "@/components/carbon-footprint-calculator"
import type { DeliveryStop, RouteResult } from "@/lib/types"

export default function HomePage() {
  const [session, setSession] = useState<Session | null>(null)
  const [stops, setStops] = useState<DeliveryStop[]>([
    { id: "hub1", name: "Hub 1", lat: 16.5062, lng: 80.648, isDepot: true },
    { id: "hub2", name: "Hub 2", lat: 16.55, lng: 80.7, isDepot: true },
    { id: "stop1", name: "Electronics Store", lat: 16.515, lng: 80.655 },
    { id: "stop2", name: "Pharmacy", lat: 16.498, lng: 80.642 },
    { id: "stop3", name: "Grocery Market", lat: 16.51, lng: 80.635 },
    { id: "stop4", name: "Restaurant", lat: 16.522, lng: 80.651 },
    { id: "stop5", name: "Hardware Store", lat: 16.54, lng: 80.71 },
    { id: "stop6", name: "Bookstore", lat: 16.56, lng: 80.69 },
  ])
  const [routes, setRoutes] = useState<RouteResult[]>([
    {
      solver: "quantum",
      name: "HAWS-QAOA p=3",
      tour: [0, 1, 4, 2, 3, 0],
      length: 23.4,
      feasible: true,
      violations: { pos: 0, city: 0 },
      runtimeMs: 1847,
      parameters: {
        use: true,
        p: 3,
        shots: 1024,
        optimizer: "COBYLA" as const,
        penalties: { A: 1000, B: 1000 },
        backend: "aer" as const,
      },
    },
    {
      solver: "classical",
      name: "Nearest Neighbor + 2-opt",
      tour: [0, 2, 1, 4, 3, 0],
      length: 26.8,
      feasible: true,
      violations: { pos: 0, city: 0 },
      runtimeMs: 67,
    },
    {
      solver: "classical",
      name: "Simulated Annealing",
      tour: [0, 3, 2, 1, 4, 0],
      length: 25.1,
      feasible: true,
      violations: { pos: 0, city: 0 },
      runtimeMs: 234,
    },
  ])
  const [selectedRoute, setSelectedRoute] = useState<RouteResult | null>(routes[0])
  const [quantumParams, setQuantumParams] = useState({
    use: true,
    p: 2,
    shots: 1024,
    optimizer: "COBYLA" as const,
    penalties: { A: 1000, B: 1000 },
    backend: "aer" as const,
  })
  const [classicalParams, setClassicalParams] = useState({
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


  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
    })

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
    })

    return () => subscription.unsubscribe()
  }, [])

  const handleLoadRoute = (route: any) => {
    setStops(route.stops)
    setRoutes(route.routes)
    setSelectedRoute(route.selected_route)
    setQuantumParams(route.quantum_params)
    setClassicalParams(route.classical_params)
  }

  return (
    <div className="min-h-screen">
      {/* Navigation */}
      <nav className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-accent rounded-lg flex items-center justify-center">
                <Route className="w-5 h-5 text-accent-foreground" />
              </div>
              <span className="text-xl font-bold">QuantaPath</span>
            </div>
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="sm">
                Demo
              </Button>
              <Button variant="ghost" size="sm">
                Benchmarks
              </Button>
              <Button variant="ghost" size="sm">
                GitHub
              </Button>
              <AuthComponent session={session} />
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-4xl mx-auto">
            <Badge variant="secondary" className="mb-6">
              <Zap className="w-4 h-4 mr-1" />
              Optimizing delivery routes at quantum speed
            </Badge>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-6 leading-tight">
              Quantum-Powered Path Optimization for <span className="text-accent">Smarter Deliveries</span>
            </h1>
            <p className="text-xl text-muted-foreground mb-8 leading-relaxed">
              Harness QAOA and hybrid computing to find optimal delivery routes in real time. Experience the future of
              logistics optimization today.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" className="bg-accent hover:bg-accent/90">
                <MapPin className="w-5 h-5 mr-2" />
                Try Demo
              </Button>
              <Button size="lg" variant="outline">
                <GitBranch className="w-5 h-5 mr-2" />
                View GitHub
              </Button>
            </div>
          </div>

          {/* Interactive Route Optimization Demo */}
          <div className="mt-16 max-w-6xl mx-auto">
            <InteractiveMap
              session={session}
              stops={stops}
              setStops={setStops}
              routes={routes}
              setRoutes={setRoutes}
              selectedRoute={selectedRoute}
              setSelectedRoute={setSelectedRoute}
              quantumParams={quantumParams}
              setQuantumParams={setQuantumParams}
              classicalParams={classicalParams}
              setClassicalParams={setClassicalParams}
            />
          </div>
          {session && (
            <div className="mt-16 max-w-6xl mx-auto">
              <SavedRoutes session={session} onLoadRoute={handleLoadRoute} />
            </div>
          )}
        </div>
      </section>

      {/* Problem Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-muted/30">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold mb-6">The Delivery Routing Problem</h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Inefficient routing costs businesses billions annually. Traditional algorithms struggle with complex
              optimization landscapes that quantum computing can navigate.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <Card>
              <CardHeader>
                <Clock className="w-12 h-12 text-destructive mb-4" />
                <CardTitle>Time Waste</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Poor routing increases delivery times by 20-40%, leading to customer dissatisfaction and operational
                  inefficiency.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <Truck className="w-12 h-12 text-destructive mb-4" />
                <CardTitle>Higher Costs</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Suboptimal routes mean more fuel consumption, vehicle wear, and driver overtime, directly impacting
                  profit margins.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <BarChart3 className="w-12 h-12 text-destructive mb-4" />
                <CardTitle>Scalability Issues</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Classical algorithms hit computational walls with complex routing scenarios, limiting business growth
                  potential.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold mb-6">How QuantaPath Works</h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Our hybrid quantum-classical approach combines the best of both worlds for superior route optimization
              performance.
            </p>
          </div>

          <div className="grid lg:grid-cols-5 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-accent rounded-full flex items-center justify-center mx-auto mb-4">
                <MapPin className="w-8 h-8 text-accent-foreground" />
              </div>
              <h3 className="font-semibold mb-2">Input Stops</h3>
              <p className="text-sm text-muted-foreground">Add delivery locations via address or map clicks</p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-accent rounded-full flex items-center justify-center mx-auto mb-4">
                <BarChart3 className="w-8 h-8 text-accent-foreground" />
              </div>
              <h3 className="font-semibold mb-2">Distance Matrix</h3>
              <p className="text-sm text-muted-foreground">Build matrix using Google Maps or OpenRoute API</p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-accent rounded-full flex items-center justify-center mx-auto mb-4">
                <Cpu className="w-8 h-8 text-accent-foreground" />
              </div>
              <h3 className="font-semibold mb-2">QUBO + QAOA</h3>
              <p className="text-sm text-muted-foreground">Formulate as quantum optimization problem</p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-accent rounded-full flex items-center justify-center mx-auto mb-4">
                <GitBranch className="w-8 h-8 text-accent-foreground" />
              </div>
              <h3 className="font-semibold mb-2">Compare</h3>
              <p className="text-sm text-muted-foreground">Benchmark against classical baselines</p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-accent rounded-full flex items-center justify-center mx-auto mb-4">
                <Route className="w-8 h-8 text-accent-foreground" />
              </div>
              <h3 className="font-semibold mb-2">Optimal Route</h3>
              <p className="text-sm text-muted-foreground">Visualize and export the best path</p>
            </div>
          </div>
        </div>
      </section>

      {/* Live Demo Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-muted/30">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold mb-6">Advanced Features</h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Explore advanced quantum optimization parameters, algorithm comparisons, and detailed performance
              analytics.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <Card>
              <CardHeader>
                <Cpu className="w-12 h-12 text-accent mb-4" />
                <CardTitle>Quantum Parameters</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Fine-tune QAOA depth, shots, and optimization methods for different problem sizes and requirements.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <BarChart3 className="w-12 h-12 text-accent mb-4" />
                <CardTitle>Algorithm Comparison</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Compare quantum HAWS-QAOA against classical methods like Simulated Annealing and Nearest Neighbor.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <Route className="w-12 h-12 text-accent mb-4" />
                <CardTitle>Real-time Navigation</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Get turn-by-turn directions with accurate timing using OpenRouteService integration.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Benchmark Results Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <BenchmarkDashboard />
        </div>
      </section>

      {/* Algorithm Efficiency Comparison Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-muted/30">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold mb-6">Algorithm Performance Analysis</h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Comprehensive comparison of HAWS-QAOA against traditional optimization methods, showcasing quantum
              advantage in route planning
            </p>
          </div>

          <EfficiencyComparison />
        </div>
      </section>

      {/* Environmental Impact Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold mb-6">Environmental Impact & Sustainability</h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Discover how quantum optimization reduces carbon footprint and drives sustainable logistics operations
            </p>
          </div>

          <CarbonFootprintCalculator routes={[]} selectedRoute={null} />
        </div>
      </section>

      {/* Use Cases */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold mb-6">Real-World Applications</h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              QuantaPath optimizes routes across diverse industries and use cases
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card className="text-center">
              <CardHeader>
                <Truck className="w-12 h-12 text-accent mx-auto mb-4" />
                <CardTitle className="text-lg">Last-Mile Delivery</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Optimize final delivery routes for e-commerce and logistics companies
                </p>
              </CardContent>
            </Card>

            <Card className="text-center">
              <CardHeader>
                <div className="w-12 h-12 bg-accent rounded-lg flex items-center justify-center mx-auto mb-4">
                  <span className="text-accent-foreground font-bold">🍕</span>
                </div>
                <CardTitle className="text-lg">Food Delivery</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Minimize delivery times for restaurants and food service platforms
                </p>
              </CardContent>
            </Card>

            <Card className="text-center">
              <CardHeader>
                <div className="w-12 h-12 bg-accent rounded-lg flex items-center justify-center mx-auto mb-4">
                  <span className="text-accent-foreground font-bold">🔧</span>
                </div>
                <CardTitle className="text-lg">Field Services</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Schedule technician visits and maintenance calls efficiently
                </p>
              </CardContent>
            </Card>

            <Card className="text-center">
              <CardHeader>
                <div className="w-12 h-12 bg-accent rounded-lg flex items-center justify-center mx-auto mb-4">
                  <span className="text-accent-foreground font-bold">🚌</span>
                </div>
                <CardTitle className="text-lg">Campus Shuttles</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Optimize shuttle routes for universities and corporate campuses
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center gap-2 mb-4 md:mb-0">
              <div className="w-8 h-8 bg-accent rounded-lg flex items-center justify-center">
                <Route className="w-5 h-5 text-accent-foreground" />
              </div>
              <span className="text-xl font-bold">QuantaPath</span>
            </div>
            <p className="text-muted-foreground text-center md:text-right">
              Optimizing delivery routes at quantum speed
            </p>
          </div>

          {/* Developer Credits Section */}
          <div className="mt-8 pt-8 border-t border-border/50">
            <div className="text-center">
              <p className="text-sm text-muted-foreground mb-2">
                Developed by <span className="font-semibold text-foreground">TEAM RED-DRAGON</span>
              </p>
              <div className="flex justify-center items-center gap-4">
                <a
                  href="https://www.linkedin.com/in/premchand-yadav-a785691a2/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-accent hover:text-accent/80 transition-colors flex items-center gap-1"
                >
                  <Linkedin className="w-4 h-4" />
                  LinkedIn Profile
                </a>
                <span className="text-muted-foreground">•</span>
                <a
                  href="https://github.com/Premchandyadav369"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-accent hover:text-accent/80 transition-colors flex items-center gap-1"
                >
                  <Github className="w-4 h-4" />
                  GitHub Profile
                </a>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
