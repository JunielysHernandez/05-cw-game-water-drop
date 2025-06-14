// --- GAME STATE VARIABLES ---
let gameRunning = false;
let gamePaused = false;
let dropMaker;
let timerInterval;
let windTimer;
let missedDrops = 0;
const maxMisses = 10;
let timeLeft = 30;

let windActive = false;
let windDirection = 0;
let bucketX = 0.5;

// --- DOM ELEMENTS ---
const gameContainer = document.getElementById('game-container');
const startBtn = document.getElementById('start-btn');
const pauseBtn = document.getElementById('pause-btn');
const resetBtn = document.getElementById('reset-btn');
const bucket = document.getElementById("bucket");

// --- GAME CONTROL BUTTONS ---

startBtn.addEventListener("click", startGame);

pauseBtn.addEventListener("click", function() {
    if (!gameRunning) return;
    gamePaused = !gamePaused;
    if (gamePaused) {
        clearInterval(dropMaker);
        clearInterval(timerInterval);
        this.textContent = "Resume";
    } else {
        dropMaker = setInterval(createDrop, 1000);
        timerInterval = setInterval(updateTimer, 1000);
                this.textContent = "Pause";
            }
        });

resetBtn.addEventListener("click", function() {
    gameRunning = false;
    gamePaused = false;
    clearInterval(dropMaker);
    clearInterval(timerInterval);
    clearTimeout(windTimer);
    document.querySelectorAll('.water-drop').forEach(drop => drop.remove());
    document.getElementById("score").textContent = "0";
    document.getElementById("time").textContent = "30";
    missedDrops = 0;
    bucketX = 0.5;
    updateBucketPosition();
});

// --- GAME LOGIC ---

function startGame() {
    if (gameRunning) return;
    gameRunning = true;
    gamePaused = false;
    missedDrops = 0;
    timeLeft = 30;
    document.getElementById("score").textContent = "0";
    document.getElementById("time").textContent = timeLeft;
    document.querySelectorAll('.water-drop').forEach(drop => drop.remove());
    clearInterval(timerInterval);
    clearInterval(dropMaker);
    clearTimeout(windTimer);
    timerInterval = setInterval(updateTimer, 1000);
    createDrop();
    dropMaker = setInterval(createDrop, 1000);
    scheduleWind();
    pauseBtn.textContent = "Pause";
}

function updateTimer() {
    if (gamePaused) return;
    timeLeft--;
    document.getElementById("time").textContent = timeLeft;
    if (timeLeft <= 0) {
        clearInterval(timerInterval);
        endGameByScore();
    }
}

function createDrop() {
    const drop = document.createElement("img");
    drop.className = "water-drop";
    drop.src = "img/aqua.png";
    drop.alt = "Aqua Drop";
    const size = 60;
    const gameWidth = gameContainer.offsetWidth;
    const xPosition = Math.random() * (gameWidth - size);
    drop.style.left = xPosition + "px";
    drop.style.top = "0px";
    drop.style.width = drop.style.height = size + "px";
    drop.style.position = "absolute";
    drop.style.pointerEvents = "none";
    gameContainer.appendChild(drop);

    let start = null;
    const duration = 3000;
    const endY = gameContainer.offsetHeight - size - 10;

    function animateDrop(timestamp) {
        if (!start) start = timestamp;
        if (gamePaused) {
            requestAnimationFrame(animateDrop);
            return;
        }
        const elapsed = timestamp - start;
        const progress = Math.min(elapsed / duration, 1);
        drop.style.top = (endY * progress) + "px";

        // Wind effect
        if (windActive) {
            let left = parseFloat(drop.style.left);
            left += windDirection * 1.5;
            left = Math.max(0, Math.min(left, gameContainer.offsetWidth - drop.offsetWidth));
            drop.style.left = left + "px";
        }

        // Collision detection
        if (checkDropCaught(drop)) {
            drop.remove();
            let scoreElem = document.getElementById("score");
            let score = parseInt(scoreElem.textContent, 10) || 0;
            scoreElem.textContent = score + 1;
            return;
        }

        if (progress < 1) {
            requestAnimationFrame(animateDrop);
        } else {
            if (drop.parentNode) {
                showSplash(drop);
                drop.remove();
                let scoreElem = document.getElementById("score");
                let score = parseInt(scoreElem.textContent, 10) || 0;
                score = Math.max(0, score - 1);
                scoreElem.textContent = score;
                missedDrops++;
                if (missedDrops >= maxMisses) {
                    endGame("You missed too many drops! Game Over.");
                }
            }
        }
    }
    requestAnimationFrame(animateDrop);
}

