export default async function handler(req, res) {
  // CORS
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  try {
    // SAFELY PARSE BODY
    let body = req.body;

    if (!body) {
      const raw = await new Promise(resolve => {
        let data = "";
        req.on("data", chunk => (data += chunk));
        req.on("end", () => resolve(data));
      });

      body = raw ? JSON.parse(raw) : {};
    }

    const { street, score, label } = body;

    if (!street || !score || !label) {
      return res.status(400).json({
        error: "Missing required fields",
        received: body
      });
    }

    const prompt = `
Context: You are a Brookline civil engineer.
Data: Street: ${street}, PCI Score: ${score}, Condition: ${label}.
Task: Write a 2-3 sentence Spotlight summary for residents.
`.trim();

    const groqRes = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.GROQ_API_KEY}`
      },
      body: JSON.stringify({
        model: "llama3-8b-8192",
        messages: [{ role: "user", content: prompt }]
      })
    });

    const data = await groqRes.json();

    if (!data.choices) {
      return res.status(500).json({ error: "Groq returned an error", raw: data });
    }

    res.status(200).json({
      result: data.choices[0].message.content
    });

  } catch (err) {
    res.status(500).json({
      error: "Proxy crashed",
      details: err.message
    });
  }
}

