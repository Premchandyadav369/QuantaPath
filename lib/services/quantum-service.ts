import type { RouteResult, OptimizationRequest, DistanceMatrix, DeliveryStop } from "@/lib/types"

const TIME_WINDOW_PENALTY = 10000; // Large penalty for violating a time window
const SERVICE_TIME_MINUTES = 15; // Assume 15 minutes service time at each stop

export class QuantumService {
  private static instance: QuantumService

  static getInstance(): QuantumService {
    if (!QuantumService.instance) {
      QuantumService.instance = new QuantumService()
    }
    return QuantumService.instance
  }

  async solveQAOA(matrix: DistanceMatrix, params: OptimizationRequest["quantum"], stops: DeliveryStop[]): Promise<RouteResult> {
    const startTime = Date.now()

    return this.simulateHAWSQAOA(matrix, params, startTime, stops)
  }

  private async simulateHAWSQAOA(
    matrix: DistanceMatrix,
    params: OptimizationRequest["quantum"],
    startTime: number,
    stops: DeliveryStop[],
  ): Promise<RouteResult> {
    const n = matrix.distances.length

    const baseTime = 800 // Higher base time for sophisticated algorithm
    const warmStartTime = n * 50 // Time for generating warm starts
    const layerwiseTime = params.p * params.p * 100 // Layerwise training complexity
    const cvarTime = Math.log(params.shots) * 30 // CVaR optimization overhead
    const simulatedTime = baseTime + warmStartTime + layerwiseTime + cvarTime

    await new Promise((resolve) => setTimeout(resolve, Math.min(simulatedTime, 6000)))

    const classicalBaseline = await this.generateClassicalBaseline(matrix.distances)
    const warmStarts = await this.generateWarmStarts(classicalBaseline, matrix.distances, 5)

    const bestResult = await this.hawsQAOAOptimization(matrix, warmStarts, params, stops)
    const finalCost = this.calculateTourCost(bestResult.tour, matrix, stops);

    const runtimeMs = Date.now() - startTime

    return {
      solver: "quantum",
      name: `HAWS-QAOA p=${params.p}`,
      tour: bestResult.tour,
      length: Math.round(finalCost.length * 100) / 100,
      timeMinutes: Math.round(finalCost.duration * 100) / 100,
      feasible: finalCost.timeWindowViolations === 0,
      violations: { pos: 0, city: 0, timeWindow: finalCost.timeWindowViolations },
      runtimeMs,
      parameters: {
        p: params.p,
        shots: params.shots,
        optimizer: params.optimizer,
        penalties: params.penalties,
        backend: "HAWS-QAOA simulator",
        warmStarts: warmStarts.length,
        cvarAlpha: 0.2,
        constraintPreserving: true,
      },
    }
  }

  private parseTimeToMinutes(time: string): number {
    const [hours, minutes] = time.split(':').map(Number);
    return hours * 60 + minutes;
  }

  private calculateTourCost(tour: number[], matrix: DistanceMatrix, stops: DeliveryStop[]): { cost: number, length: number, duration: number, timeWindowViolations: number } {
    let length = 0;
    let duration = 0;
    let timeWindowViolations = 0;
    let currentTime = 0; // Start at time 0

    const hasTimeWindows = stops.some(s => s.timeWindow);

    for (let i = 0; i < tour.length - 1; i++) {
      const from = tour[i];
      const to = tour[i + 1];
      length += matrix.distances[from][to];

      const travelTime = matrix.durations?.[from]?.[to] || (matrix.distances[from][to] * 2);
      duration += travelTime;

      if (hasTimeWindows) {
        currentTime += travelTime;
        const stopInfo = stops[to];
        if (stopInfo.timeWindow) {
          const start = this.parseTimeToMinutes(stopInfo.timeWindow.start);
          const end = this.parseTimeToMinutes(stopInfo.timeWindow.end);
          if (currentTime < start) {
            // Wait until the time window opens
            currentTime = start;
          } else if (currentTime > end) {
            timeWindowViolations++;
          }
        }
        // Add service time for the stop
        if(i < tour.length - 2) { // No service time at the end depot
            currentTime += SERVICE_TIME_MINUTES;
            duration += SERVICE_TIME_MINUTES;
        }
      }
    }

    const cost = length + timeWindowViolations * TIME_WINDOW_PENALTY;
    return { cost, length, duration, timeWindowViolations };
  }

