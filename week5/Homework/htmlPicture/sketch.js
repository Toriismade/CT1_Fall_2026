// ==========================================
// FOREGROUND SKETCH: Clipped Image Carousel
// ==========================================
new p5((p) => {
  let currentAngle = 0;
  let targetAngle = 0;
  const totalItems = 8;
  const wheelRadius = 170;
  const boxSize = 75;
  const cornerRadius = 18; // Rounded corner radius

  let imgs = [];

  // 1. Preload and clip each picture to the rounded square
  p.preload = () => {
    // A. Create the rounded mask graphic once
    let maskGraphic = p.createGraphics(boxSize, boxSize);
    maskGraphic.pixelDensity(1);
    maskGraphic.background(0, 0); // Transparent background
    maskGraphic.fill(255);        // Solid white mask shape
    maskGraphic.noStroke();
    maskGraphic.rect(0, 0, boxSize, boxSize, cornerRadius);

    // B. Load, resize, and mask each image
    for (let i = 0; i < totalItems; i++) {
      p.loadImage(`assets/${i + 1}.jpg`, (loadedImg) => {
        // Resize picture to fill the square completely
        loadedImg.resize(boxSize, boxSize);
        // Clip image to the rounded square
        loadedImg.mask(maskGraphic);
        imgs[i] = loadedImg;
      });
    }
  };

  p.setup = () => {
    p.createCanvas(p.windowWidth, p.windowHeight);
    p.rectMode(p.CENTER);
    p.imageMode(p.CENTER);
  };

  p.draw = () => {
    p.clear();

    currentAngle = p.lerp(currentAngle, targetAngle, 0.08);

    p.push();
    p.translate(p.width / 2, p.height / 2);

    for (let i = 0; i < totalItems; i++) {
      let angle = currentAngle + (p.TWO_PI / totalItems) * i;
      let x = p.cos(angle) * wheelRadius;
      let y = p.sin(angle) * wheelRadius;

      p.push();
      p.translate(x, y);

// 1. Draw your pre-clipped picture
      if (imgs[i]) {
        p.image(imgs[i], 0, 0, boxSize, boxSize);
      }

      // ==========================================
      // INTENSE WHITE DROP SHADOW / GLOW
      // ==========================================
      p.noFill();
      p.stroke(255);
      p.strokeWeight(1.5); // Slightly thicker stroke to cast more light

      // Layer 1: Wide, diffused outer white halo
      p.drawingContext.shadowColor = 'rgba(255, 255, 255, 1.0)'; // Full solid white
      p.drawingContext.shadowBlur = 32;                          // Wide dispersion
      p.drawingContext.shadowOffsetX = 0;
      p.drawingContext.shadowOffsetY = 6;                        // Downward bias
      p.rect(0, 0, boxSize, boxSize, cornerRadius);

      // Layer 2: Tight, intense inner rim glow (stacks on top)
      p.drawingContext.shadowBlur = 12;                          // Concentrated bright core
      p.drawingContext.shadowOffsetY = 3;
      p.rect(0, 0, boxSize, boxSize, cornerRadius);

      // Reset immediately so subsequent drawings aren't blurred
      p.drawingContext.shadowBlur = 0;

      p.pop();
    }
    p.pop();
  };

  p.mouseWheel = (event) => {
    targetAngle += event.delta * 0.002;
    return false;
  };

  p.windowResized = () => {
    p.resizeCanvas(p.windowWidth, p.windowHeight);
  };
}, 'fg-container');