"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { CloudRain, Car, AlertTriangle, BatteryWarning, RouteOff } from "lucide-react"

export function ScenarioSimulator() {
  const [scenarios, setScenarios] = useState({
    traffic: false,
    weather: false,
    closures: false,
    vehicleFailure: false,
  })

  const toggleScenario = (key: keyof typeof scenarios) => {
    setScenarios(prev => ({ ...prev, [key]: !prev[key] }))
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Scenario Simulator</CardTitle>
        <CardDescription>&quot;What If?&quot; environment testing for automatic route re-optimization</CardDescription>
      </CardHeader>
      <CardContent className="grid sm:grid-cols-2 gap-4">

        <label className="flex items-center justify-between p-4 border rounded-lg cursor-pointer hover:bg-muted/50 transition-colors">
          <div className="flex items-center gap-3">
            <Car className={`w-5 h-5 ${scenarios.traffic ? 'text-destructive' : 'text-muted-foreground'}`} />
            <div>
              <p className="font-medium">Heavy Traffic</p>
              <p className="text-sm text-muted-foreground">Simulate rush hour congestion</p>
            </div>
          </div>
          <input
            type="checkbox"
            checked={scenarios.traffic}
            onChange={() => toggleScenario('traffic')}
            className="w-5 h-5 accent-destructive"
          />
        </label>

        <label className="flex items-center justify-between p-4 border rounded-lg cursor-pointer hover:bg-muted/50 transition-colors">
          <div className="flex items-center gap-3">
            <CloudRain className={`w-5 h-5 ${scenarios.weather ? 'text-blue-500' : 'text-muted-foreground'}`} />
            <div>
              <p className="font-medium">Adverse Weather</p>
              <p className="text-sm text-muted-foreground">Rain/Snow delaying routes</p>
            </div>
          </div>
          <input
            type="checkbox"
            checked={scenarios.weather}
            onChange={() => toggleScenario('weather')}
            className="w-5 h-5 accent-blue-500"
          />
        </label>

        <label className="flex items-center justify-between p-4 border rounded-lg cursor-pointer hover:bg-muted/50 transition-colors">
          <div className="flex items-center gap-3">
            <RouteOff className={`w-5 h-5 ${scenarios.closures ? 'text-orange-500' : 'text-muted-foreground'}`} />
            <div>
              <p className="font-medium">Road Closures</p>
              <p className="text-sm text-muted-foreground">Unexpected blocks on primary paths</p>
            </div>
          </div>
          <input
            type="checkbox"
            checked={scenarios.closures}
            onChange={() => toggleScenario('closures')}
            className="w-5 h-5 accent-orange-500"
          />
        </label>

        <label className="flex items-center justify-between p-4 border rounded-lg cursor-pointer hover:bg-muted/50 transition-colors">
          <div className="flex items-center gap-3">
            <BatteryWarning className={`w-5 h-5 ${scenarios.vehicleFailure ? 'text-red-600' : 'text-muted-foreground'}`} />
            <div>
              <p className="font-medium">Vehicle Failure</p>
              <p className="text-sm text-muted-foreground">Simulate breakdown & re-allocation</p>
            </div>
          </div>
          <input
            type="checkbox"
            checked={scenarios.vehicleFailure}
            onChange={() => toggleScenario('vehicleFailure')}
            className="w-5 h-5 accent-red-600"
          />
        </label>

      </CardContent>
    </Card>
  )
}
