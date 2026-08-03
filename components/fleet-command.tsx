"use client"

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Truck, AlertCircle, CheckCircle2, Clock } from "lucide-react"

const fleetData = [
  { id: "V-104", status: "In Transit", driver: "A. Smith", eta: "14:30", fuel: "68%", alerts: 0 },
  { id: "V-209", status: "Delayed", driver: "M. Johnson", eta: "15:45", fuel: "42%", alerts: 1 },
  { id: "EV-03", status: "Charging", driver: "S. Lee", eta: "N/A", fuel: "98% (Bat)", alerts: 0 },
  { id: "V-112", status: "Delivered", driver: "J. Davis", eta: "12:15", fuel: "21%", alerts: 0 },
]

export function FleetCommandCenter() {
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Truck className="w-6 h-6 text-accent" />
          Fleet Command Center
        </CardTitle>
        <CardDescription>Live enterprise vehicle tracking and KPI overview</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="p-4 border rounded-lg bg-card text-center">
            <p className="text-2xl font-bold">24</p>
            <p className="text-xs text-muted-foreground uppercase tracking-wider">Active Vehicles</p>
          </div>
          <div className="p-4 border rounded-lg bg-card text-center">
            <p className="text-2xl font-bold text-green-500">89%</p>
            <p className="text-xs text-muted-foreground uppercase tracking-wider">On-Time Rate</p>
          </div>
          <div className="p-4 border rounded-lg bg-card text-center">
            <p className="text-2xl font-bold text-destructive">2</p>
            <p className="text-xs text-muted-foreground uppercase tracking-wider">Critical Alerts</p>
          </div>
          <div className="p-4 border rounded-lg bg-card text-center">
            <p className="text-2xl font-bold text-accent">1,240</p>
            <p className="text-xs text-muted-foreground uppercase tracking-wider">Deliveries Today</p>
          </div>
        </div>

        <div className="border rounded-lg overflow-hidden">
          <table className="w-full text-sm text-left">
            <thead className="bg-muted text-muted-foreground">
              <tr>
                <th className="px-4 py-3 font-medium">Vehicle ID</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Driver</th>
                <th className="px-4 py-3 font-medium">ETA</th>
                <th className="px-4 py-3 font-medium">Fuel/Battery</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {fleetData.map((vehicle) => (
                <tr key={vehicle.id} className="bg-card hover:bg-muted/50 transition-colors">
                  <td className="px-4 py-3 font-medium">{vehicle.id}</td>
                  <td className="px-4 py-3">
                    <Badge variant={
                      vehicle.status === 'In Transit' ? 'default' :
                      vehicle.status === 'Delayed' ? 'destructive' :
                      vehicle.status === 'Delivered' ? 'secondary' : 'outline'
                    }>
                      {vehicle.status}
                    </Badge>
                  </td>
                  <td className="px-4 py-3">{vehicle.driver}</td>
                  <td className="px-4 py-3 flex items-center gap-1">
                    <Clock className="w-3 h-3 text-muted-foreground" />
                    {vehicle.eta}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-between">
                      <span>{vehicle.fuel}</span>
                      {vehicle.alerts > 0 && <AlertCircle className="w-4 h-4 text-destructive" />}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

      </CardContent>
    </Card>
  )
}
