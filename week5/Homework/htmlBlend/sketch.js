new p5((p) => {
  let currentAngle = 0;
  let targetAngle = 0;
  const totalItems = 8;
  const wheelRadius = 170;
  const boxSize = 75;

  p.setup = () => {
    p.createCanvas(p.windowWidth, p.windowHeight);
    p.rectMode(p.CENTER);
  };

  p.draw = () => {
    p.clear(); // Leaves the background transparent

    // Smooth inertia easing
    currentAngle = p.lerp(currentAngle, targetAngle, 0.08);

    p.push();
    p.translate(p.width / 2, p.height / 2);


    // Rotating rounded squares
    for (let i = 0; i < totalItems; i++) {
      let angle = currentAngle + (p.TWO_PI / totalItems) * i;
      let x = p.cos(angle) * wheelRadius;
      let y = p.sin(angle) * wheelRadius;

      p.push();
      p.translate(x, y);

      p.fill(245, 230); // Subtle opacity
      p.stroke(180);
      p.strokeWeight(1);
      p.rect(0, 0, boxSize, boxSize, 18);

      // Card index text
      p.fill(80);
      p.noStroke();
      p.textAlign(p.CENTER, p.CENTER);
      p.textSize(14);
      p.text(i + 1, 0, 0);

      p.pop();
    }
    p.pop();
  };

  p.mouseWheel = (event) => {
    targetAngle += event.delta * 0.002;
    return false; // Prevent default page scrolling
  };

  p.windowResized = () => {
    p.resizeCanvas(p.windowWidth, p.windowHeight);
  };
}, 'fg-container');