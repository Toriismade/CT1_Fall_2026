// ---------- sound: the roar of thousands of wingbeats ----------
// A murmuration overhead is a dense, granular hiss (roughly 300–2500 Hz) made of
// countless short wing "whooshes", swelling as the flock comes nearer, with a
// few faint calls above it. We pre-render seamless loops of filtered noise
// grains and steer their mix live from what the flock is doing.
function genWingTexture(sr, secs, rate, fLo, fHi, seed) {
  let s = seed >>> 0 || 1;
  const rnd = () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296);
  const n = Math.floor(sr * secs), d = new Float32Array(n);
  const grains = Math.floor(secs * rate);
  for (let g = 0; g < grains; g++) {
    const t0 = Math.floor(rnd() * n);
    const len = Math.floor(sr * (0.012 + rnd() * rnd() * 0.05));   // one wing stroke
    const f = fLo * Math.pow(fHi / fLo, rnd());
    const bw = f * (0.3 + rnd() * 0.45);
    const r = Math.exp(-Math.PI * bw / sr), w = 2 * Math.PI * f / sr;
    const a1 = 2 * r * Math.cos(w), a2 = -r * r, gain = (0.3 + rnd() * 0.7) * (1 - r);
    let y1 = 0, y2 = 0;
    for (let k = 0; k < len; k++) {
      const e = Math.sin(Math.PI * k / len), env = e * e * e;   // soft attack and release
      const y = (rnd() * 2 - 1) + a1 * y1 + a2 * y2;
      y2 = y1; y1 = y;
      d[(t0 + k) % n] += y * env * gain;                         // wrap: the loop is seamless
    }
  }
  // steep high-pass (two RBJ biquads at 280 Hz), run twice round the loop so it stays seamless
  const fc = 280, Q = 0.7071, w0 = 2 * Math.PI * fc / sr, al = Math.sin(w0) / (2 * Q), cw = Math.cos(w0);
  const b0 = (1 + cw) / 2 / (1 + al), b1 = -(1 + cw) / (1 + al), b2 = b0, c1 = -2 * cw / (1 + al), c2 = (1 - al) / (1 + al);
  for (let pass = 0; pass < 2; pass++) {
    let x1 = 0, x2 = 0, y1 = 0, y2 = 0;
    for (let rep = 0; rep < 2; rep++) for (let i = 0; i < n; i++) {
      const x = d[i], y = b0 * x + b1 * x1 + b2 * x2 - c1 * y1 - c2 * y2;
      x2 = x1; x1 = x; y2 = y1; y1 = y;
      if (rep === 1) d[i] = y; // keep the settled second lap
    }
  }
  let pk = 0;
  for (let i = 0; i < n; i++) pk = Math.max(pk, Math.abs(d[i]));
  for (let i = 0; i < n; i++) d[i] *= 0.9 / (pk || 1);
  return d;
}

