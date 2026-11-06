let handPose;
let video;
let hands=[];
let gameBall, gamePaddle;



async function setup() {
    createCanvas(640, 480);

    video = createCapture(VIDEO, {flipped: true});
    video.size(640, 480);
    video.hide();

    handPose = await ml5.handPose({flipped: true});

    gameBall = new Ball(width/2, height/2);
    gamePaddle = new Paddle();

    handPose.detectStart(video, gotHands);
}

function draw() {
    background(220);

    image(video, 0, 0);

    gameBall.move();
    gameBall.display();

    if (hands[0]) {
        gamePaddle.update(hands[0].index_finger_tip, hands[0].thumb_tip);
        gamePaddle.display();

    fill(255, 0, 0);
    circle(hands[0].index_finger_tip.x, hands[0].index_finger_tip.y, 20);

    fill(0, 255, 0);
    circle(hands[0].thumb_tip.x, hands[0].thumb_tip.y, 20);
}   
}

function gotHands(results) {
    if (results.length > 0) {
        console.log(results);
        hands = results;
    }
}

class Paddle {
    constructor() {
        this.pos = createVector(width - 100, 200)
        this.height = 60
        this.width = 20
        this.clr = color(255, 0, 0)
    }

    update(point1, point2) {
        this.pos.y = point1.y;
        this.height = point2.y - point1.y;
    }

    display() {
        fill(this.clr)
        rect(this.pos.x, this.pos.y, this.width, this.height)
    }
}

class Ball {
    constructor(_x, _y) {
        this.pos = createVector(_x, _y)
        this.size = 60
        this.velocity = createVector(random(-4, 4), random(-4, 4))
        this.clr = color(random(255), random(255), random(255))

        this.frendliness = random(270,200)
    }


    move(paddle=null) {
        this.pos.add(this.velocity)
        
        if(this.pos.x - this.size/2 <= 0) {
            this.velocity.x *= -1
            this.pos.x = this.size/2
        }

        if(this.pos.x + this.size/2 >= paddle.pos.x && this.pos.y >= paddle.pos.y && this.pos.y <= paddle.pos.y + paddle.height) {
            this.velocity.x *= -1
            this.pos.x = paddle.pos.x - this.size/2
        }

        if(this.pos.x + this.size/2 >= width) {
            this.velocity.x *= -1
            this.pos.x = width - this.size/2
        }

        if(this.pos.y - this.size/2 <= 0 ) {
            this.velocity.y *= -1
            this.pos.y = this.size/2
        }

        if(this.pos.y + this.size/2 >= height) {
            this.velocity.y *= -1
            this.pos.y = height - this.size/2
        }

    }

    display() {
        fill(this.clr)
        circle(this.pos.x, this.pos.y, this.size)
        noStroke()
  
    }

    


}