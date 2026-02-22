// 1. Initialize the Map
var map = L.map('map').setView([42.3601, -71.119], 13);

L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
}).addTo(map);

// 3. Define interaction logic (what happens when you click) 
function onEachStreet(feature, layer) {
    layer.on('click', async function () {
        const streetName = feature.properties.address_st;
        const score = feature.properties.score;
        const status = feature.properties.label;

        // Update the UI 
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

// 4. LOAD THE DATA IMMEDIATELY (Always Showing)
fetch('pavements.geojson')
    .then(response => response.json())
    .then(data => {
        L.geoJSON(data, {
            style: feature => ({
                color: feature.properties.stroke || '#3388ff', // Use color from file or default blue
                weight: 5
            }),
            onEachFeature: onEachStreet // Connects the click logic to the layers
        }).addTo(map);
    })
    .catch(error => console.error('Error loading GeoJSON:', error));

// 5. AI Function 
async function askGroq(street, score, label) {
  try {
    const response = await fetch("https://civic-hacks-ofom.vercel.app/api/spotlight", {
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

