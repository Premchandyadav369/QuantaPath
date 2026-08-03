import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { routeData, messages = [] } = body

    if (!routeData) {
      return NextResponse.json({ error: "Route data is required" }, { status: 400 })
    }

    const systemPrompt = `You are an AI Logistics Copilot and Route Optimization Advisor.
You are assisting a user in a futuristic logistics dashboard (QuantaPath).
The user has just optimized a route using a Quantum solver (HAWS-QAOA) or a Classical solver.
Your goal is to explain why the route was selected, identify bottlenecks, predict delays, recommend alternatives, estimate costs, and answer questions.

Be concise, informative, and professional. Format your response with markdown. Use lists and bold text for readability.

Current Route Data Context:
${JSON.stringify(routeData, null, 2)}
`

    let apiMessages = [
        { role: "system", content: systemPrompt }
    ];

    if (messages.length === 0) {
        // Initial explanation request
        apiMessages.push({
            role: "user",
            content: `Analyze this delivery route optimization and explain why the solver chose this route.
Keep the explanation concise and focus on:
- why it might be the shortest edge
- if it avoids congestion (hypothetically based on the data)
- if it is a balanced path
- if it reduces emissions
- what is the confidence level

Natural language explanation. Format using markdown. Be encouraging and informative.`
        });
    } else {
        // Chat continuation
        apiMessages = apiMessages.concat(messages);
    }


    const aiResponse = await fetch("https://api.k2think.ai/v1/chat/completions", {
      method: "POST",
      headers: {
        "accept": "application/json",
        "Authorization": `Bearer ${process.env.K2_API_KEY || 'IFM-4SpQ0qEg0Wlsw04O'}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "MBZUAI-IFM/K2-Think-v2",
        messages: apiMessages,
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
