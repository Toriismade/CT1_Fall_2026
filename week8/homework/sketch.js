// ---------- p5 + ml5 front end ----------
const NBIRDS = 14000;
const FOCAL = 1400, ELEV = 0.38;   // camera looks slightly up at the flock
const BUCKETS = 7;

let video, handPose, hands = [];
let handStates = [];
let roosts = [];                   // smoothed roost params, one per hand slot
let groups = 1;
let SC = 1;                        // world -> screen scale
let showCam = false, showHud = true, showHand = true;
let statusEl, hudEl;
let bx, bcount;                    // per-bucket draw lists

function preload() {
  handPose = ml5.handPose({ maxHands: 2, flipped: true });
}

function setup() {
  createCanvas(windowWidth, windowHeight);
  pixelDensity(1);
  statusEl = document.getElementById('status');
  hudEl = document.getElementById('hud');
  video = createCapture(VIDEO, { flipped: true });
  video.size(640, 480);
  video.hide();
  handPose.detectStart(video, r => { hands = r; });

  Flock.init(NBIRDS);
  Sound.init();
  bx = []; for (let k = 0; k < BUCKETS; k++) bx.push(new Float32Array(NBIRDS * 3));
  bcount = new Int32Array(BUCKETS);
  for (let k = 0; k < 2; k++) roosts.push({ x: 0, y: -100, z: 0, R: 220, coh: 1, sep: 1, th: 1, flat: 1, turn: 0, speed: 1 });
  buildBuffers();
}

function windowResized() { resizeCanvas(windowWidth, windowHeight); buildBuffers(); }

function buildBuffers() {
  SC = Math.min(width, height) / 620;
}

// ---------- hands ----------
function mapVideo(x, y) {
  const vw = video.width || 640, vh = video.height || 480;
  const s = Math.max(width / vw, height / vh);
  return [x * s + (width - vw * s) / 2, y * s + (height - vh * s) / 2];
}

function readHand(h) {
  const k = h.keypoints.map(p => mapVideo(p.x, p.y));
  let cx = 0, cy = 0;
  for (const i of [0, 5, 9, 13, 17]) { cx += k[i][0]; cy += k[i][1]; }
  cx /= 5; cy /= 5;
  const palm = Math.max(10, dist(k[0][0], k[0][1], k[9][0], k[9][1]));
  let spread = 0;
  for (const i of [4, 8, 12, 16, 20]) spread += dist(k[i][0], k[i][1], cx, cy);
  spread /= 5 * palm;
  const open = constrain(map(spread, 0.95, 1.8, 0, 1), 0, 1);
  const pinch = dist(k[4][0], k[4][1], k[8][0], k[8][1]) / palm < 0.32 && open > 0.25;
  const ang = Math.atan2(k[9][1] - k[0][1], k[9][0] - k[0][0]);
  const tilt = constrain((ang + HALF_PI) / (PI / 3), -1, 1);
  return { x: cx, y: cy, palm, open, pinch, tilt };
}

function updateHands() {
  let det = hands.map(readHand);
  if (det.length === 0 && mouseIsPressed) det = [{ x: mouseX, y: mouseY, palm: 90, open: 0.65, pinch: false, tilt: 0 }];
  det.sort((a, b) => a.x - b.x);
  const palmRef = Math.min(width, height) * 0.16;
  for (let i = 0; i < det.length; i++) {
    const d = det[i];
    let s = handStates[i];
    if (!s) s = handStates[i] = { x: d.x, y: d.y, z: 0, open: d.open, tilt: d.tilt, pinch: 0, spd: 0, scare: 0, lost: 0 };
    const px = s.x, py = s.y;
    s.x = lerp(s.x, d.x, 0.35); s.y = lerp(s.y, d.y, 0.35);
    s.z = lerp(s.z, constrain(map(d.palm / palmRef, 0.4, 1.4, -160, 160), -160, 160), 0.08);
    s.open = lerp(s.open, d.open, 0.12);
    s.tilt = lerp(s.tilt, d.tilt, 0.1);
    s.pinch = lerp(s.pinch, d.pinch ? 1 : 0, 0.08);
    s.spd = lerp(s.spd, dist(px, py, s.x, s.y), 0.4);
    s.lost = 0;
  }
  for (let i = det.length; i < handStates.length; i++) handStates[i].lost++;
  handStates = handStates.filter(s => s.lost < 30);
  const flick = 22 * Math.max(width, height) / 1400;
  for (const s of handStates) { if (s.spd > flick) s.scare = 1; s.scare *= 0.94; }
}

