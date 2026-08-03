import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { routeData } = body

    if (!routeData) {
      return NextResponse.json({ error: "Route data is required" }, { status: 400 })
    }

    const prompt = `Analyze this delivery route optimization and explain why the quantum solver chose this route.
Keep the explanation concise and focus on:
- why it might be the shortest edge
- if it avoided congestion
- if it is a balanced path
- if it reduced emissions
- what is the confidence level

Natural language explanation. Format using markdown. Be encouraging and informative.

Data:
${JSON.stringify(routeData, null, 2)}
`

    const aiResponse = await fetch("https://api.k2think.ai/v1/chat/completions", {
      method: "POST",
      headers: {
        "accept": "application/json",
        "Authorization": `Bearer ${process.env.K2_API_KEY || 'IFM-4SpQ0qEg0Wlsw04O'}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "MBZUAI-IFM/K2-Think-v2",
        messages: [
          { role: "system", content: "You are an AI logistics and route optimization advisor." },
          { role: "user", content: prompt }
        ],
        stream: false
      })
    })

    if (!aiResponse.ok) {
      throw new Error(`AI API responded with status ${aiResponse.status}`)
    }

    const result = await aiResponse.json()
    const explanation = result.choices[0].message.content

    return NextResponse.json({ explanation })
  } catch (error) {
    console.error("AI Advisor error:", error)
    return NextResponse.json({ error: "Failed to generate AI explanation" }, { status: 500 })
  }
}
