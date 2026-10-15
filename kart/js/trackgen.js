// Track generation and queries. A track is a closed centripetal Catmull-Rom spline through
// control points; around it runs a "corridor": road, kerbs, off-road bands and walls (or open
// cliff edges). Everything (physics, AI, lap counting, rendering) works in the corridor's local
// coordinates: s = distance along the centre line, d = signed lateral offset (+ = right).
// Pure JS: imported by the game and by the node tests.

export const SURF = { ROAD: 0, GRASS: 1, SAND: 2, SNOW: 3, ICE: 4, LAVA: 5, DIRT: 6, VOID: 7, WALL: 8 };
export const SURF_NAMES = ['road', 'grass', 'sand', 'snow', 'ice', 'lava', 'dirt', 'void', 'wall'];
export const SURF_PROPS = [
  { speed: 1, grip: 1 },
  { speed: 0.56, grip: 0.82, off: true },
  { speed: 0.52, grip: 0.78, off: true },
  { speed: 0.54, grip: 0.62, off: true },
  { speed: 1, grip: 0.26 },
  { speed: 0.35, grip: 0.6, off: true, deadly: true },
  { speed: 0.95, grip: 0.92 },
  { speed: 1, grip: 1, void: true },
  { speed: 1, grip: 1 },
];
const surfId = n => (typeof n === 'number' ? n : SURF[String(n).toUpperCase()] ?? 1);

const SPACING = 2.5;
const OFF_RISE = 0.05; // off-road rises gently toward the walls
export const SHOULDER = 1.6;

function crPoint(p0, p1, p2, p3, u) {
  const d = (a, b) => Math.pow(Math.hypot(b[0] - a[0], b[1] - a[1], b[2] - a[2]) || 1e-4, 0.5);
  const t0 = 0, t1 = t0 + d(p0, p1), t2 = t1 + d(p1, p2), t3 = t2 + d(p2, p3);
  const t = t1 + u * (t2 - t1);
  const out = [0, 0, 0];
  for (let k = 0; k < 3; k++) {
    const a1 = ((t1 - t) / (t1 - t0)) * p0[k] + ((t - t0) / (t1 - t0)) * p1[k];
    const a2 = ((t2 - t) / (t2 - t1)) * p1[k] + ((t - t1) / (t2 - t1)) * p2[k];
    const a3 = ((t3 - t) / (t3 - t2)) * p2[k] + ((t - t2) / (t3 - t2)) * p3[k];
    const b1 = ((t2 - t) / (t2 - t0)) * a1 + ((t - t0) / (t2 - t0)) * a2;
    const b2 = ((t3 - t) / (t3 - t1)) * a2 + ((t - t1) / (t3 - t1)) * a3;
    out[k] = ((t2 - t) / (t2 - t1)) * b1 + ((t - t1) / (t2 - t1)) * b2;
  }
  return out;
}
const smoothstep = x => (x <= 0 ? 0 : x >= 1 ? 1 : x * x * (3 - 2 * x));

