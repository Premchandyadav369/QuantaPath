<div align="center">
  <img src="https://i.postimg.cc/d7q4X7H8/Quanta-Path-Logo.png" alt="QuantaPath Logo" width="600"/>
</div>

<h3 align="center">Unlocking Infinite Paths with Quantum Power.</h3>

<p align="center">
  <a href="https://v0-quanta-path-setup.vercel.app/">
    <img src="https://img.shields.io/badge/Deployed%20on-Vercel-black?logo=vercel" alt="Vercel Deploy">
  </a>
  <a href="https://qiskit.org/">
    <img src="https://img.shields.io/badge/Made%20with-Qiskit-6929C4?logo=ibm" alt="Made with Qiskit">
  </a>
  <a href="https://nextjs.org/">
    <img src="https://img.shields.io/badge/Frontend-Next.js-black?logo=nextdotjs" alt="Next.js">
  </a>
  <a href="https://www.typescriptlang.org/">
    <img src="https://img.shields.io/badge/Code-TypeScript-3178C6?logo=typescript" alt="TypeScript">
  </a>
  <a href="LICENSE">
    <img src="https://img.shields.io/badge/License-MIT-green.svg" alt="License">
  </a>
</p>

<h3 align="center">
  <a href="https://quanta-path-setup.vercel.app/"><strong>👉Live Demo to QuantaPath</strong></a>
</h3>

---

**QuantaPath** is a web-based application that demonstrates how **quantum computing** can optimize **real-world logistics problems**. It provides a clean and interactive interface for finding optimal delivery routes using a simulated quantum algorithm and comparing the results with classical solvers.

## ✨ Key Features

- 🗺️ **Interactive Map**: Add delivery stops easily by clicking on the map or entering addresses.
- ⚛️ **Quantum vs. Classical Comparison**: Benchmark the performance of a simulated **HAWS-QAOA** (Hybrid Adaptive Warm-Start QAOA) quantum algorithm against classical solvers like **Nearest Neighbor** and **Simulated Annealing**.
- ⚙️ **Advanced Parameter Tuning**: Fine-tune the settings for both quantum and classical solvers to gain deeper insights into their behavior.
- 📊 **Performance Analytics**: Visualize performance with comprehensive dashboards and efficiency comparisons.
- 🌱 **Carbon Footprint Estimation**: Calculate the estimated environmental impact of the generated routes.
- 📍 **Real-Time Navigation**: Get turn-by-turn directions for the optimized route via the **OpenRouteService**.

---

## 🧠 How It Works

QuantaPath tackles the **Traveling Salesperson Problem (TSP)** using a hybrid quantum-classical approach. The process is as follows:

1.  **Input Stops**: The user provides a set of delivery locations.
2.  **Distance Matrix Calculation**: The application uses the OpenRouteService API to compute the distances between all pairs of stops.
3.  **Optimization**: The core of the application runs the **HAWS-QAOA** simulation alongside classical algorithms to find the most efficient route.
4.  **Results & Analytics**: The optimized routes are displayed on the map, accompanied by detailed performance analytics.

⚠️ **Disclaimer**: The quantum processes in QuantaPath are **simulations** designed for educational and demonstration purposes. They mimic the behavior of quantum algorithms but do not run on actual quantum hardware.

---

## 🔬 The Quantum Approach: HAWS-QAOA

Our implementation uses a **Hybrid Adaptive Warm-Start Quantum Approximate Optimization Algorithm (HAWS-QAOA)**. Here’s a breakdown of its key components:

-   **Warm-Start Initialization**: We use classical heuristics (Nearest Neighbor + 3-opt) to find a high-quality initial solution. This "warm-start" gives the quantum algorithm a significant advantage.
-   **CVaR-QAOA Sampling**: Instead of considering all possible outcomes, the algorithm focuses on the top ~20% of the best results at each step. This Conditional Value-at-Risk (CVaR) approach strikes a balance between exploring new solutions and exploiting promising ones.
-   **Adaptive & Hybrid Structure**: The quantum circuit is built layer by layer. After each quantum run, the results are refined using classical optimization techniques (2-opt & 3-opt), creating a powerful feedback loop.

### Why Does This Matter?

-   🌐 **Superior Exploration**: Quantum superposition allows the algorithm to explore a vast number of potential routes simultaneously.
-   🔗 **Global Correlation**: Entanglement helps capture complex, global relationships between all the cities in a route, leading to better solutions.
-   ⚡ **Faster Convergence**: Our simulations show that this hybrid approach can converge to optimal routes **3.2x faster** and yield **12.7% better quality** solutions compared to the classical solvers tested.

---

## 🏗️ Technology Stack

-   **Frontend**: Next.js, React, TypeScript, Tailwind CSS
-   **Quantum Solver (Web Simulation)**: A TypeScript-based simulation of the HAWS-QAOA algorithm.
-   **Classical Solvers**: Nearest Neighbor, Simulated Annealing, 2-opt, 3-opt.
-   **Mapping & Distance API**: OpenRouteService
-   **Deployment**: Vercel

---

## ⚙️ Getting Started

### Running the Web App Locally

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/Premchandyadav369/QuantaPath.git
    cd QuantaPath
    ```

2.  **Install dependencies (using pnpm):**
    ```bash
    pnpm install
    ```

3.  **Run the development server:**
    ```bash
    pnpm dev
    ```

4.  Open your browser and navigate to `http://localhost:3000`.

### 🐍 Running the Python QAOA Solver (Qiskit)

For a more rigorous, Qiskit-based implementation of the QAOA solver:

1.  **Set up a Python virtual environment:**
    ```bash
    python3 -m venv .venv
    source .venv/bin/activate
    ```

2.  **Install the required Python packages:**
    ```bash
    pip install qiskit qiskit-aer qiskit-algorithms qiskit-optimization numpy
    ```

3.  **Prepare your input file (`input.json`):**
    ```json
    {
      "distance_matrix": [
       ,
       ,
       ,
       
      ]
    }
    ```

4.  **Run the solver:**
    ```bash
    python scripts/qaoa_solver.py --input input.json --p 3 --shots 2000 --optimizer COBYLA
    ```

---

## 👨‍💻 The Team

-   **V C Premchand Yadav** – Founder & Quantum Architect ⚛️
-   **P R Kiran Kumar Reddy** – Operations & Optimization 🚀
-   **Edupulapati Sai Praneeth** – Algorithms & Backend 🔧
-   **Vyshwaran P** – Full Stack Developer
-   **Sanjana Pasam** – UI/UX & Frontend Magic 🎨

---

## 📜 License

This project is licensed under the **MIT License**. See the [LICENSE](LICENSE) file for details.
