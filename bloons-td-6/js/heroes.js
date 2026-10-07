'use strict';
// Heroes level from 1 to 20 with XP earned each round, like BTD6. Abilities
// unlock at level 3 and level 10.
(function () {
  const U = BTD.U;
  const A = BTD.A;
  const isType = (...ks) => (t) => ks.includes(t.k);

  const COST = [0, 0, 180, 460, 1000, 1860, 3280, 5180, 8320, 9380, 13620, 16380, 14400, 16650, 14940, 16380, 17820, 19260, 20700, 16470, 17280];
  const CUM = [];
  COST.reduce((s, c, i) => (CUM[i] = s + c), 0);
  BTD.heroLevelXp = (lvl) => CUM[lvl] || Infinity;
  BTD.heroXpForRound = (r) => (r <= 20 ? 20 * r + 20 : r <= 50 ? 40 * r - 380 : 90 * r - 2880);

  const H = {};
  H.quincy = {
    name: 'Quincy', cost: 540, r: 15, color: '#3c7b2f', title: 'Mighty Archer',
    desc: 'Quincy fires arrows that bounce between bloons. Solid all-rounder.',
    base: { range: 50 * U, a: [A({ rate: 0.95, pierce: 3, speed: 900, sprite: 'arrow', move: 'bounce', lifeDist: 500 })] },
    level(s, l) {
      const a = s.a[0];
      if (l >= 2) a.pierce += 1;
      if (l >= 3) s.ability = { name: 'Rapid Shot', icon: 'rapid', cd: 45, fn: (G, t) => G.boost(t, { dur: 8, rate: 0.33 }) };
      if (l >= 4) s.range += 5 * U;
      if (l >= 5) a.dmg = 2;
      if (l >= 6) a.rate *= 0.85;
      if (l >= 7) { a.pierce += 2; s.camo = true; }
      if (l >= 8) s.a.push(A({ rate: 1.5, dmg: 0, speed: 700, sprite: 'arrow', size: 8, dmgType: 'explosion', expl: { r: 34, dmg: 2, pierce: 12, dmgType: 'explosion' } }));
      if (l >= 9) a.moab = 2;
      if (l >= 10) s.ability2 = s.ability, s.ability = { name: 'Storm of Arrows', icon: 'arrows', cd: 60, needBloons: true, fn: (G, t) => { const b = G.pickTarget(t, t.x, t.y, 9999, null, 3); if (b) G.damageAll({ dmg: 8 + t.hero.lvl, range: 170, x: b.x, y: b.y, dmgType: 'normal', color: '#f3e7b3' }, t); } };
      if (l >= 11) a.dmg = 3;
      if (l >= 12) a.rate *= 0.85;
      if (l >= 13) s.range += 5 * U;
      if (l >= 14) a.pierce += 3;
      if (l >= 15) a.moab = 6;
      if (l >= 16) a.dmg = 5;
      if (l >= 17) a.rate *= 0.8;
      if (l >= 18) a.dmgType = 'normal';
      if (l >= 19) a.pierce += 4;
      if (l >= 20) { a.dmg = 10; a.moab = 20; }
    },
  };
  H.gwendolin = {
    name: 'Gwendolin', cost: 725, r: 15, color: '#d6421e', title: 'Fire Starter',
    desc: 'Sets bloons on fire. Fire monkeys near her get a boost.',
    base: { range: 40 * U, a: [A({ rate: 0.65, pierce: 3, speed: 520, sprite: 'flame', size: 9, dmgType: 'fire', fx: { burn: { dmg: 1, every: 1, dur: 3 } } })] },
    level(s, l) {
      const a = s.a[0];
      if (l >= 2) a.pierce += 2;
      if (l >= 3) s.ability = { name: 'Cocktail of Fire', icon: 'cocktail', cd: 30, needBloons: true, fn: (G, t) => { const b = G.pickTarget(t, t.x, t.y, G.range(t) * 1.4, null, 0); if (b) G.patches.push({ x: b.x, y: b.y, r: 50, life: 8, every: 0.2, t: 0, age: 0, a: { dmg: 1 + Math.floor(t.hero.lvl / 4), pierce: 40, dmgType: 'fire' }, owner: t, color: '#ff6a00' }); } };
      if (l >= 4) a.rate *= 0.85;
      if (l >= 5) a.dmg = 2;
      if (l >= 6) s.buff = { only: isType('tack', 'wizard', 'mortar'), dmg: 1, self: false };
      if (l >= 7) s.range += 5 * U;
      if (l >= 8) a.fx.burn.dmg = 2;
      if (l >= 9) a.moab = 3;
      if (l >= 10) s.ability = { name: 'Firestorm', icon: 'firestorm', cd: 60, fn: (G, t) => G.damageAll({ dmg: 2, dmgType: 'normal', fx: { burn: { dmg: 4, every: 0.5, dur: 8 } }, color: '#ffb070' }, t) };
      if (l >= 12) a.dmg = 4;
      if (l >= 14) a.rate *= 0.8;
      if (l >= 16) { a.dmgType = 'normal'; a.pierce += 4; }
      if (l >= 18) a.moab = 10;
      if (l >= 20) { a.dmg = 10; a.fx.burn.dmg = 10; }
    },
  };
  H.striker = {
    name: 'Striker Jones', cost: 650, r: 16, color: '#4a6b3a', title: 'Artillery Commander',
    desc: 'Fires a bazooka. Bomb Shooters and Mortars near him can pop Black bloons.',
    base: { range: 45 * U, buff: { only: isType('bomb', 'mortar'), normal: true, self: false }, a: [A({ rate: 1.2, dmg: 0, speed: 600, sprite: 'missile', size: 8, dmgType: 'explosion', expl: { r: 32, dmg: 1, pierce: 18, dmgType: 'normal' } })] },
    level(s, l) {
      const a = s.a[0];
      if (l >= 2) a.expl.pierce += 6;
      if (l >= 3) s.ability = { name: 'Concussive Shell', icon: 'concussive', cd: 25, needBloons: true, fn: (G, t) => G.strike(t, { dmg: 10 + t.hero.lvl * 5, fx: { stun: 4, stunMoab: true }, expl: { r: 50, dmg: 2, pierce: 30, dmgType: 'normal', fx: { stun: 2 } } }) };
      if (l >= 4) s.range = 9999;
      if (l >= 5) a.expl.dmg = 2;
      if (l >= 7) a.rate *= 0.8;
      if (l >= 9) a.expl.moab = 5;
      if (l >= 10) s.ability = { name: 'Artillery Command', icon: 'artillery', cd: 60, fn: (G, t) => G.boostArea(t, 99999, isType('bomb', 'mortar'), { dur: 3, rate: 0.1 }) };
      if (l >= 12) a.expl.dmg = 4;
      if (l >= 15) a.expl.r *= 1.3;
      if (l >= 18) a.expl.moab = 20;
      if (l >= 20) { a.expl.dmg = 10; a.rate *= 0.6; }
    },
  };
  H.obyn = {
    name: 'Obyn Greenfoot', cost: 650, r: 15, color: '#2c6e8f', title: 'Forest Guardian',
    desc: 'Casts spirit wolves. Magic monkeys near him get extra pierce.',
    base: { range: 40 * U, buff: { only: (t) => t.def && t.def.cat === 'magic', pierce: 1, self: false }, a: [A({ rate: 1.35, pierce: 4, dmg: 2, speed: 500, move: 'seek', seek: 5, sprite: 'wolf', size: 10, dmgType: 'normal' })] },
    level(s, l) {
      const a = s.a[0];
      if (l >= 2) a.pierce += 2;
      if (l >= 3) s.ability = { name: 'Brambles', icon: 'brambles', cd: 25, fn: (G, t) => { for (let i = 0; i < 2; i++) { const p = G.trackPts[(Math.random() * G.trackPts.length) | 0]; G.spikes.push({ x: p.x, y: p.y, sx: t.x, sy: t.y, fly: 0, a: { dmg: 1, dmgType: 'normal' }, owner: t, pierce: 40 + t.hero.lvl * 5, life: 30, hit: new Set(), sprite: 'brambles' }); } } };
      if (l >= 4) s.buff.pierce = 2;
      if (l >= 5) a.dmg = 3;
      if (l >= 7) a.rate *= 0.8;
      if (l >= 9) s.camo = true;
      if (l >= 10) s.ability = { name: 'Wall of Trees', icon: 'walltrees', cd: 60, fn: (G, t) => { const p = G.trackPts[Math.floor(G.trackPts.length * 0.75)]; G.patches.push({ x: p.x, y: p.y, r: 45, life: 25, every: 0.1, t: 0, age: 0, a: { dmg: 20, pierce: 60, dmgType: 'normal' }, owner: t, color: '#2e8b2e' }); } };
      if (l >= 12) a.dmg = 5;
      if (l >= 15) { a.moab = 5; s.buff.pierce = 3; }
      if (l >= 18) a.rate *= 0.75;
      if (l >= 20) { a.dmg = 12; a.moab = 15; }
    },
  };
  H.benjamin = {
    name: 'Benjamin', cost: 1200, r: 15, color: '#2c2c3a', title: 'Code Monkey',
    desc: 'Doesn\'t attack. Hacks the bank for extra cash every round.',
    base: { range: 45 * U, a: [] },
    level(s, l) {
      s.income = 100 + l * 40;
      if (l >= 3) s.ability = { name: 'Biohack', icon: 'biohack', cd: 45, fn: (G, t) => { const list = G.towers.filter((x) => x !== t && !x.temp).sort((p, q) => Math.hypot(p.x - t.x, p.y - t.y) - Math.hypot(q.x - t.x, q.y - t.y)).slice(0, 4); for (const x of list) G.boost(x, { dur: 10, dmg: 1 + Math.floor(t.hero.lvl / 7) }); } };
      if (l >= 5) s.buff = { cashMult: 1.05 };
      if (l >= 10) s.ability = { name: 'Syphon Funding', icon: 'syphon', cd: 50, fn: (G, t) => { G.addCash(500 + t.hero.lvl * 100); G.damageAll({ dmg: 2, dmgType: 'normal', notBad: true, color: '#3a9b3a' }, t); } };
      if (l >= 15) s.buff = { cashMult: 1.1 };
      if (l >= 20) s.income = 1500;
    },
  };
  H.churchill = {
    name: 'Captain Churchill', cost: 2000, r: 20, color: '#5a6a3a', title: 'Tank Commander',
    desc: 'A tank. Heavy shells and a machine gun.',
    base: { range: 55 * U, a: [A({ rate: 0.9, dmg: 0, speed: 800, sprite: 'shell', size: 9, dmgType: 'explosion', expl: { r: 34, dmg: 3, pierce: 20, dmgType: 'normal' } }), A({ rate: 0.12, dmg: 1, pierce: 2, speed: 1100, sprite: 'bullet', jitter: 0.1, sound: false })] },
    level(s, l) {
      const a = s.a[0];
      if (l >= 2) a.expl.pierce += 10;
      if (l >= 3) s.ability = { name: 'Armor Piercing Shells', icon: 'apshell', cd: 40, fn: (G, t) => G.boost(t, { dur: 10, moab: 30, dmg: 3 }) };
      if (l >= 5) { a.expl.dmg = 5; s.camo = true; }
      if (l >= 7) a.rate *= 0.8;
      if (l >= 9) a.expl.moab = 10;
      if (l >= 10) s.ability = { name: 'MOAB Barrage', icon: 'barrage', cd: 45, needBloons: true, fn: (G, t) => G.strike(t, { dmg: 1500 + t.hero.lvl * 150, moabOnly: true, count: 4 }) };
      if (l >= 13) a.expl.dmg = 10;
      if (l >= 16) { s.a[1].dmg = 4; s.a[1].dmgType = 'normal'; }
      if (l >= 20) { a.expl.dmg = 30; a.expl.moab = 60; }
    },
  };
  for (const k in H) { H[k].k = k; H[k].hero = true; H[k].cat = 'hero'; H[k].targets = ['First', 'Last', 'Close', 'Strong']; }
  BTD.HEROES = H;
  BTD.HERO_ORDER = ['quincy', 'gwendolin', 'striker', 'obyn', 'benjamin', 'churchill'];
})();
