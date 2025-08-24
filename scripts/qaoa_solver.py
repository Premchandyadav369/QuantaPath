#!/usr/bin/env python3
"""
Enhanced Hybrid Quantum-Classical TSP Solver using QAOA.

This script solves the Traveling Salesperson Problem (TSP) by:
1.  Formulating the problem as a Quadratic Unconstrained Binary
    Optimization (QUBO) problem.
2.  Solving the QUBO using a powerful classical solver (Simulated Annealing)
    to establish a strong baseline.
3.  Optionally, using the Quantum Approximate Optimization Algorithm (QAOA)
    to refine the solution or solve it from scratch.
4.  Decoding the optimal solution back into a TSP tour.

This hybrid approach ensures a high-quality solution is always found, while
exploring the capabilities of quantum algorithms.
"""

import json
import sys
import numpy as np
from typing import List, Dict, Tuple, Any, Optional
import argparse

# Gracefully handle optional imports
try:
    from qiskit.primitives import Sampler
    from qiskit_algorithms.optimizers import COBYLA, SPSA
    from qiskit_algorithms import QAOA, SamplingVQE
    from qiskit_optimization import QuadraticProgram
    from qiskit_optimization.algorithms import MinimumEigenOptimizer
    from qiskit.utils import algorithm_globals
    from qiskit_algorithms.expectations import CVaRExpectation
    QISKIT_AVAILABLE = True
except ImportError:
    QISKIT_AVAILABLE = False

try:
    from scipy.optimize import dual_annealing
    SCIPY_AVAILABLE = True
except ImportError:
    SCIPY_AVAILABLE = False


