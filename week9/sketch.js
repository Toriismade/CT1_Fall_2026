// =============================================
// 简单版椋鸟群：鸟群会飞向你的食指指尖
// =============================================

let video;          // 摄像头画面
let handPose;       // ml5 的手部识别模型
let hands = [];     // 识别到的手（每帧更新）
let birds = [];     // 所有的鸟都放在这个数组里

const NUM_BIRDS = 10;   // 鸟的数量


// ---------- 1. 加载模型（在 setup 之前运行） ----------
function preload() {
  // flipped: true 表示镜像，你往右动手，画面里的手也往右
  handPose = ml5.handPose({ flipped: true });
}


// ---------- 2. 初始化（只运行一次） ----------
function setup() {
  createCanvas(640, 480);

  // 打开摄像头，但不把画面画出来
  video = createCapture(VIDEO, { flipped: true });
  video.size(640, 480);
  video.hide();

  // 开始识别手。每次识别出结果，就调用 gotHands
  handPose.detectStart(video, gotHands);

  // 造 300 只鸟，用 push 一只一只放进 birds 数组
  for (let i = 0; i < NUM_BIRDS; i++) {
    birds.push(new Bird(random(width), random(height)));
  }
}

// ml5 识别完会把结果交给这个函数
function gotHands(results) {
  hands = results;
}


// ---------- 3. 每一帧都运行（大约每秒 60 次） ----------
function draw() {
background(235, 205, 180);   // 用背景色盖掉上一帧

 image(video, 0, 0);

  // 目标点：默认在画面中间
  let targetX = width / 2;
  let targetY = height / 2;

  // 如果看到手，目标点就是食指指尖
  // 每只手有 21 个关键点，编号 8 是食指指尖
  if (hands.length > 0) {
    let fingerTip = hands[0].keypoints[8];
    targetX = fingerTip.x;
    targetY = fingerTip.y;

    // 在指尖画一个小圆圈
    noFill();
    stroke(225);
    strokeWeight(4);
    circle(targetX, targetY, 10);
  }

  // 让每只鸟：看邻居 → 飞向目标 → 移动 → 画出来
  for (let bird of birds) {
    bird.flock(birds);
    bird.seek(targetX, targetY);
    bird.update();
    bird.show();
  }
}


// ---------- 4. 鸟（每只鸟都是这个类的一个"实例"） ----------
class Bird {
  constructor(x, y) {
    this.x = x;                 // 位置
    this.y = y;
    this.vx = random(-1, 1);    // 速度：每帧往 x、y 方向各走多少像素
    this.vy = random(-1, 1);
  }

  // 鸟群三规则：只看附近 50 像素以内的鸟
  flock(others) {
    let sumVX = 0, sumVY = 0;   // 用来算邻居的平均速度（对齐）
    let sumX = 0, sumY = 0;     // 用来算邻居的平均位置（聚拢）
    let awayX = 0, awayY = 0;   // 用来远离太近的鸟（分离）
    let count = 0;              // 有几个邻居

    for (let other of others) {
      if (other === this) continue;   // 跳过自己

      let d = dist(this.x, this.y, other.x, other.y);
      if (d < 50) {
        sumVX += other.vx;
        sumVY += other.vy;
        sumX += other.x;
        sumY += other.y;
        count++;

        // 太近了（小于 12 像素）就往反方向躲，越近躲得越用力
        if (d < 12 && d > 0) {
          awayX += (this.x - other.x) / d;
          awayY += (this.y - other.y) / d;
        }
      }
    }

    if (count > 0) {
      // 规则 1 对齐：速度慢慢变成邻居的平均速度
      this.vx += (sumVX / count - this.vx) * 0.05;
      this.vy += (sumVY / count - this.vy) * 0.05;

      // 规则 2 聚拢：往邻居的平均位置靠一点
      this.vx += (sumX / count - this.x) * 0.002;
      this.vy += (sumY / count - this.y) * 0.002;
    }

    // 规则 3 分离：躲开太近的鸟
    this.vx += awayX * 0.4;
    this.vy += awayY * 0.4;
  }

  // 飞向目标点：慢慢把速度转向"朝着目标"的方向
  seek(tx, ty) {
    let dx = tx - this.x;
    let dy = ty - this.y;
    let d = sqrt(dx * dx + dy * dy);
    if (d > 0) {
      // 想要的速度：方向朝着目标，大小是 3
      let wantX = dx / d * 3;
      let wantY = dy / d * 3;
      // 每帧只转一点点（3%），所以鸟会画着弧线飞过去
      this.vx += (wantX - this.vx) * 0.03;
      this.vy += (wantY - this.vy) * 0.03;
    }
  }

  // 限制速度，然后移动
  update() {
    let speed = sqrt(this.vx * this.vx + this.vy * this.vy);
    let maxSpeed = 3.5;
    let minSpeed = 1.5;   // 鸟不能停在空中，所以有最低速度

    if (speed > maxSpeed) {
      this.vx = this.vx / speed * maxSpeed;
      this.vy = this.vy / speed * maxSpeed;
    } else if (speed < minSpeed && speed > 0) {
      this.vx = this.vx / speed * minSpeed;
      this.vy = this.vy / speed * minSpeed;
    }

    this.x += this.vx;
    this.y += this.vy;
  }

  // 画成一个小黑点
  show() {
    let angle = atan2(this.vy, this.vx);   // 速度的方向（角度）

    push();                     // 保存当前的画布设置
    translate(this.x, this.y);  // 把原点 (0,0) 移到这只鸟的位置
    rotate(angle);              // 把画布转到鸟飞的方向

    noStroke();
    fill(255, 204, 0);
    triangle(6, 0, -4, -3, -4, 3);   // 尖头朝右（x 正方向）

    pop();                      // 恢复画布设置，不影响下一只鸟
  }
}