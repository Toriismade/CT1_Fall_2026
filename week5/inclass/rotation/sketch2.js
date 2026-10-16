let radius;
const numRings = 10;
let strWeight = 20;
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
        stroke(TWO_PI/numRings * i, 0.8, 0.8);
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