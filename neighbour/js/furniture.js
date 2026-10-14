// Stylised furniture and props, built from boxes, cylinders and spheres into the static mesh.
// Every piece fills a footprint w (local x) × d (local z) × h, sits on the floor at d.y, is centred
// on (d.x, d.z), and faces local +z (rotated by d.ry). The maps keep the original collision boxes
// (made invisible) and add one of these in the same spot, so the game plays exactly as before.
//
// Cartoon horror proportions: chunky cushions, slightly crooked tops, thick trims, worn colours.
import * as THREE from 'three';
import { primGeo } from './models.js';

const M4 = new THREE.Matrix4(), Q = new THREE.Quaternion(), E = new THREE.Euler(), S = new THREE.Vector3(), P = new THREE.Vector3();
const WOOD = 0x6e4a30, DARKW = 0x3e2618, BRASS = 0xd8a840, STEEL = 0xb8bcc4, CREAM = 0xf2ead8, BLACK = 0x1d1d22;

export function buildFurniture(B, d) {
  const ry = d.ry || 0, cs = Math.cos(ry), sn = Math.sin(ry);
  const W = d.w || 1, D = d.d || 1, H = d.h || 1, y0 = d.y || 0;
  // local box: (x, z) centre, y bottom, size w × h × dd; tilt r (radians about local z) for crooked bits
  const box = (m, x, y, z, w, h, dd, c, tilt = 0, yaw = 0) => {
    P.set(d.x + x * cs + z * sn, y0 + y + h / 2, d.z - x * sn + z * cs);
    E.set(0, ry + yaw, tilt); Q.setFromEuler(E); S.set(Math.max(0.005, w), Math.max(0.005, h), Math.max(0.005, dd));
    B.geom(m, primGeo('box'), M4.compose(P, Q, S), c);
  };
  const cyl = (m, x, y, z, r, h, c, axis = 'y', seg = 'cyl') => {
    P.set(d.x + x * cs + z * sn, y0 + y, d.z - x * sn + z * cs);
    if (axis === 'y') E.set(0, ry, 0); else if (axis === 'x') E.set(0, ry, Math.PI / 2); else E.set(Math.PI / 2, ry, 0);
    Q.setFromEuler(E); S.set(r, h, r);
    B.geom(m, primGeo(seg), M4.compose(P, Q, S), c);
  };
  const ball = (m, x, y, z, r, c, sy = 1) => { P.set(d.x + x * cs + z * sn, y0 + y, d.z - x * sn + z * cs); E.set(0, ry, 0); Q.setFromEuler(E); S.set(r, r * sy, r); B.geom(m, primGeo('sphere'), M4.compose(P, Q, S), c); };
  const legs = (inset, h, r, c, m = 'wood') => { for (const sx of [-1, 1]) for (const sz of [-1, 1]) cyl(m, sx * (W / 2 - inset), h / 2, sz * (D / 2 - inset), r, h, c); };
  const c1 = d.c ?? WOOD, c2 = d.c2 ?? CREAM;
  switch (d.t) {
    case 'f_sofa': {                    // chunky three-seater: base, back, rolled arms, fat cushions, wooden feet
      const arm = Math.min(0.28, W * 0.12), seatH = H * 0.5;
      legs(0.1, 0.1, 0.05, DARKW);
      box('fabric', 0, 0.1, 0, W, seatH * 0.55, D, c1);
      box('fabric', 0, 0.1, -D / 2 + 0.14, W, H - 0.1, 0.28, c1, 0.01);
      for (const sx of [-1, 1]) { box('fabric', sx * (W / 2 - arm / 2), 0.1, 0.02, arm, seatH + 0.12, D - 0.04, c1); cyl('fabric', sx * (W / 2 - arm / 2), seatH + 0.22, 0.02, arm * 0.55, D - 0.04, c1, 'z'); }
      const n = Math.max(1, Math.round((W - 2 * arm) / 0.7)), cw = (W - 2 * arm) / n;
      for (let i = 0; i < n; i++) {
        const x = -W / 2 + arm + cw * (i + 0.5);
        box('fabric', x, 0.1 + seatH * 0.55, 0.06, cw - 0.04, seatH * 0.4, D - 0.34, d.c2 ?? c1, 0, (i - (n - 1) / 2) * 0.01);
        box('fabric', x, seatH * 0.95, -D / 2 + 0.33, cw - 0.06, H * 0.42, 0.18, d.c2 ?? c1, -0.02 * (i % 2 ? 1 : -1));
        box('fabric', x, 0.1 + seatH * 0.95 - 0.001, 0.06, cw - 0.3, 0.005, 0.02, 0x000000);   // stitching seam
      }
      break;
    }
    case 'f_armchair': {                // high-backed, slightly crooked wing chair
      legs(0.08, 0.12, 0.045, DARKW);
      box('fabric', 0, 0.12, 0.04, W, H * 0.32, D - 0.08, c1);
      box('fabric', 0, 0.12, -D / 2 + 0.1, W, H, 0.2, c1, 0.04);
      for (const sx of [-1, 1]) { box('fabric', sx * (W / 2 - 0.09), 0.12, 0.04, 0.18, H * 0.58, D - 0.1, c1, sx * 0.05); box('fabric', sx * (W / 2 - 0.12), H * 0.62, -D / 2 + 0.2, 0.16, H * 0.32, 0.3, c1); }
      box('fabric', 0, 0.12 + H * 0.32, 0.08, W - 0.36, 0.14, D - 0.32, d.c2 ?? c1);
      break;
    }
    case 'f_bed': {                     // frame, headboard with knobs, mattress, blanket, pillows
      const foot = H * 0.55;
      box('wood', 0, 0.12, 0, W, 0.22, D, c1);
      legs(0.06, 0.12, 0.05, c1);
      box('wood', 0, 0, -D / 2 + 0.04, W, H, 0.08, c1);
      box('wood', 0, H - 0.12, -D / 2 + 0.04, W + 0.06, 0.1, 0.12, c1);
      for (const sx of [-1, 1]) ball('wood', sx * W / 2, H + 0.04, -D / 2 + 0.04, 0.06, c1);
      box('wood', 0, 0, D / 2 - 0.04, W, foot, 0.08, c1);
      box('fabric', 0, 0.34, 0, W - 0.08, 0.2, D - 0.16, CREAM);
      box('fabric', 0, 0.5, 0.18, W - 0.02, 0.07, D - 0.55, c2, 0.01);
      box('fabric', 0, 0.36, 0.18, W - 0.0, 0.2, 0.04, c2);
      const np = W > 1.3 ? 2 : 1;
      for (let i = 0; i < np; i++) box('fabric', np === 1 ? 0 : (i ? 1 : -1) * W / 4, 0.54, -D / 2 + 0.32, np === 1 ? W * 0.6 : W * 0.4, 0.14, 0.32, 0xf8f6f0, 0.05 * (i ? 1 : -1));
      break;
    }
    case 'f_wardrobe': {                // panelled doors, cornice, plinth, handles, hinges
      box('wood', 0, 0, 0, W, 0.1, D, DARKW);
      box('wood', 0, 0.1, 0, W, H - 0.2, D, c1);
      box('wood', 0, H - 0.1, 0, W + 0.08, 0.1, D + 0.06, DARKW);
      const n = W > 1.1 ? 2 : 1, dw = (W - 0.08) / n;
      for (let i = 0; i < n; i++) {
        const x = -W / 2 + 0.04 + dw * (i + 0.5);
        box('door', x, 0.16, D / 2, dw - 0.03, H - 0.32, 0.03, c1);
        box('wood', x, 0.3, D / 2 + 0.02, dw - 0.2, (H - 0.6) * 0.42, 0.02, DARKW);
        box('wood', x, 0.3 + (H - 0.6) * 0.5, D / 2 + 0.02, dw - 0.2, (H - 0.6) * 0.42, 0.02, DARKW);
        ball('metal', x + (i === 0 && n === 2 ? dw / 2 - 0.08 : -dw / 2 + 0.08), H * 0.5, D / 2 + 0.05, 0.035, BRASS);
        for (const yy of [0.35, H - 0.45]) box('metal', x - dw / 2 + 0.02, yy, D / 2 + 0.02, 0.03, 0.1, 0.02, BRASS);
      }
      break;
    }
    case 'f_dresser': {                 // drawers with handles, top, mirror optional
      legs(0.06, 0.1, 0.04, DARKW);
      box('wood', 0, 0.1, 0, W, H - 0.14, D, c1);
      box('wood', 0, H - 0.04, 0, W + 0.04, 0.04, D + 0.04, DARKW);
      const rows = Math.max(2, Math.round((H - 0.2) / 0.28)), rh = (H - 0.2) / rows;
      for (let i = 0; i < rows; i++) for (const sx of W > 0.9 ? [-1, 1] : [0]) {
        const dwid = W > 0.9 ? W / 2 - 0.05 : W - 0.06;
        box('wood', sx * W / 4, 0.14 + i * rh, D / 2, dwid, rh - 0.04, 0.03, i % 2 ? c1 : mix(c1, 0xffffff, 0.06));
        box('metal', sx * W / 4, 0.14 + i * rh + rh / 2 - 0.02, D / 2 + 0.03, 0.14, 0.03, 0.03, BRASS);
      }
      if (d.mirror) { box('wood', 0, H, -D / 2 + 0.04, W * 0.7, 0.75, 0.05, DARKW); box('glass', 0, H + 0.06, -D / 2 + 0.07, W * 0.6, 0.62, 0.01, 0xc8e0f0); }
      break;
    }
    case 'f_table': {                   // thick top with apron, turned legs
      const t = 0.07;
      box('wood', 0, H - t, 0, W, t, D, c1, 0.004);
      box('wood', 0, H - t - 0.1, 0, W - 0.12, 0.1, D - 0.12, mix(c1, 0x000000, 0.15));
      for (const sx of [-1, 1]) for (const sz of [-1, 1]) { cyl('wood', sx * (W / 2 - 0.1), (H - t) / 2, sz * (D / 2 - 0.1), 0.05, H - t, c1); ball('wood', sx * (W / 2 - 0.1), (H - t) * 0.3, sz * (D / 2 - 0.1), 0.065, c1, 0.7); }
      if (d.cloth) box('fabric', 0, H - 0.005, 0, W * 0.7, 0.01, D + 0.06, d.cloth);
      break;
    }
    case 'f_chair': {
      legs(0.05, H * 0.5, 0.025, c1);
      box('wood', 0, H * 0.5, 0, W, 0.05, D, c1);
      box('wood', 0, H * 0.5, -D / 2 + 0.03, W, H * 0.5, 0.05, c1, 0.03);
      for (const sx of [-0.25, 0, 0.25]) box('wood', sx * W, H * 0.55, -D / 2 + 0.03, 0.05, H * 0.38, 0.055, mix(c1, 0x000000, 0.2));
      if (d.c2) box('fabric', 0, H * 0.5 + 0.05, 0.02, W - 0.06, 0.05, D - 0.08, d.c2);
      break;
    }
    case 'f_bookshelf': {               // frame + shelves + rows of coloured books, some leaning
      box('wood', -W / 2 + 0.03, 0, 0, 0.06, H, D, c1); box('wood', W / 2 - 0.03, 0, 0, 0.06, H, D, c1);
      box('wood', 0, 0, -D / 2 + 0.015, W, H, 0.03, mix(c1, 0x000000, 0.3));
      box('wood', 0, H - 0.05, 0, W + 0.06, 0.05, D + 0.04, c1);
      const shelves = Math.max(2, Math.round(H / 0.45)), sh = H / shelves;
      let seed = Math.abs(Math.round(d.x * 13 + d.z * 7));
      const r = () => ((seed = (seed * 9301 + 49297) % 233280) / 233280);
      const cols = [0x8a2a2a, 0x2a4a8a, 0x2a6a3a, 0x8a6a2a, 0x5a2a6a, 0xd8c8a0, 0x3a3a3a];
      for (let s = 0; s < shelves; s++) {
        box('wood', 0, s * sh, 0, W - 0.08, 0.04, D - 0.02, c1);
        let x = -W / 2 + 0.08;
        while (x < W / 2 - 0.12) {
          const bw = 0.04 + r() * 0.05, bh = sh * (0.55 + r() * 0.3), lean = r() < 0.08 ? 0.25 : 0;
          if (r() < 0.12) { x += 0.08; continue; }
          box('paint', x + bw / 2, s * sh + 0.04, 0.02, bw, bh, D * 0.7, cols[Math.floor(r() * cols.length)], lean);
          x += bw + 0.005;
        }
      }
      break;
    }
    case 'f_counter': {                 // kitchen base units: doors, handles, kick plate, worktop
      box('wood', 0, 0, 0.03, W - 0.04, 0.1, D - 0.1, BLACK);
      box('wood', 0, 0.1, 0, W, H - 0.14, D, c1);
      box('counter', 0, H - 0.04, 0.02, W + 0.04, 0.04, D + 0.06, d.c2 ?? 0xe8e0cc);
      const n = Math.max(1, Math.round(W / 0.55)), dw = W / n;
      for (let i = 0; i < n; i++) {
        const x = -W / 2 + dw * (i + 0.5);
        box('door', x, 0.14, D / 2, dw - 0.04, H - 0.48, 0.02, c1);
        box('wood', x, H - 0.3, D / 2, dw - 0.04, 0.14, 0.02, mix(c1, 0xffffff, 0.08));
        box('metal', x, H - 0.25, D / 2 + 0.02, 0.12, 0.025, 0.025, STEEL);
        box('metal', x + dw / 2 - 0.1, H * 0.55, D / 2 + 0.02, 0.025, 0.12, 0.025, STEEL);
      }
      if (d.sink) { box('metal', 0, H - 0.05, 0.02, Math.min(0.6, W * 0.4), 0.02, D * 0.6, STEEL); box('metal', 0, H - 0.06, 0.02, Math.min(0.5, W * 0.33), 0.02, D * 0.5, 0x6a7078); cyl('metal', 0, H + 0.12, -D / 2 + 0.12, 0.025, 0.25, STEEL); box('metal', 0, H + 0.22, -D / 2 + 0.2, 0.04, 0.04, 0.18, STEEL); }
      if (d.clutter) { cyl('paint', -W / 2 + 0.25, H + 0.1, -0.05, 0.08, 0.2, 0xd85a3a); box('wood', W / 2 - 0.3, H, -0.05, 0.3, 0.03, 0.22, 0xa87a4a); ball('paint', W / 2 - 0.6, H + 0.06, 0, 0.06, 0xd83a2a); }
      break;
    }
    case 'f_stove': {                   // enamel range: oven door + window, knobs, 4 burners, back panel
      box('paint', 0, 0, 0, W, H - 0.02, D, c1 === WOOD ? 0xe8e4da : c1);
      box('metal', 0, H - 0.03, 0, W, 0.03, D, BLACK);
      for (const sx of [-1, 1]) for (const sz of [-1, 1]) cyl('metal', sx * W / 4, H, sz * D / 4, Math.min(W, D) * 0.13, 0.02, 0x2a2a2e);
      box('paint', 0, 0.12, D / 2, W - 0.1, H * 0.6, 0.03, mix(c1 === WOOD ? 0xe8e4da : c1, 0x000000, 0.06));
      box('glass', 0, 0.3, D / 2 + 0.02, W * 0.55, H * 0.25, 0.01, 0x2a2018);
      box('metal', 0, H * 0.72, D / 2 + 0.03, W * 0.7, 0.03, 0.03, STEEL);
      for (let i = 0; i < 4; i++) cyl('metal', -W * 0.3 + i * W * 0.2, H * 0.86, D / 2 + 0.02, 0.03, 0.04, BLACK, 'z');
      box('paint', 0, H, -D / 2 + 0.03, W, 0.3, 0.06, c1 === WOOD ? 0xe8e4da : c1);
      break;
    }
    case 'f_fridge': {                  // rounded 1950s fridge: two doors, chrome handles, a badge
      box('paint', 0, 0, 0, W, H, D, c1 === WOOD ? 0xece6d8 : c1);
      box('paint', 0, H - 0.02, 0, W - 0.06, 0.06, D - 0.06, c1 === WOOD ? 0xf4efe2 : c1);
      box('paint', 0, H * 0.66, D / 2 + 0.005, W - 0.04, 0.02, 0.01, 0x9a968a);
      for (const [yy, hh] of [[H * 0.72, H * 0.16], [H * 0.3, H * 0.22]]) box('metal', W / 2 - 0.12, yy, D / 2 + 0.04, 0.05, hh, 0.05, STEEL);
      box('metal', -W * 0.15, H * 0.85, D / 2 + 0.01, 0.16, 0.05, 0.01, 0xd8a840);
      for (const m of d.magnets ? [0xd83a3a, 0x3a8ad8, 0xe8c83a] : []) box('paint', -W * 0.3 + Math.random() * W * 0.4, H * (0.3 + Math.random() * 0.3), D / 2 + 0.02, 0.06, 0.06, 0.01, m);
      break;
    }
    case 'f_tv': {                      // old CRT on a little cabinet with dials and rabbit ears
      box('wood', 0, 0, 0, W, H * 0.42, D, c1);
      box('wood', 0, H * 0.42, 0, W * 0.8, H * 0.5, D * 0.8, 0x3a2a20);
      box('glass', -W * 0.08, H * 0.48, D * 0.4, W * 0.5, H * 0.38, 0.01, 0x9ab8d8);
      for (const yy of [0.62, 0.75]) cyl('metal', W * 0.3, H * yy, D * 0.4, 0.035, 0.03, BLACK, 'z');
      for (const s of [-1, 1]) { P.set(0, 0, 0); box('metal', s * 0.12, H * 0.92, 0, 0.012, 0.5, 0.012, STEEL, s * 0.5); }
      break;
    }
    case 'f_lamp': {                    // table lamp: base, stem, fabric shade (the bulb glows)
      cyl('wood', 0, 0.03, 0, 0.12, 0.06, c1);
      cyl('metal', 0, 0.25, 0, 0.02, 0.4, BRASS);
      cyl('fabric', 0, 0.5, 0, 0.18, 0.24, c2, 'y', 'cone');
      ball('emissive', 0, 0.42, 0, 0.05, 0xfff0c0);
      break;
    }
    case 'f_floorlamp': {
      cyl('metal', 0, 0.02, 0, 0.18, 0.04, BLACK);
      cyl('metal', 0, H / 2, 0, 0.02, H, BRASS);
      cyl('fabric', 0, H - 0.05, 0, 0.26, 0.32, c2, 'y', 'cone');
      ball('emissive', 0, H - 0.15, 0, 0.06, 0xfff0c0);
      break;
    }
    case 'f_picture': {                 // framed picture on a wall (local +z faces out of the wall)
      box('wood', 0, 0, 0, W, H, 0.05, c1);
      box('paint', 0, 0.06, 0.03, W - 0.12, H - 0.12, 0.01, c2);
      box('paint', -W * 0.15, H * 0.2, 0.04, W * 0.35, H * 0.35, 0.005, mix(c2, 0x000000, 0.35));
      box('paint', W * 0.18, H * 0.45, 0.04, W * 0.2, H * 0.25, 0.005, mix(c2, 0xffffff, 0.4));
      break;
    }
    case 'f_plant': {                   // pot and a bushy plant
      cyl('paint', 0, 0.16, 0, Math.min(W, D) * 0.32, 0.32, c1 === WOOD ? 0xb8603a : c1, 'y', 'cyl6');
      cyl('dirt', 0, 0.32, 0, Math.min(W, D) * 0.28, 0.02, 0x4a3420);
      for (let i = 0; i < 6; i++) { const a = i * 1.05; ball('hedge', Math.cos(a) * 0.12, 0.45 + (i % 3) * 0.12, Math.sin(a) * 0.12, 0.16, i % 2 ? 0x4a8a3a : 0x3a7a32, 1.3); }
      ball('hedge', 0, 0.75, 0, 0.18, 0x5a9a42, 1.2);
      break;
    }
    case 'f_curtains': {                // pole + two gathered curtains (for window walls; local +z into the room)
      cyl('metal', 0, H, 0.08, 0.025, W + 0.3, BRASS, 'x');
      for (const sx of [-1, 1]) for (let k = 0; k < 4; k++) box('fabric', sx * (W / 2 + 0.05 - k * 0.07), 0, 0.06 + (k % 2) * 0.03, 0.08, H, 0.05, k % 2 ? c1 : mix(c1, 0x000000, 0.15));
      box('fabric', 0, H - 0.25, 0.1, W + 0.3, 0.25, 0.05, mix(c1, 0x000000, 0.1));
      break;
    }
    case 'f_bathtub': {                 // claw-foot bath
      for (const sx of [-1, 1]) for (const sz of [-1, 1]) ball('metal', sx * (W / 2 - 0.1), 0.06, sz * (D / 2 - 0.1), 0.07, BRASS, 0.8);
      box('paint', 0, 0.1, 0, W, H - 0.1, D, 0xf4f4f0);
      box('paint', 0, H - 0.02, 0, W + 0.04, 0.05, D + 0.04, 0xffffff);
      box('glass', 0, H - 0.2, 0, W - 0.16, 0.02, D - 0.16, 0x9ad0e8);
      cyl('metal', -W / 2 + 0.12, H + 0.12, 0, 0.025, 0.25, STEEL);
      break;
    }
    case 'f_toilet': {
      box('paint', 0, 0, 0.05, W * 0.6, H * 0.5, D * 0.7, 0xf4f4f0);
      box('paint', 0, H * 0.5, 0.06, W * 0.75, 0.05, D * 0.75, 0xffffff);
      box('paint', 0, H * 0.45, -D / 2 + 0.1, W, H * 0.55, 0.2, 0xf4f4f0);
      box('metal', W * 0.3, H * 0.88, -D / 2 + 0.2, 0.08, 0.02, 0.02, STEEL);
      break;
    }
    case 'f_basin': {
      cyl('paint', 0, H * 0.4, 0, 0.08, H * 0.8, 0xf4f4f0);
      box('paint', 0, H * 0.8, 0, W, H * 0.2, D, 0xf4f4f0);
      box('glass', 0, H * 0.95, 0.03, W - 0.12, 0.02, D - 0.16, 0x9ad0e8);
      cyl('metal', 0, H + 0.08, -D / 2 + 0.08, 0.02, 0.16, STEEL);
      box('glass', 0, H + 0.35, -D / 2 + 0.02, W * 0.8, 0.6, 0.02, 0xc8e0f0);
      box('wood', 0, H + 0.32, -D / 2 + 0.005, W * 0.86, 0.66, 0.02, DARKW);
      break;
    }
    case 'f_washer': {
      box('paint', 0, 0, 0, W, H, D, 0xf0f0ea);
      cyl('glass', 0, H * 0.45, D / 2 + 0.01, Math.min(W, H) * 0.3, 0.03, 0x6a8aa0, 'z');
      cyl('metal', 0, H * 0.45, D / 2, Math.min(W, H) * 0.36, 0.02, STEEL, 'z');
      box('paint', 0, H - 0.15, D / 2 + 0.005, W - 0.06, 0.12, 0.01, 0xd8d8d0);
      for (let i = 0; i < 3; i++) cyl('metal', -W * 0.3 + i * 0.1, H - 0.09, D / 2 + 0.02, 0.025, 0.02, BLACK, 'z');
      break;
    }
    case 'f_fireplace': {               // brick surround, mantel with clutter, glowing firebox, grate
      box('brick', 0, 0, 0, W, H, D, c1 === WOOD ? 0x8a4a3a : c1);
      box('wood', 0, H, 0.03, W + 0.2, 0.08, D + 0.14, DARKW);
      box('emissive', 0, 0.12, D / 2 - 0.02, W * 0.5, H * 0.45, 0.02, 0x1a0804);
      for (let i = 0; i < 3; i++) box('emissive', -W * 0.12 + i * W * 0.12, 0.14, D / 2 - 0.0, W * 0.08, H * 0.12 + (i % 2) * 0.08, 0.02, i % 2 ? 0xff8a2a : 0xffc040);
      for (let i = 0; i < 4; i++) box('metal', -W * 0.2 + i * W * 0.13, 0.12, D / 2 + 0.02, 0.02, H * 0.3, 0.02, BLACK);
      cyl('paint', -W * 0.35, H + 0.18, 0, 0.06, 0.2, 0x3a6a9a); box('wood', W * 0.25, H + 0.08, 0, 0.18, 0.24, 0.1, 0x6a4a1a);
      break;
    }
    case 'f_desk': {                    // writing desk with a drawer pedestal and a leather top
      box('wood', 0, H - 0.05, 0, W, 0.05, D, c1);
      box('fabric', 0, H - 0.001, 0, W * 0.7, 0.005, D * 0.6, 0x2a4a3a);
      box('wood', W / 2 - 0.25, 0, 0, 0.45, H - 0.05, D - 0.06, c1);
      for (let i = 0; i < 3; i++) { box('wood', W / 2 - 0.25, 0.08 + i * (H - 0.15) / 3, D / 2 - 0.02, 0.4, (H - 0.2) / 3, 0.02, mix(c1, 0xffffff, 0.05)); box('metal', W / 2 - 0.25, 0.08 + i * (H - 0.15) / 3 + (H - 0.2) / 6, D / 2 + 0.01, 0.1, 0.025, 0.025, BRASS); }
      for (const sz of [-1, 1]) cyl('wood', -W / 2 + 0.06, (H - 0.05) / 2, sz * (D / 2 - 0.06), 0.035, H - 0.05, c1);
      box('paint', -W * 0.15, H, 0, 0.3, 0.02, 0.22, 0xf2ead8);
      break;
    }
    case 'f_cabinet': {                 // filing cabinet
      box('metal', 0, 0, 0, W, H, D, c1 === WOOD ? 0x6d7a6f : c1);
      const n = Math.max(2, Math.round(H / 0.33));
      for (let i = 0; i < n; i++) { box('metal', 0, 0.04 + i * H / n, D / 2, W - 0.06, H / n - 0.05, 0.02, mix(c1 === WOOD ? 0x6d7a6f : c1, 0xffffff, 0.08)); box('metal', 0, (i + 0.6) * H / n, D / 2 + 0.02, 0.14, 0.03, 0.03, STEEL); }
      break;
    }
    case 'f_crib': {
      box('wood', 0, 0.3, 0, W, 0.06, D, c1);
      for (const sz of [-1, 1]) for (let x = -W / 2 + 0.05; x <= W / 2; x += 0.12) box('wood', x, 0.3, sz * (D / 2 - 0.03), 0.04, H - 0.3, 0.04, c1);
      for (const sx of [-1, 1]) box('wood', sx * (W / 2 - 0.03), 0, 0, 0.06, H, D, c1);
      for (const sz of [-1, 1]) box('wood', 0, H - 0.05, sz * (D / 2 - 0.03), W, 0.05, 0.06, c1);
      box('fabric', 0, 0.36, 0, W - 0.1, 0.1, D - 0.1, 0xd8b8c8);
      break;
    }
    case 'f_piano': {                   // upright piano with keys
      box('wood', 0, 0, -D * 0.15, W, H, D * 0.7, c1);
      box('wood', 0, H * 0.55, D * 0.15, W, 0.06, D * 0.5, c1);
      box('paint', 0, H * 0.61, D * 0.3, W - 0.1, 0.02, D * 0.2, 0xf8f8f0);
      for (let x = -W / 2 + 0.1; x < W / 2 - 0.1; x += 0.07) box('paint', x, H * 0.63, D * 0.24, 0.025, 0.02, D * 0.1, BLACK);
      box('wood', 0, H * 0.7, D * 0.04, W * 0.6, H * 0.25, 0.03, mix(c1, 0xffffff, 0.08), -0.15);
      break;
    }
    case 'f_workbench': {               // heavy bench with a vice, tools, a shelf underneath
      box('wood', 0, H - 0.08, 0, W, 0.08, D, 0x9a7a4a);
      legs(0.08, H - 0.08, 0.05, 0x6a5232);
      box('wood', 0, 0.2, 0, W - 0.1, 0.04, D - 0.1, 0x7a5a3a);
      box('metal', W / 2 - 0.2, H, D / 2 - 0.12, 0.18, 0.12, 0.2, 0x3a5a7a);
      box('metal', -W * 0.2, H, 0, 0.3, 0.03, 0.06, 0xd83a2a); box('wood', -W * 0.2 + 0.2, H, 0, 0.12, 0.04, 0.04, 0x6a4a2a);
      cyl('metal', W * 0.1, H + 0.1, -0.1, 0.06, 0.2, 0x6a7078);
      box('cardboard', -W / 2 + 0.3, 0.24, 0, 0.4, 0.3, 0.35, 0xb08a5c);
      break;
    }
    case 'f_shelving': {                // metal storage shelving with boxes, jars and tins
      for (const sx of [-1, 1]) for (const sz of [-1, 1]) box('metal', sx * (W / 2 - 0.02), 0, sz * (D / 2 - 0.02), 0.04, H, 0.04, 0x55626a);
      const n = Math.max(2, Math.round(H / 0.55));
      let seed = Math.abs(Math.round(d.x * 31 + d.z * 17));
      const r = () => ((seed = (seed * 9301 + 49297) % 233280) / 233280);
      for (let i = 0; i < n; i++) {
        const yy = 0.1 + i * (H - 0.15) / (n - 1 || 1);
        box('metal', 0, yy, 0, W, 0.03, D, 0x6a7680);
        if (i === n - 1) continue;
        let x = -W / 2 + 0.08;
        while (x < W / 2 - 0.15) {
          const k = r(), s = 0.12 + r() * 0.2;
          if (k < 0.4) box('cardboard', x + s / 2, yy + 0.03, 0, s, s * 0.8, D * 0.7, 0xb08a5c);
          else if (k < 0.7) cyl('glass', x + 0.05, yy + 0.12, 0, 0.05, 0.2, [0x3c5a3a, 0xc8a050, 0x8a3a2a][Math.floor(r() * 3)]);
          else if (k < 0.85) cyl('metal', x + 0.06, yy + 0.09, 0, 0.06, 0.15, [0xd85a3a, 0x3a8ad8, 0xd8d8d0][Math.floor(r() * 3)]);
          x += s + 0.04;
        }
      }
      break;
    }
    case 'f_boiler': {                  // big boiler: rust body, gauges, pipes up to the ceiling, a glowing burner window
      cyl('rust', 0, H * 0.45, 0, Math.min(W, D) * 0.45, H * 0.9, 0x7a8a8a);
      ball('rust', 0, H * 0.9, 0, Math.min(W, D) * 0.45, 0x7a8a8a, 0.4);
      box('emissive', 0, H * 0.18, Math.min(W, D) * 0.44, 0.24, 0.14, 0.02, 0xff8030);
      for (const [x, y] of [[-0.12, 0.6], [0.14, 0.62]]) { cyl('metal', x, H * y, Math.min(W, D) * 0.45, 0.07, 0.03, CREAM, 'z'); box('paint', x, H * y - 0.005, Math.min(W, D) * 0.47, 0.005, 0.05, 0.005, BLACK); }
      for (const sx of [-0.18, 0.18]) cyl('rust', sx, H + 0.6, 0, 0.06, 1.2, 0x8e5c42);
      cyl('metal', 0, H * 0.75, Math.min(W, D) * 0.45, 0.04, 0.2, 0xd83a2a, 'x');
      break;
    }
    case 'f_pipes': {                   // a run of pipes along a ceiling or wall: local x is the run
      for (let k = 0; k < (d.n || 3); k++) {
        const off = (k - ((d.n || 3) - 1) / 2) * 0.16;
        cyl('rust', 0, 0, off, 0.045 + (k % 2) * 0.02, W, k % 2 ? 0x8e5c42 : 0x7a8a8a, 'x');
        for (let x = -W / 2 + 0.6; x < W / 2; x += 1.6) { cyl('metal', x, 0, off, 0.07, 0.06, 0x5a5a5a, 'x'); box('metal', x, 0.02, off, 0.03, 0.25, 0.03, 0x4a4a4a); }
      }
      if (d.valve) { cyl('metal', 0, -0.12, 0, 0.12, 0.03, 0xd83a2a, 'y', 'torus'); cyl('metal', 0, -0.06, 0, 0.02, 0.1, 0xd83a2a); }
      break;
    }
    case 'f_elecbox': {                 // electrical box with a hazard stripe and a conduit
      box('metal', 0, 0, 0, W, H, D, 0x5a6a6a);
      box('metal', 0, H * 0.06, D / 2, W - 0.04, H - 0.12, 0.02, 0x6a7a7a);
      for (let i = 0; i < 4; i++) box('paint', -W / 2 + 0.05 + i * W / 4, H - 0.12, D / 2 + 0.012, W / 8, 0.06, 0.005, i % 2 ? BLACK : 0xf0c020);
      box('emissive', W * 0.3, H * 0.7, D / 2 + 0.015, 0.03, 0.03, 0.01, 0xff3020);
      cyl('metal', 0, H + 0.6, -D / 4, 0.03, 1.2, 0x4a4a4a);
      break;
    }
    case 'f_crates': {                  // a stack of storage boxes / crates
      let seed = Math.abs(Math.round(d.x * 7 + d.z * 3));
      const r = () => ((seed = (seed * 9301 + 49297) % 233280) / 233280);
      const n = Math.max(2, Math.round(W * D * 3));
      for (let i = 0; i < n; i++) {
        const s = 0.35 + r() * 0.3, x = (r() - 0.5) * (W - s), z = (r() - 0.5) * (D - s), stack = r() < 0.4 ? s : 0;
        box(r() < 0.5 ? 'cardboard' : 'crate', x, stack * 0.95, z, s, s * 0.85, s, r() < 0.5 ? 0xb08a5c : 0xc89a62, 0, (r() - 0.5) * 0.4);
      }
      break;
    }
    case 'f_barrel': {
      cyl('wood', 0, H / 2, 0, Math.min(W, D) / 2, H, c1, 'y', 'cyl');
      for (const y of [0.15, 0.5, 0.85]) cyl('metal', 0, H * y, 0, Math.min(W, D) / 2 + 0.01, 0.05, 0x4a4a4a);
      break;
    }
    case 'f_bulb': {                    // bare bulb on a flex, with a wire cage (d.y is the ceiling)
      const drop = d.drop ?? 0.35;
      cyl('metal', 0, -drop / 2, 0, 0.012, drop, BLACK);
      cyl('metal', 0, -drop - 0.04, 0, 0.035, 0.08, 0x3a3a3a);
      ball('emissive', 0, -drop - 0.12, 0, 0.07, d.c ?? 0xffe0a0, 1.25);
      if (d.cage !== false) for (let i = 0; i < 4; i++) box('metal', Math.cos(i * Math.PI / 2) * 0.1, -drop - 0.24, Math.sin(i * Math.PI / 2) * 0.1, 0.012, 0.2, 0.012, 0x2a2a2a);
      break;
    }
    case 'f_ceilinglamp': {             // flush ceiling fitting: brass rim and a glowing glass bowl (d.y is the ceiling)
      cyl('metal', 0, -0.02, 0, 0.26, 0.04, BRASS);
      ball('emissive', 0, -0.05, 0, 0.22, d.c ?? 0xfff0d0, 0.45);
      ball('metal', 0, -0.15, 0, 0.03, BRASS);
      break;
    }
    case 'f_pendant': {                 // hanging shade lamp (d.y is the ceiling)
      const drop = d.drop ?? 0.6;
      cyl('metal', 0, -drop / 2, 0, 0.012, drop, BLACK);
      cyl('fabric', 0, -drop - 0.1, 0, 0.26, 0.22, d.c2 ?? 0xd8c890, 'y', 'cone');
      ball('emissive', 0, -drop - 0.16, 0, 0.08, d.c ?? 0xffe6b0);
      break;
    }
    case 'f_chest': {                   // old trunk: body, curved lid, iron bands, a padlock, chains
      box('wood', 0, 0, 0, W, H * 0.7, D, c1);
      cyl('wood', 0, H * 0.7, 0, D / 2, W, c1, 'x');
      for (const x of [-W * 0.3, W * 0.3]) { box('metal', x, -0.005, 0, 0.06, H * 0.71, D + 0.02, 0x3a3a3a); cyl('metal', x, H * 0.7, 0, D / 2 + 0.01, 0.06, 0x3a3a3a, 'x'); }
      box('metal', 0, H * 0.5, D / 2 + 0.01, 0.12, 0.14, 0.04, BRASS);
      if (d.chain) for (let i = 0; i < 8; i++) cyl('metal', -W / 2 + 0.1 + i * (W - 0.2) / 7, H * 0.95, D * 0.1, 0.05, 0.02, 0x8a8a8a, 'z', 'torus');
      break;
    }
    case 'f_tank': {                    // pressure / oil tank on legs, with a gauge and a valve
      const r = Math.min(D, H) * 0.45;
      for (const x of [-W * 0.3, W * 0.3]) box('metal', x, 0, 0, 0.08, H - r * 1.4, D * 0.7, 0x3a3a3a);
      cyl('rust', 0, H - r, 0, r, W, c1 ?? 0x6b7d86, 'x');
      for (const sx of [-1, 1]) ball('rust', sx * W / 2, H - r, 0, r, c1 ?? 0x6b7d86, 1);
      cyl('metal', W * 0.15, H - r * 0.05, 0, 0.07, 0.03, CREAM);
      cyl('metal', -W * 0.2, H + 0.05, 0, 0.04, 0.3, 0x8e5c42);
      cyl('metal', -W * 0.2, H + 0.18, 0, 0.08, 0.02, 0xd83a2a, 'y', 'torus');
      break;
    }
    case 'f_winerack': {                // wooden rack of diamond cubbies full of bottles
      box('wood', 0, 0, -D / 2 + 0.02, W, H, 0.04, DARKW);
      for (const sx of [-1, 1]) box('wood', sx * (W / 2 - 0.03), 0, 0, 0.06, H, D, c1);
      box('wood', 0, H - 0.05, 0, W, 0.05, D, c1);
      const rows = Math.max(2, Math.round(H / 0.32)), cols = Math.max(2, Math.round(W / 0.24));
      for (let i = 0; i < rows; i++) {
        box('wood', 0, 0.05 + i * (H - 0.1) / rows, 0, W - 0.1, 0.03, D, c1);
        for (let j = 0; j < cols; j++) {
          if ((i * 7 + j * 3) % 5 === 0) continue;
          cyl('glass', -W / 2 + 0.12 + j * (W - 0.24) / (cols - 1), 0.17 + i * (H - 0.1) / rows, 0.02, 0.045, D * 0.8, [0x2a4a2a, 0x4a1a2a, 0x3a3a1a][(i + j) % 3], 'z');
        }
      }
      break;
    }
    case 'f_trophycase': {              // glass-fronted cabinet of gold cups
      box('wood', 0, 0, 0, W, H, D, c1);
      box('glass', 0, 0.3, D / 2 + 0.01, W - 0.12, H - 0.45, 0.02, 0xa8cce8);
      for (const yy of [0.35, H * 0.55]) {
        box('wood', 0, yy - 0.03, 0.02, W - 0.12, 0.03, D - 0.1, DARKW);
        for (const dx of [-W * 0.3, 0, W * 0.3]) { cyl('metal', dx, yy + 0.04, 0.05, 0.06, 0.06, BRASS); cyl('metal', dx, yy + 0.16, 0.05, 0.08, 0.18, BRASS, 'y', 'cone'); }
      }
      break;
    }
    case 'f_statue': {                  // a marble bust on a plinth
      box('block', 0, 0, 0, W, H * 0.45, D, 0xd8cdb8);
      cyl('block', 0, H * 0.55, 0, W * 0.28, H * 0.2, 0xeeeae0);
      ball('block', 0, H * 0.78, 0, W * 0.24, 0xeeeae0, 1.2);
      ball('block', 0, H * 0.67, 0, W * 0.34, 0xeeeae0, 0.45);
      break;
    }
    case 'f_clutter': {                 // small things on a surface: books, a cup, a radio, papers
      box('paint', -W * 0.25, 0, 0, 0.22, 0.05, 0.16, 0x8a2a2a, 0, 0.2); box('paint', -W * 0.25, 0.05, 0, 0.2, 0.04, 0.15, 0x2a4a8a, 0, -0.1);
      cyl('paint', W * 0.2, 0.05, 0.05, 0.04, 0.1, 0xf2ead8);
      box('paint', 0, 0, -0.05, 0.24, 0.005, 0.32, 0xf8f4e8, 0, 0.3);
      break;
    }
  }
}
function mix(a, b, t) {
  const r = Math.round(((a >> 16) & 255) * (1 - t) + ((b >> 16) & 255) * t), g = Math.round(((a >> 8) & 255) * (1 - t) + ((b >> 8) & 255) * t), bl = Math.round((a & 255) * (1 - t) + (b & 255) * t);
  return (r << 16) | (g << 8) | bl;
}