function checkDropCaught(drop) {
    const bucketRect = bucket.getBoundingClientRect();
    const dropRect = drop.getBoundingClientRect();
    const containerRect = gameContainer.getBoundingClientRect();
    const bucketLeft = bucketRect.left - containerRect.left;
    const bucketRight = bucketRect.right - containerRect.left;
    const bucketTop = bucketRect.top - containerRect.top;
    const dropLeft = dropRect.left - containerRect.left;
    const dropRight = dropRect.right - containerRect.left;
    const dropBottom = dropRect.bottom - containerRect.top;
    const isHorizontallyOverlapping = dropRight > bucketLeft && dropLeft < bucketRight;
    const offset = 35;
    const isTouchingAbove = dropBottom >= (bucketTop - offset);
    return isHorizontallyOverlapping && isTouchingAbove;
}

function showSplash(drop) {
    const splash = document.createElement("div");
    splash.className = "splash";
    const dropLeft = parseFloat(drop.style.left) || 0;
    const dropWidth = parseFloat(drop.style.width) || 60;
    splash.style.left = `${dropLeft + dropWidth / 2 - 20}px`;
    splash.style.bottom = "0px";
    gameContainer.appendChild(splash);
    setTimeout(() => splash.remove(), 500);
}

function endGame(message) {
    gameRunning = false;
    clearInterval(dropMaker);
    clearInterval(timerInterval);
    clearTimeout(windTimer);
    document.querySelectorAll('.water-drop').forEach(drop => drop.remove());
    showLosePopup(message);
    missedDrops = 0;
}

function endGameByScore() {
    gameRunning = false;
    clearInterval(dropMaker);
    clearInterval(timerInterval);
    clearTimeout(windTimer);
    document.querySelectorAll('.water-drop').forEach(drop => drop.remove());
    let score = parseInt(document.getElementById("score").textContent, 10) || 0;
    if (score >= 20) {
        showWinCelebration();
    } else {
        showLosePopup("Time's up! You needed 20 points to win. Try again!");
    }
}

// --- WIND ---

function startWind() {
    windActive = true;
    windDirection = Math.random() < 0.5 ? -1 : 1;
    showWindMessage(windDirection);
    setTimeout(() => {
        windActive = false;
        windDirection = 0;
        hideWindMessage();
    }, 3000);
}
function scheduleWind() {
    const nextWind = Math.random() * 5000 + 5000;
    windTimer = setTimeout(() => {
        startWind();
        scheduleWind();
    }, nextWind);
}
function showWindMessage(dir) {
    let msg = document.getElementById("wind-msg");
    if (!msg) {
        msg = document.createElement("div");
        msg.id = "wind-msg";
        msg.style.position = "absolute";
        msg.style.top = "10px";
        msg.style.left = "50%";
        msg.style.transform = "translateX(-50%)";
        msg.style.fontSize = "2rem";
        msg.style.color = "#2E9DF7";
        msg.style.zIndex = "1000";
        gameContainer.appendChild(msg);
    }
    msg.textContent = dir === 1 ? "💨 Wind →" : "💨 Wind ←";
}
function hideWindMessage() {
    const msg = document.getElementById("wind-msg");
    if (msg) msg.remove();
}

// --- BUCKET MOVEMENT ---

