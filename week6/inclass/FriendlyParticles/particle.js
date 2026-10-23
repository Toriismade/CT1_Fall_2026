class Particle {
    constructor(_x, _y) {
        this.pos = createVector(_x, _y)
        this.size = 60
        this.velocity = createVector(random(-4, 4), random(-4, 4))
        this.clr = color(random(255), random(255), random(255))

        this.frendliness = random(270,200)
    }


    move() {
        this.pos.add(this.velocity)
        
        if(this.pos.x - this.size/2 <= 0) {
            this.velocity.x *= -1
            this.pos.x = this.size/2
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

    reachOut(_allparticles){
        _allparticles.forEach((p) => {
            if(this.pos.dist(p.pos) <= this.frendliness){
                stroke(255)
                line(this.pos.x, this.pos.y, p.pos.x, p.pos.y)
            }
        })


    }

}