export class Track {
  constructor(def) {
    this.def = def;
    this.id = def.id;
    this.name = def.name;
    this.theme = def.theme;
    const cps = def.pts.map(p => [p[0], p[2] || 0, p[1]]); // [x, y, z]
    const M = cps.length;
    // dense sampling
    const dense = [];
    const SUB = 80;
    for (let k = 0; k < M; k++) {
      const p0 = cps[(k - 1 + M) % M], p1 = cps[k], p2 = cps[(k + 1) % M], p3 = cps[(k + 2) % M];
      for (let j = 0; j < SUB; j++) dense.push({ p: crPoint(p0, p1, p2, p3, j / SUB), u: k + j / SUB });
    }
    const DL = [0];
    for (let i = 1; i <= dense.length; i++) {
      const a = dense[i - 1].p, b = dense[i % dense.length].p;
      DL.push(DL[i - 1] + Math.hypot(b[0] - a[0], b[2] - a[2]));
    }
    const L0 = DL[dense.length];
    const N = Math.max(64, Math.round(L0 / SPACING));
    this.N = N;
    this.L = L0;
    const ds = L0 / N;
    this.ds = ds;
    const PX = new Float32Array(N), PY = new Float32Array(N), PZ = new Float32Array(N), U = new Float32Array(N), S = new Float32Array(N + 1);
    let j = 0;
    for (let i = 0; i < N; i++) {
      const target = i * ds;
      while (j < dense.length - 1 && DL[j + 1] < target) j++;
      const f = (target - DL[j]) / Math.max(1e-6, DL[j + 1] - DL[j]);
      const a = dense[j].p, b = dense[(j + 1) % dense.length].p;
      PX[i] = a[0] + (b[0] - a[0]) * f; PY[i] = a[1] + (b[1] - a[1]) * f; PZ[i] = a[2] + (b[2] - a[2]) * f;
      const ua = dense[j].u, ub = j + 1 < dense.length ? dense[j + 1].u : M;
      U[i] = ua + (ub - ua) * f;
      S[i] = target;
    }
    S[N] = L0;
    // indoors the floor is at 0: never dip under it
    if (def.indoor) for (let i = 0; i < N; i++) PY[i] = Math.max(0, PY[i]);
    Object.assign(this, { PX, PY, PZ, U, S });
    // frames
    const FX = new Float32Array(N), FZ = new Float32Array(N), RX = new Float32Array(N), RZ = new Float32Array(N), SL = new Float32Array(N), K = new Float32Array(N);
    for (let i = 0; i < N; i++) {
      const a = (i - 1 + N) % N, b = (i + 1) % N;
      let fx = PX[b] - PX[a], fz = PZ[b] - PZ[a];
      const l = Math.hypot(fx, fz) || 1; fx /= l; fz /= l;
      FX[i] = fx; FZ[i] = fz; RX[i] = -fz; RZ[i] = fx;
      SL[i] = (PY[b] - PY[a]) / (2 * ds);
    }
    for (let i = 0; i < N; i++) {
      const a = (i - 2 + N) % N, b = (i + 2) % N;
      const cr = FX[a] * FZ[b] - FZ[a] * FX[b];
      const dt = FX[a] * FX[b] + FZ[a] * FZ[b];
      K[i] = Math.atan2(cr, dt) / (4 * ds);
    }
    // smooth curvature
    const Ks = new Float32Array(N);
    for (let i = 0; i < N; i++) { let s = 0; for (let k = -3; k <= 3; k++) s += K[(i + k + N) % N]; Ks[i] = s / 7; }
    Object.assign(this, { FX, FZ, RX, RZ, SL, K: Ks });

    // ---- corridor properties with section overrides
    const base = {
      hw: (def.width || 16) / 2, offL: def.off ?? 7, offR: def.off ?? 7,
      wallL: def.walls === false ? 0 : 1, wallR: def.walls === false ? 0 : 1,
      road: surfId(def.road || 'road'), offSurfL: surfId(def.offSurf || 'grass'), offSurfR: surfId(def.offSurf || 'grass'),
    };
    const HW = new Float32Array(N), OL = new Float32Array(N), OR = new Float32Array(N);
    const WL = new Uint8Array(N), WR = new Uint8Array(N), SR = new Uint8Array(N), SOL = new Uint8Array(N), SOR = new Uint8Array(N);
    const LANE = new Int8Array(N); // -1 lane on left, 1 lane on right
    const LW = new Float32Array(N); // lane extra width (div + lane)
    const sOfU = u => {
      // first sample whose U >= u (U is monotonic)
      let lo = 0, hi = N - 1;
      u = ((u % M) + M) % M;
      while (lo < hi) { const m = (lo + hi) >> 1; if (U[m] < u) lo = m + 1; else hi = m; }
      return S[lo];
    };
    this.sOfU = sOfU;
    const secs = (def.sections || []).map(sc => ({ ...sc, s0: sOfU(sc.a), s1: sOfU(sc.b) }));
    // lanes on the inside of the bend unless a side is given
    for (const sc of secs) if (sc.lane && sc.lane.side === 'in') {
      let sum = 0, i = Math.floor(sc.s0 / ds);
      const n = Math.round((((sc.s1 - sc.s0) % L0) + L0) % L0 / ds);
      for (let k = 0; k < n; k++) sum += Ks[(i + k) % N];
      sc.lane = { ...sc.lane, side: sum >= 0 ? 1 : -1 };
    }
    this.sections = secs;
    const TAPER = 18;
    const inSec = (s, sc) => {
      // weight 0..1 with tapers, handles wrap
      let len = sc.s1 - sc.s0; if (len < 0) len += L0;
      let x = s - sc.s0; if (x < 0) x += L0;
      if (x > len) return 0;
      const tp = Math.min(TAPER, len / 3);
      return smoothstep(Math.min(x, len - x) / tp);
    };
    for (let i = 0; i < N; i++) {
      const s = S[i];
      let hw = base.hw, offL = base.offL, offR = base.offR, wallL = base.wallL, wallR = base.wallR, road = base.road, sol = base.offSurfL, sor = base.offSurfR;
      let lane = 0, lw = 0;
      for (const sc of secs) {
        const w = inSec(s, sc);
        if (w <= 0) continue;
        if (sc.hw !== undefined) hw += (sc.hw - hw) * w;
        if (sc.width !== undefined) hw += (sc.width / 2 - hw) * w;
        if (sc.off !== undefined) { offL += (sc.off - offL) * w; offR += (sc.off - offR) * w; }
        if (sc.offL !== undefined) offL += (sc.offL - offL) * w;
        if (sc.offR !== undefined) offR += (sc.offR - offR) * w;
        if (w > 0.5) {
          if (sc.walls !== undefined) { wallL = wallR = sc.walls ? 1 : 0; }
          if (sc.wallL !== undefined) wallL = sc.wallL ? 1 : 0;
          if (sc.wallR !== undefined) wallR = sc.wallR ? 1 : 0;
          if (sc.road) road = surfId(sc.road);
          if (sc.offSurf) { sol = sor = surfId(sc.offSurf); }
          if (sc.offSurfL) sol = surfId(sc.offSurfL);
          if (sc.offSurfR) sor = surfId(sc.offSurfR);
        }
        if (sc.lane) { lane = sc.lane.side; lw = Math.max(lw, (sc.lane.div + sc.lane.w) * w); }
      }
      HW[i] = hw; OL[i] = offL; OR[i] = offR; WL[i] = wallL; WR[i] = wallR; SR[i] = road; SOL[i] = sol; SOR[i] = sor; LANE[i] = lane; LW[i] = lw;
    }
    // no lava right next to a shortcut lane's mouth or exit
    for (const sc of secs) if (sc.lane) {
      let len = sc.s1 - sc.s0; if (len < 0) len += L0;
      for (let x = -30; x <= len + 30; x += ds) {
        const i = Math.floor(((sc.s0 + x) % L0 + L0) % L0 / ds) % N;
        if (sc.lane.side > 0 ? SOR[i] === SURF.LAVA : SOL[i] === SURF.LAVA) { if (sc.lane.side > 0) SOR[i] = SURF.SAND; else SOL[i] = SURF.SAND; }
      }
    }
    // keep the inside of corners from folding over: inner extent < 0.9 R
    const EXT_L = new Float32Array(N), EXT_R = new Float32Array(N);
    for (let i = 0; i < N; i++) {
      EXT_L[i] = HW[i] + (LANE[i] === -1 ? Math.max(LW[i], 0) : OL[i]);
      EXT_R[i] = HW[i] + (LANE[i] === 1 ? Math.max(LW[i], 0) : OR[i]);
      if (LANE[i] === -1 && LW[i] < OL[i]) EXT_L[i] = HW[i] + OL[i];
      if (LANE[i] === 1 && LW[i] < OR[i]) EXT_R[i] = HW[i] + OR[i];
    }
    const lim = new Float32Array(N);
    for (let i = 0; i < N; i++) { let m = 1e9; for (let k = -6; k <= 6; k++) { const kk = Math.abs(this.K[(i + k + N) % N]); m = Math.min(m, kk > 1e-5 ? 0.88 / kk : 1e9); } lim[i] = m; }
    for (let i = 0; i < N; i++) {
      if (this.K[i] > 0) EXT_R[i] = Math.max(HW[i] + 1, Math.min(EXT_R[i], lim[i]));
      else if (this.K[i] < 0) EXT_L[i] = Math.max(HW[i] + 1, Math.min(EXT_L[i], lim[i]));
    }
    // smooth extents a little so walls don't kink
    for (const E of [EXT_L, EXT_R]) {
      const c = Float32Array.from(E);
      for (let i = 0; i < N; i++) { let m = 1e9; for (let k = -2; k <= 2; k++) m = Math.min(m, c[(i + k + N) % N]); E[i] = m; }
    }
    Object.assign(this, { HW, OL, OR, WL, WR, SR, SOL, SOR, LANE, LW, EXT_L, EXT_R });
    this.maxExt = 0;
    for (let i = 0; i < N; i++) this.maxExt = Math.max(this.maxExt, EXT_L[i], EXT_R[i]);
    // banking
    const BK = new Float32Array(N);
    const bankK = (def.bank ?? 1) * 5;
    const mb = def.maxBank ?? 0.17;
    for (let i = 0; i < N; i++) BK[i] = Math.max(-mb, Math.min(mb, -this.K[i] * bankK * HW[i] / 8));
    const BKs = new Float32Array(N);
    for (let i = 0; i < N; i++) { let s = 0; for (let k = -4; k <= 4; k++) s += BK[(i + k + N) % N]; BKs[i] = s / 9; }
    this.BK = BKs;
    // indoors: a banked corner at floor level lifts its outer side instead of sinking the inner edge into the floor
    if (def.indoor) {
      for (let i = 0; i < N; i++) PY[i] = Math.max(PY[i], Math.abs(BKs[i]) * HW[i] + 0.02);
      for (let i = 0; i < N; i++) { const a = (i - 1 + N) % N, b = (i + 1) % N; this.SL[i] = (PY[b] - PY[a]) / (2 * ds); }
    }

    // ---- features
    this.ramps = (def.ramps || []).map(r => ({ lip: sOfU(r.at), len: r.len || 12, h: r.h || 2.5, gap: r.gap || 0, land: r.land }));
    this.pads = (def.pads || []).map(p => {
      const s = sOfU(p.at);
      let d = p.d || 0;
      if (p.lane) { const i = this.idx(s); d = this.LANE[i] * (HW[i] + this.LW[i] - (this.LW[i] - (def.sections.find(x => x.lane && Math.abs(sOfU(x.a) - s) < L0)?.lane.div || 2.5)) / 2); }
      return { s, d, len: p.len || 7, w: p.w || 4 };
    });
    this.boxRows = (def.boxes || []).map(b => {
      const s = sOfU(typeof b === 'number' ? b : b.at);
      const i = this.idx(s);
      const hw = HW[i];
      const n = Math.max(3, Math.min(6, Math.floor((hw * 2 - 2) / 3.2)));
      const ds = [];
      for (let k = 0; k < n; k++) ds.push((k - (n - 1) / 2) * 3.2 + (typeof b === 'object' && b.d ? b.d : 0));
      return { s, ds };
    });
    this.obstacles = (def.obstacles || []).map(o => {
      const s = sOfU(o.at);
      const p = this.pointAt(s, o.d);
      return { s, d: o.d, r: o.r || 2, x: p.x, z: p.z, y: p.y, kind: o.kind || 'rock' };
    });
    this.dividers = [];
    for (const sc of secs) if (sc.lane) {
      let len = sc.s1 - sc.s0; if (len < 0) len += L0;
      const tp = Math.min(TAPER, len / 3);
      const s0 = sc.s0 + tp, s1 = sc.s0 + len - tp;
      this.dividers.push({ s0, s1, side: sc.lane.side, div: sc.lane.div, w: sc.lane.w });
    }
    // checkpoints
    const KCP = Math.max(8, Math.round(L0 / 60));
    this.checkpoints = [];
    for (let k = 1; k <= KCP; k++) this.checkpoints.push((k / KCP) * L0);
    this.computeRacingLine();
  }