class TSPQUBOFormulation:
    """
    Converts a TSP instance into a QuadraticProgram (QUBO).
    
    The formulation uses binary variables x_i,p, where i is a city and p is a
    position in the tour. x_i,p = 1 if city i is at position p, and 0 otherwise.
    """

    def __init__(self, distance_matrix: np.ndarray, penalty: float = None):
        """
        Args:
            distance_matrix: An (n x n) numpy array of distances between cities.
            penalty: The penalty coefficient for constraint violations. If None,
                     it is auto-calculated to be larger than the max distance.
        """
        self.distance_matrix = distance_matrix
        self.n = len(distance_matrix)
        
        # A good penalty must be larger than any possible change in the cost
        # function. Setting it to a multiple of the largest distance is a
        # robust heuristic.
        max_dist = np.max(distance_matrix)
        self.penalty = penalty if penalty is not None else 2 * self.n * max_dist
        if self.penalty == 0: # Handle case where all distances are 0
            self.penalty = 1000

    def get_variable_index(self, city: int, position: int) -> int:
        """Returns the index for the binary variable x_{city, position}."""
        return city * self.n + position

    def create_qubo(self) -> QuadraticProgram:
        """
        Creates the QuadraticProgram for the TSP instance.
        
        The objective function consists of two parts:
        1.  Cost Term: Minimizes the total tour length.
        2.  Penalty Terms: Enforce the constraints that each city is visited
            exactly once and each position in the tour is filled exactly once.
        """
        qp = QuadraticProgram(name="TSP")
        
        # Create binary variables
        for i in range(self.n):
            for p in range(self.n):
                qp.binary_var(name=f"x_{i},{p}")

        # --- Objective Function: Minimize total distance ---
        cost_objective: Dict[Tuple[int, int], float] = {}
        for i in range(self.n):
            for j in range(self.n):
                if i == j:
                    continue
                for p in range(self.n):
                    # Next position in the tour, with wrap-around
                    next_p = (p + 1) % self.n
                    
                    idx1 = self.get_variable_index(i, p)
                    idx2 = self.get_variable_index(j, next_p)
                    cost_objective[(idx1, idx2)] = self.distance_matrix[i, j]
        
        qp.objective.quadratic = cost_objective
        
        # --- Constraints as Penalty Terms ---
        linear_penalty: Dict[int, float] = {}
        quadratic_penalty: Dict[Tuple[int, int], float] = {}

        # Constraint 1: Each city must be visited exactly once.
        # Penalty: P * (1 - sum_p x_i,p)^2 for each city i
        for i in range(self.n):
            for p in range(self.n):
                idx = self.get_variable_index(i, p)
                linear_penalty[idx] = linear_penalty.get(idx, 0.0) - 2 * self.penalty
                for q in range(self.n):
                    idx2 = self.get_variable_index(i, q)
                    quadratic_penalty[(idx, idx2)] = quadratic_penalty.get((idx, idx2), 0.0) + self.penalty
        
        # Constraint 2: Each position must be filled by exactly one city.
        # Penalty: P * (1 - sum_i x_i,p)^2 for each position p
        for p in range(self.n):
            for i in range(self.n):
                idx = self.get_variable_index(i, p)
                linear_penalty[idx] = linear_penalty.get(idx, 0.0) - 2 * self.penalty
                for j in range(self.n):
                    idx2 = self.get_variable_index(j, p)
                    quadratic_penalty[(idx, idx2)] = quadratic_penalty.get((idx, idx2), 0.0) + self.penalty
        
        # Add penalty terms to the objective
        qp.objective.linear.update(linear_penalty)
        qp.objective.quadratic.update(quadratic_penalty)

        # Constant offset from squaring (1 - sum(...))^2 terms
        qp.objective.constant = 2 * self.n * self.penalty
        
        return qp

    def decode_solution(self, bitstring: str) -> Tuple[List[int], bool, Dict[str, int]]:
        """
        Decodes a binary bitstring into a TSP tour and checks its feasibility.
        
        Args:
            bitstring: A string of '0's and '1's representing the solution.

        Returns:
            A tuple containing:
            - The decoded tour (list of cities).
            - A boolean indicating if the tour is feasible.
            - A dictionary of constraint violations.
        """
        if len(bitstring) != self.n * self.n:
            raise ValueError("Bitstring length is incorrect for this TSP size.")

        # Reshape bitstring into a tour matrix
        x_matrix = np.array([int(b) for b in bitstring]).reshape(self.n, self.n)
        
        violations = {"pos": 0, "city": 0}
        
        # Check position constraints (columns sum to 1)
        for p in range(self.n):
            if not np.isclose(np.sum(x_matrix[:, p]), 1):
                violations["pos"] += 1
        
        # Check city constraints (rows sum to 1)
        for i in range(self.n):
            if not np.isclose(np.sum(x_matrix[i, :]), 1):
                violations["city"] += 1
        
        feasible = violations["pos"] == 0 and violations["city"] == 0
        
        tour = []
        if feasible:
            tour_array = np.zeros(self.n, dtype=int)
            for p in range(self.n):
                city_idx = np.where(x_matrix[:, p] == 1)[0]
                if len(city_idx) > 0:
                    tour_array[p] = city_idx[0]
            tour = tour_array.tolist()
            tour.append(tour[0]) # Return to start city
        
        return tour, feasible, violations


