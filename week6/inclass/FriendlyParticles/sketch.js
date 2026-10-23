let particle = []

function setup() {
    createCanvas(800, 600);
    particle.push(new Particle(random(width), random(height)))
}

function draw() {
    background(170);
    particle.forEach((p) => {
        p.move();
        p.display();
        p.reachOut(particle);
    });
}

function mouseReleased() {
    particle.push(new Particle(mouseX, mouseY))
}