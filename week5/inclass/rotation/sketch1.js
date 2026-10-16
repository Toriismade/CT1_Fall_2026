let angle = 0;

function setup() {
    createCanvas(800, 600), document.getElementById('sk1').appendChild(canvas);

}

function draw() {
    background(220);
    

    //draw a grid
    makeGrid();

    //transform
    push()

    translate(100+100, 70+75);

    rotate(angle);
    fill(46, 77, 157);
    rect(-100, -70, 200, 150)

    makeGrid();

    pop()

    angle += 0.01;

}

function makeGrid(gridRes = 10){
    let xVal = width/gridRes;
    for(let x = 0; x<gridRes; x++){
        line(xVal * x, 0, xVal * x, height);
    }
    let yVal = height/gridRes;
    for(let y = 0; y<gridRes; y++){
        line(0, yVal * y, width, yVal * y);
    }
}