  // ---- indexing helpers
  wrapS(s) { const L = this.L; return ((s % L) + L) % L; }
  idx(s) { return Math.min(this.N - 1, Math.floor(this.wrapS(s) / this.ds)); }
  // interpolated centre-line frame at distance s
  frame(s) {
    s = this.wrapS(s);
    const f = s / this.ds;
    const i = Math.min(this.N - 1, Math.floor(f)), j = (i + 1) % this.N, t = f - i;
    const lerp = (A) => A[i] + (A[j] - A[i]) * t;
    let fx = lerp(this.FX), fz = lerp(this.FZ);
    const l = Math.hypot(fx, fz) || 1; fx /= l; fz /= l;
    return { i, t, x: lerp(this.PX), y: lerp(this.PY) + this.yOffset(s), z: lerp(this.PZ), fx, fz, rx: -fz, rz: fx, hw: lerp(this.HW), bk: lerp(this.BK), extL: lerp(this.EXT_L), extR: lerp(this.EXT_R), sl: lerp(this.SL) };
  }
  pointAt(s, d) {
    const f = this.frame(s);
    const dd = Math.max(-f.hw, Math.min(f.hw, d));
    return { x: f.x + f.rx * d, z: f.z + f.rz * d, y: f.y + f.bk * dd + Math.max(0, Math.abs(d) - f.hw) * OFF_RISE, fx: f.fx, fz: f.fz, rx: f.rx, rz: f.rz };
  }
  yOffset(s) {
    let y = 0;
    for (const r of this.ramps) {
      let x = s - (r.lip - r.len); if (x < -this.L / 2) x += this.L; if (x > this.L / 2) x -= this.L;
      if (x >= 0 && x <= r.len) { const k = x / r.len; y += r.h * k * k; }
    }
    return y;
  }
  // the gap after a jump: void (fall and get rescued) unless the ramp says there is a floor below
  inPit(s) { const r = this.pitRamp(s); return !!r && r.land === undefined; }
  pitRamp(s) {
    for (const r of this.ramps) {
      if (!r.gap) continue;
      let x = s - r.lip; if (x < -this.L / 2) x += this.L; if (x > this.L / 2) x -= this.L;
      if (x > 0 && x < r.gap) return r;
    }
    return null;
  }