// ---------- hand -> roost parameters ----------
function updateRoosts() {
  const live = handStates.filter(s => s.lost === 0);
  const halfW = width / 2 / SC, halfH = height / 2 / SC;
  const t = frameCount * 0.004;
  const n1 = (a, b) => (noise(a, b) - 0.5) * 2;
  const want = groups;
  groups = live.length >= 2 ? 2 : 1;
  if (groups !== want) Flock.setGroups(groups);

  for (let k = 0; k < 2; k++) {
    const h = live.length ? live[Math.min(k, live.length - 1)] : null;
    let tg;
    if (h) {
      tg = {
        x: (h.x - width / 2) / SC, y: (h.y - height / 2) / SC, z: h.z,
        R: lerp(120, 420, h.open) * (1 - h.pinch * 0.3),
        coh: lerp(3, 0.8, h.open), sep: lerp(0.7, 1.05, h.open), th: lerp(0.25, 1, h.open),
        flat: 1 + h.pinch * 4, turn: h.tilt * 0.9, speed: 1 + h.open * 0.12
      };
    } else {
      // no hand: drift around the sky on its own
      tg = { x: n1(t, 1 + k) * halfW * 0.45, y: -halfH * 0.18 + n1(t, 4 + k) * halfH * 0.2, z: n1(t, 7) * 120,
             R: 220, coh: 1, sep: 1, th: 1, flat: 1, turn: 0, speed: 1 };
    }
    tg.x = constrain(tg.x, -halfW + 160, halfW - 160);
    tg.y = constrain(tg.y, -halfH + 90, halfH - 150);
    const r = roosts[k], e = h ? 0.08 : 0.02;
    for (const key of ['x', 'y', 'z']) r[key] = lerp(r[key], tg[key], e);
    for (const key of ['R', 'coh', 'sep', 'th', 'flat', 'turn', 'speed']) r[key] = lerp(r[key], tg[key], 0.05);
  }
}

function predators() {
  const out = [];
  for (const s of handStates) {
    if (s.lost === 0 && s.scare > 0.15) out.push({ x: (s.x - width / 2) / SC, y: (s.y - height / 2) / SC, R: 260, str: s.scare });
  }
  return out;
}

// ---------- drawing ----------
function drawSky() {
  const ctx = drawingContext;
  const g = ctx.createLinearGradient(0, 0, 0, height);
  g.addColorStop(0, '#8f97ae');
  g.addColorStop(0.45, '#cbc6cf');
  g.addColorStop(0.78, '#ebc7a8');
  g.addColorStop(1, '#efad78');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, width, height);
}

const flockStats = { bank: 0, near: 1, x: 0, scare: 0 };
function drawBirds() {
  const ctx = drawingContext;
  const P = Flock.P, B = Flock.B, N = Flock.N;
  const cx = width / 2, cy = height / 2, ce = Math.cos(ELEV), se = Math.sin(ELEV);
  const dotS = Math.max(1, Math.sqrt(SC) * 0.9);
  bcount.fill(0);
  let sb = 0, ss = 0, sx = 0;
  for (let i = 0; i < N; i++) {
    const x = P[i*3], y = P[i*3+1], z = P[i*3+2];
    const y2 = y * ce - z * se, z2 = y * se + z * ce;
    const s = FOCAL / (FOCAL - z2);
    sb += B[i]; ss += s; sx += x * s * SC;
    const a = Math.min(0.9, (0.3 + 0.55 * B[i]) * s);
    const q = Math.min(BUCKETS - 1, Math.floor(a / 0.9 * BUCKETS));
    const o = bcount[q]++ * 3, arr = bx[q];
    arr[o] = cx + x * s * SC; arr[o+1] = cy + y2 * s * SC; arr[o+2] = s * dotS * (1 + B[i] * 0.9);
  }
  flockStats.bank = sb / N; flockStats.near = ss / N; flockStats.x = (sx / N) / (width / 2);
  for (let q = 0; q < BUCKETS; q++) {
    const n = bcount[q]; if (!n) continue;
    const arr = bx[q];
    ctx.fillStyle = `rgba(30,28,36,${((q + 0.5) / BUCKETS * 0.9).toFixed(3)})`;
    ctx.beginPath();
    for (let k = 0; k < n; k++) { const o = k * 3; ctx.rect(arr[o], arr[o+1], arr[o+2], arr[o+2] * 0.7); }
    ctx.fill();
  }
}

