document.addEventListener('DOMContentLoaded', () => {
    // Initialize the map
    const map = L.map('map').setView([14.5995, 120.9842], 13); // Centered on Manila

    // Add OpenStreetMap tile layer
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '&copy; OpenStreetMap contributors'
    }).addTo(map);

    let startMarker, endMarker, routeControl;
    let startCoords, endCoords;

    // Get references to buttons
    const setStartButton = document.getElementById('setStart');
    const setEndButton = document.getElementById('setEnd');
    const simulateButton = document.getElementById('simulatePath');
    const resetButton = document.getElementById('resetPoints'); // Reference to Reset Button

    // Set start point marker
    setStartButton.addEventListener('click', () => {
        map.once('click', (e) => {
            if (startMarker) startMarker.remove();
            startCoords = e.latlng;
            startMarker = L.marker(startCoords).addTo(map)
                .bindPopup('Start Point')
                .openPopup();
        });
    });

    // Set end point marker
    setEndButton.addEventListener('click', () => {
        map.once('click', (e) => {
            if (endMarker) endMarker.remove();
            endCoords = e.latlng;
            endMarker = L.marker(endCoords).addTo(map)
                .bindPopup('End Point')
                .openPopup();
        });
    });

    // Simulate path using OSRM's route service
    simulateButton.addEventListener('click', () => {
        if (!startCoords || !endCoords) {
            alert('Please set both start and end points.');
            return;
        }

        if (routeControl) {
            map.removeControl(routeControl);
        }

        routeControl = L.Routing.control({
            waypoints: [
                L.latLng(startCoords.lat, startCoords.lng),
                L.latLng(endCoords.lat, endCoords.lng)
            ],
            router: L.Routing.osrmv1({
                serviceUrl: 'https://router.project-osrm.org/route/v1/'
            }),
            lineOptions: {
                styles: [{ color: '#1DB954', weight: 5 }]
            },
            createMarker: function() { return null; } // Remove extra markers created by the plugin
        }).addTo(map);
    });

    // Reset start and end points
    resetButton.addEventListener('click', () => {
        if (startMarker) {
            startMarker.remove();
            startMarker = null;
        }
        if (endMarker) {
            endMarker.remove();
            endMarker = null;
        }
        startCoords = null;
        endCoords = null;
        if (routeControl) {
            map.removeControl(routeControl);
            routeControl = null;
        }
    });
});