  // Nearest point on the centre line. hint: last known segment index (or -1).
  locate(x, z, hint = -1) {
    const N = this.N, PX = this.PX, PZ = this.PZ;
    let best = -1, bd = Infinity, bt = 0;
    const scan = (a, b) => {
      for (let k = a; k <= b; k++) {
        const i = ((k % N) + N) % N, j = (i + 1) % N;
        const ex = PX[j] - PX[i], ez = PZ[j] - PZ[i];
        const l2 = ex * ex + ez * ez;
        let t = ((x - PX[i]) * ex + (z - PZ[i]) * ez) / l2;
        t = t < 0 ? 0 : t > 1 ? 1 : t;
        const dx = x - (PX[i] + ex * t), dz = z - (PZ[i] + ez * t);
        const dd = dx * dx + dz * dz;
        if (dd < bd) { bd = dd; best = i; bt = t; }
      }
    };
    if (hint >= 0) scan(hint - 8, hint + 10);
    const lim = this.maxExt + 6;
    if (best < 0 || bd > lim * lim) { best = -1; bd = Infinity; scan(0, N - 1); }
    const i = best, j = (i + 1) % N, t = bt;
    let rx = this.RX[i] + (this.RX[j] - this.RX[i]) * t, rz = this.RZ[i] + (this.RZ[j] - this.RZ[i]) * t;
    const rl = Math.hypot(rx, rz) || 1; rx /= rl; rz /= rl;
    const cx = PX[i] + (PX[j] - PX[i]) * t, cz = PZ[i] + (PZ[j] - PZ[i]) * t;
    const d = (x - cx) * rx + (z - cz) * rz;
    const s = this.S[i] + t * this.ds;
    return { i, t, s, d, rx, rz, fx: rz, fz: -rx };
  }

