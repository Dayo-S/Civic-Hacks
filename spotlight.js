// -------------------------------
// 1. Initialize the Map
// -------------------------------
// Using the coordinates from your second version as they seem more centered on Brookline
var map = L.map('map').setView([42.326, -71.122], 14);

L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '&copy; OpenStreetMap contributors'
}).addTo(map);

// -------------------------------
// 2. Load Pavement GeoJSON
// -------------------------------
fetch('/pavements.geojson')
    .then(response => response.json())
    .then(data => {
        const layer = L.geoJSON(data, {
            style: feature => ({
                // Using the custom color function from your second script
                color: getColorByLabel(feature.properties.label),
                weight: 6,
                opacity: 0.8
            }),
            onEachFeature: onEachStreet
        });

        layer.addTo(map);
    })
    .catch(error => console.error('Error loading GeoJSON:', error));

// -------------------------------
// 3. Combined Interaction Logic
// -------------------------------
function onEachStreet(feature, layer) {
    // A. Add the standard Popup
    let props = feature.properties;
    let popupText = `<strong>${props.address_st}</strong><br/>
                    Condition: ${props.label}<br/>
                    Score: ${props.score}`;
    layer.bindPopup(popupText);

    // B. Add the AI Spotlight Trigger on Click
    layer.on('click', async function () {
        const streetName = props.address_st;
        const score = props.score;
        const status = props.label;

        // Update UI Elements
        const instruction = document.getElementById('instruction');
        const statsContent = document.getElementById('stats-content');
        
        if (instruction) instruction.classList.add('hidden');
        if (statsContent) statsContent.classList.remove('hidden');

        document.getElementById('street-name').innerText = streetName;
        document.getElementById('pci-score').innerText = `Score: ${score}`;
        document.getElementById('pci-label').innerText = `Condition: ${status}`;
        
        // Reset and show loading state
        document.getElementById('ai-narrative').innerText = "Analyzing infrastructure data and generating report...";

        // Fetch AI narrative from Vercel backend
        const aiReport = await askGroq(streetName, score, status);
        document.getElementById('ai-narrative').innerText = aiReport;
    });
}

// -------------------------------
// 4. Helper: Color Logic
// -------------------------------
function getColorByLabel(label) {
    switch (label) {
        case 'Good':          return "#272f21";
        case 'Satisfactory':  return "#518f50";
        case 'Fair':          return "#e3dcba";
        case 'Poor':          return "#cba158";
        case 'Very Poor':     return "#c7522a";
        case 'Serious':       return "#7b0b09";
        case 'Failed':        return "#4f0404";
        case 'Not Scored':    return "#808080";
        default:              return "#999999";
    }
}

// -------------------------------
// 5. AI Function (calls Vercel backend)
// -------------------------------
async function askGroq(street, score, label) {
    try {
        const response = await fetch("/api/spotlight", {
            method: "POST",
            body: JSON.stringify({ street, score, label }),
            headers: { "Content-Type": "application/json" }
        });

        const data = await response.json();
        return data.result || "AI could not generate a report.";
    } catch (err) {
        console.error("Error details:", err);
        return "Error connecting to AI service.";
    }
    
}