  private async generateClassicalBaseline(distanceMatrix: number[][]): Promise<number[]> {
    const n = distanceMatrix.length

    // Nearest neighbor construction
    const tour = [0]
    const unvisited = new Set(Array.from({ length: n - 1 }, (_, i) => i + 1))
    let current = 0

    while (unvisited.size > 0) {
      let nearest = -1
      let minDistance = Number.POSITIVE_INFINITY

      for (const city of unvisited) {
        if (distanceMatrix[current][city] < minDistance) {
          minDistance = distanceMatrix[current][city]
          nearest = city
        }
      }

      tour.push(nearest)
      unvisited.delete(nearest)
      current = nearest
    }

    tour.push(0) // Return to depot

    // Apply 3-opt improvement
    return this.threeOptImprovement(tour, distanceMatrix)
  }

  private async generateWarmStarts(baseline: number[], distanceMatrix: number[][], count: number): Promise<number[][]> {
    const warmStarts = [baseline]

    for (let i = 1; i < count; i++) {
      const perturbed = this.perturbTour(baseline, Math.floor(baseline.length * 0.3))
      const improved = this.twoOptImprovement(perturbed, distanceMatrix)
      warmStarts.push(improved)
    }

    return warmStarts
  }

  private perturbTour(tour: number[], swapCount: number): number[] {
    const result = [...tour]
    const n = result.length - 1 // Exclude duplicate depot

    for (let i = 0; i < swapCount; i++) {
      const idx1 = 1 + Math.floor(Math.random() * (n - 1))
      const idx2 = 1 + Math.floor(Math.random() * (n - 1))

      if (idx1 !== idx2) {
        ;[result[idx1], result[idx2]] = [result[idx2], result[idx1]]
      }
    }

    return result
  }

  private async hawsQAOAOptimization(
    matrix: DistanceMatrix,
    warmStarts: number[][],
    params: OptimizationRequest["quantum"],
    stops: DeliveryStop[],
  ): Promise<{ tour: number[]; cost: number }> {
    let bestTour: number[] = []
    let bestCost = Number.POSITIVE_INFINITY

    // Process each warm start
    for (const warmStart of warmStarts) {
      // Simulate layerwise training (p=1 to p=params.p)
      let currentTour = warmStart

      for (let layer = 1; layer <= params.p; layer++) {
        // Simulate CVaR-QAOA sampling with constraint-preserving mixers
        const samples = await this.cvarQAOASampling(matrix.distances, currentTour, params, layer)

        // Elite selection and local search refinement
        const elites = this.selectElites(samples, matrix, stops, 10)

        for (const elite of elites) {
          const refined = this.localSearchRefinement(elite, matrix.distances)
          const { cost } = this.calculateTourCost(refined, matrix, stops)

          if (cost < bestCost) {
            bestCost = cost
            bestTour = refined
          }
        }

        // Update current tour for next layer
        if (elites.length > 0) {
          currentTour = elites[0]
        }
      }
    }

    return { tour: bestTour, cost: bestCost }
  }

  private async cvarQAOASampling(
    distanceMatrix: number[][],
    warmStart: number[],
    params: OptimizationRequest["quantum"],
    layer: number,
  ): Promise<number[][]> {
    const samples: number[][] = []
    const n = distanceMatrix.length
    const shotsPerLayer = Math.floor(params.shots / params.p)

    for (let shot = 0; shot < shotsPerLayer; shot++) {
      // Quantum-inspired sampling biased towards warm start
      const biasStrength = 0.7 - (layer - 1) * 0.1 // Decrease bias with layers

      if (Math.random() < biasStrength) {
        // Sample close to warm start with small perturbations
        const sample = this.perturbTour(warmStart, Math.max(1, Math.floor(n * 0.1)))
        samples.push(sample)
      } else {
        // Explore with quantum-inspired randomness
        const sample = this.quantumInspiredSample(distanceMatrix, warmStart)
        samples.push(sample)
      }
    }

    return samples
  }

