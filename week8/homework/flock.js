// Starling flock after the StarDisplay model (Hildenbrandt, Carere & Hemelrijk 2010):
// ~7 topological neighbours, near-constant cruise speed, turning by banking,
// horizontal roost attraction + preferred altitude, agitation waves copied
// between neighbours. Units: world px, one step = one frame.
const Flock = (function () {
  const K = 7;                    // topological neighbours
  const TBL = 1 << 15, MASK = TBL - 1;
  let N = 0, P, D, S, B, AL, G, head, next, FX, FY, FZ, MX, MY, MZ, ZG, BETA, PH, CE, TH;
  let frame = 0;
  const kd = new Float32Array(K), ki = new Int32Array(K);
  // coarse density field (hashed grid) for surface tension
  const DT = 1 << 16, DM = DT - 1;
  const dens = new Float32Array(DT);
  let meanD = 1, sumD = 0, cntD = 0;
  const dhash = (ix, iy, iz) => ((ix * 73856093) ^ (iy * 19349663) ^ (iz * 83492791)) & DM;

  const prm = {
    cell: 22,        // hash cell (>= typical neighbour distance)
    v0: 2.6,         // cruise speed
    rs: 18,          // separation radius
    ws: 0.4,         // separation weight
    wc: 0.05,        // cohesion weight (to topological neighbours)
    wa: 0.3,         // alignment weight
    wr: 0.003,       // roost (horizontal) pull per px beyond radius
    wy: 0.0012,      // altitude spring
    wn: 0.008,       // random steering
    rollIn: 1.3,     // roll-in gain (StarDisplay ratio roll-in : roll-out = 10 : 1)
    rollOut: 0.13,   // roll-out gain
    lift: 0.10,      // lateral accel at 90° bank
    maxPitch: 0.08,  // climb / dive accel limit
    sink: 0.025,     // lift lost while banked
    cBase: 0.3,      // cohesion felt by interior birds
    cGain: 0.8,      // extra cohesion at the border (surface tension)
    cPow: 1,         // how sharply that extra pull is confined to the edge
    dc: 42,          // density field cell size
    qLow: 0.6,       // below this share of typical density a bird counts as 'outside'
    wt: 0.15,        // surface-tension pull up the density gradient
    qHigh: 1.4,      // above this share, birds are pushed apart (pressure)
    wp: 0.08,        // pressure push
    thSpread: 450,   // spread of per-bird roost thresholds: turns start at the edge and travel inward
    rt: 3,           // reaction time in frames (~50 ms at 60 fps)
    blind: -0.707,   // rear blind cone for cohesion/alignment: cos(135°)
  };

  function init(n) {
    N = n;
    P = new Float32Array(N * 3); D = new Float32Array(N * 3);
    S = new Float32Array(N); B = new Float32Array(N);
    AL = new Float32Array(N);
    FX = new Float32Array(N); FY = new Float32Array(N); FZ = new Float32Array(N);
    MX = new Float32Array(N); MY = new Float32Array(N); MZ = new Float32Array(N);
    ZG = new Float32Array(N); BETA = new Float32Array(N); PH = new Uint8Array(N);
    CE = new Float32Array(N); TH = new Float32Array(N);
    G = new Uint8Array(N); head = new Int32Array(TBL); next = new Int32Array(N);
    for (let i = 0; i < N; i++) {
      const u = Math.random() * 6.283, w = Math.acos(Math.random() * 2 - 1), r = Math.cbrt(Math.random());
      P[i*3] = Math.sin(w) * Math.cos(u) * r * 260;
      P[i*3+1] = Math.cos(w) * r * 70 - 80;
      P[i*3+2] = Math.sin(w) * Math.sin(u) * r * 180;
      D[i*3] = 1; D[i*3+1] = 0; D[i*3+2] = 0;
      S[i] = prm.v0; G[i] = 0; PH[i] = (Math.random() * 64) | 0;
      TH[i] = Math.random() * Math.random() * prm.thSpread;  // most birds ignore the roost until well past it
    }
  }

  const hash = (ix, iy, iz) => ((ix * 73856093) ^ (iy * 19349663) ^ (iz * 83492791)) & MASK;

  // ctrl.roosts: [{x,y,z,R,coh,flat,turn,speed}] ; ctrl.preds: [{x,y,R,str}] (screen-plane world coords)
  function step(ctrl) {
    const cs = prm.cell;
    head.fill(-1);
    for (let i = 0; i < N; i++) {
      const h = hash(Math.floor(P[i*3] / cs), Math.floor(P[i*3+1] / cs), Math.floor(P[i*3+2] / cs));
      next[i] = head[h]; head[h] = i;
    }
    const roosts = ctrl.roosts, nr = roosts.length, preds = ctrl.preds;
    const maxR2 = (cs * 1.5) * (cs * 1.5);
    frame++;

    // ---- density field: trilinear splat of every bird ----
    const dc = prm.dc, useD = prm.wt > 0 || prm.wp > 0;
    if (useD) {
      dens.fill(0);
      for (let i = 0; i < N; i++) {
        const fx = P[i*3] / dc, fy = P[i*3+1] / dc, fz = P[i*3+2] / dc;
        const ix = Math.floor(fx), iy = Math.floor(fy), iz = Math.floor(fz);
        const tx = fx - ix, ty = fy - iy, tz = fz - iz;
        for (let c = 0; c < 8; c++) {
          const a = c & 1, b = (c >> 1) & 1, e = (c >> 2) & 1;
          dens[dhash(ix + a, iy + b, iz + e)] += (a ? tx : 1 - tx) * (b ? ty : 1 - ty) * (e ? tz : 1 - tz);
        }
      }
      if (cntD > 0) meanD = Math.max(0.5, sumD / cntD);
      sumD = 0; cntD = 0;
    }

    for (let i = 0; i < N; i++) {
      if ((frame + PH[i]) % prm.rt !== 0) continue;   // each bird re-senses only every ~50 ms, out of step
      const p = i * 3;
      const x = P[p], y = P[p+1], z = P[p+2];
      const dx0 = D[p], dy0 = D[p+1], dz0 = D[p+2];
      const R0 = roosts[G[i] % nr];
      const rs = prm.rs * (R0.sep || 1), rs2 = rs * rs;

      // ---- find K nearest neighbours ----
      let kc = 0, worst = maxR2;
      let sx = 0, sy = 0, sz = 0;
      const cx = Math.floor(x / cs), cy = Math.floor(y / cs), cz = Math.floor(z / cs);
      for (let a = -1; a <= 1; a++) for (let b = -1; b <= 1; b++) for (let c = -1; c <= 1; c++) {
        let j = head[hash(cx + a, cy + b, cz + c)], cc = 0;
        while (j !== -1 && cc++ < 14) {     // cap per cell so dense balls stay fast
          if (j !== i) {
            const ex = P[j*3] - x, ey = P[j*3+1] - y, ez = P[j*3+2] - z;
            const d2 = ex * ex + ey * ey + ez * ez;
            if (d2 < rs2 && d2 > 1e-4) {           // separation: all-round, not topological
              const d = Math.sqrt(d2), f = (1 - d / rs);
              sx -= ex / d * f; sy -= ey / d * f; sz -= ez / d * f;
            }
            if (d2 < worst && (ex * dx0 + ey * dy0 + ez * dz0) > prm.blind * Math.sqrt(d2)) {
              // insert into sorted top-K (birds in the rear blind cone are ignored)
              let q = kc < K ? kc++ : K - 1;
              while (q > 0 && kd[q - 1] > d2) { kd[q] = kd[q - 1]; ki[q] = ki[q - 1]; q--; }
              kd[q] = d2; ki[q] = j;
              if (kc === K) worst = kd[K - 1];
            }
          }
          j = next[j];
        }
      }

      // ---- alignment, cohesion, centrality, alarm copying ----
      let ax = 0, ay = 0, az = 0, mx = 0, my = 0, mz = 0, ux = 0, uy = 0, uz = 0, alMax = 0;
      for (let q = 0; q < kc; q++) {
        const j = ki[q], jp = j * 3;
        ax += D[jp]; ay += D[jp+1]; az += D[jp+2];
        const ex = P[jp] - x, ey = P[jp+1] - y, ez = P[jp+2] - z;
        mx += ex; my += ey; mz += ez;
        const id = 1 / (Math.sqrt(kd[q]) + 1e-4);
        ux += ex * id; uy += ey * id; uz += ez * id;
        if (AL[j] > alMax) alMax = AL[j];
      }
      let fx = sx * prm.ws, fy = sy * prm.ws, fz = sz * prm.ws;
      if (kc > 0) {
        const inv = 1 / kc;
        MX[i] = ax * inv; MY[i] = ay * inv; MZ[i] = az * inv;
        // border birds (neighbours all on one side) are pulled in harder
        const cent = Math.hypot(ux, uy, uz) * inv;
        const ml = Math.hypot(mx, my, mz) + 1e-4;
        CE[i] = cent;
        const wc = prm.wc * (R0.coh || 1) * (prm.cBase + prm.cGain * Math.pow(cent, prm.cPow));
        fx += mx / ml * wc; fy += my / ml * wc; fz += mz / ml * wc;
      } else {
        // lost bird: head back to its roost
        MX[i] = dx0; MY[i] = dy0; MZ[i] = dz0;
        fx += (R0.x - x) * 0.002; fy += (R0.y - y) * 0.002; fz += (R0.z - z) * 0.002;
      }

      // ---- surface tension / pressure from the density field ----
      if (useD) {
        const qx = x / dc, qy = y / dc, qz = z / dc;
        const ix = Math.floor(qx), iy = Math.floor(qy), iz = Math.floor(qz);
        const tx = qx - ix, ty = qy - iy, tz = qz - iz;
        let d = 0, gx = 0, gy = 0, gz = 0;
        for (let c = 0; c < 8; c++) {
          const a = c & 1, b = (c >> 1) & 1, e = (c >> 2) & 1;
          const wx = a ? tx : 1 - tx, wy = b ? ty : 1 - ty, wz = e ? tz : 1 - tz;
          const n = dens[dhash(ix + a, iy + b, iz + e)];
          d += n * wx * wy * wz;
          gx += n * (a ? 1 : -1) * wy * wz; gy += n * wx * (b ? 1 : -1) * wz; gz += n * wx * wy * (e ? 1 : -1);
        }
        sumD += d; cntD++;
        const q = d / meanD, gl = Math.hypot(gx, gy, gz) + 1e-6;
        if (q < prm.qLow) {
          const f = prm.wt * (1 - q / prm.qLow) * (R0.coh || 1);
          fx += gx / gl * f; fy += gy / gl * f; fz += gz / gl * f;
        } else if (q > prm.qHigh) {
          const f = Math.min(0.15, prm.wp * (q - prm.qHigh));
          fx -= gx / gl * f; fy -= gy / gl * f; fz -= gz / gl * f;
        }
      }

      // ---- predator: startle + agitation wave ----
      let al = Math.max(AL[i] * 0.85, alMax * 0.9);
      for (const pr of preds) {
        const ex = x - pr.x, ey = y - pr.y, ed = Math.hypot(ex, ey) + 1e-4;
        if (ed < pr.R) {
          const s = pr.str * (1 - ed / pr.R);
          if (s > al) al = s;
          fx += ex / ed * s * 0.35; fy += ey / ed * s * 0.35;
        }
      }
      AL[i] = al;
      // zig: a quick sideways roll, alternating by bird, copied through the flock
      ZG[i] = al > 0.05 ? ((i & 2) ? al : -al) : 0;

      fx += (Math.random() - 0.5) * prm.wn; fy += (Math.random() - 0.5) * prm.wn * 0.5; fz += (Math.random() - 0.5) * prm.wn;
      FX[i] = fx; FY[i] = fy; FZ[i] = fz;
    }

    // ---- fly every frame: roll in/out, bank to turn, lose lift while banked ----
    for (let i = 0; i < N; i++) {
      const p = i * 3;
      const dx = D[p], dy = D[p+1], dz = D[p+2];
      const R0 = roosts[G[i] % nr];
      let fx = FX[i] + (MX[i] - dx) * prm.wa, fy = FY[i] + (MY[i] - dy) * prm.wa, fz = FZ[i] + (MZ[i] - dz) * prm.wa;
      // roost: horizontal (x,z) ring, pulled harder when heading outward; preferred altitude
      const x = P[p], y = P[p+1], z = P[p+2];
      const hx = x - R0.x, hz = z - R0.z, hd = Math.hypot(hx, hz) + 1e-4;
      const lim = R0.R + TH[i] * (R0.th ?? 1);
      if (hd > lim) {
        // felt mostly by birds on the flock's edge; the rest follow by alignment
        const outward = (hx * dx + hz * dz) / hd > 0 ? 1.6 : 0.6;
        const f = Math.min(0.25, (hd - lim) * prm.wr * outward) * (0.15 + 1.2 * CE[i]);
        fx -= hx / hd * f; fz -= hz / hd * f;
      }
      fy -= (y - R0.y) * prm.wy * (R0.flat || 1);
      // banking bias from hand tilt: a steady yaw makes the flock wheel
      if (R0.turn) { fx += -dz * R0.turn * 0.05; fz += dx * R0.turn * 0.05; }
      // side axis (horizontal, right of heading) and the bird's level "up" axis; world up is -y
      let sx = dz, sz = -dx, sl = Math.hypot(sx, sz);
      if (sl < 1e-3) { sx = 1; sz = 0; sl = 1; }
      sx /= sl; sz /= sl;
      const ux = -sz * dy, uy = sz * dx - sx * dz, uz = sx * dy;
      const fSide = fx * sx + fz * sz;
      const fUp = fx * ux + fy * uy + fz * uz;
      const fwd = fx * dx + fy * dy + fz * dz;

      let b = BETA[i] + prm.rollIn * fSide - prm.rollOut * BETA[i] + ZG[i] * 0.3;
      b = b > 1.45 ? 1.45 : b < -1.45 ? -1.45 : b;
      BETA[i] = b;
      const lat = prm.lift * Math.sin(b);
      let pit = fUp > prm.maxPitch ? prm.maxPitch : fUp < -prm.maxPitch ? -prm.maxPitch : fUp;
      pit -= (1 - Math.cos(b)) * prm.sink;

      let sp = S[i];
      const nx = dx * sp + sx * lat + ux * pit, ny = dy * sp + uy * pit, nz = dz * sp + sz * lat + uz * pit;
      const nl = Math.hypot(nx, ny, nz) + 1e-6;
      D[p] = nx / nl; D[p+1] = ny / nl; D[p+2] = nz / nl;
      const v0 = prm.v0 * (R0.speed || 1);
      sp += fwd * 0.3 + (v0 - sp) * 0.04;
      sp = sp < v0 * 0.6 ? v0 * 0.6 : sp > v0 * 1.5 ? v0 * 1.5 : sp;
      S[i] = sp;
      // how much wing the viewer sees: grows with bank angle
      B[i] = Math.min(1, Math.abs(Math.sin(b)) * 1.15);
      P[p] += D[p] * sp; P[p+1] += D[p+1] * sp; P[p+2] += D[p+2] * sp;
    }
  }

  function setGroups(n) { for (let i = 0; i < N; i++) G[i] = n > 1 ? (i & 1) : 0; }

  return { init, step, prm, setGroups, get N() { return N; }, get P() { return P; }, get D() { return D; }, get B() { return B; }, get AL() { return AL; } };
})();
