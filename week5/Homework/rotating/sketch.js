let currentAngle = 0;
let targetAngle = 0;
const totalItems = 8;
const radius = 170; 
const boxSize = 75; 

function setup() {
  createCanvas(windowWidth, windowHeight);
  rectMode(CENTER);
}

function draw() {
  background(255);

  // Smooth easing toward the target angle
  currentAngle = lerp(currentAngle, targetAngle, 0.08);

  // Move origin to the screen center
  translate(width / 2, height / 2);

  // Draw the central circle / hub
  noFill();
  stroke(220);
  strokeWeight(1.5);
  circle(0, 0, 70);

  // Draw rotating rounded squares
  for (let i = 0; i < totalItems; i++) {
    // Distribute angles evenly around the ring
    let angle = currentAngle + (TWO_PI / totalItems) * i;

    // Convert polar angle to Cartesian (x, y) coordinates
    let x = cos(angle) * radius;
    let y = sin(angle) * radius;

    push();
    translate(x, y);

    fill(235);
    stroke(200);
    strokeWeight(1);
    // Draw rounded square (rectMode is CENTER)
    rect(0, 0, boxSize, boxSize, 18);

    // Placeholder item number
    fill(120);
    noStroke();
    textAlign(CENTER, CENTER);
    textSize(14);
    text(i + 1, 0, 0);

    pop();
  }
}

// Map mouse scroll to wheel rotation
function mouseWheel(event) {
  // event.delta gives scroll direction and magnitude
  targetAngle += event.delta * 0.002;
  // Prevent page default scroll
  return false;
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}