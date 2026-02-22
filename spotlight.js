// --- 1. CONFIGURATION (Put your secret keys here) ---
const NEWS_API_KEY = 'efd0218f0c924443aef41f728908f39a';
const GEMINI_API_KEY = 'AIzaSyBwYxz2a5US3kHmTFOcF12xVnDyqStBnlg';
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3-flash:generateContent?key=${AIzaSyBwYxz2a5US3kHmTFOcF12xVnDyqStBnlg}`;

// --- 2. THE RELAY START: Map Click ---
function onEachStreet(feature, layer) {
    layer.on('click', async function (e) {
        // Pull data from your Grover Street style JSON
        const streetName = feature.properties.address_st;
        const score = feature.properties.score;
        const status = feature.properties.label;

        // Immediately update the UI with raw stats
        document.getElementById('street-name').innerText = streetName;
        document.getElementById('pci-score').innerText = `Score: ${score}`;
        document.getElementById('ai-narrative').innerText = "Consulting the expert and checking the news...";

        // Trigger the next steps
        const headline = await fetchBrooklineNews(streetName);
        const aiSummary = await askGemini(streetName, score, status, headline);
        
        // Display the final result
        document.getElementById('ai-narrative').innerText = aiSummary;
    });
}

function onEachStreet(feature, layer) {
    layer.on('click', async function (e) {
        // Grab data from the "Box" (pavement_data.js)
        const streetName = feature.properties.address_st;
        const score = feature.properties.score;
        const status = feature.properties.label;

        // Update the UI immediately
        document.getElementById('street-name').innerText = streetName;
        document.getElementById('pci-score').innerText = `Score: ${score}`;
        document.getElementById('ai-narrative').innerText = "Reading the news and writing report...";

        // Step A: Get the News
        const headline = await fetchNews(streetName);
        
        // Step B: Ask the Gemini Brain
        const aiReport = await askGemini(streetName, score, status, headline);
        
        // Step C: Show the final report in your Spotlight box
        document.getElementById('ai-narrative').innerText = aiReport;
    });
}

// 4. ADD THE DATA TO THE MAP
// 'myPavementData' is the variable name you created in your other JS file!
L.geoJSON(myPavementData, {
    style: function(feature) {
        return { color: feature.properties.stroke, weight: 5 };
    },
    onEachFeature: onEachStreet
}).addTo(map);

// --- 4. THE RELAY FINISH: Ask the "Brain" (Gemini) ---
async function askGemini(street, score, label, news) {
    const prompt = `
        Context: You are a Brookline civil engineer.
        Data: Street: ${street}, PCI Score: ${score}, Condition: ${label}.
        News: ${news}.
        Task: Write a 2-sentence 'Spotlight' for a neighborhood app explaining what this means for residents. 
        Focus on safety, 2026 town plans, or flooding if relevant.
    `;

    try {
        const response = await fetch(`${GEMINI_URL}?key=${GEMINI_API_KEY}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ parts: [{ text: prompt }] }]
            })
        });

        const result = await response.json();
        // Extract the text from Gemini's specific response structure
        return result.candidates[0].content.parts[0].text;
    } catch (err) {
        return "The AI is currently resting. Please try another street in a moment!";
    }
}