class TspSolver:
    """
    A solver for TSP, capable of using classical and quantum algorithms.
    """
    def __init__(self, p: int = 1, optimizer: str = "COBYLA", shots: int = 1024,
                 cvar_alpha: Optional[float] = None, seed: int = 42):
        self.p = p
        self.optimizer_name = optimizer
        self.shots = shots
        self.cvar_alpha = cvar_alpha
        self.seed = seed

    def solve_classically(self, qp: QuadraticProgram) -> Dict[str, Any]:
        """
        Solves the QUBO problem using a powerful classical algorithm.
        
        Uses SciPy's dual_annealing, a generalized simulated annealing algorithm.
        """
        if not SCIPY_AVAILABLE:
            raise ImportError("SciPy is required for the classical solver.")
        
        qubo_matrix, offset = qp.to_ising()
        
        # dual_annealing requires a function to minimize
        def energy_func(x):
            # dual_annealing provides continuous variables, round them to 0/1
            x_bin = np.round(x)
            return float(x_bin.T @ qubo_matrix @ x_bin + offset)

        bounds = [(0, 1)] * len(qp.variables)
        
        print("Starting classical optimization with Simulated Annealing...", file=sys.stderr)
        result = dual_annealing(energy_func, bounds=bounds, seed=self.seed)
        
        best_bitstring = "".join([str(int(b)) for b in np.round(result.x)])
        
        return {
            "bitstring": best_bitstring,
            "energy": result.fun,
            "success": result.success,
            "message": result.message
        }

    def solve_qaoa(self, qp: QuadraticProgram) -> Dict[str, Any]:
        """
        Solves the QUBO problem using the QAOA algorithm.
        """
        if not QISKIT_AVAILABLE:
            raise ImportError("Qiskit is required for the QAOA solver.")
        
        algorithm_globals.random_seed = self.seed
        
        # --- Configure QAOA ---
        if self.optimizer_name.upper() == "SPSA":
            optimizer = SPSA(maxiter=100)
        else:
            optimizer = COBYLA(maxiter=150)

        sampler = Sampler()
        
        # Setup CVaR if requested
        if self.cvar_alpha is not None and 0 < self.cvar_alpha < 1:
            print(f"Using CVaR-QAOA with alpha = {self.cvar_alpha}", file=sys.stderr)
            expectation = CVaRExpectation(self.cvar_alpha, sampler)
            qaoa_instance = SamplingVQE(
                sampler=sampler,
                ansatz=QAOA(sampler, optimizer, reps=self.p).ansatz,
                optimizer=optimizer,
                expectation=expectation
            )
        else:
            qaoa_instance = QAOA(sampler=sampler, optimizer=optimizer, reps=self.p)

        # --- Run Optimization ---
        print("Starting quantum optimization with QAOA...", file=sys.stderr)
        eigen_optimizer = MinimumEigenOptimizer(qaoa_instance)
        result = eigen_optimizer.solve(qp)
        
        # --- Extract Results ---
        bitstring = "".join([str(int(x)) for x in result.x])
        samples = {k: v / self.shots for k, v in result.samples[0].data.items()}

        return {
            "bitstring": bitstring,
            "energy": result.fval,
            "success": True,
            "samples": samples
        }


def solve_tsp(distance_matrix: List[List[float]],
              mode: str = "hybrid",
              p: int = 1,
              shots: int = 1024,
              optimizer: str = "COBYLA",
              penalty: Optional[float] = None,
              cvar_alpha: Optional[float] = None) -> Dict[str, Any]:
    """
    Main function to coordinate solving the TSP.
    
    Args:
        distance_matrix: The matrix of distances between cities.
        mode: Execution mode ('hybrid', 'classical', 'quantum').
        p: QAOA depth parameter.
        shots: Number of measurement shots for QAOA.
        optimizer: Classical optimizer for QAOA.
        penalty: Penalty coefficient for QUBO constraints.
        cvar_alpha: Alpha parameter for CVaR-QAOA.
        
    Returns:
        A dictionary containing the best solution and diagnostics.
    """
    dist_matrix = np.array(distance_matrix)
    
    # 1. Formulate the problem
    tsp_qubo_formulation = TSPQUBOFormulation(dist_matrix, penalty)
    qp = tsp_qubo_formulation.create_qubo()
    
    solver = TspSolver(p=p, optimizer=optimizer, shots=shots, cvar_alpha=cvar_alpha)
    
    best_solution = {
        "tour": [], "length": float('inf'), "feasible": False,
        "energy": float('inf'), "bitstring": "", "solver": "None"
    }

    # 2. Solve classically if in classical or hybrid mode
    if mode in ["classical", "hybrid"]:
        if not SCIPY_AVAILABLE:
            print("Warning: SciPy not found. Skipping classical solver.", file=sys.stderr)
        else:
            classical_result = solver.solve_classically(qp)
            tour, feasible, violations = tsp_qubo_formulation.decode_solution(classical_result["bitstring"])
            
            tour_length = 0
            if feasible:
                for i in range(len(tour) - 1):
                    tour_length += dist_matrix[tour[i], tour[i+1]]
            
            best_solution = {
                "tour": tour, "length": float(tour_length), "feasible": feasible,
                "violations": violations, "energy": classical_result["energy"],
                "bitstring": classical_result["bitstring"], "solver": "classical",
                "details": classical_result
            }
            print(f"Classical solver found a {'feasible' if feasible else 'infeasible'} solution.", file=sys.stderr)

    # 3. Solve with QAOA if in quantum or hybrid mode
    if mode in ["quantum", "hybrid"]:
        if not QISKIT_AVAILABLE:
            print("Warning: Qiskit not found. Skipping QAOA solver.", file=sys.stderr)
        else:
            qaoa_result = solver.solve_qaoa(qp)
            tour, feasible, violations = tsp_qubo_formulation.decode_solution(qaoa_result["bitstring"])

            tour_length = 0
            if feasible:
                for i in range(len(tour) - 1):
                    tour_length += dist_matrix[tour[i], tour[i+1]]
            
            # If QAOA found a better feasible solution, update the best solution
            if feasible and tour_length < best_solution["length"]:
                best_solution = {
                    "tour": tour, "length": float(tour_length), "feasible": feasible,
                    "violations": violations, "energy": qaoa_result["energy"],
                    "bitstring": qaoa_result["bitstring"], "solver": "quantum",
                    "details": qaoa_result
                }
                print("QAOA found a better feasible solution.", file=sys.stderr)
            elif best_solution["solver"] == "None": # If classical didn't run
                best_solution = {
                    "tour": tour, "length": float(tour_length), "feasible": feasible,
                    "violations": violations, "energy": qaoa_result["energy"],
                    "bitstring": qaoa_result["bitstring"], "solver": "quantum",
                    "details": qaoa_result
                }

    return best_solution