const Sound = (function () {
  // Wingbeat sound, on by default; M switches it. Browsers hold audio until the
  // visitor first clicks or presses a key, so we start then if we can't sooner.
  let ac = null, on = true, ready = false, started = false;
  let out, gWing, master, lp, hp, pan, gBody, gFlutter, gCalls;
  let nextCall = 0;
  const WING_MAX = 0.35;

  function loop(data) {
    const buf = ac.createBuffer(1, data.length, ac.sampleRate);
    buf.copyToChannel(data, 0);
    const src = ac.createBufferSource();
    src.buffer = buf; src.loop = true;
    return src;
  }

  function build() {
    const sr = ac.sampleRate;
    out = ac.createGain(); out.gain.value = 0; out.connect(ac.destination);
    gWing = ac.createGain(); gWing.gain.value = 1; gWing.connect(out);
    master = ac.createGain(); master.gain.value = 0;
    hp = ac.createBiquadFilter(); hp.type = 'highpass'; hp.frequency.value = 220; hp.Q.value = 0.5;
    lp = ac.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 2200; lp.Q.value = 0.4;
    pan = ac.createStereoPanner ? ac.createStereoPanner() : ac.createGain();
    gBody = ac.createGain(); gFlutter = ac.createGain(); gCalls = ac.createGain();
    gBody.gain.value = 1; gFlutter.gain.value = 0.4; gCalls.gain.value = 0.5;

    // two loops of different lengths so the repetition never lines up
    const body = loop(genWingTexture(sr, 5.3, 1600, 400, 1800, 7));
    const flutter = loop(genWingTexture(sr, 7.1, 700, 900, 3200, 11));
    body.connect(gBody); flutter.connect(gFlutter);
    gBody.connect(lp); gFlutter.connect(lp);
    lp.connect(hp); hp.connect(pan); gCalls.connect(pan);
    pan.connect(master); master.connect(gWing);
    body.start(); flutter.start(ac.currentTime + 0.37);

    ready = true;
  }

  // a faint starling call: a short whistle sweeping up or down
  function call(t) {
    const o = ac.createOscillator(), g = ac.createGain();
    const f0 = 2600 + Math.random() * 2400, f1 = f0 * (0.7 + Math.random() * 0.7), dur = 0.04 + Math.random() * 0.09;
    o.type = 'sine';
    o.frequency.setValueAtTime(f0, t);
    o.frequency.exponentialRampToValueAtTime(f1, t + dur);
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(0.012 + Math.random() * 0.02, t + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g); g.connect(gCalls);
    o.start(t); o.stop(t + dur + 0.02);
  }

  function applyMute() {
    if (!ready) return;
    if (started) out.gain.setTargetAtTime(1, ac.currentTime, 0.8);       // fade in once audio is allowed
    gWing.gain.setTargetAtTime(on ? 1 : 0, ac.currentTime, on ? 0.6 : 0.2);
  }

  // called once at startup
  function init() {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC || ac) return;
    ac = new AC();
    build();
    const tryStart = () => {
      if (ac.state === 'running') { started = true; applyMute(); return true; }
      return false;
    };
    ac.resume().then(tryStart).catch(() => {});
    const unlock = () => {
      ac.resume().then(() => {
        if (tryStart()) for (const ev of ['pointerdown', 'keydown', 'touchstart']) window.removeEventListener(ev, unlock, true);
      }).catch(() => {});
    };
    for (const ev of ['pointerdown', 'keydown', 'touchstart']) window.addEventListener(ev, unlock, true);
  }

  function toggle() {
    on = !on;
    if (ac) ac.resume();
    applyMute();
    return on;
  }

  // waiting for the first click or key press before the browser lets audio play
  function blocked() { return !!ac && ac.state !== 'running'; }

  // st: { bank 0..1 (how hard the flock is turning), near ~1 (projected size),
  //       x -1..1 (flock centre on screen), scare 0..1 }
  function update(st) {
    if (!ready || !started) return;
    const t = ac.currentTime;
    // calibrated on the running flock: mean bank sits around 0.57-0.70, nearness 0.9-1.2
    const act = Math.min(1.4, Math.max(0, (st.bank - 0.57) / 0.13) + st.scare * 0.9);
    const near = Math.min(1.4, Math.max(0.45, 0.6 + (st.near - 0.9) * 1.6));
    // slow time constants: the roar swells and ebbs like surf
    master.gain.setTargetAtTime(WING_MAX * near * (0.55 + 0.6 * act), t, 0.5);
    lp.frequency.setTargetAtTime(1500 + 2600 * Math.min(1, act), t, 0.4);
    gFlutter.gain.setTargetAtTime(0.25 + 0.75 * Math.min(1, act), t, 0.3);
    if (pan.pan) pan.pan.setTargetAtTime(Math.max(-0.8, Math.min(0.8, st.x * 0.8)), t, 0.6);
    if (t > nextCall) {
      call(t + 0.01);
      nextCall = t + 0.15 + Math.random() * Math.random() * 1.4;
    }
  }

  return { init, toggle, update, blocked, get on() { return on; } };
})();
