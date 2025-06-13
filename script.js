// Variables to control game state
let gameRunning = false; // Keeps track of whether game is active or not
let dropMaker; // Will store our timer that creates drops regularly
let gamePaused = false;
let timerInterval;

let missedDrops = 0;
const maxMisses = 10; // was 5, now 10

let timeLeft = 30; // or your preferred starting time

// Wind variables
let windActive = false;
let windDirection = 0;
let windTimer;

// Wait for button click to start the game
document.getElementById("start-btn").addEventListener("click", startGame);

function startGame() {
    // Prevent multiple games from running at once
    if (gameRunning) return;

    gameRunning = true;
    timeLeft = 30;
    document.getElementById("time").textContent = timeLeft;
    clearInterval(timerInterval); // Prevent multiple intervals
    timerInterval = setInterval(updateTimer, 1000);

    // Create new drops every second (1000 milliseconds)
    createDrop(); // Create the first drop immediately
    dropMaker = setInterval(createDrop, 1000);
    scheduleWind();
}

function createDrop() {
  // Create an img element for the water drop
  const drop = document.createElement("img");
  drop.className = "water-drop";
  drop.src = "img/aqua.png";
  drop.alt = "Aqua Drop";

  // Make drops different sizes for visual variety
  const initialSize = 60;
  const sizeMultiplier = Math.random() * 0.8 + 0.5;
  const size = initialSize * sizeMultiplier;
  drop.style.width = drop.style.height = `${size}px`;

  // Make sure drops spawn fully inside the game area
  const gameWidth = gameContainer.offsetWidth;
  const xPosition = Math.random() * (gameWidth - size);
  drop.style.left = xPosition + "px";
  drop.style.top = "0px";
  drop.style.position = "absolute";
  drop.style.pointerEvents = "none"; // So mouse doesn't block bucket movement

  // Add the new drop to the game screen
  gameContainer.appendChild(drop);

  // Animate the drop falling and store the animation object
  const dropAnimation = drop.animate([
    { transform: "translateY(0)" },
    { transform: `translateY(${gameContainer.offsetHeight - size}px)` }
  ], {
    duration: 4000,
    easing: "linear"
  });
  drop._animation = dropAnimation; // Store reference for pause/resume

  // Collision detection loop
  function checkCollision() {
    if (gamePaused) {
        // Wait and retry when unpaused
        requestAnimationFrame(checkCollision);
        return;
    }
    const bucketRect = bucket.getBoundingClientRect();
    const dropRect = drop.getBoundingClientRect();
    const containerRect = gameContainer.getBoundingClientRect();

    // Calculate positions relative to the game container
    const bucketLeft = bucketRect.left - containerRect.left;
    const bucketRight = bucketRect.right - containerRect.left;
    const bucketTop = bucketRect.top - containerRect.top;

    const dropLeft = dropRect.left - containerRect.left;
    const dropRight = dropRect.right - containerRect.left;
    const dropBottom = dropRect.bottom - containerRect.top;

    // Horizontal overlap
    const isHorizontallyOverlapping =
      dropRight > bucketLeft && dropLeft < bucketRight;
    // Vertical: drop bottom touches or passes bucket top (with a little offset for forgiveness)
    const offset = 35; // px above the bucket
    const isTouchingAbove = dropBottom >= (bucketTop - offset);

    if (isHorizontallyOverlapping && isTouchingAbove) {
      drop.remove();
      // Add 1 point
      let scoreElem = document.getElementById("score");
      let score = parseInt(scoreElem.textContent, 10) || 0;
      scoreElem.textContent = score + 1;
      return; // Stop checking
    }

    // Apply wind if active
    if (windActive) {
        let left = parseFloat(drop.style.left);
        left += windDirection * 1.5; // Adjust speed as needed
        left = Math.max(0, Math.min(left, gameContainer.offsetWidth - drop.offsetWidth));
        drop.style.left = left + "px";
    }

    if (drop.parentNode) {
      requestAnimationFrame(checkCollision);
    }
  }

  requestAnimationFrame(checkCollision);

  // Remove drops that reach the bottom (weren't caught)
  setTimeout(() => {
    if (drop.parentNode) {
        showSplash(drop);
        drop.remove();
        // Deduct points
        let scoreElem = document.getElementById("score");
        let score = parseInt(scoreElem.textContent, 10) || 0;
        score = Math.max(0, score - 1);
        scoreElem.textContent = score;

        // Track missed drops
        missedDrops++;
        if (missedDrops >= maxMisses) {
            endGame("You missed too many drops! Game Over.");
        }
    }
}, 4000); // 4000ms should match your drop animation duration
}

function showSplash(drop) {
    const splash = document.createElement("div");
    splash.className = "splash";
    // Position splash at the bottom where the drop lands
    const dropLeft = parseFloat(drop.style.left) || 0;
    const dropWidth = parseFloat(drop.style.width) || 60;
    splash.style.left = `${dropLeft + dropWidth / 2 - 20}px`; // Center splash under drop
    splash.style.bottom = "0px";
    gameContainer.appendChild(splash);
    setTimeout(() => splash.remove(), 500);
}

const bucket = document.getElementById("bucket");
const gameContainer = document.getElementById("game-container");

// Track bucket position as a percentage of game width
let bucketX = 0.5; // 0 (left) to 1 (right)

