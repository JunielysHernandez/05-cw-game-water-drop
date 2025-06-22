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
let bucketX = 0.5; // 0 (left) to 1 (right)

// --- DIFFICULTY SETTINGS ---
let dropIntervalMs = 1000;
let dropFallDuration = 3000;
let scoreToWin = 30;
let timeLimit = 30;
let currentDifficulty = 'medium';

const difficultySettings = {
    easy:        { dropInterval: 1200, dropDuration: 3500, score: 20, time: 40 },
    medium:      { dropInterval: 1000, dropDuration: 3000, score: 30, time: 30 },
    hard:        { dropInterval: 700,  dropDuration: 2200, score: 40, time: 25 },
    challenging: { dropInterval: 500,  dropDuration: 1600, score: 50, time: 20 }
};

// --- DOM ELEMENTS ---
const gameContainer = document.getElementById('game-container');
const startBtn = document.getElementById('start-btn');
const pauseBtn = document.getElementById('pause-btn');
const resetBtn = document.getElementById('reset-btn');
const bucket = document.getElementById("bucket");

// --- DIFFICULTY BUTTONS ---
document.querySelectorAll('.difficulty-btn').forEach(btn => {
    btn.addEventListener('click', function() {
        document.querySelectorAll('.difficulty-btn').forEach(b => b.classList.remove('active'));
        this.classList.add('active');
        currentDifficulty = this.dataset.mode;
        const setting = difficultySettings[currentDifficulty];
        dropIntervalMs = setting.dropInterval;
        dropFallDuration = setting.dropDuration;
        scoreToWin = setting.score;
        timeLimit = setting.time;
        document.getElementById("time").textContent = timeLimit;
        document.getElementById("score").textContent = "0";
        missedDrops = 0;
        timeLeft = timeLimit;
        updateObjective();
        resetGameState();
    });
});
document.querySelector('.difficulty-btn[data-mode="medium"]').classList.add('active');

// --- OBJECTIVE DISPLAY ---
function updateObjective() {
    document.getElementById("objective").textContent =
        `Objective: Catch ${scoreToWin} drops before time runs out!`;
}

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
        dropMaker = setInterval(spawnDropsForLevel, dropIntervalMs);
        timerInterval = setInterval(updateTimer, 1000);
        this.textContent = "Pause";
    }
});

resetBtn.addEventListener("click", function() {
    resetGameState();
    updateObjective();
});

// --- GAME LOGIC ---

function resetGameState() {
    gameRunning = false;
    gamePaused = false;
    clearInterval(dropMaker);
    clearInterval(timerInterval);
    clearTimeout(windTimer);
    document.querySelectorAll('.water-drop').forEach(drop => drop.remove());
    document.getElementById("score").textContent = "0";
    document.getElementById("time").textContent = timeLimit;
    missedDrops = 0;
    timeLeft = timeLimit;
    bucketX = 0.5;
    updateBucketPosition();
}

