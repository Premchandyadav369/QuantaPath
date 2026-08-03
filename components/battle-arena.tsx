"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Trophy, Timer, Zap, Route } from "lucide-react"

const ALGORITHMS = [
  { id: 1, name: "HAWS-QAOA", score: 98, time: "1.2s", distance: "45km", color: "bg-accent" },
  { id: 2, name: "Simulated Annealing", score: 85, time: "2.5s", distance: "48km", color: "bg-blue-500" },
  { id: 3, name: "Tabu Search", score: 82, time: "3.1s", distance: "49km", color: "bg-purple-500" },
  { id: 4, name: "Genetic Algorithm", score: 80, time: "4.0s", distance: "51km", color: "bg-green-500" },
  { id: 5, name: "Ant Colony", score: 75, time: "5.2s", distance: "55km", color: "bg-orange-500" },
  { id: 6, name: "Nearest Neighbor", score: 60, time: "0.1s", distance: "65km", color: "bg-slate-500" },
]

export function BattleArena() {
  const [leaderboard, setLeaderboard] = useState(ALGORITHMS)

  // Simulate live updates
  useEffect(() => {
    const interval = setInterval(() => {
      setLeaderboard(prev => {
        const newBoard = [...prev].map(algo => ({
          ...algo,
          score: Math.min(100, Math.max(0, algo.score + (Math.random() * 4 - 2))) // slight score fluctuation
        }))
        return newBoard.sort((a, b) => b.score - a.score)
      })
    }, 3000)
    return () => clearInterval(interval)
  }, [])

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Trophy className="w-6 h-6 text-yellow-500" />
          Algorithm Battle Arena
        </CardTitle>
        <CardDescription>Live comparison of optimization algorithms</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">

        {leaderboard.map((algo, index) => (
          <motion.div
            key={algo.id}
            layout
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 20 }}
            className="flex items-center gap-4 p-4 rounded-lg border bg-card relative overflow-hidden"
          >
            {/* Background progress bar */}
            <div
              className={`absolute left-0 top-0 bottom-0 opacity-10 ${algo.color}`}
              style={{ width: `${algo.score}%` }}
            />

            <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center font-bold text-muted-foreground shrink-0 z-10">
              {index + 1}
            </div>

            <div className="flex-1 z-10">
              <h4 className="font-semibold">{algo.name}</h4>
              <div className="flex gap-4 text-sm text-muted-foreground mt-1">
                <span className="flex items-center gap-1"><Zap className="w-3 h-3" /> Score: {algo.score.toFixed(1)}</span>
                <span className="flex items-center gap-1"><Timer className="w-3 h-3" /> {algo.time}</span>
                <span className="flex items-center gap-1"><Route className="w-3 h-3" /> {algo.distance}</span>
              </div>
            </div>

            <div className="text-right z-10 hidden sm:block">
              <div className={`text-xs px-2 py-1 rounded-full ${algo.color} text-white`}>
                {index === 0 ? 'Optimal' : index < 3 ? 'Competitive' : 'Sub-optimal'}
              </div>
            </div>
          </motion.div>
        ))}

      </CardContent>
    </Card>
  )
}