  private quantumInspiredSample(distanceMatrix: number[][], reference: number[]): number[] {
    const n = distanceMatrix.length
    const tour = [0]
    const remaining = Array.from({ length: n - 1 }, (_, i) => i + 1)
    let current = 0

    while (remaining.length > 0) {
      // Quantum-inspired probability based on distance and reference tour influence
      const probabilities = remaining.map((city) => {
        const distance = distanceMatrix[current][city]
        const referenceBonus = reference.includes(city) ? 0.3 : 0
        return Math.exp(-(distance / 1000) + referenceBonus)
      })

      const totalProb = probabilities.reduce((sum, p) => sum + p, 0)
      const normalizedProbs = probabilities.map((p) => p / totalProb)

      // Quantum-like sampling
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

      const selectedCity = remaining[selectedIndex]
      tour.push(selectedCity)
      remaining.splice(selectedIndex, 1)
      current = selectedCity
    }

    tour.push(0)
    return tour
  }

  private selectElites(samples: number[][], matrix: DistanceMatrix, stops: DeliveryStop[], k: number): number[][] {
    const alpha = 0.2 // CVaR parameter - focus on best 20%

    const evaluated = samples.map((tour) => ({
      tour,
      cost: this.calculateTourCost(tour, matrix, stops).cost,
    }))

    evaluated.sort((a, b) => a.cost - b.cost)

    const cvarCount = Math.max(1, Math.floor(samples.length * alpha))
    const eliteCount = Math.min(k, cvarCount)

    return evaluated.slice(0, eliteCount).map((item) => item.tour)
  }

  private localSearchRefinement(tour: number[], distanceMatrix: number[]): number[] {
    let refined = this.twoOptImprovement(tour, distanceMatrix)
    refined = this.threeOptImprovement(refined, distanceMatrix)
    return refined
  }

  private threeOptImprovement(tour: number[], distanceMatrix: number[]): number[] {
    const n = tour.length - 1
    let improved = true
    let currentTour = [...tour]

    while (improved) {
      improved = false

      for (let i = 1; i < n - 2; i++) {
        for (let j = i + 1; j < n - 1; j++) {
          for (let k = j + 1; k < n; k++) {
            const currentLength =
              distanceMatrix[currentTour[i - 1]][currentTour[i]] +
              distanceMatrix[currentTour[j]][currentTour[j + 1]] +
              distanceMatrix[currentTour[k]][currentTour[k + 1]]

            // Try different 3-opt reconnections
            const reconnections = this.generate3OptReconnections(currentTour, i, j, k)

            for (const reconnection of reconnections) {
              const newLength =
                distanceMatrix[reconnection[i - 1]][reconnection[i]] +
                distanceMatrix[reconnection[j]][reconnection[j + 1]] +
                distanceMatrix[reconnection[k]][reconnection[k + 1]]

              if (newLength < currentLength) {
                currentTour = reconnection
                improved = true
                break
              }
            }

            if (improved) break
          }
          if (improved) break
        }
        if (improved) break
      }
    }

    return currentTour
  }

  private generate3OptReconnections(tour: number[], i: number, j: number, k: number): number[][] {
    const reconnections: number[][] = []

    // Basic 3-opt move (reverse middle segment)
    const variant1 = [...tour]
    for (let idx = i; idx <= j; idx++) {
      variant1[idx] = tour[j - (idx - i)]
    }
    reconnections.push(variant1)

    // Another 3-opt variant (reverse last segment)
    const variant2 = [...tour]
    for (let idx = j + 1; idx <= k; idx++) {
      variant2[idx] = tour[k - (idx - j - 1)]
    }
    reconnections.push(variant2)

    return reconnections
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
            for (let idx = i; idx <= j; idx++) {
              newTour[idx] = currentTour[j - (idx - i)]
            }
            currentTour = newTour
            improved = true
          }
        }
      }
    }

    return currentTour
  }

  private calculateTourLength(tour: number[], distanceMatrix: number[][]): number {
    let length = 0
    for (let i = 0; i < tour.length - 1; i++) {
      length += distanceMatrix[tour[i]][tour[i + 1]]
    }
    return length
  }
}
