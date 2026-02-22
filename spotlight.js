// --- NEW: Global variable to store image data ---
let streetviewData = null;

// Load the image data when the app starts
fetch('/streetviewImages.geojson')
    .then(res => res.json())
    .then(data => { streetviewData = data; });

function onEachStreet(feature, layer) {
    let props = feature.properties;

    layer.on('click', async function (e) {
        const streetName = props.address_st;
        
        // 1. UI Updates
        document.getElementById('instruction').classList.add('hidden');
        document.getElementById('stats-content').classList.remove('hidden');
        document.getElementById('street-name').innerText = streetName;
        
        // 2. Find and Display Image
        const streetImgElement = document.getElementById('street-image');
        const imgUrl = findClosestImage(e.latlng); // Use the click coordinates
        
        if (imgUrl) {
            streetImgElement.src = imgUrl;
            streetImgElement.style.display = 'block';
        } else {
            streetImgElement.style.display = 'none'; // Hide if no image found
        }

        // 3. AI Narrative Logic (keep your existing code here)
        document.getElementById('ai-narrative').innerText = "Analyzing...";
        const aiReport = await askGroq(streetName, props.score, props.label);
        document.getElementById('ai-narrative').innerText = aiReport;
    });
}

// --- NEW: Helper function to find the nearest image ---
function findClosestImage(clickLatLng) {
    if (!streetviewData) return null;

    let closestImg = null;
    let minDistance = Infinity;

    streetviewData.features.forEach(imgFeature => {
        const imgCoords = imgFeature.geometry.coordinates;
        // Leaflet uses [lat, lng], GeoJSON uses [lng, lat]
        const imgLatLng = L.latLng(imgCoords[1], imgCoords[0]);
        const dist = clickLatLng.distanceTo(imgLatLng);

        if (dist < minDistance) {
            minDistance = dist;
            closestImg = imgFeature.properties.image_url;
        }
    });

    // Only return if it's reasonably close (e.g., within 100 meters)
    return minDistance < 100 ? closestImg : null;
}












