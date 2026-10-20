let radius;
const numRings = 3;
let strWeight = 60;
let aWidth;
let aHeight


function setup() {
    createCanvas(800, 800), document.getElementById('sk2');
    colorMode(HSL, TWO_PI, 1, 1, 1);
    radius = width * 0.1;
    
}

function draw() {
    background("black")
    noFill();
    
// Time variable to advance the noise smoothly over time
    let t = frameCount * 0.01;

    for (let i = 0; i < numRings; i++) {
        // 1. Noise-driven Blue Hue:
        // Constrain the hue around pure blue (4/3 * PI) from cyan-blue (~195°) to indigo (~255°)
        let minBlueHue = (195 / 360) * TWO_PI;
        let maxBlueHue = (255 / 360) * TWO_PI;
        // i * 10 offsets each ring in the noise space so they drift independently
        let h = map(noise(t, i * 10), 0, 1, minBlueHue, maxBlueHue);

        // 2. Noise-driven Lightness:
        // Drifts between deep blue (0.35) and vibrant glowing cyan/sky blue (0.75)
        let l = map(noise(t + 100, i * 10), 0, 1, 0.35, 0.75);

        // 3. Keep saturation rich and vivid
        let s = map(noise(t + 200, i * 10), 0, 1, 0.8, 1.0);

        stroke(h, s, l);
        strokeWeight(strWeight);
        
        aWidth = radius * 2 + (strWeight * i * 2);
        aHeight = aWidth;

        push()
        translate(width/2, height/2);
        rotate( sin(millis() * 0.0005 * (i + 1)) );


        arc(0,0, aWidth, aHeight, 3/4*PI, 1/4*PI);

        pop()
    }
    
}