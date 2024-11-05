
// Initialize the map centered on the Maldives
const map = L.map('map').setView([4.0846355, 73.5107275], 14); // Center on the Maldives coordinates
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: 'Map data &copy; OpenStreetMap contributors'
}).addTo(map);

// Load the graph data from JSON
let graphData = null;
fetch("maldives_roads.json") // maldives muna for now
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

function findNearestNode(latlng) {
    let nearestNode = null;
    let minDist = Infinity;

    for (const [nodeId, nodeData] of Object.entries(graphData.nodes)) {
        // Calculate the distance between the node and the clicked location
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

// Heuristic function for A*
function heuristicCostEstimate(nodeA, nodeB) {
    const a = graphData.nodes[nodeA];
    const b = graphData.nodes[nodeB];
    return Math.sqrt(Math.pow(a.lat - b.lat, 2) + Math.pow(a.lon - b.lon, 2)); 
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

        console.log("Current node:", current); // Debug: Current node
        if (current === end) return reconstructPath(cameFrom, current);

        openSet.delete(current);

        // Filter edges that are connected to the current node
        for (let edge of graphData.edges.filter(e => e.from === current)) {
            let neighbor = edge.to;
            let tentativeGScore = gScore[current] + edge.distance;

            if (tentativeGScore < gScore[neighbor]) {
                cameFrom[neighbor] = current;
                gScore[neighbor] = tentativeGScore;
                fScore[neighbor] = gScore[neighbor] + heuristicCostEstimate(neighbor, end);

                if (!openSet.has(neighbor)) openSet.add(neighbor);
            }
        }

        // Debug: Log openSet and scores
        console.log("Open set:", openSet);
        console.log("gScore:", gScore);
        console.log("fScore:", fScore);
    }

    console.log("No path found."); // Debug: No path found message
    return { path: [], cost: Infinity }; // Return empty path if no path found
}

// Reconstruct path after A* completes
function reconstructPath(cameFrom, current) {
    const totalPath = [current];
    let cost = 0;

    while (cameFrom[current]) {
        current = cameFrom[current];
        totalPath.unshift(current);
    }

    for (let i = 0; i < totalPath.length - 1; i++) {
        let from = totalPath[i];
        let to = totalPath[i + 1];
        let edge = graphData.edges.find(e => e.from === from && e.to === to);
        if (edge) cost += edge.distance;
    }

    return { path: totalPath.map(node => [graphData.nodes[node].lat, graphData.nodes[node].lon]), cost };
}

// Simulate pathfinding
function simulatePath() {
    if (!startMarker || !endMarker) {
        alert("Please set both start and end points first.");
        return;
    }

    let start = findNearestNode(startMarker.getLatLng());
    let end = findNearestNode(endMarker.getLatLng());

    console.log("Start node:", start); // Debug: Start node
    console.log("End node:", end); // Debug: End node

    let pathResult = aStarAlgorithm(start, end);

    if (routePolyline) map.removeLayer(routePolyline);
    routePolyline = L.polyline(pathResult.path, { color: 'blue' }).addTo(map);
    if (pathResult.path.length === 0) {
        alert("No valid path found between the selected points.");
    } else {
        alert(`Path found! Total distance: ${pathResult.cost.toFixed(2)} km`);
    }
}