  // Lateral intervals a kart can be in at sample i (walls, dividers). Returns [lo, hi] for the
  // band containing d, and which sides are solid.
  bounds(i, t, s, d) {
    const j = (i + 1) % this.N;
    const extL = this.EXT_L[i] + (this.EXT_L[j] - this.EXT_L[i]) * t;
    const extR = this.EXT_R[i] + (this.EXT_R[j] - this.EXT_R[i]) * t;
    const hw = this.HW[i] + (this.HW[j] - this.HW[i]) * t;
    let lo = -extL, hi = extR, wallLo = !!this.WL[i], wallHi = !!this.WR[i];
    for (const dv of this.dividers) {
      let x = s - dv.s0; if (x < 0) x += this.L;
      let len = dv.s1 - dv.s0; if (len < 0) len += this.L;
      if (x > len) continue;
      const a = dv.side > 0 ? hw : -hw - dv.div, b = dv.side > 0 ? hw + dv.div : -hw;
      if (d < (a + b) / 2) { if (a < hi) { hi = a; wallHi = true; } } else if (b > lo) { lo = b; wallLo = true; }
    }
    return { lo, hi, wallLo, wallHi, hw, extL, extR };
  }

  surfaceAt(i, t, s, d) {
    if (this.inPit(s)) return SURF.VOID;
    const hw = this.HW[i] + (this.HW[(i + 1) % this.N] - this.HW[i]) * t;
    if (Math.abs(d) <= hw) return this.SR[i];
    const right = d > 0;
    const ext = right ? this.EXT_R[i] : this.EXT_L[i];
    if (Math.abs(d) > ext + 0.5) return (right ? this.WR[i] : this.WL[i]) ? SURF.WALL : SURF.VOID;
    if (this.LANE[i] === (right ? 1 : -1)) return SURF.DIRT;
    const sf = right ? this.SOR[i] : this.SOL[i];
    // a rocky shoulder before the lava so a wheel over the line isn't instant death
    if (sf === SURF.LAVA && Math.abs(d) - hw < SHOULDER) return SURF.SAND;
    return sf;
  }

