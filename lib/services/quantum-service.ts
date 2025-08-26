import type { RouteResult, OptimizationRequest } from "@/lib/types";

// The URL for the Python backend. Defaults to localhost for development.
// In a real production environment, this would point to the deployed API.
const BACKEND_URL = process.env.NEXT_PUBLIC_QUANTUM_BACKEND_URL || "http://localhost:5001";

export class QuantumService {
  private static instance: QuantumService;

  static getInstance(): QuantumService {
    if (!QuantumService.instance) {
      QuantumService.instance = new QuantumService();
    }
    return QuantumService.instance;
  }

  /**
   * Solves the TSP by calling a remote Python backend that runs Qiskit's QAOA.
   *
   * @param distanceMatrix The matrix of distances between cities.
   * @param params The quantum-specific parameters from the UI.
   * @returns A promise that resolves to a RouteResult object.
   */
  async solveQAOA(distanceMatrix: number[][], params: OptimizationRequest["quantum"]): Promise<RouteResult> {
    const startTime = Date.now();
    console.log("Calling Python backend for QAOA solution...");

    try {
      const response = await fetch(`${BACKEND_URL}/api/solve-qaoa`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          distance_matrix: distanceMatrix,
          // Future enhancement: Pass parameters to the backend
          // p: params.p,
          // shots: params.shots,
          // optimizer: params.optimizer,
        }),
      });

      if (!response.ok) {
        const errorBody = await response.json().catch(() => ({ error: "Failed to parse error response" }));
        console.error("Backend error:", errorBody);
        throw new Error(`Backend returned an error: ${response.status} ${response.statusText}. Details: ${errorBody.details || errorBody.error}`);
      }

      const result = await response.json();
      const runtimeMs = Date.now() - startTime;

      // The backend returns the core solution. We wrap it in the RouteResult
      // structure that the frontend UI expects.
      return {
        solver: "quantum",
        name: `Qiskit QAOA (p=${params.p})`, // Identify the source as the real Qiskit backend
        tour: result.tour,
        length: Math.round(result.length * 100) / 100,
        feasible: result.feasible,
        violations: result.violations || { pos: 0, city: 0 },
        runtimeMs,
        parameters: {
          p: params.p,
          shots: params.shots,
          optimizer: params.optimizer,
          backend: result.details?.backend || "Qiskit Aer Simulator", // Extract backend from result if available
          warmStarts: 0, // Not applicable in the same way as the simulation
          cvarAlpha: result.details?.cvar_alpha,
          constraintPreserving: false,
        },
      };
    } catch (error) {
      console.error("Failed to fetch QAOA solution from backend:", error);
      // Return a structured error that the UI can display
      return {
        solver: "quantum",
        name: "Qiskit QAOA",
        tour: [],
        length: Number.POSITIVE_INFINITY,
        feasible: false,
        violations: { pos: 1, city: 1 }, // Indicate a failure
        runtimeMs: Date.now() - startTime,
        error: error instanceof Error ? error.message : "An unknown error occurred.",
        parameters: params,
      };
    }
  }
}
