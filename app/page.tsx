"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { InteractiveMap } from "@/components/interactive-map"
import { BenchmarkDashboard } from "@/components/benchmark-dashboard"
import { EfficiencyComparison } from "@/components/efficiency-comparison"
import { CarbonFootprintCalculator } from "@/components/carbon-footprint-calculator"
import { QuantumAnalyticsDashboard } from "@/components/quantum-analytics"
import { SustainabilityDashboard } from "@/components/sustainability-dashboard"
import { FleetCommandCenter } from "@/components/fleet-command"
import { ResearchBenchmarkMode } from "@/components/research-benchmark"
import { Route, BarChart3, Settings, MapPin, Truck, Leaf, Activity } from "lucide-react"
import { cn } from "@/lib/utils"

export default function AppShell() {
  const [activeTab, setActiveTab] = useState("map")
  const [isSidebarOpen, setIsSidebarOpen] = useState(true)

  const navItems = [
    { id: "map", label: "Map Workspace", icon: MapPin },
    { id: "analytics", label: "Quantum Analytics", icon: BarChart3 },
    { id: "fleet", label: "Fleet Command", icon: Truck },
    { id: "sustainability", label: "Sustainability", icon: Leaf },
    { id: "benchmarks", label: "Benchmarks", icon: Activity },
  ]

  const renderContent = () => {
    switch (activeTab) {
      case "map":
        return <InteractiveMap />
      case "analytics":
        return (
          <div className="p-6 space-y-6 h-full overflow-y-auto">
            <QuantumAnalyticsDashboard />
            <EfficiencyComparison />
          </div>
        )
      case "fleet":
        return (
          <div className="p-6 h-full overflow-y-auto">
            <FleetCommandCenter />
          </div>
        )
      case "sustainability":
        return (
          <div className="p-6 space-y-6 h-full overflow-y-auto">
            <SustainabilityDashboard />
            <CarbonFootprintCalculator routes={[]} selectedRoute={null} />
          </div>
        )
      case "benchmarks":
        return (
          <div className="p-6 space-y-6 h-full overflow-y-auto">
            <BenchmarkDashboard />
            <ResearchBenchmarkMode />
          </div>
        )
      default:
        return <InteractiveMap />
    }
  }

  return (
    <div className="flex h-screen w-full overflow-hidden bg-background">
      {/* Sidebar Navigation */}
      <aside
        className={cn(
          "h-full bg-card/80 backdrop-blur-md border-r flex flex-col transition-all duration-300 z-50",
          isSidebarOpen ? "w-64" : "w-16"
        )}
      >
        <div className="h-16 flex items-center justify-between px-4 border-b">
          <div className="flex items-center gap-2 overflow-hidden">
            <div className="w-8 h-8 shrink-0 bg-accent rounded-lg flex items-center justify-center cursor-pointer" onClick={() => setIsSidebarOpen(!isSidebarOpen)}>
              <Route className="w-5 h-5 text-accent-foreground" />
            </div>
            <span className={cn("text-xl font-bold transition-opacity whitespace-nowrap", isSidebarOpen ? "opacity-100" : "opacity-0 w-0 hidden")}>
              QuantaPath
            </span>
          </div>
        </div>

        <nav className="flex-1 py-4 px-2 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon
            const isActive = activeTab === item.id
            return (
              <Button
                key={item.id}
                variant={isActive ? "secondary" : "ghost"}
                className={cn(
                  "w-full justify-start overflow-hidden",
                  isActive ? "bg-accent/20 text-accent" : "text-muted-foreground",
                  !isSidebarOpen && "px-2 justify-center"
                )}
                onClick={() => setActiveTab(item.id)}
              >
                <Icon className={cn("w-5 h-5 shrink-0", isSidebarOpen && "mr-3")} />
                <span className={cn("transition-opacity whitespace-nowrap", isSidebarOpen ? "opacity-100" : "opacity-0 w-0 hidden")}>
                  {item.label}
                </span>
              </Button>
            )
          })}
        </nav>

        <div className="p-4 border-t">
            <Button variant="ghost" className="w-full justify-start" size="sm">
                <Settings className={cn("w-5 h-5 shrink-0", isSidebarOpen && "mr-3")} />
                <span className={cn("transition-opacity", isSidebarOpen ? "opacity-100" : "opacity-0 w-0 hidden")}>
                  Settings
                </span>
            </Button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col h-full overflow-hidden relative">
        {/* Top Navbar */}
        <header className="h-16 absolute top-0 left-0 right-0 z-40 bg-card/50 backdrop-blur-sm border-b flex items-center justify-between px-6 pointer-events-none">
          <div className="flex-1"></div>
          <div className="pointer-events-auto">
            <div className="flex items-center gap-4">
                <Button variant="outline" size="sm" className="hidden md:flex gap-2 text-muted-foreground">
                    <span className="text-xs">Search...</span>
                    <kbd className="inline-flex items-center rounded border px-1 font-mono text-[10px] font-medium opacity-100">
                        <span className="text-xs">⌘</span>K
                    </kbd>
                </Button>
            </div>
          </div>
        </header>

        {/* Dynamic View Content */}
        <div className="flex-1 w-full h-full pt-16">
          {renderContent()}
        </div>
      </main>
    </div>
  )
}