  // Ground under (x, z). Returns height, normal, surface and local coords.
  ground(x, z, hint = -1) {
    const L = this.locate(x, z, hint);
    const { i, t, s, d } = L;
    const j = (i + 1) % this.N;
    const lerp = A => A[i] + (A[j] - A[i]) * t;
    const hw = lerp(this.HW), bk = lerp(this.BK), sl = lerp(this.SL);
    const surf = this.surfaceAt(i, t, s, d);
    let base = lerp(this.PY) + this.yOffset(s);
    const dd = d < -hw ? -hw : d > hw ? hw : d;
    let h = base + bk * dd + Math.max(0, Math.abs(d) - hw) * OFF_RISE;
    if (surf === SURF.VOID) h = base - 60;
    else if (this.ramps.length) { const pr = this.pitRamp(s); if (pr && pr.land !== undefined) h = pr.land; }
    // slope of the ramp at s for the normal
    let rs = 0;
    for (const r of this.ramps) {
      let xx = s - (r.lip - r.len); if (xx < -this.L / 2) xx += this.L; if (xx > this.L / 2) xx -= this.L;
      if (xx >= 0 && xx <= r.len) rs += (2 * r.h * xx) / (r.len * r.len);
    }
    const slope = sl + rs;
    const lat = Math.abs(d) <= hw ? bk : (d > 0 ? OFF_RISE : -OFF_RISE);
    // normal = normalize(cross(R, T)), T = (fx, slope, fz), R = (rx, lat, rz)
    const fx = L.fx, fz = L.fz, rx = L.rx, rz = L.rz;
    let nx = lat * fz - rz * slope, ny = rz * fx - rx * fz, nz = rx * slope - lat * fx;
    const nl = Math.hypot(nx, ny, nz) || 1;
    return { h, nx: nx / nl, ny: ny / nl, nz: nz / nl, surf, s, d, i, t, base, hw, fx, fz, rx, rz };
  }

