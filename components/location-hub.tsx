import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { MapPin, Star, Truck, Building } from "lucide-react"

interface LocationHubProps {
  onSelectIcon: (icon: string) => void
}

export function LocationHub({ onSelectIcon }: LocationHubProps) {
  const icons = [
    { name: "Pin", icon: <MapPin /> },
    { name: "Star", icon: <Star /> },
    { name: "Truck", icon: <Truck /> },
    { name: "Building", icon: <Building /> },
  ]

  return (
    <Card>
      <CardHeader>
        <CardTitle>Location Hub</CardTitle>
      </CardHeader>
      <CardContent className="grid grid-cols-4 gap-4">
        {icons.map((item) => (
          <Button
            key={item.name}
            variant="outline"
            size="icon"
            onClick={() => onSelectIcon(item.name)}
          >
            {item.icon}
          </Button>
        ))}
      </CardContent>
    </Card>
  )
}
