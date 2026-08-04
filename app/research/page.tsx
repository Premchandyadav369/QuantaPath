"use client"

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Route, BookOpen, GitBranch, ArrowLeft } from "lucide-react"
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
              <span className="text-xl font-bold">QuantaPath Research</span>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto space-y-6">
          <Badge variant="secondary" className="mb-2">
            <BookOpen className="w-4 h-4 mr-1" />
            Original Research
          </Badge>
          <h1 className="text-4xl sm:text-5xl font-bold leading-tight">
            DARA: Dynamic Adaptive Resilience Analysis for Critical Node Identification in Large-Scale Transportation Networks
          </h1>
          <div className="text-muted-foreground space-y-2 border-l-4 border-accent pl-4">
            <p className="font-semibold">Suresh Dara*, V C Premchand Yadav†</p>
            <p className="text-sm">*School of Computer Science and Engineering (SCOPE), VIT-AP University, Amaravati, India</p>
            <p className="text-sm">†School of Computer Science and Engineering (SCOPE), VIT-AP University, Amaravati, India</p>
          </div>
        </div>
      </section>

      <section className="px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto space-y-12">
          {/* Abstract */}
          <Card className="bg-card/50 backdrop-blur-md border-border/50 shadow-xl">
            <CardHeader>
              <CardTitle>Abstract</CardTitle>
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
             <h3 className="text-xl font-bold text-accent">Conclusion</h3>
             <p className="text-muted-foreground max-w-2xl mx-auto">
               DARA improves Spearman rank correlation with self-supervised ground truth by 36.3–53.4% over the strongest of ten classical baselines across three large road networks. It is domain-agnostic and its ranking is actionable for infrastructure triage.
             </p>
          </div>
        </div>
      </section>
    </div>
  )
}
