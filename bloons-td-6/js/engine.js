'use strict';
// Simulation: paths, bloons, towers, projectiles, rounds. Fixed 60Hz step,
// fast forward runs extra steps. Rendering lives in render.js.
(function () {
  const B = BTD.BLOONS;
  const TAU = Math.PI * 2;
  const DT = 1 / 60;
  const TRACK_W = 42;
  const CELL = 8;
  const GCELL = 50;
  let nextId = 1;

  const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
  const rand = (a, b) => a + Math.random() * (b - a);
  BTD.clamp = clamp;

  function clone(o) {
    if (Array.isArray(o)) return o.map(clone);
    if (o && typeof o === 'object') {
      const r = {};
      for (const k in o) r[k] = clone(o[k]);
      return r;
    }
    return o;
  }
  BTD.clone = clone;

  // ---------- Paths ----------
  function roundPath(pts, rad) {
    const out = [];
    out.push(pts[0]);
    for (let i = 1; i < pts.length - 1; i++) {
      const [ax, ay] = pts[i - 1], [bx, by] = pts[i], [cx, cy] = pts[i + 1];
      const l1 = Math.hypot(bx - ax, by - ay), l2 = Math.hypot(cx - bx, cy - by);
      const r = Math.min(rad, l1 / 2, l2 / 2);
      const ux = (ax - bx) / l1, uy = (ay - by) / l1, vx = (cx - bx) / l2, vy = (cy - by) / l2;
      const p1 = [bx + ux * r, by + uy * r], p2 = [bx + vx * r, by + vy * r];
      // quadratic bezier with the corner as control point: close to an arc
      for (let k = 0; k <= 12; k++) {
        const t = k / 12, it = 1 - t;
        out.push([it * it * p1[0] + 2 * it * t * bx + t * t * p2[0], it * it * p1[1] + 2 * it * t * by + t * t * p2[1]]);
      }
    }
    out.push(pts[pts.length - 1]);
    return out;
  }
  function splinePath(pts) {
    const out = [];
    const P = (i) => pts[clamp(i, 0, pts.length - 1)];
    for (let i = 0; i < pts.length - 1; i++) {
      const p0 = P(i - 1), p1 = P(i), p2 = P(i + 1), p3 = P(i + 2);
      for (let k = 0; k < 16; k++) {
        const t = k / 16, t2 = t * t, t3 = t2 * t;
        const f = (a, b, c, d) => 0.5 * (2 * b + (-a + c) * t + (2 * a - 5 * b + 4 * c - d) * t2 + (-a + 3 * b - 3 * c + d) * t3);
        out.push([f(p0[0], p1[0], p2[0], p3[0]), f(p0[1], p1[1], p2[1], p3[1])]);
      }
    }
    out.push(pts[pts.length - 1]);
    return out;
  }
  class Path {
    constructor(spec, reverse) {
      let pts = spec.mode === 'spline' ? splinePath(spec.pts) : roundPath(spec.pts, spec.r || 40);
      if (reverse) pts = pts.slice().reverse();
      // resample to a fixed step so lookups are O(1)
      const step = 3;
      const cum = [0];
      for (let i = 1; i < pts.length; i++) cum.push(cum[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]));
      const len = cum[cum.length - 1];
      const n = Math.ceil(len / step) + 1;
      this.x = new Float32Array(n); this.y = new Float32Array(n); this.a = new Float32Array(n);
      let j = 0;
      for (let i = 0; i < n; i++) {
        const d = Math.min(i * step, len);
        while (j < cum.length - 2 && cum[j + 1] < d) j++;
        const seg = cum[j + 1] - cum[j] || 1;
        const f = (d - cum[j]) / seg;
        this.x[i] = pts[j][0] + (pts[j + 1][0] - pts[j][0]) * f;
        this.y[i] = pts[j][1] + (pts[j + 1][1] - pts[j][1]) * f;
      }
      for (let i = 0; i < n; i++) {
        const a = Math.max(0, i - 2), b = Math.min(n - 1, i + 2);
        this.a[i] = Math.atan2(this.y[b] - this.y[a], this.x[b] - this.x[a]);
      }
      this.n = n; this.len = len; this.step = step;
    }
    at(d, o) {
      const f = clamp(d, 0, this.len) / this.step;
      const i = Math.min(this.n - 2, f | 0), t = f - i;
      o.x = this.x[i] + (this.x[i + 1] - this.x[i]) * t;
      o.y = this.y[i] + (this.y[i + 1] - this.y[i]) * t;
      o.ang = this.a[i];
      return o;
    }
  }

  // ---------- Game ----------
  class Game {
    constructor(opts) {
      this.map = opts.map;
      this.diffKey = opts.diff;
      this.mode = opts.mode;
      this.heroKey = opts.hero || null;
      const diff = BTD.DIFF[opts.diff];
      this.costMult = this.mode.cost || diff.cost;
      this.cash = this.mode.cash || diff.cash;
      this.lives = this.mode.lives || diff.lives;
      this.maxLives = this.lives;
      this.round = this.mode.start - 1;
      this.endRound = this.mode.end;
      this.roundActive = false;
      this.queue = [];
      this.qi = 0;
      this.roundT = 0;
      this.bloons = [];
      this.towers = [];
      this.projs = [];
      this.fx = [];
      this.spikes = [];
      this.patches = [];
      this.bananas = [];
      this.speed = 1;
      this.autoStart = !!opts.autoStart;
      this.paused = false;
      this.over = false;
      this.won = false;
      this.freeplay = false;
      this.popsTotal = 0;
      this.spawnAlt = 0;
      this.mouse = { x: BTD.W / 2, y: BTD.H / 2 };
      this.sabotage = 0;
      this.time = 0;
      this.events = [];
      this.heroPlaced = false;
      this.blitzCd = 0;
      this.buildMap();
    }

    buildMap() {
      const m = this.map;
      this.paths = m.paths.map((p) => new Path(p, this.mode.reverse));
      const gw = Math.ceil(BTD.W / CELL), gh = Math.ceil(BTD.H / CELL);
      this.gw = gw; this.gh = gh;
      this.cells = new Uint8Array(gw * gh);
      const mark = (x, y, r, bit) => {
        const x0 = Math.max(0, Math.floor((x - r) / CELL)), x1 = Math.min(gw - 1, Math.floor((x + r) / CELL));
        const y0 = Math.max(0, Math.floor((y - r) / CELL)), y1 = Math.min(gh - 1, Math.floor((y + r) / CELL));
        for (let j = y0; j <= y1; j++) for (let i = x0; i <= x1; i++) {
          const cx = i * CELL + CELL / 2, cy = j * CELL + CELL / 2;
          if ((cx - x) ** 2 + (cy - y) ** 2 <= r * r) this.cells[j * gw + i] |= bit;
        }
      };
      for (const p of this.paths) for (let i = 0; i < p.n; i += 2) mark(p.x[i], p.y[i], TRACK_W / 2 + 2, 1);
      for (const w of m.water || []) {
        for (let j = 0; j < gh; j++) for (let i = 0; i < gw; i++) {
          const cx = i * CELL + CELL / 2, cy = j * CELL + CELL / 2;
          let inside = false;
          if (w.t === 'circle') inside = (cx - w.x) ** 2 + (cy - w.y) ** 2 <= w.r * w.r;
          else inside = ((cx - w.x) / w.rx) ** 2 + ((cy - w.y) / w.ry) ** 2 <= 1;
          if (inside) this.cells[j * gw + i] |= 2;
        }
      }
      for (const l of m.lava || []) mark(l.x, l.y, l.r, 4);
      if (m.stump) mark(m.stump[0], m.stump[1], m.stump[2] + 4, 4);
      if (m.hole) mark(m.hole[0], m.hole[1], m.hole[2] + 6, 4);
      if (m.castle) mark(m.castle[0], m.castle[1], 80, 4);
      // trees: seeded so the same map always looks the same
      let s = 0;
      for (const ch of m.id) s = (s * 31 + ch.charCodeAt(0)) >>> 0;
      const rnd = () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; };
      this.rnd = rnd;
      this.trees = [];
      let tries = 0;
      while (this.trees.length < (m.trees || 10) && tries++ < 3000) {
        const x = 30 + rnd() * (BTD.W - 60), y = 30 + rnd() * (BTD.H - 60), r = 16 + rnd() * 12;
        if (!this.areaFree(x, y, r + 22, true)) continue;
        if (this.trees.some((t) => Math.hypot(t.x - x, t.y - y) < t.r + r + 60)) continue;
        this.trees.push({ x, y, r, v: rnd() });
        mark(x, y, r, 4);
      }
      this.decoSeed = rnd() * 1e9;
      this.trackPts = [];
      for (let pi = 0; pi < this.paths.length; pi++) {
        const p = this.paths[pi];
        for (let i = 0; i < p.n; i += 4) if (p.x[i] > 0 && p.x[i] < BTD.W && p.y[i] > 0 && p.y[i] < BTD.H) this.trackPts.push({ x: p.x[i], y: p.y[i], d: i * p.step, p: pi });
      }
      this.ggw = Math.ceil(BTD.W / GCELL) + 2; this.ggh = Math.ceil(BTD.H / GCELL) + 2;
      this.grid = Array.from({ length: this.ggw * this.ggh }, () => []);
    }

    cellAt(x, y) {
      const i = Math.floor(x / CELL), j = Math.floor(y / CELL);
      if (i < 0 || j < 0 || i >= this.gw || j >= this.gh) return 255;
      return this.cells[j * this.gw + i];
    }
    areaFree(x, y, r, landOnly) {
      for (let a = 0; a < 12; a++) {
        const ang = (a / 12) * TAU;
        for (const f of [0, 0.5, 1]) {
          const c = this.cellAt(x + Math.cos(ang) * r * f, y + Math.sin(ang) * r * f);
          if (c === 255 || (c & 5) || (landOnly && (c & 2))) return false;
        }
      }
      return true;
    }
    canPlace(key, x, y) {
      const def = key.startsWith('hero:') ? BTD.HEROES[key.slice(5)] : BTD.TOWERS[key];
      const r = def.r || 16;
      if (x < r || y < r || x > BTD.W - r || y > BTD.H - r) return false;
      for (let a = 0; a < 10; a++) {
        const ang = (a / 10) * TAU;
        for (const f of [0, 0.6, 0.85]) {
          const c = this.cellAt(x + Math.cos(ang) * r * f, y + Math.sin(ang) * r * f);
          if (c === 255 || (c & 5)) return false;
          if (def.water ? !(c & 2) : (c & 2)) return false;
        }
      }
      for (const t of this.towers) if (!t.temp && Math.hypot(t.x - x, t.y - y) < r + t.r - 2) return false;
      return true;
    }

    // ---------- money ----------
    price(base, x, y, tierIdx) {
      let c = base * this.costMult;
      let disc = 0;
      if (x != null) for (const v of this.towers) {
        const vs = v.stats;
        if (vs && vs.discount && (tierIdx == null || tierIdx < 3) && Math.hypot(v.x - x, v.y - y) <= vs.range + 4) disc = Math.max(disc, vs.discount);
      }
      c *= 1 - disc;
      return Math.max(5, Math.round(c / 5) * 5);
    }
    towerCost(key, x, y) {
      const def = key.startsWith('hero:') ? BTD.HEROES[key.slice(5)] : BTD.TOWERS[key];
      return this.price(def.cost, x, y, null);
    }
    upgradeCost(t, path) {
      const def = BTD.TOWERS[t.k];
      const u = def.up[path][t.up[path]];
      return u ? this.price(u.c, t.x, t.y, t.up[path]) : Infinity;
    }
    canUpgradePath(t, path) {
      if (t.hero || t.temp) return false;
      const up = t.up.slice();
      if (up[path] >= 5) return false;
      up[path]++;
      const used = up.filter((v) => v > 0).length;
      if (used > 2) return false;
      if (up.filter((v) => v > 2).length > 1) return false;
      return true;
    }
    addCash(n) {
      if (!isFinite(n)) return;
      this.cash += n;
    }
    sellValue(t) {
      if (this.mode.chimps) return 0;
      return Math.floor(t.spent * (t.stats.sellRate || 0.7));
    }

    // ---------- towers ----------
    place(key, x, y) {
      if (this.over) return null;
      if (!this.canPlace(key, x, y)) return null;
      const cost = this.towerCost(key, x, y);
      if (this.cash < cost) return null;
      const isHero = key.startsWith('hero:');
      if (isHero && this.heroPlaced) return null;
      if (this.mode.chimps && key === 'farm') return null;
      const def = isHero ? BTD.HEROES[key.slice(5)] : BTD.TOWERS[key];
      if (this.mode.only && !isHero && def.cat !== this.mode.only) return null;
      this.cash -= cost;
      const t = this.makeTower(isHero ? key.slice(5) : key, x, y, isHero);
      t.spent = cost;
      if (isHero) this.heroPlaced = true;
      this.towers.push(t);
      this.recalcAll();
      BTD.audio && BTD.audio.play('place');
      return t;
    }
    makeTower(k, x, y, isHero) {
      const def = isHero ? BTD.HEROES[k] : BTD.TOWERS[k];
      const t = {
        id: nextId++, k, x, y, r: def.r || 16, up: [0, 0, 0], targ: 0, pops: 0, spent: 0,
        cd: [], ang: -Math.PI / 2, boosts: [], abilityCd: 0, shots: 0, spin: 0,
        heli: { x, y }, ace: { a: 0, x, y }, aim: null, bank: 0, wrath: 0, def,
      };
      if (isHero) t.hero = { lvl: 1, xp: 0 };
      return t;
    }
    upgrade(t, path) {
      if (!this.canUpgradePath(t, path)) return false;
      const cost = this.upgradeCost(t, path);
      if (this.cash < cost) return false;
      this.cash -= cost;
      t.spent += cost;
      t.up[path]++;
      this.recalcAll();
      BTD.audio && BTD.audio.play('upgrade');
      return true;
    }
    sell(t) {
      if (this.mode.chimps || t.temp) return;
      this.cash += this.sellValue(t);
      if (t.hero) this.heroPlaced = false;
      this.towers.splice(this.towers.indexOf(t), 1);
      if (t.stats.bananas) this.bananas = this.bananas.filter((b) => b.farm !== t);
      this.recalcAll();
      BTD.audio && BTD.audio.play('sell');
    }

    buildStats(t) {
      if (t.temp) return t.stats;
      const def = t.def;
      const s = clone(def.base);
      s.range = s.range || 40 * BTD.U;
      s.a = s.a || [];
      if (t.hero) {
        def.level(s, t.hero.lvl);
      } else {
        for (let p = 0; p < 3; p++) for (let i = 0; i < t.up[p]; i++) def.up[p][i].f(s, t);
      }
      return s;
    }
    recalcAll() {
      for (const t of this.towers) {
        t.stats = this.buildStats(t);
        t.mod = { rate: 1, range: 1, dmg: 0, pierce: 0, pierceMult: 1, camo: false, normal: false, moab: 0, cashMult: 1 };
      }
      // support auras: villages, shinobi, heroes and anything with buff{}
      for (const v of this.towers) {
        const bf = v.stats.buff;
        if (!bf) continue;
        for (const t of this.towers) {
          if (bf.self === false && t === v) continue;
          if (Math.hypot(t.x - v.x, t.y - v.y) > v.stats.range * (v.mod ? 1 : 1) + t.r) continue;
          if (bf.only && !bf.only(t)) continue;
          const m = t.mod;
          if (bf.rate) m.rate *= bf.rate;
          if (bf.range) m.range = Math.max(m.range, bf.range);
          if (bf.dmg) m.dmg += bf.dmg;
          if (bf.pierce) m.pierce += bf.pierce;
          if (bf.pierceMult) m.pierceMult *= bf.pierceMult;
          if (bf.camo) m.camo = true;
          if (bf.normal) m.normal = true;
          if (bf.moab) m.moab += bf.moab;
          if (bf.cashMult) m.cashMult = Math.max(m.cashMult, bf.cashMult);
        }
      }
      for (const t of this.towers) {
        t.trackIn = this.trackPts.filter((p) => Math.hypot(p.x - t.x, p.y - t.y) <= this.range(t));
        while (t.cd.length < t.stats.a.length) t.cd.push(Math.random() * 0.2);
        if (t.stats.ability && t.abilityCd === 0 && !t.abilityInit) { t.abilityCd = t.stats.ability.cd * 0.35; t.abilityInit = true; }
      }
    }
    range(t) {
      let r = t.stats.range * t.mod.range;
      for (const b of t.boosts) if (b.range) r *= b.range;
      return r;
    }
    canSeeCamo(t) { return t.stats.camo || t.mod.camo || t.boosts.some((b) => b.camo); }

    // ---------- rounds ----------
    startRound() {
      if (this.over) return;
      if (this.roundActive && !this.mode.apop) return;
      this.round++;
      this.roundActive = true;
      this.roundT = 0;
      const spec = BTD.roundSpec(this.round);
      const q = [];
      for (const [count, typ, st, en] of spec) {
        const [type, flags = ''] = typ.split(':');
        for (let i = 0; i < count; i++) {
          const t = st + (count > 1 ? (en - st) * (i / (count - 1)) : 0);
          q.push({ t, type, flags });
        }
      }
      q.sort((a, b) => a.t - b.t);
      this.queue = q; this.qi = 0;
      // farms schedule this round's bananas
      for (const t of this.towers) {
        const bn = t.stats.bananas;
        if (!bn || this.mode.chimps) continue;
        t.bananaQ = [];
        for (let i = 0; i < bn.n; i++) t.bananaQ.push(1 + (i / bn.n) * 12);
      }
      this.events.push({ type: 'round', round: this.round });
      BTD.audio && BTD.audio.play('round');
    }
    finishRound() {
      this.roundActive = false;
      const r = this.round;
      if (!this.mode.chimps && !this.mode.noIncome) {
        this.addCash((100 + r) * (this.mode.cashMult || 1));
      }
      for (const t of this.towers) {
        const s = t.stats;
        if (s.income && !this.mode.chimps) this.addCash(s.income * (this.mode.cashMult || 1));
        if (s.bank != null) { t.bank = Math.min(s.bankCap || 7000, Math.round(t.bank * (1 + (s.interest || 0.15)))); }
        if (t.hero) this.heroXp(t, BTD.heroXpForRound(r));
      }
      // banana auto pickup at round end
      for (const b of this.bananas) this.collectBanana(b);
      this.bananas = [];
      this.spikes = this.spikes.filter((s) => s.persist && --s.rounds > 0);
      this.events.push({ type: 'roundEnd', round: r });
      if (r >= this.endRound && !this.freeplay && !this.won) {
        this.won = true;
        this.events.push({ type: 'win' });
        BTD.audio && BTD.audio.play('win');
      } else if (this.autoStart || this.mode.apop) {
        this.pendingStart = 0.4;
      }
    }
    heroXp(t, xp) {
      const h = t.hero;
      h.xp += xp * (t.def.xpRatio || 1);
      let changed = false;
      while (h.lvl < 20 && h.xp >= BTD.heroLevelXp(h.lvl + 1)) { h.lvl++; changed = true; }
      if (changed) { this.recalcAll(); this.events.push({ type: 'herolvl', lvl: h.lvl }); BTD.audio && BTD.audio.play('upgrade'); }
    }

    // ---------- bloons ----------
    spawn(type, flags, pi, d) {
      const def = B[type];
      const fort = flags.includes('f');
      let hp = def.hp;
      if (fort) hp = def.fortHp || (def.moab ? def.hp * 2 : def.hp);
      if (def.moab) hp = Math.round(hp * BTD.hpScale(this.round) * (this.mode.moabHp || 1));
      if (def.moab && this.sabotageMoab > 0) hp = Math.round(hp * 0.75);
      const b = {
        id: nextId++, t: type, def, hp, maxHp: hp, d: d || 0, p: pi,
        camo: flags.includes('c') || !!def.camo, regrow: flags.includes('r'), fort,
        x: 0, y: 0, ang: 0, slowM: 1, slowT: 0, frozen: 0, stun: 0, glue: null,
        burn: null, acid: null, brittle: 0, brittleB: 0, chain: null, regrowT: 0, gold: false, dead: false,
        r: def.r || def.wid * 0.5, spd: BTD.speedScale(this.round),
      };
      const p = this.paths[pi];
      p.at(b.d, b);
      this.bloons.push(b);
      if (def.moab) for (const t of this.towers) if (t.stats.preempt) this.hitBloon(b, t.stats.preempt, t, null);
      return b;
    }
    spawnKids(b, proj) {
      const kids = b.def.kids;
      if (!kids.length) return [];
      const out = [];
      const n = kids.length;
      const sp = b.def.moab ? 9 : 6;
      const flags = (b.camo || (b.def.kidFlags || '').includes('c') ? 'c' : '') + (b.regrow || (b.def.kidFlags || '').includes('r') ? 'r' : '');
      const oldRound = this.round;
      for (let i = 0; i < n; i++) {
        const k = this.spawn(kids[i], flags, b.p, Math.max(0, b.d + (i - (n - 1) / 2) * sp));
        if (b.def.moab) { k.hp = B[kids[i]].moab ? Math.round(B[kids[i]].hp * BTD.hpScale(oldRound) * (this.mode.moabHp || 1)) : k.hp; k.maxHp = k.hp; }
        if (k.regrow) {
          k.chain = (b.chain || []).concat([b.t]);
          if ((b.def.kidFlags || '').includes('r') && !b.regrow) k.chain = [];
        }
        if (b.glue && b.glue.soak && !k.def.moab) k.glue = Object.assign({}, b.glue);
        if (b.slowT > 0) { k.slowT = b.slowT; k.slowM = b.slowM; }
        if (b.brittle > 0) { k.brittle = b.brittle; k.brittleB = b.brittleB; }
        if (b.gold) k.gold = true;
        if (b.frozenKids) k.frozen = b.frozenKids;
        if (proj) proj.hit.add(k.id);
        out.push(k);
      }
      return out;
    }

    hitBloon(b, a, owner, proj, hitSet) {
      if (b.dead) return false;
      const def = b.def;
      let dt = a.dmgType || 'sharp';
      if (owner && owner.mod && owner.mod.normal) dt = 'normal';
      if (dt !== 'normal' && def.immune && def.immune.includes(dt)) {
        if (Math.random() < 0.25) this.fx.push({ k: 'block', x: b.x, y: b.y, t: 0, life: 0.25 });
        return true;
      }
      if (dt === 'glue' && def.moab && !(a.fx && a.fx.glue && a.fx.glue.moab)) return true;
      if (a.onlyMoab && !def.moab) return false;
      if (a.fx) this.applyFx(b, a.fx, owner);
      let d = a.dmg || 0;
      if (def.moab) d += a.moab || 0;
      if (b.t === 'ceramic') d += a.ceram || 0;
      if (b.fort) d += a.fort || 0;
      if (b.t === 'lead') d += a.lead || 0;
      if (b.camo) d += a.camoB || 0;
      if (b.stun > 0 || b.frozen > 0) d += a.stunB || 0;
      if (b.brittle > 0) d += b.brittleB;
      if (b.glue && b.glue.bonus) d += b.glue.bonus;
      if (d > 0) this.damage(b, d, owner, proj || (hitSet ? { hit: hitSet } : null));
      return true;
    }
    applyFx(b, fx, owner) {
      const def = b.def, isM = !!def.moab, bad = b.t === 'bad';
      if (fx.slow && !bad && (!isM || fx.slowMoab)) {
        if (fx.slow[0] <= b.slowM || b.slowT <= 0) { b.slowM = fx.slow[0]; b.slowT = Math.max(b.slowT, fx.slow[1]); }
      }
      if (fx.freeze && !bad && !(def.immune && def.immune.includes('cold')) && (!isM || fx.freezeMoab)) {
        b.frozen = Math.max(b.frozen, isM ? fx.freeze * 0.5 : fx.freeze);
        if (fx.freezeKids) b.frozenKids = fx.freeze * 0.6;
      }
      if (fx.glue && !bad && (!isM || fx.glue.moab)) {
        if (!b.glue || (fx.glue.dot || 0) >= (b.glue.dot || 0)) b.glue = Object.assign({ t: 0, owner }, fx.glue, { left: fx.glue.dur });
      }
      if (fx.stun && !bad && (!isM || fx.stunMoab)) b.stun = Math.max(b.stun, isM ? fx.stun * 0.6 : fx.stun);
      if (fx.burn) b.burn = Object.assign({ t: 0, owner }, fx.burn, { left: fx.burn.dur });
      if (fx.acid) b.acid = Object.assign({ t: 0, owner }, fx.acid, { left: fx.acid.dur });
      if (fx.knock && !bad && (!isM || fx.knockMoab) && (!fx.knockChance || Math.random() < fx.knockChance)) {
        b.d = Math.max(0, b.d - fx.knock * (isM ? 0.5 : 1));
      }
      if (fx.decamo) b.camo = false;
      if (fx.degrow) { b.regrow = false; b.chain = null; }
      if (fx.defort && b.fort) { b.fort = false; b.hp = Math.min(b.hp, Math.ceil(b.maxHp / 2)); }
      if (fx.brittle) { b.brittle = fx.brittle.dur; b.brittleB = Math.max(b.brittleB, fx.brittle.bonus); }
      if (fx.gold) b.gold = true;
      if (fx.shrink && !bad && (!isM || def.moab <= (fx.shrinkMax || 2))) {
        b.t = 'red'; b.def = B.red; b.hp = 1; b.maxHp = 1; b.r = B.red.r; b.chain = null; b.regrow = false; b.fort = false;
      }
    }
    damage(b, d, owner, proj) {
      if (b.dead) return;
      b.regrowT = 0;
      if (b.hp > d) { b.hp -= d; b.flash = 0.06; return; }
      const over = d - b.hp;
      this.pop(b, owner, proj, over);
    }
    pop(b, owner, proj, over) {
      b.dead = true;
      if (!this.mode.noIncome) {
        let c = BTD.cashScale(this.round) * (this.mode.cashMult || 1);
        if (b.gold) c *= 2;
        if (owner && owner.mod) c *= owner.mod.cashMult;
        if (owner && owner.stats && owner.stats.leadGold && b.t === 'lead') c += owner.stats.leadGold;
        this.cash += c;
      }
      this.popsTotal++;
      if (owner) {
        owner.pops++;
        if (owner.stats && owner.stats.wrath) owner.wrath = Math.min(owner.wrath + 1, 200);
      }
      if (this.fx.length < 260) this.fx.push({ k: b.def.moab ? 'moabpop' : 'pop', x: b.x, y: b.y, t: 0, life: b.def.moab ? 0.5 : 0.13, r: b.r, rot: Math.random() * TAU });
      BTD.audio && BTD.audio.play(b.def.moab ? 'moabpop' : 'pop');
      const kids = this.spawnKids(b, proj);
      if (over > 0) for (const k of kids) this.damage(k, over, owner, proj);
    }
    leak(b) {
      b.dead = true;
      const lost = Math.max(1, Math.ceil(b.hp + b.def.rbe - b.def.hp));
      this.lives -= lost;
      this.events.push({ type: 'leak', n: lost });
      BTD.audio && BTD.audio.play('leak');
      if (this.blitzCd <= 0) {
        const blitz = this.towers.find((t) => t.stats.blitz);
        if (blitz) {
          this.blitzCd = 40;
          this.damageAll({ dmg: 1000, dmgType: 'normal', notBad: true }, blitz);
        }
      }
      if (this.lives <= 0) {
        this.lives = 0;
        this.over = true;
        this.events.push({ type: 'lose' });
        BTD.audio && BTD.audio.play('lose');
      }
    }

    // ---------- spatial grid ----------
    buildGrid() {
      for (const c of this.grid) c.length = 0;
      for (const b of this.bloons) {
        if (b.dead) continue;
        const i = clamp(Math.floor(b.x / GCELL) + 1, 0, this.ggw - 1), j = clamp(Math.floor(b.y / GCELL) + 1, 0, this.ggh - 1);
        this.grid[j * this.ggw + i].push(b);
      }
    }
    query(x, y, r, out) {
      out.length = 0;
      const pad = 60;
      const i0 = clamp(Math.floor((x - r - pad) / GCELL) + 1, 0, this.ggw - 1), i1 = clamp(Math.floor((x + r + pad) / GCELL) + 1, 0, this.ggw - 1);
      const j0 = clamp(Math.floor((y - r - pad) / GCELL) + 1, 0, this.ggh - 1), j1 = clamp(Math.floor((y + r + pad) / GCELL) + 1, 0, this.ggh - 1);
      for (let j = j0; j <= j1; j++) for (let i = i0; i <= i1; i++) {
        const c = this.grid[j * this.ggw + i];
        for (const b of c) {
          if (b.dead) continue;
          const rr = r + b.r;
          if ((b.x - x) ** 2 + (b.y - y) ** 2 <= rr * rr) out.push(b);
        }
      }
      return out;
    }

    remaining(b) { return this.paths[b.p].len - b.d; }
    pickTarget(t, ox, oy, range, a, mode) {
      const camo = this.canSeeCamo(t);
      const list = range >= 2000 ? this.bloons : this.query(ox, oy, range, this._q || (this._q = []));
      let best = null, bv = -Infinity;
      const m = mode != null ? mode : (a && a.targetStrong ? 3 : t.targ);
      for (const b of list) {
        if (b.dead || (b.camo && !camo)) continue;
        if (b.x < -10 || b.y < -10 || b.x > BTD.W + 10 || b.y > BTD.H + 10) continue;
        if (a && a.onlyMoab && !b.def.moab) continue;
        if (a && a.skipGlued && b.glue && !b.def.moab) continue;
        if (range < 2000 && (b.x - ox) ** 2 + (b.y - oy) ** 2 > (range + b.r) ** 2) continue;
        let v;
        const rem = this.remaining(b);
        if (m === 0) v = -rem;
        else if (m === 1) v = rem;
        else if (m === 2) v = -((b.x - ox) ** 2 + (b.y - oy) ** 2);
        else v = b.def.rank * 1e6 - rem;
        if (v > bv) { bv = v; best = b; }
      }
      if (!best && a && a.skipGlued) return this.pickTarget(t, ox, oy, range, Object.assign({}, a, { skipGlued: false }), mode);
      return best;
    }

    // effective attack after tower mods and timed boosts
    eff(t, a) {
      const e = Object.assign({}, a);
      const m = t.mod;
      let rate = m.rate, dmg = m.dmg, pierce = m.pierce, pm = m.pierceMult, moab = m.moab;
      for (const b of t.boosts) {
        if (b.rate) rate *= b.rate;
        if (b.dmg) dmg += b.dmg;
        if (b.pierce) pierce += b.pierce;
        if (b.pierceMult) pm *= b.pierceMult;
        if (b.moab) moab += b.moab;
      }
      if (t.stats.wrath) rate *= Math.max(0.35, 1 - t.wrath / 220);
      e.rate = a.rate * rate;
      if (a.kind !== 'aura' || a.dmg > 0) e.dmg = (a.dmg || 0) + (a.dmg > 0 || a.expl ? dmg : 0);
      e.pierce = Math.ceil((a.pierce || 1) * pm + pierce);
      e.moab = (a.moab || 0) + moab;
      if (e.expl) {
        e.expl = Object.assign({}, a.expl);
        e.expl.dmg += dmg; e.expl.pierce = Math.ceil(e.expl.pierce * pm + pierce); e.expl.moab = (e.expl.moab || 0) + moab;
      }
      if (m.normal) { e.dmgType = 'normal'; if (e.expl) e.expl.dmgType = 'normal'; }
      return e;
    }

    // ---------- step ----------
    update(realDt) {
      if (this.paused || this.over) return;
      this.acc = (this.acc || 0) + Math.min(realDt, 0.1) * this.speed;
      let steps = 0;
      while (this.acc >= DT && steps < 12) { this.step(DT); this.acc -= DT; steps++; if (this.over) break; }
      if (steps >= 12) this.acc = 0;
    }
    step(dt) {
      this.time += dt;
      if (this.blitzCd > 0) this.blitzCd -= dt;
      if (this.pendingStart != null) {
        this.pendingStart -= dt;
        if (this.pendingStart <= 0) { this.pendingStart = null; if (!this.roundActive || this.mode.apop) this.startRound(); }
      }
      if (this.sabotage > 0) this.sabotage -= dt;
      if (this.sabotageMoab > 0) this.sabotageMoab -= dt;
      // spawn
      if (this.roundActive) {
        this.roundT += dt;
        while (this.qi < this.queue.length && this.queue[this.qi].t <= this.roundT) {
          const q = this.queue[this.qi++];
          const pi = this.spawnAlt++ % this.paths.length;
          this.spawn(q.type, q.flags, pi, 0);
        }
        // apopalypse: next round rolls in as soon as this one has spawned
        if (this.mode.apop && this.qi >= this.queue.length && (this.round < this.endRound || this.freeplay)) this.finishRound();
      }
      this.moveBloons(dt);
      this.buildGrid();
      for (const t of this.towers) this.updateTower(t, dt);
      this.towers = this.towers.filter((t) => !t.temp || (t.life -= dt) > 0 || (this.recalcSoon = true, false));
      if (this.recalcSoon) { this.recalcSoon = false; this.recalcAll(); }
      this.updateProjs(dt);
      this.updateGround(dt);
      for (const f of this.fx) f.t += dt;
      this.fx = this.fx.filter((f) => f.t < f.life);
      if (this.bloons.some((b) => b.dead)) this.bloons = this.bloons.filter((b) => !b.dead);
      if (this.roundActive && this.qi >= this.queue.length && this.bloons.length === 0) this.finishRound();
    }
    moveBloons(dt) {
      const base = BTD.BASE_SPEED;
      for (const b of this.bloons) {
        if (b.dead) continue;
        const def = b.def;
        // damage over time
        if (b.glue) {
          b.glue.left -= dt;
          if (b.glue.dot) {
            b.glue.t += dt;
            if (b.glue.t >= b.glue.every) { b.glue.t -= b.glue.every; this.damage(b, b.glue.dot + (def.moab ? (b.glue.moabDot || 0) : 0), b.glue.owner, null); }
          }
          if (b.glue && b.glue.left <= 0) b.glue = null;
        }
        if (b.burn && !b.dead) {
          b.burn.left -= dt; b.burn.t += dt;
          if (b.burn.t >= b.burn.every) { b.burn.t -= b.burn.every; if (!(def.immune && def.immune.includes('fire'))) this.damage(b, b.burn.dmg, b.burn.owner, null); }
          if (b.burn && b.burn.left <= 0) b.burn = null;
        }
        if (b.acid && !b.dead) {
          b.acid.left -= dt; b.acid.t += dt;
          if (b.acid.t >= b.acid.every) { b.acid.t -= b.acid.every; this.damage(b, b.acid.dmg + (def.moab ? (b.acid.moab || 0) : 0), b.acid.owner, null); }
          if (b.acid && b.acid.left <= 0) b.acid = null;
        }
        if (b.dead) continue;
        if (b.flash > 0) b.flash -= dt;
        if (b.brittle > 0) b.brittle -= dt;
        // regrow
        if (b.regrow && b.chain && b.chain.length) {
          b.regrowT += dt;
          if (b.regrowT >= 1.6) {
            b.regrowT = 0;
            const nt = b.chain.pop();
            b.t = nt; b.def = B[nt]; b.hp = b.def.hp; b.maxHp = b.hp; b.r = b.def.r || b.def.wid * 0.5;
          }
        }
        let sp = base * b.def.speed * b.spd;
        if (b.slowT > 0) { b.slowT -= dt; sp *= b.slowM; } else b.slowM = 1;
        if (b.glue) sp *= b.glue.slow;
        if (this.sabotage > 0 && b.t !== 'bad') sp *= 0.5;
        if (b.frozen > 0) { b.frozen -= dt; sp = 0; }
        if (b.stun > 0) { b.stun -= dt; sp = 0; }
        b.d += sp * dt;
        const p = this.paths[b.p];
        if (b.d >= p.len) { this.leak(b); if (this.over) return; continue; }
        if (b.d < 0) b.d = 0;
        p.at(b.d, b);
      }
    }

    origin(t) {
      if (t.stats.mover === 'ace') return t.ace;
      if (t.stats.mover === 'heli') return t.heli;
      return t;
    }
    updateTower(t, dt) {
      const s = t.stats;
      if (t.abilityCd > 0) t.abilityCd -= dt;
      for (const b of t.boosts) b.dur -= dt;
      if (t.boosts.length && t.boosts.some((b) => b.dur <= 0)) t.boosts = t.boosts.filter((b) => b.dur > 0);
      if (t.stats.wrath && t.wrath > 0) t.wrath = Math.max(0, t.wrath - dt * 8);
      // movers
      if (s.mover === 'ace') {
        const spd = (s.moveSpeed || 220) * dt;
        const R = 150;
        t.ace.a += spd / R;
        const a = t.ace.a;
        let x, y;
        if (t.targ === 1) { x = t.x + Math.cos(a) * 340; y = t.y + Math.sin(a * 2) * 120; }
        else if (t.targ === 2) { x = t.x + Math.sin(a) * 240; y = t.y + Math.sin(a * 2) * 130; }
        else { x = t.x + Math.cos(a) * R; y = t.y + Math.sin(a) * R; }
        t.ace.vx = x - t.ace.x; t.ace.vy = y - t.ace.y;
        t.ace.x = x; t.ace.y = y;
        t.ace.ang = Math.atan2(t.ace.vy, t.ace.vx);
      } else if (s.mover === 'heli') {
        let tx = t.x, ty = t.y;
        if (t.targ === 0) {
          const b = this.pickTarget(t, t.heli.x, t.heli.y, 5000, null, 0);
          if (b) { tx = b.x; ty = b.y; }
        } else if (t.targ === 2) { tx = this.mouse.x; ty = this.mouse.y; }
        const dx = tx - t.heli.x, dy = ty - t.heli.y, dd = Math.hypot(dx, dy);
        const sp = (s.moveSpeed || 200) * dt;
        if (dd > 30) { t.heli.x += (dx / dd) * Math.min(sp, dd - 30); t.heli.y += (dy / dd) * Math.min(sp, dd - 30); t.heli.ang = Math.atan2(dy, dx); }
        t.heli.x = clamp(t.heli.x, 10, BTD.W - 10); t.heli.y = clamp(t.heli.y, 10, BTD.H - 10);
      }
      // farm bananas
      if (s.bananas && t.bananaQ && t.bananaQ.length && this.roundActive && this.roundT >= t.bananaQ[0]) {
        t.bananaQ.shift();
        this.makeBanana(t);
      }
      if (s.carpet) {
        t.carpetT = (t.carpetT || 0) + dt;
        if (t.carpetT > s.carpet && this.roundActive) { t.carpetT = 0; this.spikeStorm(t, { n: 60, pierce: 20, dmg: 4, dmgType: 'normal' }); }
      }
      if (!this.bloons.length && !s.idleFire) { for (let i = 0; i < t.cd.length; i++) t.cd[i] = Math.max(0, t.cd[i] - dt); return; }
      for (let i = 0; i < s.a.length; i++) {
        const a = s.a[i];
        t.cd[i] -= dt;
        if (t.cd[i] > 0) continue;
        const e = this.eff(t, a);
        const fired = this.fire(t, e, i);
        t.cd[i] = fired ? e.rate : 0.05;
      }
      for (const b of t.boosts) if (b.extra) {
        b.cd = (b.cd || 0) - dt;
        if (b.cd <= 0) { const e = this.eff(t, b.extra); this.fire(t, e, -1); b.cd = e.rate; }
      }
    }

    fire(t, a, idx) {
      const o = a.fromTower ? t : this.origin(t);
      const ox = o.x, oy = o.y;
      const rng = a.range || (a.rangeMult ? this.range(t) * a.rangeMult : this.range(t));
      let target = null;
      const needTarget = !['spikes', 'banana', 'summon', 'brew', 'zombie'].includes(a.kind) && !a.noTarget;
      if (a.kind === 'aura') {
        const list = this.query(ox, oy, a.radius || rng, this._qa || (this._qa = []));
        const camo = this.canSeeCamo(t);
        let n = 0;
        const pierce = a.pierce;
        for (const b of list) {
          if (n >= pierce) break;
          if (b.dead || (b.camo && !camo && !a.hitCamo)) continue;
          if (a.onlyMoab && !b.def.moab) continue;
          if (this.hitBloon(b, a, t, null)) n++;
        }
        if (n > 0 || a.always) {
          this.fx.push({ k: 'aura', x: ox, y: oy, r: a.radius || rng, t: 0, life: 0.35, color: a.color || '#bfefff' });
          if (a.sound) BTD.audio && BTD.audio.play(a.sound);
        }
        return n > 0;
      }
      if (needTarget) {
        if (a.aim === 'cursor' || (t.stats.aimCursor && t.targ === 0)) {
          if (!this.bloons.length) return false;
          target = { x: this.mouse.x, y: this.mouse.y, fake: true };
        } else if (a.aim === 'lock' || (t.stats.aimCursor && t.targ === 1) || (a.kind === 'mortar' && t.targ === 2)) {
          if (!this.bloons.length) return false;
          const p = t.aim || { x: t.x + 60, y: t.y };
          target = { x: p.x, y: p.y, fake: true };
        } else {
          let mode = null;
          if (t.stats.mover === 'heli' || t.stats.mover === 'ace') mode = 0;
          if (a.kind === 'mortar' && t.targ === 0) mode = 3;
          if (a.kind === 'mortar' && t.targ === 1) mode = 0;
          if (t.stats.aimCursor && t.targ === 2) mode = 0;
          target = this.pickTarget(t, ox, oy, rng, a, mode);
          if (!target) return false;
        }
        if (!a.noTurn) t.ang = Math.atan2(target.y - oy, target.x - ox);
      }
      t.shots++;
      let crit = false;
      if (a.crit && t.shots % a.crit.every === 0) crit = true;
      const dmg = crit ? a.crit.dmg : a.dmg;
      if (crit) a = Object.assign({}, a, { dmg });
      if (a.sound !== false && BTD.audio) BTD.audio.play(a.sound || (a.kind === 'hit' ? 'snipe' : 'shoot'));
      switch (a.kind) {
        case 'proj': {
          let ang = Math.atan2(target.y - oy, target.x - ox);
          if (!target.fake && a.speed > 0 && a.move !== 'boom' && a.move !== 'seek') {
            // lead the target a little
            const dist = Math.hypot(target.x - ox, target.y - oy);
            const tt = dist / a.speed;
            const b = target;
            const sp = BTD.BASE_SPEED * b.def.speed * b.spd * (b.frozen > 0 || b.stun > 0 ? 0 : 1) * (b.slowT > 0 ? b.slowM : 1);
            const p = this.paths[b.p].at(b.d + sp * tt, {});
            ang = Math.atan2(p.y - oy, p.x - ox);
          }
          const n = a.count || 1;
          for (let i = 0; i < n; i++) {
            let aa = ang + (i - (n - 1) / 2) * (a.spread || 0.2);
            if (a.jitter) aa += rand(-a.jitter, a.jitter);
            this.shoot(t, a, ox, oy, aa, target, rng);
          }
          return true;
        }
        case 'radial': {
          const n = a.count || 8;
          if (a.rotate) t.spin += 0.35;
          const base = a.rotate ? t.spin : (a.fromPlane ? (t.ace.ang || 0) : 0);
          for (let i = 0; i < n; i++) this.shoot(t, a, ox, oy, base + (i / n) * TAU, null, rng);
          return true;
        }
        case 'hit': {
          this.hitBloon(target, a, t, null);
          this.fx.push({ k: 'shot', x: ox, y: oy, x2: target.x, y2: target.y, t: 0, life: 0.08, color: a.color || '#fff6b0' });
          if (a.shrap) {
            const ang = Math.atan2(target.y - oy, target.x - ox);
            for (let i = 0; i < a.shrap.count; i++) this.shoot(t, Object.assign({ kind: 'proj', speed: 600, size: 5, sprite: 'shard', dmgType: 'sharp', life: 0.25 }, a.shrap), target.x, target.y, ang + rand(-0.6, 0.6), null, 200, target.id);
          }
          if (a.bounceN) this.chainFrom(t, a, target, a.bounceN, 160, 'shot');
          if (a.expl) this.explode(target.x, target.y, a.expl, t);
          return true;
        }
        case 'chain': {
          this.hitBloon(target, a, t, null);
          this.chainFrom(t, a, target, a.pierce - 1, a.jump || 110, 'bolt', ox, oy);
          return true;
        }
        case 'beam': {
          const ang = Math.atan2(target.y - oy, target.x - ox);
          const L = a.len || Math.max(rng, 300) * 1.2;
          const ex = ox + Math.cos(ang) * L, ey = oy + Math.sin(ang) * L;
          const w = a.width || 10;
          const hits = [];
          const list = this.bloons;
          const dx = ex - ox, dy = ey - oy, l2 = dx * dx + dy * dy;
          for (const b of list) {
            if (b.dead) continue;
            const u = ((b.x - ox) * dx + (b.y - oy) * dy) / l2;
            if (u < 0 || u > 1) continue;
            const px = ox + dx * u, py = oy + dy * u;
            if ((b.x - px) ** 2 + (b.y - py) ** 2 <= (w + b.r) ** 2) hits.push([u, b]);
          }
          hits.sort((p, q) => p[0] - q[0]);
          let n = 0;
          for (const [, b] of hits) { if (n >= a.pierce) break; if (this.hitBloon(b, a, t, null)) n++; }
          this.fx.push({ k: 'beam', x: ox, y: oy, x2: ex, y2: ey, w, t: 0, life: a.beamLife || 0.12, color: a.color || '#ff3b3b' });
          return true;
        }
        case 'mortar': {
          const acc = a.acc != null ? a.acc : 30;
          const tx = target.x + rand(-acc, acc), ty = target.y + rand(-acc, acc);
          this.projs.push({ k: 'shell', x: ox, y: oy, sx: ox, sy: oy, tx, ty, age: 0, life: 0.55, a, owner: t, hit: new Set(), pierce: 1, rot: 0 });
          return true;
        }
        case 'drop': {
          this.projs.push({ k: 'drop', x: ox, y: oy, age: 0, life: a.delay || 1.2, a, owner: t, hit: new Set(), pierce: 1, rot: 0, sprite: a.sprite });
          return true;
        }
        case 'spikes': {
          if (!t.trackIn || !t.trackIn.length) return false;
          let pt;
          const pts = t.trackIn;
          if (t.targ === 1) pt = pts.reduce((m, p) => (Math.hypot(p.x - t.x, p.y - t.y) < Math.hypot(m.x - t.x, m.y - t.y) ? p : m), pts[0]);
          else if (t.targ === 2) pt = pts.reduce((m, p) => (Math.hypot(p.x - t.x, p.y - t.y) > Math.hypot(m.x - t.x, m.y - t.y) ? p : m), pts[0]);
          else if (t.targ === 3 && this.bloons.length) {
            const b = this.pickTarget(t, t.x, t.y, this.range(t), a, 0);
            pt = b ? { x: b.x + Math.cos(b.ang) * 40, y: b.y + Math.sin(b.ang) * 40 } : pts[(Math.random() * pts.length) | 0];
          } else pt = pts[(Math.random() * pts.length) | 0];
          const jx = rand(-8, 8), jy = rand(-8, 8);
          this.spikes.push({ x: pt.x + jx, y: pt.y + jy, sx: t.x, sy: t.y, fly: 0, a, owner: t, pierce: a.pierce, life: a.life || 40, persist: !!a.persist, rounds: a.rounds || 1, hit: new Set(), sprite: a.sprite || 'spikes' });
          if (this.spikes.length > 600) this.spikes.shift();
          return true;
        }
        case 'patch': {
          this.patches.push({ x: target.x, y: target.y, r: a.radius || 30, life: a.life || 4, every: a.every || 0.2, t: 0, a, owner: t, color: a.color || '#ff7a1a', age: 0 });
          return true;
        }
        case 'zombie': {
          const pi = (Math.random() * this.paths.length) | 0;
          const p = this.paths[pi];
          this.projs.push({ k: 'zombie', pi, d: p.len - 10, x: 0, y: 0, a, owner: t, hit: new Set(), pierce: a.pierce, age: 0, life: 30, rot: 0, sprite: a.sprite || 'zombie' });
          return true;
        }
        case 'summon': {
          const sm = a.summon;
          const n = this.towers.filter((x) => x.temp && x.parent === t).length;
          if (n >= (sm.max || 6)) return false;
          for (let tries = 0; tries < 30; tries++) {
            const ang = Math.random() * TAU, d = rand(30, this.range(t));
            const x = t.x + Math.cos(ang) * d, y = t.y + Math.sin(ang) * d;
            if (!this.areaFree(x, y, 10, true)) continue;
            const st = typeof sm.stats === 'function' ? sm.stats(t) : clone(sm.stats);
            const s = this.makeTower(t.k, x, y, false);
            s.temp = true; s.parent = t; s.life = sm.life || 25; s.stats = st; s.r = 9; s.sprite = sm.sprite || 'sentry';
            s.mod = Object.assign({}, t.mod); s.trackIn = []; s.cd = st.a.map(() => 0);
            this.towers.push(s);
            return true;
          }
          return false;
        }
        case 'brew': {
          const cands = this.towers.filter((x) => x !== t && !x.temp && Math.hypot(x.x - t.x, x.y - t.y) <= this.range(t) && !x.boosts.some((b) => b.brew) && !x.stats.bananas && !x.stats.village);
          if (!cands.length) return false;
          cands.sort((p, q) => q.spent - p.spent);
          const x = cands[0];
          x.boosts.push(Object.assign({ brew: true }, a.brew));
          this.projs.push({ k: 'lob', x: t.x, y: t.y, sx: t.x, sy: t.y, tx: x.x, ty: x.y, age: 0, life: 0.4, a: { sprite: 'potion' }, owner: t, hit: new Set(), pierce: 1, rot: 0, noExpl: true });
          return true;
        }
      }
      return false;
    }
    chainFrom(t, a, start, jumps, reach, look, ox, oy) {
      const hit = new Set([start.id]);
      let cur = start;
      const pts = [[ox != null ? ox : start.x, oy != null ? oy : start.y], [start.x, start.y]];
      const tmp = [];
      for (let j = 0; j < jumps; j++) {
        this.query(cur.x, cur.y, reach, tmp);
        let best = null, bd = Infinity;
        for (const b of tmp) {
          if (hit.has(b.id) || b.dead) continue;
          const d = (b.x - cur.x) ** 2 + (b.y - cur.y) ** 2;
          if (d < bd) { bd = d; best = b; }
        }
        if (!best) break;
        hit.add(best.id);
        this.hitBloon(best, a, t, null, hit);
        pts.push([best.x, best.y]);
        cur = best;
      }
      this.fx.push({ k: look === 'bolt' ? 'bolt' : 'chainshot', pts, t: 0, life: 0.18, color: a.color || '#b8f0ff' });
    }
    shoot(t, a, x, y, ang, target, rng, skipId) {
      const sp = a.speed || 600;
      const life = a.life || ((a.lifeDist || rng * 1.25 + 30) / sp);
      const p = {
        k: 'p', x, y, ox: x, oy: y, vx: Math.cos(ang) * sp, vy: Math.sin(ang) * sp, ang, a, owner: t, hit: new Set(),
        pierce: a.pierce, age: 0, life, size: a.size || 6, rot: 0, target: target && !target.fake ? target : null, rng,
      };
      if (skipId) p.hit.add(skipId);
      if (a.move === 'boom' || a.move === 'kylie') p.life = (rng * 2.4) / sp + 0.2;
      this.projs.push(p);
      return p;
    }
    updateProjs(dt) {
      const tmp = this._qp || (this._qp = []);
      for (const p of this.projs) {
        if (p.dead) continue;
        p.age += dt;
        const a = p.a;
        if (p.k === 'shell' || p.k === 'lob') {
          const f = Math.min(1, p.age / p.life);
          p.x = p.sx + (p.tx - p.sx) * f; p.y = p.sy + (p.ty - p.sy) * f; p.h = Math.sin(f * Math.PI) * 60;
          if (f >= 1) { p.dead = true; if (!p.noExpl && a.expl) this.explode(p.tx, p.ty, a.expl, p.owner); }
          continue;
        }
        if (p.k === 'drop') {
          if (p.age >= p.life) { p.dead = true; if (a.expl) this.explode(p.x, p.y, a.expl, p.owner); }
          continue;
        }
        if (p.k === 'zombie') {
          const path = this.paths[p.pi];
          p.d -= (a.speed || 60) * dt;
          path.at(p.d, p);
          if (p.d <= 0 || p.age > p.life) { p.dead = true; continue; }
        } else {
          if (a.move === 'seek') {
            if (!p.target || p.target.dead) p.target = this.pickTarget(p.owner, p.x, p.y, 320, a, 2);
            if (p.target) {
              const want = Math.atan2(p.target.y - p.y, p.target.x - p.x);
              let da = want - p.ang;
              while (da > Math.PI) da -= TAU;
              while (da < -Math.PI) da += TAU;
              const turn = (a.seek || 6) * dt;
              p.ang += clamp(da, -turn, turn);
              const sp = a.speed || 600;
              p.vx = Math.cos(p.ang) * sp; p.vy = Math.sin(p.ang) * sp;
            }
            p.x += p.vx * dt; p.y += p.vy * dt;
          } else if (a.move === 'boom' || a.move === 'kylie') {
            const T = p.life;
            const f = p.age / T;
            const R = p.rng * 0.95;
            const ca = Math.cos(p.ang), sa = Math.sin(p.ang);
            const fw = Math.sin(f * Math.PI) * R;
            const side = a.move === 'boom' ? Math.sin(f * Math.PI * 2) * R * 0.45 * (p.owner.x > BTD.W / 2 ? -1 : 1) : 0;
            p.x = p.ox + ca * fw - sa * side; p.y = p.oy + sa * fw + ca * side;
          } else if (a.move !== 'still') {
            p.x += p.vx * dt; p.y += p.vy * dt;
          }
        }
        p.rot += (a.spin || 0) * dt;
        if (p.age >= p.life || p.x < -80 || p.y < -80 || p.x > BTD.W + 80 || p.y > BTD.H + 80) {
          p.dead = true;
          if (a.split) for (let i = 0; i < a.split.count; i++) this.shoot(p.owner, a.split, p.x, p.y, (i / a.split.count) * TAU + p.ang, null, 160);
          if (a.expl && a.explOnEnd) this.explode(p.x, p.y, a.expl, p.owner);
          continue;
        }
        // collisions
        this.query(p.x, p.y, p.size, tmp);
        for (const b of tmp) {
          if (p.pierce <= 0) break;
          if (b.dead || p.hit.has(b.id)) continue;
          if (a.onlyMoab && !b.def.moab) continue;
          p.hit.add(b.id);
          if (a.expl && !a.explOnEnd) {
            if (a.dmg > 0) this.hitBloon(b, a, p.owner, p);
            this.explode(p.x, p.y, a.expl, p.owner);
            p.pierce = 0;
            break;
          }
          if (this.hitBloon(b, a, p.owner, p)) p.pierce--;
          if (a.burst && !p.burst) {
            p.burst = true;
            for (let i = 0; i < a.burst.count; i++) this.shoot(p.owner, a.burst, p.x, p.y, p.ang + rand(-0.8, 0.8), null, 120, b.id);
          }
          if (a.move === 'bounce' && p.pierce > 0) {
            const nb = this.nearestUnhit(p, 190);
            if (nb) { p.ang = Math.atan2(nb.y - p.y, nb.x - p.x); const sp = a.speed || 600; p.vx = Math.cos(p.ang) * sp; p.vy = Math.sin(p.ang) * sp; p.age = Math.max(0, p.age - 0.25); }
          }
        }
        if (p.pierce <= 0) {
          p.dead = true;
          if (a.split) for (let i = 0; i < a.split.count; i++) this.shoot(p.owner, a.split, p.x, p.y, (i / a.split.count) * TAU + p.ang, null, 160);
        }
      }
      this.projs = this.projs.filter((p) => !p.dead);
      if (this.projs.length > 1500) this.projs.splice(0, this.projs.length - 1500);
    }
    nearestUnhit(p, r) {
      const tmp = this.query(p.x, p.y, r, this._qn || (this._qn = []));
      let best = null, bd = Infinity;
      for (const b of tmp) {
        if (p.hit.has(b.id) || b.dead) continue;
        const d = (b.x - p.x) ** 2 + (b.y - p.y) ** 2;
        if (d < bd) { bd = d; best = b; }
      }
      return best;
    }
    explode(x, y, e, owner, hitSet, depth) {
      const hs = hitSet || new Set();
      const list = this.query(x, y, e.r, this._qe || (this._qe = []));
      list.sort((p, q) => ((p.x - x) ** 2 + (p.y - y) ** 2) - ((q.x - x) ** 2 + (q.y - y) ** 2));
      let n = 0;
      const items = list.slice();
      for (const b of items) {
        if (n >= e.pierce) break;
        if (b.dead || hs.has(b.id)) continue;
        hs.add(b.id);
        if (this.hitBloon(b, e, owner, null, hs)) n++;
      }
      if (this.fx.length < 300) this.fx.push({ k: 'boom', x, y, r: e.r, t: 0, life: 0.3, color: e.color });
      BTD.audio && BTD.audio.play('boom');
      if (e.frag) for (let i = 0; i < e.frag.count; i++) this.shoot(owner, Object.assign({ kind: 'proj', speed: 500, size: 5, sprite: 'frag', life: 0.22 }, e.frag), x, y, (i / e.frag.count) * TAU, null, 100);
      if (e.cluster && (depth || 0) < (e.cluster.recursive ? 2 : 1)) {
        for (let i = 0; i < e.cluster.count; i++) {
          const ang = (i / e.cluster.count) * TAU;
          const d = e.r * 0.9;
          this.projs.push({ k: 'drop', x: x + Math.cos(ang) * d, y: y + Math.sin(ang) * d, age: 0, life: 0.18 + Math.random() * 0.1, a: { expl: Object.assign({}, e.cluster.expl, e.cluster.recursive && (depth || 0) < 1 ? { cluster: e.cluster } : {}) }, owner, hit: new Set(), pierce: 1, rot: 0, sprite: 'bomblet', depth: (depth || 0) + 1 });
        }
      }
    }
    updateGround(dt) {
      const tmp = this._qg || (this._qg = []);
      for (const s of this.spikes) {
        if (s.fly < 1) { s.fly = Math.min(1, s.fly + dt * 4); if (s.fly < 1) continue; }
        s.life -= dt;
        if (s.life <= 0 || s.pierce <= 0) { s.dead = true; if (s.a.expl && s.pierce <= 0) this.explode(s.x, s.y, s.a.expl, s.owner); continue; }
        this.query(s.x, s.y, 9, tmp);
        for (const b of tmp) {
          if (s.pierce <= 0) break;
          if (b.dead || s.hit.has(b.id)) continue;
          s.hit.add(b.id);
          if (this.hitBloon(b, s.a, s.owner, s)) {
            s.pierce--;
            if (s.a.trap) { s.trapped = (s.trapped || 0) + b.def.rbe; }
          }
        }
        if (s.a.trap && s.pierce <= 0) { this.addCash(Math.min(s.trapped || 0, 5000) * 0.2); this.fx.push({ k: 'cash', x: s.x, y: s.y, t: 0, life: 1, n: Math.round(Math.min(s.trapped || 0, 5000) * 0.2) }); }
      }
      if (this.spikes.some((s) => s.dead)) this.spikes = this.spikes.filter((s) => !s.dead);
      for (const p of this.patches) {
        p.age += dt; p.t += dt;
        if (p.age >= p.life) { p.dead = true; continue; }
        if (p.t < p.every) continue;
        p.t -= p.every;
        this.query(p.x, p.y, p.r, tmp);
        let n = 0;
        for (const b of tmp) { if (n >= (p.a.pierce || 20)) break; if (this.hitBloon(b, p.a, p.owner, null)) n++; }
      }
      if (this.patches.some((p) => p.dead)) this.patches = this.patches.filter((p) => !p.dead);
      for (const b of this.bananas) {
        b.age += dt;
        if (b.fly < 1) b.fly = Math.min(1, b.fly + dt * 2.2);
        if (b.age > b.life) b.dead = true;
        else if (b.fly >= 1 && (b.auto || Math.hypot(this.mouse.x - b.x, this.mouse.y - b.y) < 26)) this.collectBanana(b);
      }
      if (this.bananas.some((b) => b.dead)) this.bananas = this.bananas.filter((b) => !b.dead);
    }
    makeBanana(t) {
      const bn = t.stats.bananas;
      const val = Math.round(bn.val * (this.mode.cashMult || 1));
      if (t.stats.bank != null) { t.bank = Math.min(t.stats.bankCap || 7000, t.bank + val); return; }
      if (t.stats.market) { this.addCash(val); this.fx.push({ k: 'cash', x: t.x, y: t.y - 20, t: 0, life: 0.9, n: val }); return; }
      const ang = Math.random() * TAU, d = rand(20, Math.min(this.range(t), 90));
      const x = clamp(t.x + Math.cos(ang) * d, 12, BTD.W - 12), y = clamp(t.y + Math.sin(ang) * d, 12, BTD.H - 12);
      this.bananas.push({ x, y, sx: t.x, sy: t.y, fly: 0, val, age: 0, life: bn.life || 15, farm: t, auto: !!t.stats.autoCollect, crate: !!bn.crate });
    }
    collectBanana(b) {
      if (b.dead) return;
      b.dead = true;
      this.addCash(b.val);
      this.fx.push({ k: 'cash', x: b.x, y: b.y, t: 0, life: 0.9, n: b.val });
      BTD.audio && BTD.audio.play('cash');
    }

    // ---------- ability helpers (used by tower data) ----------
    useAbility(t) {
      const ab = t.stats.ability;
      if (!ab || t.abilityCd > 0 || this.over) return false;
      if (ab.needBloons && !this.bloons.length) return false;
      ab.fn(this, t);
      t.abilityCd = ab.cd;
      BTD.audio && BTD.audio.play('ability');
      this.fx.push({ k: 'ring', x: t.x, y: t.y, r: 80, t: 0, life: 0.5, color: '#ffe55c' });
      return true;
    }
    damageAll(opts, t) {
      const a = Object.assign({ dmgType: 'normal', pierce: 1 }, opts);
      const list = this.bloons.slice();
      for (const b of list) {
        if (b.dead) continue;
        if (a.notBad && b.t === 'bad') continue;
        if (opts.range && Math.hypot(b.x - (opts.x != null ? opts.x : t.x), b.y - (opts.y != null ? opts.y : t.y)) > opts.range) continue;
        this.hitBloon(b, a, t, null);
      }
      this.fx.push({ k: 'flash', t: 0, life: 0.4, color: opts.color || '#ffffff' });
    }
    boost(t, b) { t.boosts.push(Object.assign({}, b)); }
    boostArea(t, r, filter, b) {
      for (const x of this.towers) if (!x.temp && Math.hypot(x.x - t.x, x.y - t.y) <= r && (!filter || filter(x))) this.boost(x, b);
    }
    strike(t, opts) {
      let n = opts.count || 1;
      while (n-- > 0) {
        let best = null, bv = -1;
        for (const b of this.bloons) {
          if (b.dead) continue;
          if (opts.moabOnly && !b.def.moab) continue;
          const v = b.def.rank * 1e6 + b.hp;
          if (v > bv) { bv = v; best = b; }
        }
        if (!best) return;
        this.fx.push({ k: 'shot', x: t.x, y: t.y, x2: best.x, y2: best.y, t: 0, life: 0.25, color: opts.color || '#ffb03a', w: 5 });
        if (opts.harpoon && best.def.moab && best.def.moab <= opts.harpoon) {
          this.pop(best, t, null, 0);
          continue;
        }
        this.hitBloon(best, Object.assign({ dmgType: 'normal' }, opts), t, null);
        if (opts.expl) this.explode(best.x, best.y, opts.expl, t);
      }
    }
    spikeStorm(t, o) {
      const pts = this.trackPts;
      for (let i = 0; i < o.n; i++) {
        const p = pts[(Math.random() * pts.length) | 0];
        this.spikes.push({ x: p.x + rand(-10, 10), y: p.y + rand(-10, 10), sx: p.x, sy: p.y - 200, fly: Math.random() * 0.5, a: { dmg: o.dmg, dmgType: o.dmgType || 'sharp', moab: o.moab || 0 }, owner: t, pierce: o.pierce, life: 25, hit: new Set(), sprite: 'spikes' });
      }
    }

    // ---------- save ----------
    serialize() {
      return {
        v: 1, map: this.map.id, diff: this.diffKey, mode: this.mode.id, hero: this.heroKey,
        round: this.round, cash: Math.floor(this.cash), lives: this.lives, freeplay: this.freeplay, won: this.won, pops: this.popsTotal,
        towers: this.towers.filter((t) => !t.temp).map((t) => ({ k: t.k, x: t.x, y: t.y, up: t.up, targ: t.targ, pops: t.pops, spent: t.spent, hero: t.hero, aim: t.aim, bank: t.bank })),
      };
    }
    load(s) {
      this.round = s.round; this.cash = s.cash; this.lives = s.lives; this.freeplay = s.freeplay; this.won = s.won; this.popsTotal = s.pops || 0;
      for (const o of s.towers) {
        const isHero = !!o.hero;
        if (isHero && !BTD.HEROES[o.k]) continue;
        if (!isHero && !BTD.TOWERS[o.k]) continue;
        const t = this.makeTower(o.k, o.x, o.y, isHero);
        Object.assign(t, { up: o.up, targ: o.targ, pops: o.pops, spent: o.spent, aim: o.aim, bank: o.bank || 0 });
        if (isHero) { t.hero = o.hero; this.heroPlaced = true; }
        this.towers.push(t);
      }
      this.recalcAll();
    }
  }

  BTD.Game = Game;
  BTD.TRACK_W = TRACK_W;
})();
