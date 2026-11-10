const CONFIG = {
    leafEverySeconds: 1,
    acornEverySeconds: 10,
    fallDurationMin: 2500,
    fallDurationMax: 4500,
    groundDepth: 70,
    maxSettledItems: 500,
    dogFollowSpeed: 0.12,
    dogTurnThreshold: 2
};

const IMAGES = {
    leaf: "images/leaf.png",
    acorn: "images/acorn.png",
    dogLeft: "images/dog-left.png",
    dogRight: "images/dog-right.png"
};

const world = document.getElementById("world");
const dog   = document.getElementById("dog");

let targetX    = window.innerWidth / 2; // where the mouse is
let dogX       = targetX;               // where the dog actually is (it eases toward the mouse)
let lastMouseX = targetX;               // mouse position at the previous movement
let facing     = "right";               // which png is showing right now

// Load both dog images up front so swapping directions never flickers
[IMAGES.dogLeft, IMAGES.dogRight].forEach(src => { new Image().src = src; });
 
// If a dog png is missing, show a brown box so the page still works
dog.addEventListener("error", () => dog.classList.add("missing"));
 
window.addEventListener("mousemove", (event) => {
  const movement = event.clientX - lastMouseX; // negative = moved left, positive = moved right
 
  // Ignore tiny jitters; only turn when the mouse really moves
  if (Math.abs(movement) > CONFIG.dogTurnThreshold) {
    const newFacing = movement < 0 ? "left" : "right";
 
    // Only touch the image if the direction actually changed
    if (newFacing !== facing) {
      facing = newFacing;
      dog.src = facing === "left" ? IMAGES.dogLeft : IMAGES.dogRight;
    }
  }
 
  lastMouseX = event.clientX;
  targetX    = event.clientX; // note: we only use X, so the dog never leaves the bottom
});
 
// Runs about 60 times per second, sliding the dog a little closer to the mouse each time
function animateDog() {
  dogX += (targetX - dogX) * CONFIG.dogFollowSpeed;
 
  // Keep the dog fully on screen
  const halfDog = dog.offsetWidth / 2;
  const clampedX = Math.max(0, Math.min(window.innerWidth - dog.offsetWidth, dogX - halfDog));
 
  dog.style.transform = `translateX(${clampedX}px)`;
  requestAnimationFrame(animateDog);
}
animateDog();
 
/* =========================================================
   PART 2: FALLING THINGS (leaves and acorns)
   ========================================================= */
function random(min, max) {
  return Math.random() * (max - min) + min;
}
 
function dropItem(type) {
  // 1. Create the image element
  const item = document.createElement("img");
  item.src = type === "leaf" ? IMAGES.leaf : IMAGES.acorn;
  item.className = `item ${type}`;
  item.alt = "";
  item.addEventListener("error", () => item.classList.add("missing")); // placeholder if png missing
  world.appendChild(item);
 
  // 2. Decide where it starts and where it will land
  const startX = random(0, window.innerWidth - 30);          // random spot across the top
  const drift  = random(-60, 60);                            // slight sideways wander while falling
  const endX   = Math.max(0, Math.min(window.innerWidth - 30, startX + drift));
  const endY   = window.innerHeight - random(25, CONFIG.groundDepth); // random spot on the ground band
  const spin   = random(-180, 180);                          // how far it rotates on the way down
  const duration = random(CONFIG.fallDurationMin, CONFIG.fallDurationMax);
 
  // 3. Describe the fall as three keyframes (start, a sway in the middle, landing)
  const finalPosition = `translate(${endX}px, ${endY}px) rotate(${spin}deg)`;
  const keyframes = [
    { transform: `translate(${startX}px, -40px) rotate(0deg)` },
    { transform: `translate(${startX + drift * -0.5}px, ${endY * 0.5}px) rotate(${spin * 0.5}deg)`, offset: 0.5 },
    { transform: finalPosition }
  ];
 
  // 4. Play it. When finished, lock the item at its landing spot permanently.
  const animation = item.animate(keyframes, { duration, easing: "ease-in" });
  item.style.transform = keyframes[0].transform; // so it doesn't flash at the corner before animating
  animation.onfinish = () => {
    item.style.transform = finalPosition;
  };
 
  // 5. Housekeeping: don't let the page grow forever
  while (world.children.length > CONFIG.maxSettledItems) {
    world.removeChild(world.firstChild);
  }
}
 
/* =========================================================
   PART 3: THE CLOCK
   ========================================================= */
let secondsPassed = 0;
 
setInterval(() => {
  secondsPassed++;
 
  if (secondsPassed % CONFIG.leafEverySeconds === 0) {
    dropItem("leaf");
  }
  if (secondsPassed % CONFIG.acornEverySeconds === 0) {
    dropItem("acorn");
  }
}, 1000); // 1000 milliseconds = 1 second