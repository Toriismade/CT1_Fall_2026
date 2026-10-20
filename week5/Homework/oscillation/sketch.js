let radius;
const numRings = 3;
let strWeight = 40;
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
    
    for (let i = 0; i < numRings; i++){
        // Hue: Fixed to blue (4/3 * PI)
        let h = (4 / 3) * PI;
        let s = 0.9;
        // Vary lightness from dark (0.35) to bright (0.75) across rings
        let l = map(i, 0, numRings - 1, 0.35, 0.75);

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