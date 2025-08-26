import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

const CodeBlock = ({ code }: { code: string }) => (
  <pre className="bg-gray-800 text-white p-4 rounded-md overflow-x-auto text-sm">
    <code>{code}</code>
  </pre>
)

export default function ApiDocsPage() {
  const requestExample = `{
  "locations": [
    { "lat": 52.5200, "lng": 13.4050, "name": "Berlin Hub", "isDepot": true },
    { "lat": 52.5300, "lng": 13.4150, "name": "Customer A" },
    { "lat": 52.5100, "lng": 13.3950, "name": "Customer B" },
    { "lat": 52.5250, "lng": 13.3850, "name": "Customer C" }
  ],
  "vehicles": 2,
  "solver": "balanced"
}`

  const responseExample = `{
  "total_distance": 15.7,
  "units": "km",
  "tours": [
    [
      { "lat": 52.5200, "lng": 13.4050, "name": "Berlin Hub" },
      { "lat": 52.5100, "lng": 13.3950, "name": "Customer B" },
      { "lat": 52.5200, "lng": 13.4050, "name": "Berlin Hub" }
    ],
    [
      { "lat": 52.5200, "lng": 13.4050, "name": "Berlin Hub" },
      { "lat": 52.5300, "lng": 13.4150, "name": "Customer A" },
      { "lat": 52.5250, "lng": 13.3850, "name": "Customer C" },
      { "lat": 52.5200, "lng": 13.4050, "name": "Berlin Hub" }
    ]
  ],
  "solver_used": "VRP (2 vehicles)",
  "runtime_ms": 128
}`

  return (
    <div className="container mx-auto p-8">
      <h1 className="text-4xl font-bold mb-4">QuantaPath API Documentation</h1>
      <p className="text-lg text-muted-foreground mb-8">
        A simple API for solving Vehicle Routing Problems.
      </p>

      <Card>
        <CardHeader>
          <CardTitle>API Endpoint</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="mb-2">To optimize a route, send a POST request to the following endpoint:</p>
          <CodeBlock code="POST /api/v1/optimize" />
        </CardContent>
      </Card>

      <Card className="mt-8">
        <CardHeader>
          <CardTitle>Request Body</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <h3 className="font-semibold">locations <Badge variant="secondary">Required</Badge></h3>
              <p className="text-sm text-muted-foreground">An array of location objects. The first location will be treated as the depot if no location has `isDepot: true`.</p>
            </div>
            <div>
              <h3 className="font-semibold">vehicles <Badge variant="outline">Optional</Badge></h3>
              <p className="text-sm text-muted-foreground">The number of vehicles to use. Defaults to 1 (which solves a standard TSP).</p>
            </div>
            <div>
              <h3 className="font-semibold">solver <Badge variant="outline">Optional</Badge></h3>
              <p className="text-sm text-muted-foreground">The solver preset to use. Can be "fast" or "balanced". Defaults to "balanced".</p>
            </div>
          </div>
          <h3 className="font-semibold mt-6 mb-2">Example Request:</h3>
          <CodeBlock code={requestExample} />
        </CardContent>
      </Card>

      <Card className="mt-8">
        <CardHeader>
          <CardTitle>Response Body</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="mb-2">The API will return a JSON object with the optimized route details.</p>
          <h3 className="font-semibold mt-6 mb-2">Example Response:</h3>
          <CodeBlock code={responseExample} />
        </CardContent>
      </Card>
    </div>
  )
}
