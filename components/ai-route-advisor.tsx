"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Sparkles, Route, Truck, Leaf, ShieldCheck, Loader2 } from "lucide-react"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"

interface AIRouteAdvisorProps {
  routeData: any; // the specific RouteResult data
}

export function AIRouteAdvisor({ routeData }: AIRouteAdvisorProps) {
  const [explanation, setExplanation] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const generateExplanation = async () => {
    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch("/api/ai-advisor", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ routeData })
      })

      if (!response.ok) {
        throw new Error("Failed to fetch explanation from AI Advisor.")
      }

      const data = await response.json()
      setExplanation(data.explanation)
    } catch (err: any) {
      console.error(err)
      setError(err.message || "An error occurred while generating explanation.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card className="mt-4 border-primary/20 bg-primary/5">
      <CardHeader className="pb-2">
        <CardTitle className="text-md flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-primary" />
          AI Route Advisor
        </CardTitle>
        <CardDescription>Understand why the quantum solver chose this specific route.</CardDescription>
      </CardHeader>
      <CardContent>
        {!explanation && !isLoading && !error && (
          <Button onClick={generateExplanation} variant="outline" size="sm" className="w-full">
            <Sparkles className="w-4 h-4 mr-2 text-primary" />
            Explain Route Choice
          </Button>
        )}

        {isLoading && (
          <div className="flex items-center justify-center p-4">
            <Loader2 className="w-6 h-6 text-primary animate-spin" />
            <span className="ml-2 text-sm text-muted-foreground">AI is analyzing the route...</span>
          </div>
        )}

        {error && (
          <div className="text-sm text-destructive p-2 bg-destructive/10 rounded">
            {error}
            <Button variant="link" size="sm" onClick={generateExplanation} className="ml-2">Retry</Button>
          </div>
        )}

        {explanation && (
          <div className="mt-2 text-sm prose prose-sm dark:prose-invert max-w-none">
             <ReactMarkdown remarkPlugins={[remarkGfm]}>{explanation}</ReactMarkdown>

             <div className="mt-4 flex flex-wrap gap-2 pt-2 border-t border-primary/10">
                <div className="flex items-center gap-1 text-xs bg-muted px-2 py-1 rounded">
                   <Route className="w-3 h-3" /> Shortest Edge
                </div>
                <div className="flex items-center gap-1 text-xs bg-muted px-2 py-1 rounded">
                   <Truck className="w-3 h-3" /> Avoids Congestion
                </div>
                <div className="flex items-center gap-1 text-xs bg-muted px-2 py-1 rounded">
                   <Leaf className="w-3 h-3" /> Reduces Emissions
                </div>
                <div className="flex items-center gap-1 text-xs bg-muted px-2 py-1 rounded">
                   <ShieldCheck className="w-3 h-3" /> High Confidence
                </div>
             </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
