// -------------------------------
// 1. Initialize the Map
// -------------------------------
var map = L.map('map').setView([42.3601, -71.119], 13);

L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '&copy; OpenStreetMap contributors'
}).addTo(map);


// -------------------------------
// 2. Load Pavement GeoJSON FIRST
// -------------------------------
let pavementLayer = null;

fetch('pavements.geojson')
    .then(response => response.json())
    .then(data => {
        pavementLayer = L.geoJSON(data, {
            style: feature => ({
                color: feature.properties.stroke || '#3388ff',
                weight: 5
            })
        }).addTo(map);

        // Attach click logic AFTER layer is created
        pavementLayer.eachLayer(layer => {
            const feature = layer.feature;
            attachStreetClick(layer, feature);
        });
    })
    .catch(error => console.error('Error loading GeoJSON:', error));


// -------------------------------
// 3. Click Logic (attached AFTER layer loads)
// -------------------------------
function attachStreetClick(layer, feature) {
    layer.on('click', async function () {
        const streetName = feature.properties.address_st;
        const score = feature.properties.score;
        const status = feature.properties.label;

        // Update UI
        document.getElementById('instruction').classList.add('hidden');
        document.getElementById('stats-section').classList.remove('hidden');
        document.getElementById('street-name').innerText = streetName;
        document.getElementById('pci-score').innerText = `Score: ${score}`;
        document.getElementById('pci-label').innerText = `Condition: ${status}`;
        document.getElementById('ai-narrative').innerText = "Reading the news and writing report...";

        // Fetch AI narrative
        const aiReport = await askGroq(streetName, score, status);
        document.getElementById('ai-narrative').innerText = aiReport;
    });
}


// -------------------------------
// 4. AI Function (Vercel backend)
// -------------------------------
async function askGroq(street, score, label) {
    try {
        const response = await fetch("/api/spotlight", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ street, score, label })
        });

        const data = await response.json();
        return data.result || "AI could not generate a report.";
    } catch (err) {
        return "Error connecting to AI service.";
    }
}


