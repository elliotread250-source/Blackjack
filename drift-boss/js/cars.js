/* Drift Boss - procedural low-poly car models.
 * Each model is a list of small convex primitives (boxes, octagonal wheels)
 * in car-local coordinates: a = forward, b = left, c = up, in road tiles.
 */
(function () {
  'use strict';

  const GLASS = '#9fd6f5';
  const TYRE = '#23252d';
  const HUB = '#c9ced8';
  const DARK = '#2a2e38';
  const HEAD = '#fff4c2';
  const TAIL = '#ff3b3b';

  function centroid(vs, idx) {
    let a = 0, b = 0, c = 0;
    for (const i of idx) { a += vs[i][0]; b += vs[i][1]; c += vs[i][2]; }
    return [a / idx.length, b / idx.length, c / idx.length];
  }

  // Make every face wind counter-clockwise seen from outside (normal points out).
  function orient(p) {
    const m = p.m;
    for (const f of p.f) {
      const v = p.v, i = f.i;
      const A = v[i[0]], B = v[i[1]], C = v[i[2]];
      const ux = B[0] - A[0], uy = B[1] - A[1], uz = B[2] - A[2];
      const wx = C[0] - A[0], wy = C[1] - A[1], wz = C[2] - A[2];
      const nx = uy * wz - uz * wy, ny = uz * wx - ux * wz, nz = ux * wy - uy * wx;
      const fc = centroid(v, i);
      if (nx * (fc[0] - m[0]) + ny * (fc[1] - m[1]) + nz * (fc[2] - m[2]) < 0) i.reverse();
    }
    return p;
  }

  // Box from a0..a1, b0..b1, c0..c1. o.ta0/o.ta1 pull the top face in at the back/front,
  // o.tb at the sides; o.faces overrides colours per face (front, back, left, right, top).
  function box(a0, a1, b0, b1, c0, c1, col, o) {
    o = o || {};
    const ta0 = o.ta0 || 0, ta1 = o.ta1 || 0, tb = o.tb || 0;
    const v = [
      [a0, b0, c0], [a1, b0, c0], [a1, b1, c0], [a0, b1, c0],
      [a0 + ta0, b0 + tb, c1], [a1 - ta1, b0 + tb, c1], [a1 - ta1, b1 - tb, c1], [a0 + ta0, b1 - tb, c1],
    ];
    const fc = o.faces || {};
    const f = [
      { i: [4, 5, 6, 7], c: fc.top || col },
      { i: [1, 2, 6, 5], c: fc.front || col },
      { i: [0, 4, 7, 3], c: fc.back || col },
      { i: [0, 1, 5, 4], c: fc.right || col },
      { i: [3, 7, 6, 2], c: fc.left || col },
    ];
    if (o.flash) for (const face of f) face.flash = o.flash;
    if (o.glow) for (const face of f) face.glow = true;
    return orient({ v: v, f: f, m: [(a0 + a1) / 2, (b0 + b1) / 2, (c0 + c1) / 2] });
  }

  // Octagonal wheel centred at (a, b) touching the ground, axle along b.
  function wheel(a, b, r, w, col, hub) {
    const v = [], f = [];
    const N = 8;
    for (let side = 0; side < 2; side++) {
      const bb = b + (side ? w / 2 : -w / 2);
      for (let k = 0; k < N; k++) {
        const t = (k + 0.5) / N * Math.PI * 2;
        v.push([a + Math.cos(t) * r, bb, r + Math.sin(t) * r]);
      }
    }
    const capA = [], capB = [];
    for (let k = 0; k < N; k++) { capA.push(k); capB.push(N + k); }
    f.push({ i: capA, c: hub || HUB, hub: true });
    f.push({ i: capB, c: hub || HUB, hub: true });
    for (let k = 0; k < N; k++) {
      const k2 = (k + 1) % N;
      f.push({ i: [k, k2, N + k2, N + k], c: col || TYRE });
    }
    return orient({ v: v, f: f, m: [a, b, r] });
  }

  function wheels4(fa, ra, b, r, w, hub) {
    return [wheel(fa, b, r, w, TYRE, hub), wheel(fa, -b, r, w, TYRE, hub), wheel(ra, b, r, w, TYRE, hub), wheel(ra, -b, r, w, TYRE, hub)];
  }

  function lights(aFront, aBack, bw, c0, c1) {
    return [
      box(aFront - 0.012, aFront, bw - 0.05, bw, c0, c1, HEAD, { glow: true }),
      box(aFront - 0.012, aFront, -bw, -bw + 0.05, c0, c1, HEAD, { glow: true }),
      box(aBack, aBack + 0.012, bw - 0.05, bw, c0, c1, TAIL),
      box(aBack, aBack + 0.012, -bw, -bw + 0.05, c0, c1, TAIL),
    ];
  }

  const glassAll = { front: GLASS, back: GLASS, left: GLASS, right: GLASS };

  const MODELS = {
    hatch: {
      color: '#ef4b4b',
      build() {
        const c = '#ef4b4b';
        return [
          ...wheels4(0.14, -0.14, 0.115, 0.05, 0.045),
          box(-0.23, 0.23, -0.13, 0.13, 0.035, 0.115, c),
          box(-0.2, 0.07, -0.118, 0.118, 0.115, 0.205, c, { ta0: 0.015, ta1: 0.075, tb: 0.018, faces: glassAll }),
          ...lights(0.232, -0.232, 0.12, 0.07, 0.095),
        ];
      },
    },
    taxi: {
      color: '#ffc61a',
      build() {
        const c = '#ffc61a';
        return [
          ...wheels4(0.155, -0.155, 0.115, 0.05, 0.045),
          box(-0.26, 0.26, -0.13, 0.13, 0.035, 0.105, c),
          box(-0.2, 0.2, -0.133, 0.133, 0.068, 0.084, '#20222a'),
          box(-0.13, 0.1, -0.118, 0.118, 0.105, 0.19, c, { ta0: 0.04, ta1: 0.05, tb: 0.016, faces: glassAll }),
          box(-0.045, 0.025, -0.055, 0.055, 0.19, 0.225, '#ffffff', { faces: { front: '#20222a', back: '#20222a' }, glow: true }),
          ...lights(0.262, -0.262, 0.12, 0.065, 0.09),
        ];
      },
    },
    police: {
      color: '#f4f6fb',
      build() {
        const c = '#f4f6fb';
        return [
          ...wheels4(0.155, -0.155, 0.115, 0.05, 0.045),
          box(-0.26, 0.26, -0.13, 0.13, 0.035, 0.105, c),
          box(-0.12, 0.12, -0.133, 0.133, 0.04, 0.09, '#1b2333'),
          box(-0.13, 0.1, -0.118, 0.118, 0.105, 0.19, c, { ta0: 0.04, ta1: 0.05, tb: 0.016, faces: glassAll }),
          box(-0.04, 0.03, 0.005, 0.085, 0.19, 0.215, '#ff2d3c', { flash: ['#ff2d3c', '#5a0f16'] }),
          box(-0.04, 0.03, -0.085, -0.005, 0.19, 0.215, '#2f6bff', { flash: ['#12204a', '#2f6bff'] }),
          ...lights(0.262, -0.262, 0.12, 0.065, 0.09),
        ];
      },
    },
    sports: {
      color: '#ff7b1c',
      build() {
        const c = '#ff7b1c';
        return [
          ...wheels4(0.165, -0.165, 0.12, 0.048, 0.05, '#2a2a2a'),
          box(-0.27, 0.27, -0.135, 0.135, 0.03, 0.09, c, { ta1: 0.03 }),
          box(0.08, 0.24, -0.03, 0.03, 0.09, 0.094, '#ffffff'),
          box(-0.1, 0.07, -0.115, 0.115, 0.09, 0.155, c, { ta0: 0.03, ta1: 0.07, tb: 0.02, faces: glassAll }),
          box(-0.255, -0.24, -0.08, -0.06, 0.09, 0.15, DARK),
          box(-0.255, -0.24, 0.06, 0.08, 0.09, 0.15, DARK),
          box(-0.28, -0.22, -0.13, 0.13, 0.15, 0.165, '#20222a'),
          ...lights(0.262, -0.272, 0.115, 0.055, 0.075),
        ];
      },
    },
    van: {
      color: '#2bb3c0',
      build() {
        const c = '#2bb3c0';
        return [
          ...wheels4(0.165, -0.16, 0.115, 0.052, 0.045),
          box(-0.26, 0.26, -0.135, 0.135, 0.04, 0.13, c),
          box(-0.26, 0.2, -0.135, 0.135, 0.13, 0.26, c, { ta1: 0.05, faces: { front: GLASS } }),
          box(-0.03, 0.16, -0.138, 0.138, 0.155, 0.225, GLASS),
          box(-0.23, -0.07, -0.138, 0.138, 0.155, 0.225, GLASS),
          box(-0.26, 0.26, -0.137, 0.137, 0.07, 0.085, '#ffffff'),
          ...lights(0.262, -0.262, 0.12, 0.075, 0.1),
        ];
      },
    },
    pickup: {
      color: '#3fbf6a',
      build() {
        const c = '#3fbf6a';
        return [
          ...wheels4(0.16, -0.16, 0.115, 0.055, 0.05),
          box(-0.27, 0.27, -0.13, 0.13, 0.04, 0.11, c, { faces: { top: '#2b8a4b' } }),
          box(-0.01, 0.16, -0.122, 0.122, 0.11, 0.215, c, { ta1: 0.05, tb: 0.012, faces: glassAll }),
          box(-0.27, -0.01, 0.105, 0.13, 0.11, 0.155, c),
          box(-0.27, -0.01, -0.13, -0.105, 0.11, 0.155, c),
          box(-0.27, -0.245, -0.105, 0.105, 0.11, 0.155, c),
          box(0.16, 0.272, -0.13, 0.13, 0.11, 0.118, c),
          ...lights(0.272, -0.272, 0.12, 0.07, 0.095),
        ];
      },
    },
    f1: {
      color: '#2f7bff',
      build() {
        const c = '#2f7bff';
        return [
          wheel(0.17, 0.125, 0.045, 0.05, TYRE, '#e8e8e8'), wheel(0.17, -0.125, 0.045, 0.05, TYRE, '#e8e8e8'),
          wheel(-0.16, 0.128, 0.058, 0.07, TYRE, '#e8e8e8'), wheel(-0.16, -0.128, 0.058, 0.07, TYRE, '#e8e8e8'),
          box(0.215, 0.29, -0.15, 0.15, 0.025, 0.04, '#ffffff'),
          box(-0.17, 0.0, -0.1, 0.1, 0.03, 0.085, c, { ta1: 0.03, tb: 0.02 }),
          box(-0.22, 0.29, -0.045, 0.045, 0.03, 0.09, c, { ta1: 0.06, tb: 0.01 }),
          box(-0.07, -0.01, -0.028, 0.028, 0.09, 0.13, '#ffd21f', { faces: { front: '#20222a' } }),
          box(-0.24, -0.225, -0.012, 0.012, 0.09, 0.16, DARK),
          box(-0.29, -0.21, -0.14, 0.14, 0.155, 0.18, c, { faces: { top: '#ffffff' } }),
        ];
      },
    },
    monster: {
      color: '#a3e635',
      build() {
        const c = '#a3e635';
        return [
          wheel(0.15, 0.13, 0.088, 0.085, TYRE, '#ff4d4d'), wheel(0.15, -0.13, 0.088, 0.085, TYRE, '#ff4d4d'),
          wheel(-0.15, 0.13, 0.088, 0.085, TYRE, '#ff4d4d'), wheel(-0.15, -0.13, 0.088, 0.085, TYRE, '#ff4d4d'),
          box(-0.17, 0.17, -0.05, 0.05, 0.06, 0.15, DARK),
          box(-0.23, 0.23, -0.115, 0.115, 0.15, 0.225, c),
          box(-0.15, 0.06, -0.1, 0.1, 0.225, 0.3, c, { ta0: 0.01, ta1: 0.05, tb: 0.012, faces: glassAll }),
          box(0.0, 0.05, -0.08, 0.08, 0.3, 0.315, '#ffcf3f', { glow: true }),
          ...lights(0.232, -0.232, 0.105, 0.18, 0.205),
        ];
      },
    },
  };

  const cache = {};
  function get(id) {
    if (!MODELS[id]) id = 'hatch';
    if (!cache[id]) cache[id] = MODELS[id].build();
    return cache[id];
  }

  window.DriftCars = { get: get, color: (id) => (MODELS[id] || MODELS.hatch).color, GLASS: GLASS };
})();
