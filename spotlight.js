// -------------------------------
// 1. Initialize the Map
// -------------------------------
var map = L.map('map').setView([42.326, -71.122], 14);

L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '&copy; OpenStreetMap contributors'
}).addTo(map);

// Global data storage for images
let streetImages = [];

// Load the street images first
fetch('streetviewImages.geojson')
    .then(res => res.json())
    .then(data => {
        streetImages = data.features;
        console.log("Imagery data loaded:", streetImages.length, "points");
    })
    .catch(err => console.error("Error loading images:", err));

// -------------------------------
// 2. Load Pavement GeoJSON
// -------------------------------
fetch('pavements.geojson')
    .then(response => response.json())
    .then(data => {
        L.geoJSON(data, {
            style: feature => ({
                color: getColorByLabel(feature.properties.label),
                weight: 6,
                opacity: 0.8
            }),
            onEachFeature: onEachStreet
        }).addTo(map);
    })
    .catch(error => console.error('Error loading pavements:', error));

// -------------------------------
// 3. Consolidated Interaction Logic
// -------------------------------
function onEachStreet(feature, layer) {
    const props = feature.properties;

    // A. THE HOVER EFFECT (Instant Image & Stats)
    layer.on('mouseover', function () {
        const statsContent = document.getElementById('stats-content');
        const instruction = document.getElementById('instruction');
        const imgElement = document.getElementById('street-view-img');
        const loader = document.getElementById('image-loader');

        // Show UI sections
        if (instruction) instruction.classList.add('hidden');
        if (statsContent) statsContent.classList.remove('hidden');

        // Update Text Info
        document.getElementById('street-name').innerText = props.address_st;
        document.getElementById('pci-score').innerText = `Score: ${props.score}`;
        document.getElementById('pci-label').innerText = `Condition: ${props.label}`;

        // Find nearest image from the geojson data
        // We compare the street's first coordinate to our image points
        const streetLat = feature.geometry.coordinates[0][1];
        const nearestImage = streetImages.find(img => 
            Math.abs(img.properties.lat - streetLat) < 0.005
        );

        if (nearestImage) {
            imgElement.src = nearestImage.properties.image_url;
            imgElement.style.display = 'block';
            if (loader) loader.style.display = 'none';
        } else {
            imgElement.style.display = 'none';
            if (loader) {
                loader.style.display = 'block';
                loader.innerText = "No image for this segment";
            }
        }
    });

    // B. THE CLICK EFFECT (Triggers AI Report)
    layer.on('click', async function () {
        const aiNarrative = document.getElementById('ai-narrative');
        const statsSection = document.getElementById('stats-section');

        // Show loading state
        aiNarrative.innerText = "Analyzing infrastructure data and generating report...";
        statsSection.classList.add('loading-glow'); // Adding the "spice" effect

        // Fetch AI narrative from backend
        const aiReport = await askGroq(props.address_st, props.score, props.label);
        
        aiNarrative.innerText = aiReport;
        statsSection.classList.remove('loading-glow');
    });

    // Optional: Standard Leaflet Popup
    layer.bindPopup(`<strong>${props.address_st}</strong><br>Condition: ${props.label}`);
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
        console.error("Error connecting to AI:", err);
        return "Error connecting to AI service.";
    }
}
