new p5((p) => {

  let radius = 120; 
  const numRings = 3;
  let strWeight = 75; 
  let aWidth, aHeight;

  p.setup = () => {
    p.createCanvas(p.windowWidth, p.windowHeight);
    p.colorMode(p.HSL, p.TWO_PI, 1, 1, 1);
  };

  p.draw = () => {
    p.background(255);
    p.noFill();

    let t = p.frameCount * 0.01;

    for (let i = 0; i < numRings; i++) {
      let minBlueHue = (195 / 360) * p.TWO_PI;
      let maxBlueHue = (255 / 360) * p.TWO_PI;
      let h = p.map(p.noise(t, i * 10), 0, 1, minBlueHue, maxBlueHue);
      let l = p.map(p.noise(t + 100, i * 10), 0, 1, 0.35, 0.75);
      let s = p.map(p.noise(t + 200, i * 10), 0, 1, 0.8, 1.0);

      p.stroke(h, s, l);
      p.strokeWeight(strWeight);

      // 固定直径公式，不再随屏幕宽度抖动
      aWidth = radius * 2 + (strWeight * i * 2);
      aHeight = aWidth;

      p.push();
      // 锚定在屏幕中心
      p.translate(p.width / 2, p.height / 2);
      p.rotate(p.sin(p.millis() * 0.0005 * (i + 1)));
      p.arc(0, 0, aWidth, aHeight, (3 / 4) * p.PI, (1 / 4) * p.PI);
      p.pop();
    }
  };

  p.windowResized = () => {
    p.resizeCanvas(p.windowWidth, p.windowHeight);
    // 这里只更新画布分辨率，不再重新计算 radius！
  };
}, 'bg-container');