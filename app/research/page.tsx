"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Route, BookOpen, GitBranch, ArrowLeft, Layers, Workflow, Zap } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"

export default function ResearchPage() {
  return (
    <div className="min-h-screen bg-background text-foreground pb-20">
      {/* Navigation */}
      <nav className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center h-16 gap-4">
            <Link href="/">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="w-5 h-5" />
              </Button>
            </Link>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-accent rounded-lg flex items-center justify-center">
                <Route className="w-5 h-5 text-accent-foreground" />
              </div>
              <span className="text-xl font-bold">QuantaPath Platform & Research</span>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto space-y-6">
          <Badge variant="secondary" className="mb-2">
            <BookOpen className="w-4 h-4 mr-1" />
            System Architecture & Original Research
          </Badge>
          <h1 className="text-4xl sm:text-5xl font-bold leading-tight">
            QuantaPath: The Quantum-Inspired Logistics Command Center
          </h1>
          <div className="text-muted-foreground space-y-2 border-l-4 border-accent pl-4">
             <p className="font-semibold text-foreground">Powered by DARA (Dynamic Adaptive Resilience Analysis)</p>
            <p className="font-semibold">Suresh Dara*, V C Premchand Yadav†</p>
            <p className="text-sm">*School of Computer Science and Engineering (SCOPE), VIT-AP University, Amaravati, India</p>
            <p className="text-sm">†School of Computer Science and Engineering (SCOPE), VIT-AP University, Amaravati, India</p>
          </div>
        </div>
      </section>

      <section className="px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto space-y-16">

          {/* System Architecture */}
          <div className="space-y-6">
             <h2 className="text-3xl font-bold flex items-center gap-2 border-b border-border/50 pb-2">
              <Layers className="text-accent w-8 h-8" />
              System Architecture
            </h2>
            <div className="prose prose-invert max-w-none text-muted-foreground">
               <p>QuantaPath is built as a highly responsive, modern <strong>Next.js App Router</strong> application. The frontend acts as a unified &quot;AppShell,&quot; discarding traditional fragmented multi-page designs in favor of a <strong>Map-Centric Command Center</strong>. This design ethos treats the interactive map (powered by <code className="bg-muted px-1 rounded">@vis.gl/react-google-maps</code>) as the hero component, overlaying all tools, inspectors, and analytics as glassmorphic floating widgets.</p>
               <p>Key architectural choices include:</p>
               <ul>
                   <li><strong>State Management:</strong> Complex route geometries, algorithmic parameters, and UI states (Heatmaps, Weather Overlays, Split-Screen modes) are managed via a unified React state layer, ensuring instant visual feedback without page reloads.</li>
                   <li><strong>API Layer:</strong> Serverless Next.js API routes (`/api/optimize`, `/api/directions`) act as the backend logic, interfacing with distance matrix services (OpenRouteService/Google) and the core optimization algorithms.</li>
                   <li><strong>Visualizations:</strong> Custom React components drive <strong>Animated Vehicle Playback</strong> using SVG math on the map canvas, while high-performance <code className="bg-muted px-1 rounded">recharts</code> provide real-time convergence and performance analytics in floating panels.</li>
               </ul>
            </div>
          </div>

          {/* Workflow */}
          <div className="space-y-6">
             <h2 className="text-3xl font-bold flex items-center gap-2 border-b border-border/50 pb-2">
              <Workflow className="text-accent w-8 h-8" />
              Optimization Workflow
            </h2>
            <div className="prose prose-invert max-w-none text-muted-foreground">
               <p>The QuantaPath workflow is designed for immediate, actionable logistics planning:</p>
               <ol>
                   <li><strong>Ingestion:</strong> Users add Depots (Hubs) and Delivery Stops via the interactive map (click or right-click context menu) or search bar.</li>
                   <li><strong>Matrix Generation:</strong> Upon triggering optimization, the backend builds a comprehensive Distance/Time matrix calculating the real-world travel costs between all nodes.</li>
                   <li><strong>Algorithmic Execution:</strong> The system simultaneously executes multiple routing algorithms. This includes classical baselines (Simulated Annealing, Nearest Neighbor) alongside our proprietary quantum-inspired models (DARA and HAWS-QAOA).</li>
                   <li><strong>Interactive Analysis:</strong> Results are streamed to the frontend where users can toggle a <strong>Split-Screen Comparison</strong>, overlay <strong>Heatmaps</strong> or <strong>Carbon Footprint</strong> estimators, and simulate the route using the <strong>Time Slider</strong>.</li>
               </ol>
            </div>
          </div>

          {/* DARA Abstract */}
          <div className="space-y-6">
            <h2 className="text-3xl font-bold flex items-center gap-2 border-b border-border/50 pb-2">
               <Zap className="text-accent w-8 h-8" />
               Under the Hood: DARA Algorithm
            </h2>
            <Card className="bg-card/50 backdrop-blur-md border-border/50 shadow-xl">
              <CardHeader>
                <CardTitle>Research Abstract</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-muted-foreground leading-relaxed">
                <p>
                  Road networks are critical infrastructure, yet the algorithms most widely used to rank junction criticality — degree, betweenness, closeness, PageRank, eigenvector and kcore centrality — are damage-agnostic, fixed-form, and blind to higher-order spectral effects.
                </p>
                <p>
                  We introduce <strong>DARA (Dynamic Adaptive Resilience Analysis)</strong>, a self-supervised, graphconditioned Mixture-of-Experts (MoE) framework that fuses classical centralities, quantum-walk-inspired spectral descriptors, and purpose-built structural resilience features into a single learned criticality score.
                </p>
                <p>
                  DARA supervises itself through Monte Carlo node-removal damage simulation and is trained with a composite objective blending a differentiable pairwise ranking surrogate with an exact validation criterion (Spearman, NDCG@10, top-K overlap, cross-dataset transfer).
                </p>
                <p>
                  On three SNAP road networks — roadNet-CA (1.96M nodes), roadNet-TX (1.35M nodes), and roadNet-PA (1.09M nodes) — DARA improves Spearman rank correlation with ground-truth structural damage by 45.2%, 36.3%, and 53.4% over the strongest classical baseline (PageRank), with Friedman statistics exceeding 1,700 (p &lt; 10−6) on every dataset. Cross-dataset transfer averages Spearman ρ = 0.444 zero-shot, and ablations show the learned fusion mechanism — not any single feature group — drives the majority of the gain.
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Key Contributions */}
          <div className="space-y-6">
            <h2 className="text-3xl font-bold flex items-center gap-2">
              <GitBranch className="text-accent w-8 h-8" />
              Key Contributions
            </h2>
            <div className="grid sm:grid-cols-2 gap-4">
              <Card className="bg-card/30">
                <CardHeader>
                  <CardTitle className="text-lg">Self-Supervised Damage Labeling</CardTitle>
                </CardHeader>
                <CardContent className="text-sm text-muted-foreground">
                  A procedure from Monte Carlo node-removal simulation, requiring no manual annotation.
                </CardContent>
              </Card>
              <Card className="bg-card/30">
                <CardHeader>
                  <CardTitle className="text-lg">Quantum-Inspired Features</CardTitle>
                </CardHeader>
                <CardContent className="text-sm text-muted-foreground">
                  A feature bank of descriptors from a truncated Laplacian eigen-decomposition, scaling to million-node graphs.
                </CardContent>
              </Card>
              <Card className="bg-card/30">
                <CardHeader>
                  <CardTitle className="text-lg">Graph-Conditioned Adaptive Fusion</CardTitle>
                </CardHeader>
                <CardContent className="text-sm text-muted-foreground">
                  A Mixture-of-Experts fusion network that replaces a fixed coefficient formula with a hypernetwork producing per-graph expert gates.
                </CardContent>
              </Card>
              <Card className="bg-card/30">
                <CardHeader>
                  <CardTitle className="text-lg">Composite Objective Training</CardTitle>
                </CardHeader>
                <CardContent className="text-sm text-muted-foreground">
                  Combining a differentiable ranking surrogate with an exact multicriterion validation score.
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Methodology: Quantum-Inspired Features */}
          <div className="space-y-6">
            <h2 className="text-3xl font-bold">Quantum-Inspired Features</h2>
            <div className="prose prose-invert max-w-none text-muted-foreground">
              <p>
                The continuous-time quantum walk generated by the symmetric normalized Laplacian <code className="bg-muted px-1 rounded">L_sym</code> is the unitary propagator <code className="bg-muted px-1 rounded">U(t) = exp(−i L_sym t)</code>.
              </p>
              <p>
                Because <code className="bg-muted px-1 rounded">|exp(-i \lambda_k t)| = 1</code>, the quantum transport efficiency reduces to the average squared eigenvector loading of a node over the K retained modes. From the row-normalized mode weights, we compute quantum entropy and inverse participation ratio (localization). Low entropy marks nodes whose spectral support concentrates in few eigenmodes — a signature of structurally isolated bottlenecks.
              </p>
              <p>
                These quantum features capture a qualitatively different failure mode than degree or betweenness: a node can have low local degree yet sit at the interference point of several low-frequency spectral modes, making it disproportionately important to global connectivity.
              </p>
            </div>
          </div>

          {/* Results Table */}
          <div className="space-y-6">
            <h2 className="text-3xl font-bold">Empirical Results</h2>
            <Card className="overflow-hidden border-border/50 bg-card/50">
               <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="bg-muted/50 text-foreground">
                    <tr>
                      <th className="p-4 font-semibold">Dataset</th>
                      <th className="p-4 font-semibold">DARA ρS</th>
                      <th className="p-4 font-semibold">Best Baseline</th>
                      <th className="p-4 font-semibold text-accent">Improvement</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/50">
                    <tr className="hover:bg-muted/20">
                      <td className="p-4 font-medium">roadNet-CA (1.96M nodes)</td>
                      <td className="p-4 text-emerald-400 font-bold">0.401</td>
                      <td className="p-4 text-muted-foreground">0.276 (PageRank)</td>
                      <td className="p-4 text-accent font-semibold">+45.2%</td>
                    </tr>
                    <tr className="hover:bg-muted/20">
                      <td className="p-4 font-medium">roadNet-TX (1.35M nodes)</td>
                      <td className="p-4 text-emerald-400 font-bold">0.475</td>
                      <td className="p-4 text-muted-foreground">0.349 (PageRank)</td>
                      <td className="p-4 text-accent font-semibold">+36.3%</td>
                    </tr>
                    <tr className="hover:bg-muted/20">
                      <td className="p-4 font-medium">roadNet-PA (1.09M nodes)</td>
                      <td className="p-4 text-emerald-400 font-bold">0.510</td>
                      <td className="p-4 text-muted-foreground">0.332 (PageRank)</td>
                      <td className="p-4 text-accent font-semibold">+53.4%</td>
                    </tr>
                  </tbody>
                </table>
               </div>
            </Card>
          </div>

          <div className="bg-accent/10 border border-accent/20 rounded-xl p-6 text-center space-y-4">
             <h3 className="text-xl font-bold text-accent">Practical Impact & Use Cases</h3>
             <p className="text-muted-foreground max-w-2xl mx-auto">
               By combining a robust, interactive frontend architecture with the unparalleled ranking logic of the DARA algorithm, QuantaPath offers massive improvements for real-world scenarios: <strong>Disaster Response</strong> (identifying critical failure nodes instantly), <strong>Supply Chain Throughput</strong> (rerouting around structural bottlenecks), and <strong>Fleet Optimization</strong> (reducing carbon footprints by avoiding path-length increases).
             </p>
          </div>
        </div>
      </section>
    </div>
  )
}
