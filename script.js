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

  // Make sure drops spawn fully inside the game area
  const gameWidth = gameContainer.offsetWidth;
  const xPosition = Math.random() * (gameWidth - size);
  drop.style.left = xPosition + "px";

  // Make drops fall for 4 seconds
  drop.style.animationDuration = "4s";

  // Add the new drop to the game screen
  gameContainer.appendChild(drop);

  // Collision detection loop
  function checkCollision() {
    const bucketRect = bucket.getBoundingClientRect();
    const dropRect = drop.getBoundingClientRect();

    // Ensure both bucket and drop exist before checking collision
    if (!bucket || !drop) return;

    // Horizontal overlap
    const isHorizontallyOverlapping =
      dropRect.right > bucketRect.left && dropRect.left < bucketRect.right;
    // Check if drop is touching the bucket from above
    // We consider a drop touching if its bottom edge is within 60px above the bucket
    // This allows for a bit of leeway in catching drops; adjust the offset as needed for your game design
    const offset = 35; // px above the bucket
    const isTouchingAbove = dropRect.bottom >= (bucketRect.top - offset);

    if (isHorizontallyOverlapping && isTouchingAbove) {
      drop.remove();
      return; // Stop checking
    }

    // If drop is still in the DOM, keep checking
    if (drop.parentNode) {
      requestAnimationFrame(checkCollision);
    }
  }

  requestAnimationFrame(checkCollision);

  // Remove drops that reach the bottom (weren't caught)
  drop.addEventListener("animationend", () => {
    showSplash(drop);
    drop.remove();
  });
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
