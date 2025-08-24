export interface DeliveryStop {
  id:string
  name: string
  lat: number
  lng: number
  x?: number // Legacy support for SVG coordinates
  y?: number // Legacy support for SVG coordinates
  isDepot?: boolean
  priority?: number
  timeWindow?: {
    start: string
    end: string
  }
  icon?: string
}

export interface OptimizationRequest {
  stops: DeliveryStop[]
  optimizeFor: "distance" | "time"
  distanceSource: "google" | "openrouteservice" | "haversine"
  quantum: {
    use: boolean
    p: number
    shots: number
    optimizer: "COBYLA" | "SPSA" | "NELDER_MEAD"
    penalties: {
      A: number
      B: number
    }
    backend: "aer" | "real"
  }
  classical: {
    nn: boolean
    twoOpt: boolean
    anneal: boolean
    ortools: boolean
    simulatedAnnealingParams?: {
      initialTemp: number
      coolingRate: number
      maxIterations: number
    }
  }
  seed: number
}

export interface RouteResult {
  solver: "quantum" | "classical"
  name: string
  tour: number[]
  length: number
  timeMinutes?: number
  feasible: boolean
  violations: {
    pos: number
    city: number
  }
  runtimeMs: number
  parameters?: Record<string, unknown>
}

export interface OptimizationResponse {
  distanceUnits: "km" | "miles"
  candidates: RouteResult[]
  bestIndex: number
  polyline?: string
  diagnostics: {
    energyHistogram?: Array<[number, number]>
    feasibilityRate: number
  }
}

export interface DistanceMatrix {
  distances: number[][]
  durations?: number[][]
  units: "km" | "miles"
  source: string
}

export interface DistanceMatrixRequest {
  stops: DeliveryStop[]
  mode: "distance" | "time"
  source: "google" | "openrouteservice" | "haversine"
}