function startGame() {
    if (gameRunning) return;
    gameRunning = true;
    gamePaused = false;
    missedDrops = 0;
    timeLeft = timeLimit;
    document.getElementById("score").textContent = "0";
    document.getElementById("time").textContent = timeLeft;
    document.querySelectorAll('.water-drop').forEach(drop => drop.remove());
    clearInterval(timerInterval);
    clearInterval(dropMaker);
    clearTimeout(windTimer);
    timerInterval = setInterval(updateTimer, 1000);
    spawnDropsForLevel();
    dropMaker = setInterval(spawnDropsForLevel, dropIntervalMs);
    scheduleWind();
    pauseBtn.textContent = "Pause";
    updateObjective();
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
    const duration = dropFallDuration;
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
            checkMilestones(score + 1); // <-- Add this line
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
    if (score >= scoreToWin) {
        showWinCelebration();
    } else {
        showLosePopup("Time's up! You needed " + scoreToWin + " points to win. Try again!");
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

// MOUSE MOVEMENT (bucket follows mouse by left edge, always fully visible)
let lastMove = 0;
gameContainer.addEventListener("mousemove", (e) => {
    const rect = gameContainer.getBoundingClientRect();
    const bucketWidth = bucket.offsetWidth;
    const containerWidth = gameContainer.offsetWidth;
    const maxX = containerWidth - bucketWidth;

    // Center bucket on mouse
    let x = e.clientX - rect.left - bucketWidth / 2;
    x = Math.max(0, Math.min(x, maxX));
    bucket.style.left = `${x}px`;

    // Update bucketX for keyboard sync:
    bucketX = maxX === 0 ? 0 : x / maxX;
});

// KEYBOARD MOVEMENT (continuous and smooth)
let moveInterval = null;
let moveDirection = 0;

document.addEventListener("keydown", (e) => {
    if (moveInterval) return; // Prevent multiple intervals
    if (e.key === "ArrowLeft") moveDirection = -1;
    else if (e.key === "ArrowRight") moveDirection = 1;
    else return;

    moveInterval = setInterval(() => {
        const bucketWidth = bucket.offsetWidth;
        const containerWidth = gameContainer.offsetWidth;
        const maxX = containerWidth - bucketWidth;
        let x = bucketX * maxX;
        const stepPx = 6; // Even finer control
        x = Math.max(0, Math.min(maxX, x + moveDirection * stepPx));
        bucketX = maxX === 0 ? 0 : x / maxX;
        updateBucketPosition();
    }, 12); // Fast repeat for smoothness
});

document.addEventListener("keyup", (e) => {
    if (e.key === "ArrowLeft" || e.key === "ArrowRight") {
        clearInterval(moveInterval);
        moveInterval = null;
        moveDirection = 0;
    }
});

// UPDATE BUCKET POSITION
function updateBucketPosition() {
    const bucketWidth = bucket.offsetWidth;
    const containerWidth = gameContainer.offsetWidth;
    const maxX = containerWidth - bucketWidth;
    bucketX = Math.max(0, Math.min(bucketX, 1));
    const x = maxX * bucketX;
    bucket.style.left = `${x}px`;
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
        <p>Objective complete: ${scoreToWin} drops caught!</p>
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

// --- MILESTONE CHECKS ---

const milestoneData = {
  easy: {
    milestones: [5, 10, 15, 20],
    messages: [
      "🎉 Great start! 5 drops collected!",
      "🔥 You’re halfway there! 10 drops!",
      "💪 Almost done! 15 drops!",
      "🏆 You did it! 20 drops caught!"
    ]
  },
  medium: {
    milestones: [10, 20, 25, 30],
    messages: [
      "🎉 Great start! 10 drops collected!",
      "🔥 You’re halfway there! 20 drops!",
      "💪 Almost done! 25 drops!",
      "🏆 You did it! 30 drops caught!"
    ]
  },
  hard: {
    milestones: [10, 20, 30, 40],
    messages: [
      "🎉 Great start! 10 drops collected!",
      "🔥 You’re halfway there! 20 drops!",
      "💪 Almost done! 30 drops!",
      "🏆 You did it! 40 drops caught!"
    ]
  },
  challenging: {
    milestones: [10, 20, 35, 50],
    messages: [
      "🎉 Great start! 10 drops collected!",
      "🔥 You’re halfway there! 20 drops!",
      "💪 Almost done! 35 drops!",
      "🏆 You did it! 50 drops caught!"
    ]
  }
};

function checkMilestones(score) {
  const { milestones, messages } = milestoneData[currentDifficulty];
  const index = milestones.indexOf(score);
  const milestoneMsg = document.getElementById("milestoneMessage");
  if (index !== -1 && milestoneMsg) {
    milestoneMsg.textContent = messages[index];
    milestoneMsg.classList.add("visible");
    milestoneMsg.style.visibility = "visible";
    setTimeout(() => {
      milestoneMsg.classList.remove("visible");
      setTimeout(() => {
        milestoneMsg.textContent = "";
        milestoneMsg.style.visibility = "hidden";
      }, 400); // matches the CSS transition
    }, 2000); // visible for 2 seconds
  }
}

// --- SPAWN MORE DROPS BASED ON DIFFICULTY ---
function spawnDropsForLevel() {
    let drops = 1;
    if (currentDifficulty === "easy") drops = 0.5;
    if (currentDifficulty === "medium") drops = 2;
    if (currentDifficulty === "hard") drops = 3;
    if (currentDifficulty === "challenging") drops = 5;
    for (let i = 0; i < drops; i++) {
        createDrop();
    }
}