function drawCam() {
  if (!showCam || !videoReady()) return;
  const w = Math.min(200, width * 0.3), h = w * 0.75, x = width - w - 18, y = 18;
  const ctx = drawingContext;
  ctx.save(); ctx.globalAlpha = 0.85;
  ctx.beginPath(); ctx.roundRect(x, y, w, h, 8); ctx.clip();
  image(video, x, y, w, h);
  ctx.restore();
}

// hand tracking panel: skeleton only, no camera image, no background
const BONES = [[0,1],[1,2],[2,3],[3,4],[0,5],[5,6],[6,7],[7,8],[5,9],[9,10],[10,11],[11,12],
  [9,13],[13,14],[14,15],[15,16],[13,17],[17,18],[18,19],[19,20],[0,17]];
function drawHandPanel() {
  if (!showHand || !hands.length) return;
  const w = Math.min(220, width * 0.3), h = w * 0.75;
  const x = width - w - 20, y = height - h - 20;
  const sx = w / (video.width || 640), sy = h / (video.height || 480);
  const ctx = drawingContext;
  ctx.save();
  ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  ctx.strokeStyle = 'rgba(42,40,51,0.7)'; ctx.lineWidth = 1.5;
  ctx.fillStyle = 'rgba(42,40,51,0.85)';
  for (const hnd of hands) {
    const k = hnd.keypoints;
    ctx.beginPath();
    for (const [a, b] of BONES) { ctx.moveTo(x + k[a].x * sx, y + k[a].y * sy); ctx.lineTo(x + k[b].x * sx, y + k[b].y * sy); }
    ctx.stroke();
    ctx.beginPath();
    for (const p of k) { ctx.moveTo(x + p.x * sx + 2.2, y + p.y * sy); ctx.arc(x + p.x * sx, y + p.y * sy, 2.2, 0, TWO_PI); }
    ctx.fill();
  }
  ctx.restore();
}

function videoReady() { return video && video.elt && video.elt.readyState >= 2; }

function updateStatus() {
  let msg = '';
  if (!videoReady()) msg = 'Allow camera access to begin';
  else if (hands.length === 0) msg = 'Raise a hand to the camera';
  if (Sound.blocked()) msg = (msg ? msg + ' · ' : '') + 'Click anywhere to start the sound';
  statusEl.style.opacity = msg ? 0.6 : 0;
  if (msg) statusEl.textContent = msg;
}

function draw() {
  updateHands();
  updateRoosts();
  Flock.step({ roosts: groups === 2 ? roosts : [roosts[0]], preds: predators() });
  drawSky();
  drawBirds();
  drawCam();
  drawHandPanel();
  flockStats.scare = handStates.reduce((m, s) => Math.max(m, s.scare), 0);
  Sound.update(flockStats);
  if (frameCount % 15 === 0) updateStatus();
}

function keyPressed() {
  if (key === 'h' || key === 'H') { showHud = !showHud; hudEl.style.opacity = showHud ? 1 : 0; }
  if (key === 'c' || key === 'C') showCam = !showCam;
  if (key === 'g' || key === 'G') showHand = !showHand;
  if (key === 'm' || key === 'M') Sound.toggle();
}
