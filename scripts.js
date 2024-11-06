// Initialize the map centered on the Maldives
const map = L.map('map').setView([4.0846355, 73.5107275], 14);
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: 'Map data &copy; OpenStreetMap contributors'
}).addTo(map);

// Load the graph data from JSON
let graphData = null;
fetch("maldives_roads.json")
    .then(response => response.json())
    .then(data => {
        graphData = data;
        console.log("Graph data loaded:", graphData);
    });

let startMarker = null;
let endMarker = null;
let routePolyline = null;

function setPoint(type) {
    map.once('click', function(e) {
        if (type === 'start') {
            if (startMarker) map.removeLayer(startMarker);
            startMarker = L.marker(e.latlng, { draggable: true }).addTo(map).bindPopup("Start Point").openPopup();
        } else if (type === 'end') {
            if (endMarker) map.removeLayer(endMarker);
            endMarker = L.marker(e.latlng, { draggable: true }).addTo(map).bindPopup("End Point").openPopup();
        }
    });
}

function resetMarkers() {
    if (startMarker) map.removeLayer(startMarker);
    if (endMarker) map.removeLayer(endMarker);
    if (routePolyline) map.removeLayer(routePolyline);
    startMarker = null;
    endMarker = null;
}

// Haversine formula for heuristic function
function heuristicCostEstimate(nodeA, nodeB) {
    const a = graphData.nodes[nodeA];
    const b = graphData.nodes[nodeB];
    const R = 6371; // Radius of Earth in km
    const dLat = (b.lat - a.lat) * Math.PI / 180;
    const dLon = (b.lon - a.lon) * Math.PI / 180;
    const lat1 = a.lat * Math.PI / 180;
    const lat2 = b.lat * Math.PI / 180;

    const sinDlat = Math.sin(dLat / 2);
    const sinDlon = Math.sin(dLon / 2);
    const aVal = sinDlat * sinDlat + Math.cos(lat1) * Math.cos(lat2) * sinDlon * sinDlon;
    const c = 2 * Math.atan2(Math.sqrt(aVal), Math.sqrt(1 - aVal));

    return R * c; // Distance in km
}

// A* Algorithm Implementation
function aStarAlgorithm(start, end) {
    if (!graphData) {
        alert("Graph data not loaded!");
        return { path: [], cost: 0 };
    }

    const openSet = new Set([start]);
    const cameFrom = {};
    const gScore = {};
    const fScore = {};

    for (const node in graphData.nodes) {
        gScore[node] = Infinity;
        fScore[node] = Infinity;
    }

    gScore[start] = 0;
    fScore[start] = heuristicCostEstimate(start, end);

    while (openSet.size > 0) {
        let current = [...openSet].reduce((lowest, node) =>
            fScore[node] < fScore[lowest] ? node : lowest
        );

        if (current === end) return reconstructPath(cameFrom, current, gScore[end]);

        openSet.delete(current);

        const neighbors = graphData.edges.filter(
            e => e.from === current || e.to === current
        );

        for (let edge of neighbors) {
            const neighbor = edge.from === current ? edge.to : edge.from;
            const tentativeGScore = gScore[current] + edge.distance;

            if (tentativeGScore < gScore[neighbor]) {
                cameFrom[neighbor] = current;
                gScore[neighbor] = tentativeGScore;
                fScore[neighbor] = gScore[neighbor] + heuristicCostEstimate(neighbor, end);

                if (!openSet.has(neighbor)) openSet.add(neighbor);
            }
        }
    }

    console.log("No path found.");
    return { path: [], cost: Infinity };
}

// Reconstruct path after A* completes and calculate cost correctly
function reconstructPath(cameFrom, current, totalCost) {
    const totalPath = [current];

    while (cameFrom[current]) {
        current = cameFrom[current];
        totalPath.unshift(current);
    }

    // Map node IDs to coordinates for polyline and return total path with calculated cost
    return { 
        path: totalPath.map(node => [graphData.nodes[node].lat, graphData.nodes[node].lon]), 
        cost: totalCost 
    };
}

// Simulate pathfinding
function simulatePath() {
    if (!startMarker || !endMarker) {
        alert("Please set both start and end points first.");
        return;
    }

    let start = findNearestNode(startMarker.getLatLng());
    let end = findNearestNode(endMarker.getLatLng());

    let pathResult = aStarAlgorithm(start, end);

    // Clear the previous route polyline if it exists
    if (routePolyline) map.removeLayer(routePolyline);

    // Display the path as a blue polyline on the map
    if (pathResult.path.length > 0) {
        routePolyline = L.polyline(pathResult.path, { color: 'blue' }).addTo(map);
        alert(`Path found! Total distance: ${pathResult.cost.toFixed(2)} km`);
    } else {
        alert("No valid path found between the selected points.");
    }
}

function findNearestNode(latlng) {
    let nearestNode = null;
    let minDist = Infinity;

    for (const [nodeId, nodeData] of Object.entries(graphData.nodes)) {
        let dist = Math.sqrt(
            Math.pow(nodeData.lat - latlng.lat, 2) + Math.pow(nodeData.lon - latlng.lng, 2)
        );

        if (dist < minDist) {
            nearestNode = nodeId;
            minDist = dist;
        }
    }

    return nearestNode;
}
