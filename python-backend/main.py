import sys
import os
import site

# Print diagnostic information
print("--- Python Environment Diagnostics ---", file=sys.stderr)
print(f"Python Executable: {sys.executable}", file=sys.stderr)
print("sys.path:", file=sys.stderr)
for p in sys.path:
    print(f"  - {p}", file=sys.stderr)
print(f"User site packages: {site.getusersitepackages()}", file=sys.stderr)
print("--- End Diagnostics ---", file=sys.stderr)


# Add the parent directory to the path so we can import the solver
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

try:
    from scripts.qaoa_solver import solve_tsp, QISKIT_AVAILABLE, SCIPY_AVAILABLE
except ImportError as e:
    # This will help diagnose issues if the script can't be found
    raise ImportError(f"Could not import solve_tsp. Path issues? Error: {e}")
except NameError as e:
    # This might happen if Qiskit is not installed correctly
    raise NameError(f"A name was not defined, likely due to a missing import. Is Qiskit installed? Error: {e}")


from flask import Flask, request, jsonify
from flask_cors import CORS


app = Flask(__name__)
CORS(app)  # Allow all origins by default

@app.route('/api/solve-qaoa', methods=['POST'])
def solve_qaoa_endpoint():
    """
    API endpoint to solve the TSP using the QAOA quantum algorithm.
    Expects a JSON payload with a 'distance_matrix' key.
    """
    if not request.is_json:
        return jsonify({"error": "Request must be JSON"}), 400

    data = request.get_json()
    distance_matrix = data.get('distance_matrix')

    if not distance_matrix:
        return jsonify({"error": "Missing 'distance_matrix' in request body"}), 400

    if not QISKIT_AVAILABLE:
        return jsonify({"error": "Qiskit is not installed or not found in the Python path on the server, cannot run QAOA."}), 500

    try:
        # We call the solver in 'quantum' mode.
        solution = solve_tsp(
            distance_matrix=distance_matrix,
            mode='quantum' # Force quantum mode for this endpoint
        )
        return jsonify(solution)
    except Exception as e:
        app.logger.error(f"An error occurred during QAOA solving: {e}")
        return jsonify({"error": "An internal error occurred.", "details": str(e)}), 500

@app.route('/health', methods=['GET'])
def health_check():
    """A simple health check endpoint."""
    return jsonify({
        "status": "ok",
        "qiskit_available": QISKIT_AVAILABLE,
        "scipy_available": SCIPY_AVAILABLE
    })

if __name__ == '__main__':
    # Running with debug=True is fine for a hackathon development environment
    app.run(host='0.0.0.0', port=5001, debug=True)
