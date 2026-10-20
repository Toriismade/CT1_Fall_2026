// --- Sketch 1 Variables (Background Arcs) ---
let bgBuffer;
let arcRadius;
const numRings = 3;
let strWeight = 70;
let aWidth, aHeight;

// --- Sketch 2 Variables (Interactive Wheel Carousel) ---
let currentAngle = 0;
let targetAngle = 0;
const totalItems = 8;
const wheelRadius = 170;
const boxSize = 75;

function setup() {
  createCanvas(windowWidth, windowHeight);
  rectMode(CENTER);

  // 1. Create an offscreen buffer for the blurred background
  bgBuffer = createGraphics(windowWidth, windowHeight);
  // Set HSL on the background buffer
  bgBuffer.colorMode(HSL, TWO_PI, 1, 1, 1);
  bgBuffer.noFill();
  arcRadius = width * 0.2;
}

function draw() {
  // Clear the main screen
  background(255);

  // ==========================================
  // LAYER 1: First Sketch (Animated Blurred Background)
  // ==========================================
  bgBuffer.background(255);
  bgBuffer.noFill();

  let t = frameCount * 0.01;

  for (let i = 0; i < numRings; i++) {
    // Noise-driven blue hue & lightness
    let minBlueHue = (195 / 360) * TWO_PI;
    let maxBlueHue = (255 / 360) * TWO_PI;
    let h = map(noise(t, i * 10), 0, 1, minBlueHue, maxBlueHue);
    let l = map(noise(t + 100, i * 10), 0, 1, 0.35, 0.75);
    let s = map(noise(t + 200, i * 10), 0, 1, 0.8, 1.0);

    bgBuffer.stroke(h, s, l);
    bgBuffer.strokeWeight(strWeight);

    aWidth = arcRadius * 2 + (strWeight * i * 2);
    aHeight = aWidth;

    bgBuffer.push();
    bgBuffer.translate(width / 2, height / 2);
    bgBuffer.rotate(sin(millis() * 0.0005 * (i + 1)));
    bgBuffer.arc(0, 0, aWidth, aHeight, (3 / 4) * PI, (1 / 4) * PI);
    bgBuffer.pop();
  }

  // Apply Gaussian blur ONLY to the off-screen background buffer
  bgBuffer.filter(BLUR, 10);

  // Render the blurred graphics buffer onto the main canvas
  image(bgBuffer, 0, 0);

  // ==========================================
  // LAYER 2: Second Sketch (Foreground Carousel)
  // ==========================================
  push();
  // Smooth easing toward the target angle
  currentAngle = lerp(currentAngle, targetAngle, 0.08);

  // Move origin to the screen center
  translate(width / 2, height / 2);

  // Central hub ring
  noFill();
  stroke(180);
  strokeWeight(1.5);
  circle(0, 0, 70);

  // Rotating rounded squares
  for (let i = 0; i < totalItems; i++) {
    let angle = currentAngle + (TWO_PI / totalItems) * i;

    let x = cos(angle) * wheelRadius;
    let y = sin(angle) * wheelRadius;

    push();
    translate(x, y);

    fill(245, 230); // slight transparency so background softly bleeds through
    stroke(180);
    strokeWeight(1);
    rect(0, 0, boxSize, boxSize, 18);

    // Number text
    fill(80);
    noStroke();
    textAlign(CENTER, CENTER);
    textSize(14);
    text(i + 1, 0, 0);

    pop();
  }
  pop();
}

// Map scroll to wheel rotation
function mouseWheel(event) {
  targetAngle += event.delta * 0.002;
  return false; // Prevent page scrolling
}

// Keep canvas and buffer responsive
function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
  bgBuffer.resizeCanvas(windowWidth, windowHeight);
  arcRadius = width * 0.1;
}