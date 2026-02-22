export default async function handler(req, res) {
  try {
    const { street, score, label } = req.body;

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

    if (!data.choices || !data.choices[0]) {
      return res.status(500).json({ error: "Groq returned no choices", raw: data });
    }

    res.status(200).json({ result: data.choices[0].message.content });

  } catch (err) {
    res.status(500).json({ error: "Proxy error", details: err.message });
  }
}
