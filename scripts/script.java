
const rows = 20;
const cols = 20;
let grid = [];
let startNode = null;
let endNode = null;
let currentMode = 'start';

// Default obstacle positions
const defaultObstacles = [
    [5, 5], [5, 6], [5, 7], [5, 8], [5, 9],
    [10, 5], [10, 6], [10, 7], [10, 8], [10, 9],
    [15, 10], [15, 11], [15, 12], [15, 13], [15, 14]
];

// Create the grid and initialize nodes
function createGrid() {
    const gridContainer = document.getElementById('grid-container');
    gridContainer.innerHTML = ''; // Clear previous grid
    grid = []; // Reset grid

    for (let row = 0; row < rows; row++) {
        const gridRow = [];
        for (let col = 0; col < cols; col++) {
            const cell = document.createElement('div');
            cell.classList.add('grid-cell');
            cell.id = `cell-${row}-${col}`;
            cell.addEventListener('click', () => handleCellClick(row, col));

            gridContainer.appendChild(cell);

            gridRow.push({
                row,
                col,
                isStart: false,
                isEnd: false,
                isObstacle: false,
                distance: Infinity,
                previous: null,
                visited: false,
                fScore: Infinity
            });
        }
        grid.push(gridRow);
    }

    // Place default barriers
    setDefaultBarriers();
}

// Function to place default barriers
function setDefaultBarriers() {
    defaultObstacles.forEach(([row, col]) => {
        grid[row][col].isObstacle = true;
        document.getElementById(`cell-${row}-${col}`).classList.add('obstacle');
    });
}

// Handle Cell Clicks (for setting start, end, or obstacle)
function handleCellClick(row, col) {
    const cell = document.getElementById(`cell-${row}-${col}`);
    const clickedNode = grid[row][col];

    if (currentMode === 'start') {
        if (startNode) {
            document.getElementById(`cell-${startNode.row}-${startNode.col}`).classList.remove('start');
            startNode.isStart = false;
        }
        cell.classList.add('start');
        clickedNode.isStart = true;
        startNode = clickedNode;
    } else if (currentMode === 'end') {
        if (endNode) {
            document.getElementById(`cell-${endNode.row}-${endNode.col}`).classList.remove('end');
            endNode.isEnd = false;
        }
        cell.classList.add('end');
        clickedNode.isEnd = true;
        endNode = clickedNode;
    } else if (currentMode === 'obstacle') {
        if (clickedNode.isObstacle) {
            cell.classList.remove('obstacle');
            clickedNode.isObstacle = false;
        } else {
            cell.classList.add('obstacle');
            clickedNode.isObstacle = true;
        }
    }
}

// Set mode to place start, end or obstacles
function setMode(mode) {
    currentMode = mode;
}

// Reset the grid (clear start, end, obstacles, paths)
function resetGrid() {
    startNode = null;
    endNode = null;
    createGrid();
}

// Heuristic function for A* (Manhattan Distance)
function heuristic(node, endNode) {
    return Math.abs(node.row - endNode.row) + Math.abs(node.col - endNode.col);
}

// A* Algorithm implementation
function runAStar() {
    if (!startNode || !endNode) {
        alert("Please select a start and an end point.");
        return;
    }

    const openSet = [startNode];
    startNode.distance = 0;
    startNode.fScore = heuristic(startNode, endNode);

    while (openSet.length > 0) {
        openSet.sort((a, b) => a.fScore - b.fScore);
        const currentNode = openSet.shift();

        if (currentNode === endNode) {
            reconstructPath(endNode);
            return;
        }

        currentNode.visited = true;
        document.getElementById(`cell-${currentNode.row}-${currentNode.col}`).classList.add('visited');

        const neighbors = getNeighbors(currentNode);
        for (const neighbor of neighbors) {
            if (neighbor.visited || neighbor.isObstacle) continue;

            const tentativeGScore = currentNode.distance + 1;

            if (tentativeGScore < neighbor.distance) {
                neighbor.distance = tentativeGScore;
                neighbor.previous = currentNode;
                neighbor.fScore = neighbor.distance + heuristic(neighbor, endNode);

                if (!openSet.includes(neighbor)) openSet.push(neighbor);
            }
        }
    }

    alert("No path found!");
}

// Get neighbors of a given node
function getNeighbors(node) {
    const { row, col } = node;
    const neighbors = [];

    if (row > 0) neighbors.push(grid[row - 1][col]);
    if (row < rows - 1) neighbors.push(grid[row + 1][col]);
    if (col > 0) neighbors.push(grid[row][col - 1]);
    if (col < cols - 1) neighbors.push(grid[row][col + 1]);

    return neighbors;
}

// Reconstruct the path from end node to start node
function reconstructPath(endNode) {
    let currentNode = endNode;
    while (currentNode !== null) {
        const cell = document.getElementById(`cell-${currentNode.row}-${currentNode.col}`);
        cell.classList.remove('visited');
        cell.classList.add('path');
        currentNode = currentNode.previous;
    }
}

// Initialize the grid on page load
window.onload = createGrid;
