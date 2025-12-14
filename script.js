// --- 1. SETUP THE ENVIRONMENT ---
const GRID_SIZE = 5;
const START_POS = { r: 0, c: 0 };
const GOAL_POS = { r: 4, c: 4 };

const ACTIONS = {
    'UP': { dr: -1, dc: 0 },
    'DOWN': { dr: 1, dc: 0 },
    'LEFT': { dr: 0, dc: -1 },
    'RIGHT': { dr: 0, dc: 1 }
};
const ACTION_KEYS = Object.keys(ACTIONS);

const REWARDS = {
    GOAL: +10,
    MOVE: -1,
    WALL_HIT: -5
};

const MAX_STEPS = 30; // Max moves before stopping an episode
const MOVE_DELAY_MS = 500; // Time in ms between movements

// DOM Elements
const gridContainer = document.getElementById('grid-container');
const startButton = document.getElementById('start-button');
const resetButton = document.getElementById('reset-button');
const logBody = document.querySelector('#log-table tbody');

let currentPos = { ...START_POS };
let stepCount = 0;
let isRunning = false;
let cells = {}; // Store references to grid cells for quick updates

// --- 2. GRID GENERATION ---

function createGrid() {
    gridContainer.innerHTML = ''; // Clear existing
    cells = {}; // Reset cell references
    for (let r = 0; r < GRID_SIZE; r++) {
        for (let c = 0; c < GRID_SIZE; c++) {
            const cell = document.createElement('div');
            cell.classList.add('cell');
            cell.dataset.row = r;
            cell.dataset.col = c;
            cells[`${r}-${c}`] = cell; // Store reference

            if (r === START_POS.r && c === START_POS.c) {
                cell.classList.add('start');
                cell.textContent = 'S';
            }
            if (r === GOAL_POS.r && c === GOAL_POS.c) {
                cell.classList.add('goal');
                cell.textContent = 'G';
            }
            gridContainer.appendChild(cell);
        }
    }
}

function updateRobotPosition(newPos, isInitial = false) {
    // Clear the robot class from the old position
    if (cells[`${currentPos.r}-${currentPos.c}`] && !isInitial) {
        cells[`${currentPos.r}-${currentPos.c}`].classList.remove('robot');
        cells[`${currentPos.r}-${currentPos.c}`].classList.add('visited'); // Leave a trail
    }

    // Set the robot class at the new position
    currentPos = newPos;
    const robotCell = cells[`${currentPos.r}-${currentPos.c}`];
    if (robotCell) {
        robotCell.classList.add('robot');
        if (robotCell.classList.contains('start')) {
            robotCell.textContent = 'R/S';
        } else if (robotCell.classList.contains('goal')) {
            robotCell.textContent = 'R/G';
        } else {
            robotCell.textContent = 'R';
        }
    }
}

// --- 3. SIMULATION LOGIC ---

function simulateMove(pos, actionKey) {
    const action = ACTIONS[actionKey];
    
    // Calculate potential new coordinates
    const new_r = pos.r + action.dr;
    const new_c = pos.c + action.dc;
    
    // Check for wall hit
    if (new_r < 0 || new_r >= GRID_SIZE || new_c < 0 || new_c >= GRID_SIZE) {
        return { 
            nextPos: pos, 
            reward: REWARDS.WALL_HIT, 
            outcomeMsg: "Hit Wall",
            isTerminal: false
        };
    }
    
    const nextPos = { r: new_r, c: new_c };
    
    // Check for Goal
    if (nextPos.r === GOAL_POS.r && nextPos.c === GOAL_POS.c) {
        return { 
            nextPos: nextPos, 
            reward: REWARDS.GOAL, 
            outcomeMsg: "Reached Goal!",
            isTerminal: true
        };
    }
    
    // Regular Move
    return { 
        nextPos: nextPos, 
        reward: REWARDS.MOVE, 
        outcomeMsg: "Moved",
        isTerminal: false
    };
}

function logExperience(step, cPos, action, nPos, reward, outcome) {
    // Create a new row for the log table
    const row = logBody.insertRow();
    
    // Add the synthetic data points as cells
    row.insertCell().textContent = step;
    row.insertCell().textContent = action;
    row.insertCell().textContent = `(${cPos.r}, ${cPos.c})`;
    row.insertCell().textContent = `(${nPos.r}, ${nPos.c})`;
    row.insertCell().textContent = reward;
    row.insertCell().textContent = outcome;
    
    // Auto-scroll to the bottom of the log
    logBody.parentElement.scrollTop = logBody.parentElement.scrollHeight;
}

// --- 4. THE MAIN LOOP ---

async function runEpisode() {
    if (isRunning) return;
    isRunning = true;
    startButton.disabled = true;

    while (isRunning && stepCount < MAX_STEPS) {
        stepCount++;
        
        // 1. Choose a random action (Pure Exploration)
        const actionKey = ACTION_KEYS[Math.floor(Math.random() * ACTION_KEYS.length)];
        
        // 2. Simulate the move and get feedback
        const { nextPos, reward, outcomeMsg, isTerminal } = simulateMove(currentPos, actionKey);
        
        // 3. RECORD THE SYNTHETIC DATA POINT
        logExperience(stepCount, currentPos, actionKey, nextPos, reward, outcomeMsg);
        
        // 4. VISUALIZE THE MOVEMENT
        updateRobotPosition(nextPos);
        
        if (isTerminal) {
            console.log("SUCCESS! Robot reached the goal.");
            break;
        }

        // Wait for the delay to create the animation effect
        await new Promise(resolve => setTimeout(resolve, MOVE_DELAY_MS));
    }
    
    isRunning = false;
    startButton.disabled = true;
    resetButton.disabled = false;
    console.log(`Episode finished in ${stepCount} steps.`);
}

// --- 5. INITIALIZATION & EVENT HANDLERS ---

function resetSimulation() {
    isRunning = false;
    stepCount = 0;
    currentPos = { ...START_POS };
    logBody.innerHTML = '';
    createGrid();
    updateRobotPosition(currentPos, true); // Initialize robot position
    startButton.disabled = false;
    resetButton.disabled = true;
    console.clear();
    console.log("Simulation Reset.");
}

startButton.addEventListener('click', runEpisode);
resetButton.addEventListener('click', resetSimulation);

// Initial setup on page load
createGrid();
updateRobotPosition(currentPos, true);