// MOUSE MOVEMENT
gameContainer.addEventListener("mousemove", (e) => {
    const rect = gameContainer.getBoundingClientRect();
    const bucketWidth = bucket.offsetWidth;
    const containerWidth = gameContainer.offsetWidth;
    const maxX = containerWidth - bucketWidth;

    // Center the bucket under the mouse
    let x = e.clientX - rect.left - bucketWidth / 2;

    // Clamp x between 0 and maxX
    x = Math.max(0, Math.min(x, maxX));

    // Store bucketX as a fraction between 0 and 1
    bucketX = x / maxX;

    updateBucketPosition();
});

// KEYBOARD MOVEMENT (unchanged, but ensure bucketX stays between 0 and 1)
document.addEventListener("keydown", (e) => {
    const step = 0.05;
    if (e.key === "ArrowLeft") {
        bucketX = Math.max(0, bucketX - step);
    } else if (e.key === "ArrowRight") {
        bucketX = Math.min(1, bucketX + step);
    }
    updateBucketPosition();
});

// UPDATE BUCKET POSITION
function updateBucketPosition() {
    const containerWidth = gameContainer.offsetWidth;
    const bucketWidth = bucket.offsetWidth;
    const maxX = containerWidth - bucketWidth;
    const x = bucketX * maxX;
    bucket.style.left = `${x}px`;
    bucket.style.transform = "";
}
window.addEventListener("resize", updateBucketPosition);
window.addEventListener("DOMContentLoaded", updateBucketPosition);

// --- WIN/LOSE POPUPS ---

function showWinCelebration() {
    if (typeof confetti === "function") {
        confetti({
          particleCount: 120,
          spread: 90,
          origin: { y: 0.6 }
        });
    }
    const popup = document.getElementById('game-popup');
    const content = document.getElementById('game-popup-content');
    content.innerHTML = `
        <h2>Congratulations! You win! 🎉</h2>
        <p>Make sure to check our <a href="#newsletter" style="color:#2E9DF7;">newsletter</a> and our <a href="#funding" style="color:#FFC907;">funding</a>!</p>
        <button id="close-popup-btn" style="margin-top:18px;padding:10px 24px;background:#2E9DF7;color:#fff;border:none;border-radius:8px;font-size:1rem;cursor:pointer;">Close</button>
    `;
    popup.style.display = 'flex';
    document.getElementById('close-popup-btn').onclick = () => {
        popup.style.display = 'none';
    };
}
function showLosePopup(message) {
    const popup = document.getElementById('game-popup');
    const content = document.getElementById('game-popup-content');
    content.innerHTML = `
        <h2>${message}</h2>
        <button id="restart-btn" style="margin-top:18px;padding:10px 24px;background:#FFC907;color:#222;border:none;border-radius:8px;font-size:1rem;cursor:pointer;">Restart</button>
    `;
    popup.style.display = 'flex';
        document.getElementById('restart-btn').onclick = () => {
            popup.style.display = 'none';
            resetBtn.click();
        };
    }
gameContainer.addEventListener("mousemove", (e) => {
    const rect = gameContainer.getBoundingClientRect();
    const bucketWidth = bucket.offsetWidth;
    const containerWidth = gameContainer.offsetWidth;
    const maxX = containerWidth - bucketWidth;

    // Center the bucket under the mouse
    let x = e.clientX - rect.left - bucketWidth / 2;

    // Clamp x between 0 and maxX
    x = Math.max(0, Math.min(x, maxX));

    // Store bucketX as a fraction between 0 and 1
    bucketX = x / maxX;

    updateBucketPosition();
});function updateBucketPosition() {
    const containerWidth = gameContainer.offsetWidth;
    const bucketWidth = bucket.offsetWidth;
    const maxX = containerWidth - bucketWidth;
    const x = bucketX * maxX;
    bucket.style.left = `${x}px`;
    bucket.style.transform = "";
}function updateBucketPosition() {
    const containerWidth = gameContainer.offsetWidth;
    const bucketWidth = bucket.offsetWidth;
    const maxX = containerWidth - bucketWidth;
    const x = bucketX * maxX;
    bucket.style.left = `${x}px`;
    bucket.style.transform = "";
}