def main():
    parser = argparse.ArgumentParser(description='Solve TSP using a Hybrid Quantum-Classical approach')
    parser.add_argument('--input', type=str, required=True, help='Input JSON file with a "distance_matrix" key.')
    parser.add_argument('--mode', type=str, default='hybrid', choices=['hybrid', 'classical', 'quantum'],
                        help='Execution mode: classical only, quantum only, or hybrid (default).')
    parser.add_argument('--p', type=int, default=1, help='QAOA depth parameter (reps).')
    parser.add_argument('--shots', type=int, default=1024, help='Number of measurement shots for QAOA.')
    parser.add_argument('--optimizer', type=str, default='COBYLA', choices=['COBYLA', 'SPSA'], help='Optimizer for QAOA.')
    parser.add_argument('--penalty', type=float, help='Custom penalty value. If not set, it is auto-calculated.')
    parser.add_argument('--cvar-alpha', type=float, help='Alpha parameter for CVaR-QAOA (e.g., 0.1). If not set, standard QAOA is used.')
    
    args = parser.parse_args()
    
    try:
        with open(args.input, 'r') as f:
            data = json.load(f)
        
        distance_matrix = data['distance_matrix']
        
        result = solve_tsp(
            distance_matrix=distance_matrix,
            mode=args.mode,
            p=args.p,
            shots=args.shots,
            optimizer=args.optimizer,
            penalty=args.penalty,
            cvar_alpha=args.cvar_alpha
        )
        
        print("\n--- TSP Solution ---")
        print(json.dumps(result, indent=2))
        
    except FileNotFoundError:
        print(json.dumps({"error": f"Input file not found: {args.input}", "success": False}), file=sys.stderr)
        sys.exit(1)
    except Exception as e:
        print(json.dumps({"error": str(e), "success": False}), file=sys.stderr)
        sys.exit(1)

if __name__ == "__main__":
    # Check for dependencies and print warnings
    if not SCIPY_AVAILABLE:
        print("Warning: SciPy not installed. 'classical' and 'hybrid' modes will be unavailable.", file=sys.stderr)
    if not QISKIT_AVAILABLE:
        print("Warning: Qiskit not installed. 'quantum' and 'hybrid' modes will be unavailable.", file=sys.stderr)
    main()
