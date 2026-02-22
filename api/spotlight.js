export default async function handler(req, res) {
  // 1. CORS Headers
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    // 2. Vercel automatically parses req.body for application/json
    const { street, score, label } = req.body;

    // Debugging: This will show up in your Vercel Logs
    console.log("Received body:", req.body);

    if (!street || score === undefined || !label) {
      return res.status(400).json({
        error: "Missing required fields",
        received: req.body
      });
    }

    const prompt = `Context: You are a Brookline civil engineer. Data: Street: ${street}, PCI Score: ${score}, Condition: ${label}. Task: Write a 2-3 sentence Spotlight summary for residents.`.trim();

    // 3. Call Groq
    const groqRes = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.GROQ_API_KEY}`
      },
      body: JSON.stringify({
        model: "llama-3.1-8b-instant",
        messages: [{ role: "user", content: prompt }]
      })
    });

    const data = await groqRes.json();

    if (!groqRes.ok || !data.choices) {
      console.error("Groq Error:", data);
      return res.status(500).json({ error: "Groq API error", details: data });
    }

    res.status(200).json({
      result: data.choices[0].message.content
    });

  } catch (err) {
    console.error("Server Error:", err);
    res.status(500).json({
      error: "Internal Server Error",
      details: err.message
    });
  }
}
