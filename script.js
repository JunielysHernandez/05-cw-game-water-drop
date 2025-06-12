// Variables to control game state
let gameRunning = false; // Keeps track of whether game is active or not
let dropMaker; // Will store our timer that creates drops regularly

// Wait for button click to start the game
document.getElementById("start-btn").addEventListener("click", startGame);

function startGame() {
  // Prevent multiple games from running at once
  if (gameRunning) return;

  gameRunning = true;

  // Create new drops every second (1000 milliseconds)
  dropMaker = setInterval(createDrop, 1000);
}

function createDrop() {
  // Create a new div element that will be our water drop
  const drop = document.createElement("div");
  drop.className = "water-drop";

  // Make drops different sizes for visual variety
  const initialSize = 60;
  const sizeMultiplier = Math.random() * 0.8 + 0.5;
  const size = initialSize * sizeMultiplier;
  drop.style.width = drop.style.height = `${size}px`;

  // Position the drop randomly across the game width
  // Subtract 60 pixels to keep drops fully inside the container
  const gameWidth = document.getElementById("game-container").offsetWidth;
  const xPosition = Math.random() * (gameWidth - 60);
  drop.style.left = xPosition + "px";

  // Make drops fall for 4 seconds
  drop.style.animationDuration = "4s";

  // Add the new drop to the game screen
  document.getElementById("game-container").appendChild(drop);

  // Remove drops that reach the bottom (weren't clicked)
  drop.addEventListener("animationend", () => {
    drop.remove(); // Clean up drops that weren't caught
  });
}

const bucket = document.getElementById("bucket");
const gameContainer = document.getElementById("game-container");

// Track bucket position as a percentage of game width
let bucketX = 0.5; // 0 (left) to 1 (right)

// Move bucket with mouse
gameContainer.addEventListener("mousemove", (e) => {
    const rect = gameContainer.getBoundingClientRect();
    let x = e.clientX - rect.left;
    // Clamp so bucket stays inside container
    x = Math.max(0, Math.min(x, rect.width));
    bucketX = x / rect.width;
    updateBucketPosition();
});

// Move bucket with arrow keys
document.addEventListener("keydown", (e) => {
    if (e.key === "ArrowLeft") {
        bucketX = Math.max(0, bucketX - 0.03);
        updateBucketPosition();
    } else if (e.key === "ArrowRight") {
        bucketX = Math.min(1, bucketX + 0.03);
        updateBucketPosition();
    }
});

function updateBucketPosition() {
    const containerWidth = gameContainer.offsetWidth;
    const bucketWidth = bucket.offsetWidth;
    const x = bucketX * (containerWidth - bucketWidth);
    bucket.style.left = `${x}px`;
    bucket.style.transform = ""; // Remove translateX(-50%) for direct positioning
}

// Initialize bucket position on load
window.addEventListener("resize", updateBucketPosition);
window.addEventListener("DOMContentLoaded", updateBucketPosition);