  // ---- racing line: elastic-band smoothing of lateral offsets inside the road
  computeRacingLine() {
    const N = this.N;
    const D = new Float32Array(N);
    const px = new Float32Array(N), pz = new Float32Array(N);
    for (let it = 0; it < 900; it++) {
      for (let i = 0; i < N; i++) { px[i] = this.PX[i] + this.RX[i] * D[i]; pz[i] = this.PZ[i] + this.RZ[i] * D[i]; }
      for (let i = 0; i < N; i++) {
        const a = (i - 1 + N) % N, b = (i + 1) % N;
        const tx = (px[a] + px[b]) / 2, tz = (pz[a] + pz[b]) / 2;
        const nd = (tx - this.PX[i]) * this.RX[i] + (tz - this.PZ[i]) * this.RZ[i];
        const m = Math.max(1.5, this.HW[i] - 2.2);
        D[i] = Math.max(-m, Math.min(m, D[i] + (nd - D[i]) * 0.6));
      }
    }
    // curvature of the line -> speed limit
    for (let i = 0; i < N; i++) { px[i] = this.PX[i] + this.RX[i] * D[i]; pz[i] = this.PZ[i] + this.RZ[i] * D[i]; }
    const KL = new Float32Array(N);
    for (let i = 0; i < N; i++) {
      const a = (i - 3 + N) % N, b = (i + 3) % N;
      const ax = px[i] - px[a], az = pz[i] - pz[a], bx = px[b] - px[i], bz = pz[b] - pz[i];
      const cr = ax * bz - az * bx, dt = ax * bx + az * bz;
      const len = (Math.hypot(ax, az) + Math.hypot(bx, bz)) / 2 || 1;
      KL[i] = Math.atan2(cr, dt) / len;
    }
    this.RL = D;
    this.RLK = KL;
  }

  // Grid slot k (0 = pole). Behind the start line, two staggered columns.
  gridSlot(k) {
    const row = Math.floor(k / 2), col = k % 2;
    const s = -7 - row * 7 - col * 3.2;
    const hw = this.HW[0];
    const d = (col === 0 ? -1 : 1) * Math.min(3.6, hw * 0.45);
    const p = this.pointAt(this.wrapS(s), d);
    return { s, d, x: p.x, y: p.y, z: p.z, yaw: Math.atan2(p.fx, p.fz) };
  }
}

// Sanity checks used by the tests: the corridor never overlaps itself.
export function selfIntersections(track, margin = 2) {
  const N = track.N, bad = [];
  const ext = i => Math.max(track.EXT_L[i], track.EXT_R[i]) + 1;
  for (let i = 0; i < N; i += 1) {
    for (let j = i + 1; j < N; j++) {
      let gap = Math.abs(track.S[i] - track.S[j]);
      gap = Math.min(gap, track.L - gap);
      const need = ext(i) + ext(j) + margin;
      if (gap < need * 1.6) continue;
      const dx = track.PX[i] - track.PX[j], dz = track.PZ[i] - track.PZ[j];
      if (dx * dx + dz * dz < need * need) {
        // allow genuine bridges (big height difference)
        if (Math.abs(track.PY[i] - track.PY[j]) > 5.5) continue;
        bad.push([i, j, Math.sqrt(dx * dx + dz * dz), need]);
      }
    }
  }
  return bad;
}
