"use client"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Sparkles, Route, Truck, Leaf, ShieldCheck, Loader2, Send, Bot, User } from "lucide-react"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"

interface AIRouteAdvisorProps {
  routeData: any; // the specific RouteResult data
}

type Message = {
  role: "user" | "assistant";
  content: string;
}

export function AIRouteAdvisor({ routeData }: AIRouteAdvisorProps) {
  const [messages, setMessages] = useState<Message[]>([])
  const [inputValue, setInputValue] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const scrollAreaRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight
    }
  }, [messages, isLoading])

  const generateExplanation = async (chatMessages?: Message[]) => {
    setIsLoading(true)
    setError(null)

    try {
      const msgsToSend = chatMessages || []

      const response = await fetch("/api/ai-advisor", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ routeData, messages: msgsToSend })
      })

      if (!response.ok) {
        throw new Error("Failed to fetch explanation from AI Copilot.")
      }

      const data = await response.json()

      setMessages((prev) => [...prev, { role: "assistant", content: data.explanation }])
    } catch (err: any) {
      console.error(err)
      setError(err.message || "An error occurred while communicating with the AI.")
    } finally {
      setIsLoading(false)
    }
  }

  const handleSendMessage = () => {
    if (!inputValue.trim()) return;

    const newMessages: Message[] = [...messages, { role: "user", content: inputValue }]
    setMessages(newMessages)
    setInputValue("")

    generateExplanation(newMessages)
  }

  return (
    <Card className="mt-4 border-primary/30 bg-primary/5 shadow-[0_0_15px_rgba(0,188,212,0.15)] relative overflow-hidden">
       {/* Decorative gradient overlay for futuristic feel */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-accent/5 pointer-events-none" />

      <CardHeader className="pb-3 border-b border-primary/20 relative z-10">
        <CardTitle className="text-lg flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-primary animate-pulse" />
          AI Logistics Copilot
        </CardTitle>
        <CardDescription className="text-primary/70">Intelligent real-time route analysis and assistance</CardDescription>
      </CardHeader>

      <CardContent className="p-0 relative z-10">
        {messages.length === 0 && !isLoading && !error && (
          <div className="p-6 text-center">
            <Bot className="w-12 h-12 text-primary/50 mx-auto mb-4" />
            <p className="text-sm text-muted-foreground mb-4">
              I can analyze this optimized route, explain the solver&apos;s decisions, identify bottlenecks, and predict delays.
            </p>
            <Button onClick={() => generateExplanation()} className="w-full bg-primary/20 hover:bg-primary/30 text-primary border border-primary/50">
              <Sparkles className="w-4 h-4 mr-2" />
              Generate Initial Analysis
            </Button>
          </div>
        )}

        {(messages.length > 0 || isLoading || error) && (
            <div className="flex flex-col h-[400px]">
                {/* Features highlights at the top */}
                 <div className="flex flex-wrap justify-center gap-2 px-4 py-2 border-b border-primary/10 bg-black/20 text-[10px] sm:text-xs">
                    <div className="flex items-center gap-1 text-primary/80">
                       <Route className="w-3 h-3" /> Shortest Edge
                    </div>
                    <div className="flex items-center gap-1 text-primary/80">
                       <Truck className="w-3 h-3" /> Avoids Congestion
                    </div>
                    <div className="flex items-center gap-1 text-primary/80">
                       <Leaf className="w-3 h-3" /> Reduces Emissions
                    </div>
                    <div className="flex items-center gap-1 text-primary/80">
                       <ShieldCheck className="w-3 h-3" /> High Confidence
                    </div>
                 </div>

                {/* Chat Area */}
                <div
                    ref={scrollAreaRef}
                    className="flex-1 overflow-y-auto p-4 space-y-4"
                >
                    {messages.map((msg, index) => (
                        <div key={index} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                            <div className={`flex gap-3 max-w-[85%] ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${msg.role === 'user' ? 'bg-secondary' : 'bg-primary/20 border border-primary/50'}`}>
                                    {msg.role === 'user' ? <User className="w-4 h-4 text-secondary-foreground" /> : <Bot className="w-4 h-4 text-primary" />}
                                </div>
                                <div className={`p-3 rounded-xl text-sm ${msg.role === 'user' ? 'bg-secondary text-secondary-foreground rounded-tr-none' : 'bg-card border border-primary/20 rounded-tl-none prose prose-sm dark:prose-invert max-w-none text-foreground'}`}>
                                    {msg.role === 'user' ? (
                                        msg.content
                                    ) : (
                                        <ReactMarkdown remarkPlugins={[remarkGfm]}>{msg.content}</ReactMarkdown>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}

                    {isLoading && (
                        <div className="flex justify-start">
                            <div className="flex gap-3 max-w-[85%]">
                                <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 bg-primary/20 border border-primary/50">
                                    <Bot className="w-4 h-4 text-primary" />
                                </div>
                                <div className="p-3 rounded-xl bg-card border border-primary/20 rounded-tl-none flex items-center gap-2 text-sm text-muted-foreground">
                                    <Loader2 className="w-4 h-4 text-primary animate-spin" />
                                    Analyzing data streams...
                                </div>
                            </div>
                        </div>
                    )}

                    {error && (
                        <div className="text-sm text-destructive p-3 bg-destructive/10 rounded border border-destructive/30 mx-4">
                            {error}
                            <Button variant="link" size="sm" onClick={() => generateExplanation(messages.length > 0 && messages[messages.length-1].role === 'user' ? messages : undefined)} className="ml-2 h-auto p-0 text-destructive underline">Retry</Button>
                        </div>
                    )}
                </div>

                {/* Input Area */}
                <div className="p-3 border-t border-primary/20 bg-black/20">
                    <form
                        onSubmit={(e) => { e.preventDefault(); handleSendMessage(); }}
                        className="flex gap-2"
                    >
                        <Input
                            value={inputValue}
                            onChange={(e) => setInputValue(e.target.value)}
                            placeholder="Ask about costs, alternatives, delays..."
                            className="bg-card border-primary/30 focus-visible:ring-primary"
                            disabled={isLoading}
                        />
                        <Button type="submit" disabled={isLoading || !inputValue.trim()} size="icon" className="bg-primary/20 hover:bg-primary/40 text-primary border border-primary/50 shrink-0">
                            <Send className="w-4 h-4" />
                        </Button>
                    </form>
                </div>
            </div>
        )}
      </CardContent>
    </Card>
  )
}
