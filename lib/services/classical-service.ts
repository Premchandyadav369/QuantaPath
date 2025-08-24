import type { RouteResult, OptimizationRequest, DistanceMatrix, DeliveryStop } from "@/lib/types"

const TIME_WINDOW_PENALTY = 10000; // Large penalty for violating a time window
const SERVICE_TIME_MINUTES = 15; // Assume 15 minutes service time at each stop

export class ClassicalService {
  private static instance: ClassicalService

  static getInstance(): ClassicalService {
    if (!ClassicalService.instance) {
      ClassicalService.instance = new ClassicalService()
    }
    return ClassicalService.instance
  }

  async solveClassical(matrix: DistanceMatrix, params: OptimizationRequest["classical"], stops: DeliveryStop[]): Promise<RouteResult[]> {
    const results: RouteResult[] = []

    // Run Nearest Neighbor + 2-opt if requested
    if (params.nn || params.twoOpt) {
      const nnResult = await this.nearestNeighborWith2Opt(matrix, stops)
      results.push(nnResult)
    }

    // Run Simulated Annealing if requested
    if (params.anneal) {
      const saResult = await this.simulatedAnnealing(matrix, stops)
      results.push(saResult)
    }

    // Run Christofides if requested
    if (params.christofides) {
      const christofidesResult = await this.christofides(matrix.distances)
      results.push(christofidesResult)
    }

    // If no specific algorithms requested, run default (NN + 2-opt)
    if (results.length === 0) {
      const defaultResult = await this.nearestNeighborWith2Opt(matrix, stops)
      results.push(defaultResult)
    }

    return results
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

  private async nearestNeighborWith2Opt(matrix: DistanceMatrix, stops: DeliveryStop[]): Promise<RouteResult> {
    const startTime = Date.now()
    const n = matrix.distances.length

    // Phase 1: Nearest Neighbor construction
    let tour = this.nearestNeighborConstruction(matrix.distances)

    // Phase 2: 2-opt improvement
    tour = this.twoOptImprovement(tour, matrix.distances)

    const cost = this.calculateTourCost(tour, matrix, stops);
    const runtimeMs = Date.now() - startTime

    return {
      solver: "classical",
      name: "Nearest Neighbor + 2-opt",
      tour,
      length: Math.round(cost.length * 100) / 100,
      timeMinutes: Math.round(cost.duration * 100) / 100,
      feasible: cost.timeWindowViolations === 0,
      violations: { pos: 0, city: 0, timeWindow: cost.timeWindowViolations },
      runtimeMs,
    }
  }

  private async simulatedAnnealing(matrix: DistanceMatrix, stops: DeliveryStop[]): Promise<RouteResult> {
    const startTime = Date.now()
    const n = matrix.distances.length

    // Start with nearest neighbor solution
    let currentTour = this.nearestNeighborConstruction(matrix.distances)
    let currentCost = this.calculateTourCost(currentTour, matrix, stops)

    let bestTour = [...currentTour]
    let bestCost = currentCost

    // Simulated Annealing parameters
    const initialTemp = this.calculateInitialTemperature(matrix.distances)
    const finalTemp = 0.01
    const coolingRate = 0.995
    const maxIterationsPerTemp = Math.max(100, n * 10)

    let temperature = initialTemp

    while (temperature > finalTemp) {
      for (let iter = 0; iter < maxIterationsPerTemp; iter++) {
        // Generate neighbor solution using 2-opt swap
        const neighborTour = this.generate2OptNeighbor(currentTour)
        const neighborCost = this.calculateTourCost(neighborTour, matrix, stops)

        // Accept or reject the neighbor
        const deltaE = neighborCost.cost - currentCost.cost

        if (deltaE < 0 || Math.random() < Math.exp(-deltaE / temperature)) {
          currentTour = neighborTour
          currentCost = neighborCost

          // Update best solution if improved
          if (currentCost.cost < bestCost.cost) {
            bestTour = [...currentTour]
            bestCost = currentCost
          }
        }
      }

      temperature *= coolingRate
    }

    const runtimeMs = Date.now() - startTime

    return {
      solver: "classical",
      name: "Simulated Annealing",
      tour: bestTour,
      length: Math.round(bestCost.length * 100) / 100,
      timeMinutes: Math.round(bestCost.duration * 100) / 100,
      feasible: bestCost.timeWindowViolations === 0,
      violations: { pos: 0, city: 0, timeWindow: bestCost.timeWindowViolations },
      runtimeMs,
    }
  }

  private nearestNeighborConstruction(distanceMatrix: number[][]): number[] {
    const n = distanceMatrix.length
    const tour = [0] // Start from depot
    const visited = new Set([0])

    let current = 0

    while (visited.size < n) {
      let nearest = -1
      let nearestDistance = Number.POSITIVE_INFINITY

      for (let i = 0; i < n; i++) {
        if (!visited.has(i) && distanceMatrix[current][i] < nearestDistance) {
          nearest = i
          nearestDistance = distanceMatrix[current][i]
        }
      }

      if (nearest !== -1) {
        tour.push(nearest)
        visited.add(nearest)
        current = nearest
      }
    }

    tour.push(0) // Return to depot
    return tour
  }

  private twoOptImprovement(tour: number[], distanceMatrix: number[]): number[] {
    const n = tour.length - 1 // Exclude the duplicate depot at the end
    let improved = true
    let currentTour = [...tour]
    let iterations = 0
    const maxIterations = n * n // Prevent infinite loops

    while (improved && iterations < maxIterations) {
      improved = false
      iterations++

      for (let i = 1; i < n - 1; i++) {
        for (let j = i + 1; j < n; j++) {
          // Calculate current distance for edges (i-1,i) and (j,j+1)
          const currentDist =
            distanceMatrix[currentTour[i - 1]][currentTour[i]] + distanceMatrix[currentTour[j]][currentTour[j + 1]]

          // Calculate new distance for edges (i-1,j) and (i,j+1) after 2-opt swap
          const newDist =
            distanceMatrix[currentTour[i - 1]][currentTour[j]] + distanceMatrix[currentTour[i]][currentTour[j + 1]]

          if (newDist < currentDist) {
            // Perform 2-opt swap: reverse the segment between i and j
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

  private generate2OptNeighbor(tour: number[]): number[] {
    const n = tour.length - 1 // Exclude duplicate depot

    // Randomly select two edges to swap
    const i = 1 + Math.floor(Math.random() * (n - 2))
    const j = i + 1 + Math.floor(Math.random() * (n - i - 1))

    // Create new tour with 2-opt swap
    const newTour = [...tour]
    for (let k = i; k <= j; k++) {
      newTour[k] = tour[j - (k - i)]
    }

    return newTour
  }

  private calculateInitialTemperature(distanceMatrix: number[]): number {
    // Calculate initial temperature based on average edge weight
    let totalDistance = 0
    let edgeCount = 0

    for (let i = 0; i < distanceMatrix.length; i++) {
      for (let j = i + 1; j < distanceMatrix.length; j++) {
        totalDistance += distanceMatrix[i][j]
        edgeCount++
      }
    }

    const avgDistance = totalDistance / edgeCount
    return avgDistance * 0.1 // Start with 10% of average distance as temperature
  }

  private calculateTourLength(tour: number[], distanceMatrix: number[]): number {
    let length = 0
    for (let i = 0; i < tour.length - 1; i++) {
      length += distanceMatrix[tour[i]][tour[i + 1]]
    }
    return length
  }

  // Additional classical algorithms can be added here

  async christofides(distanceMatrix: number[][]): Promise<RouteResult> {
    const startTime = Date.now()
    const hasTimeWindows = false; // Simplified for now
    // Simplified Christofides approximation (MST + matching heuristic)
    // For demo purposes, we'll use a greedy approximation
    const tour = await this.greedyChristofides(distanceMatrix)
    const length = this.calculateTourLength(tour, distanceMatrix)
    const runtimeMs = Date.now() - startTime

    return {
      solver: "classical",
      name: "Christofides (approx)",
      tour,
      length: Math.round(length * 100) / 100,
      feasible: true, // Assuming no time windows for this solver
      violations: { pos: 0, city: 0, timeWindow: 0 },
      runtimeMs,
      timeWindowUnsupported: true,
    }
  }

  private async greedyChristofides(distanceMatrix: number[][]): Promise<number[]> {
    const n = distanceMatrix.length

    // Step 1: Build Minimum Spanning Tree using Prim's algorithm
    const mst = this.primMST(distanceMatrix)

    // Step 2: Find vertices with odd degree in MST
    const oddDegreeVertices = this.findOddDegreeVertices(mst, n)

    // Step 3: Greedy matching of odd degree vertices (simplified)
    const matching = this.greedyMatching(oddDegreeVertices, distanceMatrix)

    // Step 4: Combine MST and matching to form Eulerian graph
    const eulerianGraph = this.combineMSTAndMatching(mst, matching, n)

    // Step 5: Find Eulerian tour and convert to Hamiltonian
    const eulerianTour = this.findEulerianTour(eulerianGraph, n)
    const hamiltonianTour = this.convertToHamiltonian(eulerianTour)

    return hamiltonianTour
  }

  private primMST(distanceMatrix: number[][]): Array<[number, number]> {
    const n = distanceMatrix.length
    const mst: Array<[number, number]> = []
    const visited = new Set([0])

    while (visited.size < n) {
      let minEdge: [number, number] = [-1, -1]
      let minWeight = Number.POSITIVE_INFINITY

      for (const u of visited) {
        for (let v = 0; v < n; v++) {
          if (!visited.has(v) && distanceMatrix[u][v] < minWeight) {
            minWeight = distanceMatrix[u][v]
            minEdge = [u, v]
          }
        }
      }

      if (minEdge[0] !== -1) {
        mst.push(minEdge)
        visited.add(minEdge[1])
      }
    }

    return mst
  }

  private findOddDegreeVertices(mst: Array<[number, number]>, n: number): number[] {
    const degree = new Array(n).fill(0)

    for (const [u, v] of mst) {
      degree[u]++
      degree[v]++
    }

    return degree.map((d, i) => (d % 2 === 1 ? i : -1)).filter((i) => i !== -1)
  }

  private greedyMatching(oddVertices: number[], distanceMatrix: number[][]): Array<[number, number]> {
    const matching: Array<[number, number]> = []
    const used = new Set<number>()

    for (let i = 0; i < oddVertices.length; i++) {
      if (used.has(oddVertices[i])) continue

      let bestMatch = -1
      let bestDistance = Number.POSITIVE_INFINITY

      for (let j = i + 1; j < oddVertices.length; j++) {
        if (used.has(oddVertices[j])) continue

        const distance = distanceMatrix[oddVertices[i]][oddVertices[j]]
        if (distance < bestDistance) {
          bestDistance = distance
          bestMatch = j
        }
      }

      if (bestMatch !== -1) {
        matching.push([oddVertices[i], oddVertices[bestMatch]])
        used.add(oddVertices[i])
        used.add(oddVertices[bestMatch])
      }
    }

    return matching
  }

  private combineMSTAndMatching(
    mst: Array<[number, number]>,
    matching: Array<[number, number]>,
    n: number,
  ): number[][] {
    const graph = Array.from({ length: n }, () => Array(n).fill(0))

    // Add MST edges
    for (const [u, v] of mst) {
      graph[u][v] = 1
      graph[v][u] = 1
    }

    // Add matching edges
    for (const [u, v] of matching) {
      graph[u][v] = 1
      graph[v][u] = 1
    }

    return graph
  }

  private findEulerianTour(graph: number[][], n: number): number[] {
    // Simplified Eulerian tour using DFS (Hierholzer's algorithm approximation)
    const tour: number[] = []
    const visited = Array.from({ length: n }, () => Array(n).fill(false))

    const dfs = (u: number) => {
      tour.push(u)
      for (let v = 0; v < n; v++) {
        if (graph[u][v] && !visited[u][v]) {
          visited[u][v] = true
          visited[v][u] = true
          dfs(v)
        }
      }
    }

    dfs(0)
    return tour
  }

  private convertToHamiltonian(eulerianTour: number[]): number[] {
    const visited = new Set<number>()
    const hamiltonianTour: number[] = []

    for (const vertex of eulerianTour) {
      if (!visited.has(vertex)) {
        hamiltonianTour.push(vertex)
        visited.add(vertex)
      }
    }

    // Ensure we return to start
    if (hamiltonianTour[hamiltonianTour.length - 1] !== 0) {
      hamiltonianTour.push(0)
    }

    return hamiltonianTour
  }
}