// Move bucket with mouse
gameContainer.addEventListener("mousemove", (e) => {
    const rect = gameContainer.getBoundingClientRect();
    const bucketWidth = bucket.offsetWidth;
    let x = e.clientX - rect.left;
    // Clamp so bucket stays fully inside container
    x = Math.max(0, Math.min(x, rect.width));
    // Calculate bucketX as a value from 0 (left) to 1 (right)
    bucketX = x / rect.width;
    updateBucketPosition();
});

// Move bucket with arrow keys
document.addEventListener("keydown", (e) => {
    const step = 0.03;
    if (e.key === "ArrowLeft") {
        bucketX = Math.max(0, bucketX - step);
        updateBucketPosition();
    } else if (e.key === "ArrowRight") {
        bucketX = Math.min(1, bucketX + step);
        updateBucketPosition();
    }
});

function updateBucketPosition() {
    const containerWidth = gameContainer.offsetWidth;
    const bucketWidth = bucket.offsetWidth;
    // Position so left edge at 0 when bucketX=0, right edge at max when bucketX=1
    const x = bucketX * (containerWidth - bucketWidth);
    bucket.style.left = `${x}px`;
    bucket.style.transform = ""; // Remove translateX(-50%) for direct positioning
}

// Initialize bucket position on load
window.addEventListener("resize", updateBucketPosition);
window.addEventListener("DOMContentLoaded", updateBucketPosition);

document.getElementById('how-to-play-btn').onclick = function() {
    document.getElementById('how-to-play-modal').style.display = 'flex';
};
document.querySelector('.close-modal').onclick = function() {
    document.getElementById('how-to-play-modal').style.display = 'none';
};
window.onclick = function(event) {
    const modal = document.getElementById('how-to-play-modal');
    if (event.target == modal) {
        modal.style.display = 'none';
    }
};

// Pause button event
document.getElementById("pause-btn").addEventListener("click", function() {
    if (!gameRunning) return;
    gamePaused = !gamePaused;
    if (gamePaused) {
        clearInterval(dropMaker);
        clearInterval(timerInterval); // Pause the timer
        this.textContent = "Resume";
        document.querySelectorAll('.water-drop').forEach(drop => {
            if (drop._animation) drop._animation.pause();
        });
    } else {
        dropMaker = setInterval(createDrop, 1000);
        timerInterval = setInterval(updateTimer, 1000); // Resume the timer
        this.textContent = "Pause";
        document.querySelectorAll('.water-drop').forEach(drop => {
            if (drop._animation) drop._animation.play();
        });
    }
});

// Reset button event
document.getElementById("reset-btn").addEventListener("click", function() {
    // Stop game and clear intervals
    gameRunning = false;
    gamePaused = false;
    clearInterval(dropMaker);
    clearInterval(timerInterval);
    // Remove all drops
    document.querySelectorAll('.water-drop').forEach(drop => drop.remove());
    // Reset score and timer
    document.getElementById("score").textContent = "0";
    document.getElementById("time").textContent = "30";
    // Reset bucket position
    bucketX = 0.5;
    updateBucketPosition && updateBucketPosition();
});

function endGame(message) {
    gameRunning = false;
    clearInterval(dropMaker);
    clearInterval(timerInterval);
    // Remove all drops
    document.querySelectorAll('.water-drop').forEach(drop => drop.remove());
    showLosePopup(message);
    missedDrops = 0;
}

function endGameByScore() {
    gameRunning = false;
    clearInterval(dropMaker);
    clearInterval(timerInterval);
    document.querySelectorAll('.water-drop').forEach(drop => drop.remove());
    let score = parseInt(document.getElementById("score").textContent, 10) || 0;
    if (score >= 20) {
        showWinCelebration();
    } else {
        showLosePopup("Time's up! You needed 20 points to win. Try again!");
    }
}

// CSS for water drop animation
const style = document.createElement('style');
style.textContent = `
@keyframes dropFall {
    0% { transform: translateY(-60px) scale(1); }
    80% { transform: translateY(80%) scale(1.1); }
    100% { transform: translateY(100%) scale(1); }
}
.water-drop {
    animation: dropFall 4s linear forwards;
}
`;
document.head.append(style);

bucket.classList.add('bucket-bounce');
setTimeout(() => bucket.classList.remove('bucket-bounce'), 300);

function celebrateWin() {
    // Simple confetti using emoji
    const confetti = document.createElement('div');
    confetti.innerHTML = "🎉🎊✨";
    confetti.style.position = "fixed";
    confetti.style.top = "30%";
    confetti.style.left = "50%";
    confetti.style.transform = "translate(-50%, -50%)";
    confetti.style.fontSize = "3rem";
    confetti.style.zIndex = "999";
    document.body.appendChild(confetti);
    setTimeout(() => confetti.remove(), 2000);

    // Optional: Play a sound
    // let audio = new Audio('win-sound.mp3');
    // audio.play();
}

function showWinCelebration() {
    // Confetti burst!
    if (typeof confetti === "function") {
        confetti({
            particleCount: 120,
            spread: 90,
            origin: { y: 0.6 }
        });
    }

    // Show custom win popup
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
        document.getElementById("reset-btn").click();
    };
}

function updateTimer() {
    if (gamePaused) return; // Don't decrement if paused
    timeLeft--;
    document.getElementById("time").textContent = timeLeft;
    if (timeLeft <= 0) {
        clearInterval(timerInterval);
        endGameByScore();
    }
}

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
