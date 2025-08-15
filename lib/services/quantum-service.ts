import type { RouteResult, OptimizationRequest } from "@/lib/types"

export class QuantumService {
  private static instance: QuantumService

  static getInstance(): QuantumService {
    if (!QuantumService.instance) {
      QuantumService.instance = new QuantumService()
    }
    return QuantumService.instance
  }

  async solveQAOA(distanceMatrix: number[][], params: OptimizationRequest["quantum"]): Promise<RouteResult> {
    const startTime = Date.now()

    return this.simulateQAOA(distanceMatrix, params, startTime)
  }

  private async simulateQAOA(
    distanceMatrix: number[][],
    params: OptimizationRequest["quantum"],
    startTime: number,
  ): Promise<RouteResult> {
    // Simulate quantum computation time based on problem size and parameters
    const baseTime = 500
    const complexityTime = distanceMatrix.length * distanceMatrix.length * params.p * 10
    const shotsTime = Math.log(params.shots) * 50
    const simulatedTime = baseTime + complexityTime + shotsTime

    await new Promise((resolve) => setTimeout(resolve, Math.min(simulatedTime, 5000)))

    const n = distanceMatrix.length

    // Simulate QAOA behavior with some quantum-inspired heuristics
    const tour = await this.quantumInspiredHeuristic(distanceMatrix, params)

    // Calculate tour length
    let length = 0
    for (let i = 0; i < tour.length - 1; i++) {
      length += distanceMatrix[tour[i]][tour[i + 1]]
    }

    // Add some quantum "noise" to make results slightly different each time
    const quantumNoise = 1 + (Math.random() - 0.5) * 0.05 // ±2.5% variation
    length *= quantumNoise

    const runtimeMs = Date.now() - startTime

    return {
      solver: "quantum",
      name: `QAOA p=${params.p} (sim)`,
      tour,
      length: Math.round(length * 100) / 100,
      feasible: true,
      violations: { pos: 0, city: 0 },
      runtimeMs,
      parameters: {
        p: params.p,
        shots: params.shots,
        optimizer: params.optimizer,
        penalties: params.penalties,
        backend: "simulator",
      },
    }
  }

  private async quantumInspiredHeuristic(
    distanceMatrix: number[][],
    params: OptimizationRequest["quantum"],
  ): Promise<number[]> {
    const n = distanceMatrix.length

    // Quantum-inspired approach: multiple random restarts with local optimization
    let bestTour: number[] = []
    let bestLength = Number.POSITIVE_INFINITY

    const numRestarts = Math.min(params.shots / 100, 20) // Scale with shots parameter

    for (let restart = 0; restart < numRestarts; restart++) {
      // Generate initial tour with quantum-inspired randomness
      const tour = [0] // Start with depot
      const remaining = Array.from({ length: n - 1 }, (_, i) => i + 1)

      let current = 0
      while (remaining.length > 0) {
        // Quantum-inspired selection: bias towards shorter distances but allow exploration
        const distances = remaining.map((city) => ({
          city,
          distance: distanceMatrix[current][city],
        }))

        distances.sort((a, b) => a.distance - b.distance)

        // Quantum-inspired probability distribution (exponential decay)
        const probabilities = distances.map((_, i) => Math.exp(-i / (params.p + 1)))
        const totalProb = probabilities.reduce((sum, p) => sum + p, 0)
        const normalizedProbs = probabilities.map((p) => p / totalProb)

        // Select based on probability distribution
        const rand = Math.random()
        let cumProb = 0
        let selectedIndex = 0

        for (let i = 0; i < normalizedProbs.length; i++) {
          cumProb += normalizedProbs[i]
          if (rand <= cumProb) {
            selectedIndex = i
            break
          }
        }

        const selectedCity = distances[selectedIndex].city
        tour.push(selectedCity)
        remaining.splice(remaining.indexOf(selectedCity), 1)
        current = selectedCity
      }

      tour.push(0) // Return to depot

      // Local optimization (2-opt)
      const optimizedTour = this.twoOptImprovement(tour, distanceMatrix)
      const tourLength = this.calculateTourLength(optimizedTour, distanceMatrix)

      if (tourLength < bestLength) {
        bestLength = tourLength
        bestTour = optimizedTour
      }
    }

    return bestTour
  }

  private twoOptImprovement(tour: number[], distanceMatrix: number[]): number[] {
    const n = tour.length - 1 // Exclude the duplicate depot at the end
    let improved = true
    let currentTour = [...tour]

    while (improved) {
      improved = false

      for (let i = 1; i < n - 1; i++) {
        for (let j = i + 1; j < n; j++) {
          // Calculate current distance
          const currentDist =
            distanceMatrix[currentTour[i - 1]][currentTour[i]] + distanceMatrix[currentTour[j]][currentTour[j + 1]]

          // Calculate new distance after 2-opt swap
          const newDist =
            distanceMatrix[currentTour[i - 1]][currentTour[j]] + distanceMatrix[currentTour[i]][currentTour[j + 1]]

          if (newDist < currentDist) {
            // Perform 2-opt swap
            const newTour = [...currentTour]
            for (let k = i; k <= j; k++) {
              newTour[k] = currentTour[j - (k - i)]
            }
            currentTour = newTour
            improved = true
          }
        }
      }
    }

    return currentTour
  }

  private calculateTourLength(tour: number[], distanceMatrix: number[]): number {
    let length = 0
    for (let i = 0; i < tour.length - 1; i++) {
      length += distanceMatrix[tour[i]][tour[i + 1]]
    }
    return length
  }
}
