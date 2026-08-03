"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Send, Bot, User } from "lucide-react"

export function AICopilot() {
  const [input, setInput] = useState("")
  const [messages, setMessages] = useState([
    { role: "assistant", content: "Hello! I am your AI Logistics Copilot. I can explain route decisions, predict delays, and provide optimization insights. How can I help you today?" }
  ])

  const handleSend = () => {
    if (!input.trim()) return

    setMessages([...messages, { role: "user", content: input }])
    setInput("")

    // Simulate AI response
    setTimeout(() => {
      setMessages(prev => [
        ...prev,
        { role: "assistant", content: "Analyzing your request... Based on current traffic and weather data, re-routing through the northern corridor will save 15 minutes and reduce fuel consumption by 5%." }
      ])
    }, 1000)
  }

  return (
    <Card className="w-full h-[500px] flex flex-col">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bot className="w-6 h-6 text-accent" />
          AI Logistics Copilot
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col gap-4 overflow-hidden">
        <div className="flex-1 overflow-y-auto space-y-4 p-2">
          {messages.map((msg, idx) => (
            <div key={idx} className={`flex gap-2 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              {msg.role === 'assistant' && <div className="w-8 h-8 rounded-full bg-accent/20 flex items-center justify-center shrink-0"><Bot className="w-5 h-5 text-accent" /></div>}
              <div className={`p-3 rounded-lg max-w-[80%] ${msg.role === 'user' ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
                {msg.content}
              </div>
              {msg.role === 'user' && <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center shrink-0"><User className="w-5 h-5 text-primary" /></div>}
            </div>
          ))}
        </div>
        <div className="flex gap-2 mt-auto">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Ask about routes, delays, or insights..."
            className="flex-1 px-3 py-2 border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-ring"
          />
          <Button onClick={handleSend} size="icon">
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
