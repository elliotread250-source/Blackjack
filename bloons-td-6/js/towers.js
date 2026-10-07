'use strict';
// All 21 classic BTD6 monkeys with three five-tier paths. Prices are BTD6's
// Medium prices. Each upgrade mutates the tower's stats; the engine reads
// stats.a (attacks), range, camo, ability, buff, bananas and friends.
(function () {
  const U = BTD.U;
  const A = (o) => Object.assign({ kind: 'proj', rate: 1, dmg: 1, pierce: 1, speed: 720, size: 7, dmgType: 'sharp', count: 1, spread: 0.2, sprite: 'dart' }, o);
  const u = (n, c, d, f) => ({ n, c, d, f });
  const m = (s) => s.a[0];
  const T = {};

  const isType = (...ks) => (t) => ks.includes(t.k);

  // ================= PRIMARY =================
  T.dart = {
    name: 'Dart Monkey', cat: 'primary', cost: 200, key: 'q', r: 15,
    desc: 'Throws a single dart at nearby bloons. Short range and low pierce but cheap.',
    base: { range: 32 * U, a: [A({ rate: 0.95, pierce: 2, speed: 900 })] },
    up: [
      [
        u('Sharp Shots', 140, 'Darts pop 1 extra bloon each.', (s) => { m(s).pierce += 1; }),
        u('Razor Sharp Shots', 220, 'Pops 2 more bloons per dart.', (s) => { m(s).pierce += 2; }),
        u('Spike-o-pult', 300, 'Hurls a big spiked ball that rolls through 22 bloons.', (s) => { Object.assign(m(s), { sprite: 'spikeball', pierce: 22, size: 12, speed: 520, spin: 8 }); m(s).rate *= 1.15; }),
        u('Juggernaut', 1800, 'Giant spiked ball pops lead and smashes ceramics.', (s) => { Object.assign(m(s), { sprite: 'jugg', pierce: 100, dmg: 2, ceram: 4, dmgType: 'normal', size: 17, speed: 560, lifeDist: 520 }); }),
        u('Ultra-Juggernaut', 15000, 'Huge ball that splits into two Juggernauts, each splitting again.', (s) => { Object.assign(m(s), { sprite: 'ujugg', pierce: 200, dmg: 5, ceram: 8, moab: 3, size: 22, split: A({ sprite: 'jugg', pierce: 100, dmg: 3, ceram: 6, dmgType: 'normal', size: 15, speed: 520, life: 0.6, spin: 8, split: A({ sprite: 'spikeball', pierce: 30, dmg: 2, ceram: 4, dmgType: 'normal', size: 10, speed: 520, life: 0.4, spin: 8 }), count: 2 }) }); m(s).split.count = 2; m(s).split.split.count = 2; m(s).split = Object.assign(m(s).split, { count: 2 }); }),
      ],
      [
        u('Quick Shots', 100, 'Shoots 15% faster.', (s) => { m(s).rate *= 0.85; }),
        u('Very Quick Shots', 190, 'Shoots even faster.', (s) => { m(s).rate *= 0.78; }),
        u('Triple Shot', 400, 'Throws 3 darts at a time.', (s) => { m(s).count = 3; m(s).spread = 0.17; }),
        u('Super Monkey Fan Club', 8000, 'Ability: up to 10 Dart Monkeys become Super Monkeys for 15 seconds.', (s) => {
          s.ability = { name: 'Super Monkey Fan Club', icon: 'smfc', cd: 50, fn: (G, t) => {
            const ds = G.towers.filter((x) => x.k === 'dart' && !x.temp).sort((p, q) => Math.hypot(p.x - t.x, p.y - t.y) - Math.hypot(q.x - t.x, q.y - t.y)).slice(0, 10);
            for (const x of ds) G.boost(x, { dur: 15, rate: 0.06, range: 1.25, camo: false, fan: 1 });
          } };
        }),
        u('Plasma Monkey Fan Club', 45000, 'Ability turns Dart Monkeys into Plasma Monkeys: 2 damage, pops everything.', (s) => {
          m(s).rate *= 0.6; m(s).dmg += 1;
          s.ability = { name: 'Plasma Monkey Fan Club', icon: 'pmfc', cd: 50, fn: (G, t) => {
            const ds = G.towers.filter((x) => x.k === 'dart' && !x.temp).sort((p, q) => Math.hypot(p.x - t.x, p.y - t.y) - Math.hypot(q.x - t.x, q.y - t.y)).slice(0, 20);
            for (const x of ds) G.boost(x, { dur: 15, rate: 0.03, range: 1.4, dmg: 1, pierce: 5, fan: 2 });
          } };
        }),
      ],
      [
        u('Long Range Darts', 90, 'Darts go further and the monkey sees further.', (s) => { s.range += 8 * U; }),
        u('Enhanced Eyesight', 200, 'Even more range, and can see Camo bloons.', (s) => { s.range += 8 * U; s.camo = true; }),
        u('Crossbow', 575, 'Crossbow bolts deal 3 damage with more pierce and range.', (s) => { s.range += 8 * U; Object.assign(m(s), { sprite: 'bolt', dmg: 3, speed: 1200 }); m(s).pierce += 1; }),
        u('Sharp Shooter', 2050, 'Faster bolts that crit for 20 damage every few shots.', (s) => { m(s).rate *= 0.75; m(s).dmg = 6; m(s).crit = { every: 10, dmg: 20 }; }),
        u('Crossbow Master', 21500, 'Rapid-fire bolts with huge pierce and frequent crits.', (s) => { m(s).rate *= 0.36; m(s).dmg = 8; m(s).pierce += 5; m(s).crit = { every: 4, dmg: 40 }; s.range += 8 * U; }),
      ],
    ],
  };

  T.boomerang = {
    name: 'Boomerang Monkey', cat: 'primary', cost: 315, key: 'w', r: 15,
    desc: 'Throws boomerangs that curve out and back, popping bloons both ways.',
    base: { range: 43 * U, a: [A({ rate: 1.2, pierce: 4, speed: 480, move: 'boom', sprite: 'rang', size: 9, spin: 18 })] },
    up: [
      [
        u('Improved Rangs', 200, 'Boomerangs pop 8 bloons.', (s) => { m(s).pierce += 4; }),
        u('Glaives', 280, 'Glaives pop 12 bloons.', (s) => { m(s).pierce += 4; m(s).sprite = 'glaive'; }),
        u('Glaive Ricochet', 1300, 'Glaives bounce from bloon to bloon.', (s) => { Object.assign(m(s), { move: 'bounce', pierce: 50, speed: 700, lifeDist: 900 }); }),
        u('MOAR Glaives', 3000, 'Glaives deal more damage and bounce faster.', (s) => { m(s).rate *= 0.5; m(s).pierce += 30; m(s).dmg = 2; m(s).ceram = 2; }),
        u('Glaive Lord', 32400, 'Three huge glaives orbit the monkey, shredding everything close.', (s) => { m(s).dmg += 3; m(s).pierce += 50; s.a.push(A({ kind: 'aura', rate: 0.1, dmg: 10, moab: 10, pierce: 999, dmgType: 'normal', radius: 70, color: '#f7d36b', sound: false })); }),
      ],
      [
        u('Faster Throwing', 175, 'Throws 25% faster.', (s) => { m(s).rate *= 0.75; }),
        u('Faster Rangs', 250, 'Boomerangs fly faster.', (s) => { m(s).speed *= 1.3; m(s).rate *= 0.85; }),
        u('Bionic Boomerang', 1600, 'Robot arm throws boomerangs extremely fast. Extra damage to MOABs.', (s) => { m(s).rate *= 0.38; m(s).moab += 2; }),
        u('Turbo Charge', 4000, 'Ability: attack speed goes through the roof for 10 seconds.', (s) => { s.ability = { name: 'Turbo Charge', icon: 'turbo', cd: 45, fn: (G, t) => G.boost(t, { dur: 10, rate: 0.25, dmg: 1 }) }; }),
        u('Perma Charge', 35000, 'Permanent Turbo Charge, and the ability is even stronger.', (s) => { m(s).rate *= 0.4; m(s).dmg += 2; s.ability = { name: 'Perma Charge', icon: 'turbo', cd: 40, fn: (G, t) => G.boost(t, { dur: 10, rate: 0.5, dmg: 4 }) }; }),
      ],
      [
        u('Long Range Rangs', 100, 'Increased range.', (s) => { s.range += 8 * U; }),
        u('Red Hot Rangs', 300, 'Red hot boomerangs can pop Lead and deal extra damage to it.', (s) => { m(s).dmgType = 'normal'; m(s).lead = 1; m(s).sprite = m(s).sprite === 'glaive' ? 'glaive' : 'hotrang'; }),
        u('Kylie Boomerang', 1300, 'Throws a kylie straight out and back, popping 2 layers.', (s) => { Object.assign(m(s), { move: 'kylie', dmg: 2, sprite: 'kylie' }); m(s).pierce += 2; }),
        u('MOAB Press', 2200, 'Huge kylies knock MOAB-class bloons back.', (s) => { m(s).moab += 4; m(s).fx = { knock: 70, knockMoab: true }; }),
        u('MOAB Domination', 60000, 'Massive damage to MOABs, and knockback works on bigger ones.', (s) => { m(s).moab += 40; m(s).dmg += 4; m(s).rate *= 0.6; m(s).fx = { knock: 120, knockMoab: true }; }),
      ],
    ],
  };

  T.bomb = {
    name: 'Bomb Shooter', cat: 'primary', cost: 375, key: 'e', r: 17,
    desc: 'Launches bombs that explode on impact. Can\'t pop Black bloons.',
    base: { range: 40 * U, a: [A({ rate: 1.5, dmg: 0, speed: 560, sprite: 'bomb', size: 8, dmgType: 'explosion', expl: { r: 18 * U, dmg: 1, pierce: 14, dmgType: 'explosion' } })] },
    up: [
      [
        u('Bigger Bombs', 250, 'Larger explosions pop more bloons.', (s) => { m(s).expl.r *= 1.25; m(s).expl.pierce += 10; }),
        u('Heavy Bombs', 650, 'Heavy bombs pop 2 layers per explosion.', (s) => { m(s).expl.dmg += 1; m(s).expl.pierce += 6; }),
        u('Really Big Bombs', 1100, 'Huge explosions pop through 3 layers.', (s) => { m(s).expl.r *= 1.35; m(s).expl.dmg += 1; m(s).expl.pierce += 30; m(s).sprite = 'bigbomb'; }),
        u('Bloon Impact', 2800, 'Explosions stun bloons for a moment.', (s) => { m(s).expl.fx = { stun: 1 }; m(s).expl.dmg += 1; }),
        u('Bloon Crush', 55000, 'Devastating explosions that stun even MOABs.', (s) => { m(s).expl.dmg += 8; m(s).expl.moab = 30; m(s).expl.pierce += 50; m(s).expl.dmgType = 'normal'; m(s).expl.fx = { stun: 1.5, stunMoab: true }; m(s).rate *= 0.7; }),
      ],
      [
        u('Faster Reload', 250, 'Reloads 25% faster.', (s) => { m(s).rate *= 0.75; }),
        u('Missile Launcher', 400, 'Fast missiles with more range.', (s) => { m(s).rate *= 0.85; m(s).speed *= 1.6; s.range += 5 * U; m(s).sprite = 'missile'; }),
        u('MOAB Mauler', 900, 'MOAB-crushing missiles deal heavy damage to blimps.', (s) => { m(s).expl.moab = (m(s).expl.moab || 0) + 15; m(s).sprite = 'missile'; }),
        u('MOAB Assassin', 3200, 'Ability: launches a missile that seeks the strongest MOAB-class bloon.', (s) => { m(s).expl.moab += 8; s.ability = { name: 'MOAB Assassin', icon: 'assassin', cd: 30, needBloons: true, fn: (G, t) => G.strike(t, { dmg: 750, moabOnly: false, expl: { r: 40, dmg: 10, pierce: 20, dmgType: 'normal' } }) }; }),
        u('MOAB Eliminator', 25000, 'Massive blimp damage, and the ability cools down fast.', (s) => { m(s).expl.moab += 100; s.ability = { name: 'MOAB Eliminator', icon: 'assassin', cd: 10, needBloons: true, fn: (G, t) => G.strike(t, { dmg: 4500, expl: { r: 50, dmg: 20, pierce: 30, dmgType: 'normal' } }) }; }),
      ],
      [
        u('Extra Range', 200, 'More range.', (s) => { s.range += 7 * U; }),
        u('Frag Bombs', 300, 'Explosions throw out sharp fragments.', (s) => { m(s).expl.frag = { count: 8, dmg: 1, pierce: 1, dmgType: 'sharp' }; }),
        u('Cluster Bombs', 800, 'Bombs burst into a cluster of smaller bombs.', (s) => { m(s).expl.cluster = { count: 8, expl: { r: 30, dmg: 1, pierce: 10, dmgType: 'explosion' } }; }),
        u('Recursive Cluster', 2800, 'Cluster bombs cluster again.', (s) => { m(s).expl.cluster.recursive = true; m(s).expl.cluster.expl.dmg += 1; }),
        u('Bomb Blitz', 35000, 'Huge cluster damage, and when you lose a life it blows up every bloon on screen.', (s) => { m(s).expl.cluster.expl.dmg += 3; m(s).expl.cluster.expl.moab = 10; m(s).expl.dmg += 3; m(s).rate *= 0.6; s.blitz = true; }),
      ],
    ],
  };

  T.tack = {
    name: 'Tack Shooter', cat: 'primary', cost: 260, key: 'r', r: 15,
    desc: 'Shoots a volley of tacks in 8 directions.',
    base: { range: 23 * U, a: [A({ kind: 'radial', rate: 1.4, count: 8, speed: 520, sprite: 'tack', size: 6 })] },
    up: [
      [
        u('Faster Shooting', 150, 'Shoots tacks faster.', (s) => { m(s).rate *= 0.75; }),
        u('Even Faster Shooting', 300, 'Shoots tacks even faster.', (s) => { m(s).rate *= 0.67; }),
        u('Hot Shots', 600, 'Red hot tacks pop Lead and deal extra damage.', (s) => { m(s).dmgType = 'fire'; m(s).dmg += 1; m(s).sprite = 'hottack'; }),
        u('Ring of Fire', 3500, 'Burns every bloon in a ring around it.', (s) => { s.a[0] = A({ kind: 'aura', rate: 0.25, dmg: 3, pierce: 60, dmgType: 'fire', color: '#ff8a1a', ring: 1 }); }),
        u('Inferno Ring', 45500, 'Massive fire ring that also calls down meteors on the strongest bloon.', (s) => { Object.assign(m(s), { rate: 0.1, dmg: 6, pierce: 100, moab: 3 }); s.range += 6 * U; s.a.push(A({ kind: 'hit', rate: 1.2, dmg: 700, dmgType: 'normal', targetStrong: true, color: '#ff5a1a', expl: { r: 40, dmg: 10, pierce: 20, dmgType: 'normal', color: '#ff7a1a' } })); }),
      ],
      [
        u('Long Range Tacks', 100, 'Tacks fly further.', (s) => { s.range += 4 * U; }),
        u('Super Range Tacks', 225, 'Tacks fly much further.', (s) => { s.range += 5 * U; }),
        u('Blade Shooter', 550, 'Razor blades pop more bloons.', (s) => { m(s).pierce = 3; m(s).sprite = m(s).sprite === 'hottack' ? 'hottack' : 'blade'; m(s).rate *= 0.83; }),
        u('Blade Maelstrom', 2700, 'Ability: shoots a whirlwind of blades in all directions.', (s) => { s.ability = { name: 'Blade Maelstrom', icon: 'maelstrom', cd: 20, fn: (G, t) => G.boost(t, { dur: 9, extra: A({ kind: 'radial', rate: 0.033, count: 2, rotate: true, pierce: 200, sprite: 'blade', speed: 520, lifeDist: 600, sound: false }) }) }; }),
        u('Super Maelstrom', 15000, 'Blades have huge pierce, and the ability lasts much longer.', (s) => { m(s).pierce += 6; m(s).dmg += 1; s.ability = { name: 'Super Maelstrom', icon: 'maelstrom', cd: 20, fn: (G, t) => G.boost(t, { dur: 20, extra: A({ kind: 'radial', rate: 0.02, count: 4, rotate: true, pierce: 400, dmg: 2, sprite: 'blade', speed: 560, lifeDist: 900, dmgType: 'normal', sound: false }) }) }; }),
      ],
      [
        u('More Tacks', 100, 'Shoots 10 tacks.', (s) => { m(s).count = 10; }),
        u('Even More Tacks', 100, 'Shoots 12 tacks.', (s) => { m(s).count = 12; }),
        u('Tack Sprayer', 450, 'Sprays 16 tacks very fast.', (s) => { m(s).count = 16; m(s).rate *= 0.6; }),
        u('Overdrive', 3200, 'Shoots incredibly fast.', (s) => { m(s).rate *= 0.33; }),
        u('The Tack Zone', 24000, 'Unleashes a constant storm of 32 tacks.', (s) => { m(s).count = 32; m(s).pierce += 8; m(s).dmg += 1; s.range += 5 * U; }),
      ],
    ],
  };

  T.ice = {
    name: 'Ice Monkey', cat: 'primary', cost: 500, key: 't', r: 15,
    desc: 'Freezes nearby bloons solid. Frozen bloons stop moving.',
    base: { range: 20 * U, a: [A({ kind: 'aura', rate: 2.4, dmg: 1, pierce: 40, dmgType: 'cold', fx: { freeze: 1.5 }, color: '#bff1ff', sound: 'freeze' })] },
    up: [
      [
        u('Permafrost', 100, 'Bloons stay slowed after they thaw.', (s) => { m(s).fx.slow = [0.5, 4]; }),
        u('Cold Snap', 350, 'Can freeze and pop Camo, Lead and White bloons.', (s) => { s.camo = true; m(s).dmgType = 'normal'; }),
        u('Ice Shards', 1500, 'Frozen bloons shatter into ice shards.', (s) => { s.a.push(A({ kind: 'radial', rate: 1.2, count: 6, pierce: 3, dmg: 1, sprite: 'shard', speed: 420, sound: false })); }),
        u('Embrittlement', 2200, 'Bloons become brittle, taking extra damage from everything.', (s) => { m(s).fx.brittle = { dur: 3, bonus: 1 }; m(s).fx.decamo = true; m(s).fx.freezeMoab = true; }),
        u('Super Brittle', 28000, 'Brittle bloons take massive extra damage.', (s) => { m(s).fx.brittle = { dur: 4, bonus: 5 }; m(s).dmg += 4; m(s).rate *= 0.6; }),
      ],
      [
        u('Enhanced Freeze', 225, 'Freezes faster and for longer.', (s) => { m(s).rate *= 0.75; m(s).fx.freeze += 0.5; }),
        u('Deep Freeze', 350, 'Freezes through 2 layers.', (s) => { m(s).fx.freezeKids = true; m(s).pierce += 10; }),
        u('Arctic Wind', 2900, 'An icy wind slows all bloons in its range.', (s) => { s.range += 8 * U; s.a.push(A({ kind: 'aura', rate: 0.2, dmg: 0, pierce: 999, fx: { slow: [0.4, 0.3], slowMoab: true }, color: 'rgba(200,240,255,0.25)', sound: false, hitCamo: true })); }),
        u('Snowstorm', 3000, 'Ability: freezes every bloon on screen, even MOABs.', (s) => { s.ability = { name: 'Snowstorm', icon: 'snow', cd: 30, fn: (G, t) => G.damageAll({ dmg: 1, dmgType: 'cold', fx: { freeze: 6, freezeMoab: true }, color: '#dff6ff' }, t) }; }),
        u('Absolute Zero', 26000, 'Global freeze that lasts much longer and pops through more.', (s) => { m(s).rate *= 0.6; s.ability = { name: 'Absolute Zero', icon: 'snow', cd: 20, fn: (G, t) => G.damageAll({ dmg: 3, dmgType: 'normal', fx: { freeze: 10, freezeMoab: true, slow: [0.5, 15], slowMoab: true }, color: '#dff6ff' }, t) }; }),
      ],
      [
        u('Larger Radius', 150, 'Larger freeze radius.', (s) => { s.range += 7 * U; }),
        u('Re-Freeze', 200, 'Can re-freeze already frozen bloons and pops more.', (s) => { m(s).pierce += 10; }),
        u('Cryo Cannon', 2000, 'Fires freezing bombs at long range.', (s) => { s.range += 18 * U; s.a[0] = A({ kind: 'proj', rate: 1.4, dmg: 0, speed: 600, sprite: 'iceball', size: 9, dmgType: 'cold', expl: { r: 32, dmg: 1, pierce: 14, dmgType: 'cold', fx: { freeze: 1.6, slow: [0.5, 4] }, color: '#bff1ff' } }); }),
        u('Icicles', 2000, 'Frozen bloons grow sharp icicles that pop bloons touching them.', (s) => { m(s).expl.frag = { count: 6, dmg: 1, pierce: 2, sprite: 'shard', dmgType: 'sharp' }; m(s).expl.dmg += 1; }),
        u('Icicle Impale', 30000, 'Huge icicles pierce and freeze MOAB-class bloons.', (s) => { s.a.push(A({ kind: 'proj', rate: 2, dmg: 30, moab: 60, pierce: 3, speed: 900, sprite: 'icicle', size: 10, onlyMoab: true, fx: { freeze: 3, freezeMoab: true }, dmgType: 'normal' })); }),
      ],
    ],
  };

  T.glue = {
    name: 'Glue Gunner', cat: 'primary', cost: 275, key: 'y', r: 15,
    desc: 'Glue slows bloons down. Glued bloons are skipped so every shot counts.',
    base: { range: 46 * U, a: [A({ rate: 1, dmg: 0, speed: 700, sprite: 'glue', size: 7, dmgType: 'glue', skipGlued: true, fx: { glue: { slow: 0.5, dur: 11 } } })] },
    up: [
      [
        u('Glue Soak', 200, 'Glue soaks through all layers.', (s) => { m(s).fx.glue.soak = true; }),
        u('Corrosive Glue', 300, 'Glue dissolves bloons over time.', (s) => { Object.assign(m(s).fx.glue, { dot: 1, every: 2.3 }); }),
        u('Bloon Dissolver', 2500, 'Much stronger corrosion.', (s) => { Object.assign(m(s).fx.glue, { dot: 2, every: 0.6 }); m(s).pierce += 1; }),
        u('Bloon Liquefier', 5000, 'Liquefies bloons extremely fast.', (s) => { Object.assign(m(s).fx.glue, { dot: 1, every: 0.1 }); }),
        u('The Bloon Solver', 22000, 'Glue that melts everything, MOABs included.', (s) => { Object.assign(m(s).fx.glue, { dot: 3, every: 0.1, moab: true, moabDot: 3 }); m(s).rate *= 0.5; m(s).expl = { r: 30, dmg: 0, pierce: 8, dmgType: 'glue', fx: { glue: Object.assign({}, m(s).fx.glue) } }; }),
      ],
      [
        u('Bigger Globs', 100, 'Glue hits 2 bloons.', (s) => { m(s).pierce = 2; }),
        u('Glue Splatter', 1800, 'Glue splatters onto 6 bloons.', (s) => { m(s).pierce = 6; m(s).size = 12; }),
        u('Glue Hose', 3250, 'Shoots glue 3 times as fast.', (s) => { m(s).rate *= 0.33; }),
        u('Glue Strike', 3500, 'Ability: glues every bloon on screen, weakening them.', (s) => { s.ability = { name: 'Glue Strike', icon: 'gluestrike', cd: 30, fn: (G, t) => G.damageAll({ dmg: 0, dmgType: 'normal', fx: { glue: { slow: 0.5, dur: 10, dot: 1, every: 1, moab: true, bonus: 1 } }, color: '#d9ff7a' }, t) }; }),
        u('Glue Storm', 15000, 'A glue storm that slows and softens every bloon on screen.', (s) => { m(s).rate *= 0.6; s.ability = { name: 'Glue Storm', icon: 'gluestrike', cd: 20, fn: (G, t) => G.damageAll({ dmg: 0, dmgType: 'normal', fx: { glue: { slow: 0.3, dur: 15, dot: 2, every: 0.5, moab: true, bonus: 2 } }, color: '#d9ff7a' }, t) }; }),
      ],
      [
        u('Stickier Glue', 120, 'Glue lasts twice as long.', (s) => { m(s).fx.glue.dur = 24; }),
        u('Stronger Glue', 400, 'Glued bloons move even slower.', (s) => { m(s).fx.glue.slow = 0.32; }),
        u('MOAB Glue', 3400, 'Glue sticks to MOAB-class bloons.', (s) => { m(s).fx.glue.moab = true; }),
        u('Relentless Glue', 3000, 'Glue keeps sticking to everything nearby.', (s) => { m(s).fx.glue.soak = true; m(s).fx.glue.slow = 0.25; m(s).pierce += 2; }),
        u('Super Glue', 35000, 'Super glue stops MOAB-class bloons dead in their tracks.', (s) => { s.a.push(A({ rate: 5, dmg: 50, moab: 0, pierce: 1, speed: 800, sprite: 'glue', size: 10, onlyMoab: true, targetStrong: true, fx: { stun: 5, stunMoab: true }, dmgType: 'normal' })); }),
      ],
    ],
  };

  // ================= MILITARY =================
  T.sniper = {
    name: 'Sniper Monkey', cat: 'military', cost: 350, key: 'z', r: 15,
    desc: 'Shoots any bloon on the map, instantly.',
    base: { range: 9999, a: [A({ kind: 'hit', rate: 1.59, dmg: 2, dmgType: 'sharp' })] },
    up: [
      [
        u('Full Metal Jacket', 350, 'Bullets do 4 damage and pop Lead.', (s) => { m(s).dmg = 4; m(s).dmgType = 'normal'; }),
        u('Large Calibre', 1300, '7 damage per shot.', (s) => { m(s).dmg = 7; }),
        u('Deadly Precision', 2500, '20 damage, with bonus damage to ceramics.', (s) => { m(s).dmg = 20; m(s).ceram = 15; }),
        u('Maim MOAB', 5000, 'Stuns MOAB-class bloons it hits.', (s) => { m(s).fx = { stun: 3, stunMoab: true }; m(s).moab = 10; }),
        u('Cripple MOAB', 40000, 'Blimps are immobilized and take extra damage from everything.', (s) => { m(s).dmg = 30; m(s).moab = 30; m(s).fx = { stun: 7, stunMoab: true, brittle: { dur: 6, bonus: 5 } }; }),
      ],
      [
        u('Night Vision Goggles', 300, 'Detects Camo bloons and deals extra damage to them.', (s) => { s.camo = true; m(s).camoB = 2; }),
        u('Shrapnel Shot', 450, 'Hits throw out shrapnel.', (s) => { m(s).shrap = { count: 5, dmg: 1, pierce: 2 }; }),
        u('Bouncing Bullet', 3000, 'Bullets bounce to 3 more bloons.', (s) => { m(s).bounceN = 3; m(s).dmg += 1; }),
        u('Supply Drop', 7600, 'Ability: drops a crate of cash.', (s) => { s.ability = { name: 'Supply Drop', icon: 'supply', cd: 60, fn: (G, t) => { const n = 1500; G.addCash(n); G.fx.push({ k: 'cash', x: t.x, y: t.y - 30, t: 0, life: 1.4, n }); } }; }),
        u('Elite Sniper', 14000, 'Shoots much faster, and supply drops pay more.', (s) => { m(s).rate *= 0.5; m(s).dmg += 3; s.ability = { name: 'Elite Supply Drop', icon: 'supply', cd: 50, fn: (G, t) => { const n = 3000; G.addCash(n); G.fx.push({ k: 'cash', x: t.x, y: t.y - 30, t: 0, life: 1.4, n }); } }; }),
      ],
      [
        u('Fast Firing', 400, 'Shoots faster.', (s) => { m(s).rate *= 0.7; }),
        u('Even Faster Firing', 400, 'Shoots even faster.', (s) => { m(s).rate *= 0.7; }),
        u('Semi-Automatic', 3500, 'Attacks 3 times as fast.', (s) => { m(s).rate *= 0.33; }),
        u('Full Auto Rifle', 4750, 'Fully automatic, with bonus damage to MOABs.', (s) => { m(s).rate *= 0.5; m(s).moab += 2; }),
        u('Elite Defender', 14000, 'Fires extremely fast, and faster still as bloons get close to the exit.', (s) => { m(s).rate *= 0.5; m(s).dmg += 2; }),
      ],
    ],
  };

  T.sub = {
    name: 'Monkey Sub', cat: 'military', cost: 325, key: 'x', r: 16, water: true,
    desc: 'Water only. Fires homing darts. Can submerge to reveal Camo bloons.',
    base: { range: 42 * U, a: [A({ rate: 0.75, pierce: 2, speed: 800, move: 'seek', seek: 5 })] },
    up: [
      [
        u('Longer Range', 130, 'More range.', (s) => { s.range += 10 * U; }),
        u('Advanced Intel', 500, 'Detects Camo bloons and sees further.', (s) => { s.camo = true; s.range += 6 * U; }),
        u('Submerge and Support', 500, 'Submerged sub strips Camo from nearby bloons.', (s) => { s.a.push(A({ kind: 'aura', rate: 0.5, dmg: 0, pierce: 999, fx: { decamo: true }, color: 'rgba(80,200,255,0.25)', hitCamo: true, sound: false })); }),
        u('Bloontonium Reactor', 2500, 'Radioactive reactor damages every bloon nearby.', (s) => { s.a.push(A({ kind: 'aura', rate: 0.4, dmg: 1, pierce: 999, dmgType: 'energy', color: 'rgba(120,255,120,0.3)', hitCamo: true, sound: false })); }),
        u('Energizer', 32000, 'Reactor overload: huge radiation damage.', (s) => { s.a[s.a.length - 1] = A({ kind: 'aura', rate: 0.2, dmg: 6, moab: 6, pierce: 999, dmgType: 'normal', color: 'rgba(120,255,120,0.35)', hitCamo: true, sound: false }); m(s).dmg += 3; }),
      ],
      [
        u('Barbed Darts', 450, 'Darts pop 3 more bloons.', (s) => { m(s).pierce += 3; }),
        u('Heat-tipped Darts', 300, 'Hot darts pop Lead.', (s) => { m(s).dmgType = 'normal'; m(s).dmg += 1; }),
        u('Ballistic Missile', 1300, 'Launches heavy missiles at long range.', (s) => { s.a.push(A({ rate: 1.5, dmg: 0, speed: 600, move: 'seek', seek: 4, sprite: 'missile', size: 9, dmgType: 'explosion', expl: { r: 34, dmg: 3, pierce: 15, ceram: 2, moab: 2, dmgType: 'explosion' }, rangeMult: 1.4 })); }),
        u('First Strike Capability', 13000, 'Ability: a devastating missile at the strongest bloon.', (s) => { s.ability = { name: 'First Strike', icon: 'firststrike', cd: 60, needBloons: true, fn: (G, t) => G.strike(t, { dmg: 10000, expl: { r: 90, dmg: 300, pierce: 200, dmgType: 'normal' } }) }; }),
        u('Pre-emptive Strike', 29000, 'Every MOAB-class bloon gets hit by a missile the moment it appears.', (s) => { s.preempt = { dmg: 1500, dmgType: 'normal' }; s.ability = { name: 'First Strike', icon: 'firststrike', cd: 45, needBloons: true, fn: (G, t) => G.strike(t, { dmg: 10000, expl: { r: 90, dmg: 300, pierce: 200, dmgType: 'normal' } }) }; }),
      ],
      [
        u('Twin Guns', 450, 'Shoots twice as fast.', (s) => { m(s).rate *= 0.5; }),
        u('Airburst Darts', 1000, 'Darts burst into 3 on impact.', (s) => { m(s).burst = A({ pierce: 2, speed: 600, life: 0.3, count: 3 }); m(s).burst.count = 3; }),
        u('Triple Guns', 1100, 'Shoots even faster.', (s) => { m(s).rate *= 0.6; }),
        u('Armor Piercing Darts', 3000, 'Darts deal extra damage to MOABs and ceramics.', (s) => { m(s).dmg += 2; m(s).moab += 2; m(s).ceram = 2; m(s).dmgType = 'normal'; }),
        u('Sub Commander', 25000, 'Massive damage and buffs every sub in range.', (s) => { m(s).dmg += 6; m(s).moab += 6; s.buff = { only: isType('sub'), pierceMult: 2, dmg: 2, self: false }; }),
      ],
    ],
  };

  T.buccaneer = {
    name: 'Monkey Buccaneer', cat: 'military', cost: 500, key: 'c', r: 20, water: true,
    desc: 'Water only. Fires darts from both sides of the ship.',
    base: { range: 60 * U, a: [A({ rate: 1, pierce: 4, count: 2, spread: 0.12, speed: 760 })] },
    up: [
      [
        u('Faster Shooting', 350, 'Shoots faster.', (s) => { m(s).rate *= 0.75; }),
        u('Double Shot', 500, 'Fires 4 darts at a time.', (s) => { m(s).count = 4; }),
        u('Destroyer', 2850, 'Shoots extremely fast.', (s) => { m(s).rate *= 0.25; }),
        u('Aircraft Carrier', 7500, 'Launches fighter planes that patrol and shoot.', (s) => { s.a.push(A({ kind: 'radial', rate: 0.35, count: 6, pierce: 4, dmg: 1, speed: 700, rangeMult: 1.3, rotate: true, sound: false })); m(s).dmg += 1; }),
        u('Carrier Flagship', 90000, 'A floating fortress. Planes deal triple damage.', (s) => { s.a[s.a.length - 1].dmg = 3; s.a[s.a.length - 1].moab = 6; s.a[s.a.length - 1].dmgType = 'normal'; m(s).dmg += 3; s.buff = { rate: 0.85, self: false }; }),
      ],
      [
        u('Grape Shot', 500, 'Also fires a spread of grapes.', (s) => { s.a.push(A({ rate: 1, count: 5, spread: 0.12, pierce: 1, speed: 650, sprite: 'grape', size: 5 })); }),
        u('Hot Shot', 900, 'Grapes burn and pop Lead.', (s) => { const g = s.a[s.a.length - 1]; g.dmgType = 'fire'; g.fx = { burn: { dmg: 1, every: 1.25, dur: 3 } }; g.sprite = 'hotgrape'; }),
        u('Cannon Ship', 3900, 'Adds a cannon that fires explosive shells.', (s) => { s.a.push(A({ rate: 1.3, dmg: 0, speed: 600, sprite: 'bomb', size: 8, dmgType: 'explosion', expl: { r: 36, dmg: 2, pierce: 20, dmgType: 'explosion' } })); }),
        u('Monkey Pirates', 4500, 'Ability: harpoons a MOAB or BFB and drags it to its doom.', (s) => { s.ability = { name: 'Monkey Pirates', icon: 'harpoon', cd: 60, needBloons: true, fn: (G, t) => G.strike(t, { dmg: 2000, moabOnly: true, harpoon: 2, color: '#d9d9d9' }) }; }),
        u('Pirate Lord', 25000, 'Ability: harpoons up to 3 blimps, ZOMGs included.', (s) => { s.a.forEach((a) => { a.dmg += 1; a.moab = (a.moab || 0) + 4; }); s.ability = { name: 'Pirate Lord', icon: 'harpoon', cd: 60, needBloons: true, fn: (G, t) => G.strike(t, { dmg: 6000, moabOnly: true, harpoon: 3, count: 3, color: '#d9d9d9' }) }; }),
      ],
      [
        u('Long Range', 180, 'More range.', (s) => { s.range += 8 * U; }),
        u("Crow's Nest", 400, 'Lookout can spot Camo bloons.', (s) => { s.camo = true; }),
        u('Merchantman', 2300, 'Generates $200 at the end of each round.', (s) => { s.income = 200; }),
        u('Favored Trades', 5500, '$300 per round and better sell prices for nearby monkeys.', (s) => { s.income = 300; s.sellRate = 0.8; }),
        u('Trade Empire', 23000, '$500 per round, and buffs other merchant ships.', (s) => { s.income = 500; s.buff = { only: isType('buccaneer'), dmg: 1, moab: 2, self: false }; s.range = Math.max(s.range, 9999); }),
      ],
    ],
  };

  T.ace = {
    name: 'Monkey Ace', cat: 'military', cost: 800, key: 'v', r: 17,
    desc: 'Flies a loop and fires darts in 8 directions. Range is the whole map.',
    targets: ['Circle', 'Infinite', 'Figure Eight'],
    base: { range: 9999, mover: 'ace', moveSpeed: 230, a: [A({ kind: 'radial', rate: 1.68, count: 8, pierce: 5, speed: 650, life: 0.45, fromPlane: true })] },
    up: [
      [
        u('Rapid Fire', 650, 'Shoots darts faster.', (s) => { m(s).rate *= 0.7; }),
        u('Lots More Darts', 650, 'Shoots 12 darts per volley.', (s) => { m(s).count = 12; }),
        u('Fighter Plane', 1000, 'Adds homing missiles that hit MOABs hard.', (s) => { s.a.push(A({ rate: 1, count: 2, dmg: 0, speed: 600, move: 'seek', seek: 6, sprite: 'missile', size: 8, dmgType: 'explosion', expl: { r: 26, dmg: 2, pierce: 8, moab: 6, dmgType: 'explosion' } })); }),
        u('Operation: Dart Storm', 3000, '16 darts at twice the speed.', (s) => { m(s).count = 16; m(s).rate *= 0.5; }),
        u('Sky Shredder', 24000, 'Shreds the sky with darts that do 3 damage each.', (s) => { m(s).dmg = 3; m(s).pierce = 7; m(s).dmgType = 'normal'; m(s).rate *= 0.7; }),
      ],
      [
        u('Exploding Pineapple', 200, 'Drops pineapples that explode after a moment.', (s) => { s.a.push(A({ kind: 'drop', rate: 3, delay: 1.5, sprite: 'pineapple', expl: { r: 40, dmg: 1, pierce: 20, dmgType: 'explosion' }, noTarget: true, sound: false })); }),
        u('Spy Plane', 350, 'Detects Camo bloons.', (s) => { s.camo = true; }),
        u('Bomber Ace', 1600, 'Drops a stream of bombs on the track.', (s) => { s.a.push(A({ kind: 'drop', rate: 0.9, delay: 0.4, sprite: 'bomb', expl: { r: 44, dmg: 3, pierce: 25, moab: 4, dmgType: 'explosion' }, noTarget: true, sound: false })); }),
        u('Ground Zero', 16000, 'Ability: a massive bomb that hits every bloon on screen.', (s) => { s.ability = { name: 'Ground Zero', icon: 'nuke', cd: 60, fn: (G, t) => G.damageAll({ dmg: 700, dmgType: 'normal', color: '#ffe9a0' }, t) }; }),
        u('Tsar Bomba', 30000, 'Ability: destroys almost everything and stuns what survives.', (s) => { s.ability = { name: 'Tsar Bomba', icon: 'nuke', cd: 60, fn: (G, t) => G.damageAll({ dmg: 3000, dmgType: 'normal', fx: { stun: 8, stunMoab: true }, color: '#fff4c4' }, t) }; }),
      ],
      [
        u('Sharper Darts', 500, 'Darts pop 8 bloons.', (s) => { m(s).pierce += 3; }),
        u('Centered Path', 300, 'Flies a tighter path. More pierce.', (s) => { m(s).pierce += 2; }),
        u('Neva-Miss Targeting', 2200, 'Darts home in on bloons.', (s) => { m(s).move = 'seek'; m(s).seek = 6; m(s).life = 0.9; }),
        u('Spectre', 24000, 'Fires a constant stream of darts and bombs.', (s) => { s.a.push(A({ rate: 0.06, dmg: 2, pierce: 4, speed: 800, move: 'seek', seek: 6, life: 0.9, dmgType: 'normal', sound: false })); }),
        u('Flying Fortress', 100000, 'Four engines of destruction.', (s) => { s.a[s.a.length - 1].dmg = 5; s.a[s.a.length - 1].moab = 5; s.a[s.a.length - 1].count = 2; m(s).dmg += 3; }),
      ],
    ],
  };

  T.heli = {
    name: 'Heli Pilot', cat: 'military', cost: 1600, key: 'b', r: 18,
    desc: 'Flies to the bloons and shoots darts. Can follow your cursor or stay put.',
    targets: ['Pursuit', 'Lock in Place', 'Follow Cursor'],
    base: { range: 50 * U, mover: 'heli', moveSpeed: 200, a: [A({ rate: 0.57, count: 2, spread: 0.12, pierce: 3, speed: 900 })] },
    up: [
      [
        u('Quad Darts', 800, 'Shoots 4 darts.', (s) => { m(s).count = 4; }),
        u('Pursuit', 500, 'Flies much faster.', (s) => { s.moveSpeed *= 1.6; }),
        u('Razor Rotors', 1750, 'Rotor blades pop bloons underneath.', (s) => { s.a.push(A({ kind: 'aura', rate: 0.3, dmg: 2, pierce: 30, radius: 40, color: 'rgba(255,255,255,0.15)', sound: false })); }),
        u('Apache Dartship', 19600, 'Adds machine guns and rockets.', (s) => { s.a.push(A({ rate: 0.06, dmg: 1, pierce: 2, speed: 1100, jitter: 0.15, sprite: 'bullet', sound: false })); s.a.push(A({ rate: 1, count: 4, dmg: 0, speed: 600, move: 'seek', seek: 5, sprite: 'missile', size: 8, dmgType: 'explosion', expl: { r: 30, dmg: 3, pierce: 14, moab: 4, dmgType: 'explosion' } })); }),
        u('Apache Prime', 45000, 'Plasma weapons that pop everything.', (s) => { s.a.forEach((a) => { a.dmgType = 'normal'; a.dmg += 2; a.moab = (a.moab || 0) + 3; }); }),
      ],
      [
        u('Bigger Jets', 300, 'Flies faster.', (s) => { s.moveSpeed *= 1.3; }),
        u('IFR', 600, 'Detects Camo bloons.', (s) => { s.camo = true; }),
        u('Downdraft', 2300, 'Blows bloons back down the track.', (s) => { s.a.push(A({ kind: 'aura', rate: 1, dmg: 0, pierce: 6, radius: 70, fx: { knock: 160 }, color: 'rgba(220,240,255,0.3)', sound: false })); }),
        u('Support Chinook', 8500, 'Ability: drops cash and a few lives.', (s) => { s.ability = { name: 'Support Chinook', icon: 'chinook', cd: 60, fn: (G, t) => { G.addCash(1000); G.lives += 25; G.fx.push({ k: 'cash', x: t.heli.x, y: t.heli.y - 30, t: 0, life: 1.4, n: 1000 }); } }; }),
        u('Special Poperations', 35000, 'Drops an elite marine and gives more cash and lives.', (s) => { s.a.push(A({ kind: 'hit', rate: 0.12, dmg: 5, moab: 5, dmgType: 'normal', range: 160, sound: false })); s.ability = { name: 'Special Poperations', icon: 'chinook', cd: 50, fn: (G, t) => { G.addCash(3000); G.lives += 50; G.fx.push({ k: 'cash', x: t.heli.x, y: t.heli.y - 30, t: 0, life: 1.4, n: 3000 }); } }; }),
      ],
      [
        u('Faster Darts', 250, 'Darts fly faster.', (s) => { m(s).speed *= 1.4; m(s).pierce += 1; }),
        u('Faster Firing', 350, 'Shoots faster.', (s) => { m(s).rate *= 0.8; }),
        u('MOAB Shove', 3000, 'Pushes MOABs and BFBs backwards.', (s) => { s.a.push(A({ kind: 'aura', rate: 0.1, dmg: 0, pierce: 3, radius: 60, onlyMoab: true, fx: { knock: 4, knockMoab: true }, color: 'rgba(255,255,255,0)', sound: false })); }),
        u('Comanche Defense', 8500, 'Calls in mini comanches when things get busy.', (s) => { m(s).count += 4; m(s).dmg += 1; }),
        u('Comanche Commander', 35000, 'A squadron of comanches with lots of firepower.', (s) => { m(s).count += 4; m(s).dmg += 3; m(s).moab = 4; m(s).dmgType = 'normal'; }),
      ],
    ],
  };

  T.mortar = {
    name: 'Mortar Monkey', cat: 'military', cost: 750, key: 'n', r: 17,
    desc: 'Lobs explosive shells anywhere on the map.',
    targets: ['Strong', 'First', 'Set Target'],
    base: { range: 9999, a: [A({ kind: 'mortar', rate: 2, dmg: 0, acc: 30, dmgType: 'explosion', expl: { r: 22 * U * 0.9, dmg: 1, pierce: 40, dmgType: 'explosion' } })] },
    up: [
      [
        u('Bigger Blast', 500, 'Bigger explosions.', (s) => { m(s).expl.r *= 1.25; m(s).expl.pierce += 14; }),
        u('Bloon Buster', 650, 'Pops 2 layers.', (s) => { m(s).expl.dmg += 1; }),
        u('Shell Shock', 1100, 'Stunning shockwaves.', (s) => { m(s).expl.fx = { stun: 1 }; m(s).expl.dmg += 1; }),
        u('The Big One', 8000, 'Massive explosions.', (s) => { m(s).expl.r *= 1.5; m(s).expl.dmg += 3; m(s).expl.pierce += 60; }),
        u('The Biggest One', 28000, 'Gigantic explosions that wreck blimps.', (s) => { m(s).expl.r *= 1.4; m(s).expl.dmg += 15; m(s).expl.moab = 20; m(s).expl.pierce += 100; }),
      ],
      [
        u('Faster Reload', 300, 'Reloads faster.', (s) => { m(s).rate *= 0.75; }),
        u('Rapid Reload', 500, 'Reloads even faster.', (s) => { m(s).rate *= 0.7; }),
        u('Heavy Shells', 900, 'Shells do extra damage to ceramics and fortified bloons.', (s) => { m(s).expl.ceram = 1; m(s).expl.fort = 1; m(s).expl.dmg += 1; }),
        u('Artillery Battery', 5500, 'Three barrels fire three times as fast.', (s) => { m(s).rate *= 0.33; }),
        u('Pop and Awe', 30000, 'Ability: every bloon on screen is blasted and stunned.', (s) => { m(s).rate *= 0.6; s.ability = { name: 'Pop and Awe', icon: 'popawe', cd: 60, fn: (G, t) => G.damageAll({ dmg: 20, dmgType: 'normal', fx: { stun: 8, stunMoab: true }, color: '#ffd9a0' }, t) }; }),
      ],
      [
        u('Increased Accuracy', 200, 'Shells land closer to the target.', (s) => { m(s).acc = 8; }),
        u('Burny Stuff', 500, 'Explosions set bloons on fire.', (s) => { m(s).expl.fx = Object.assign(m(s).expl.fx || {}, { burn: { dmg: 1, every: 1.25, dur: 3.5 } }); }),
        u('Signal Flare', 900, 'Removes Camo from bloons and detects them.', (s) => { s.camo = true; m(s).expl.fx = Object.assign(m(s).expl.fx || {}, { decamo: true }); }),
        u('Shattering Shells', 11000, 'Strips Fortified and Regrow and hits hard.', (s) => { m(s).expl.fx = Object.assign(m(s).expl.fx || {}, { defort: true, degrow: true }); m(s).expl.dmg += 2; m(s).expl.moab = (m(s).expl.moab || 0) + 5; }),
        u('Blooncineration', 40000, 'Leaves a burning field behind each shell.', (s) => { m(s).expl.dmg += 3; s.a.push(A({ kind: 'patch', rate: 2, dmg: 4, moab: 4, pierce: 60, radius: 55, life: 4, every: 0.2, dmgType: 'normal', color: '#ff6a00', fx: { decamo: true, degrow: true }, targetStrong: true, sound: false })); }),
      ],
    ],
  };

  T.dartling = {
    name: 'Dartling Gunner', cat: 'military', cost: 850, key: 'm', r: 17,
    desc: 'Rapid-fire gun that shoots toward your cursor.',
    targets: ['Follow Cursor', 'Locked', 'First'],
    base: { range: 9999, aimCursor: true, a: [A({ rate: 0.2, pierce: 1, speed: 1000, jitter: 0.35, lifeDist: 900, sound: 'tick' })] },
    up: [
      [
        u('Focused Firing', 250, 'Tighter spread.', (s) => { m(s).jitter = 0.15; }),
        u('Laser Shock', 1200, 'Shocking lasers pop through more.', (s) => { Object.assign(m(s), { sprite: 'laser', dmgType: 'energy', pierce: 2, fx: { burn: { dmg: 1, every: 1, dur: 2 } } }); }),
        u('Laser Cannon', 3000, 'Powerful lasers with 13 pierce.', (s) => { Object.assign(m(s), { pierce: 13, dmgType: 'plasma', sprite: 'laser', size: 9 }); }),
        u('Plasma Accelerator', 11000, 'A continuous plasma beam.', (s) => { s.a[0] = A({ kind: 'beam', rate: 0.2, dmg: 4, pierce: 100, width: 10, len: 1300, dmgType: 'plasma', color: '#ff4bff', sound: false }); }),
        u('Ray of Doom', 85000, 'The Ray of Doom. Annihilates everything in a line.', (s) => { s.a[0] = A({ kind: 'beam', rate: 0.05, dmg: 20, moab: 10, pierce: 400, width: 16, len: 1300, dmgType: 'normal', color: '#ff2020', sound: false }); }),
      ],
      [
        u('Advanced Targeting', 300, 'Darts curve toward bloons, and it detects Camo.', (s) => { s.camo = true; m(s).move = 'seek'; m(s).seek = 3; }),
        u('Faster Barrel Spin', 950, 'Shoots much faster.', (s) => { m(s).rate *= 0.6; }),
        u('Hydra Rocket Pods', 6000, 'Fires explosive rockets.', (s) => { Object.assign(m(s), { sprite: 'missile', dmg: 0, size: 8, dmgType: 'explosion', expl: { r: 26, dmg: 2, pierce: 8, dmgType: 'explosion' } }); }),
        u('Rocket Storm', 6000, 'Ability: a storm of rockets for 9 seconds.', (s) => { s.ability = { name: 'Rocket Storm', icon: 'rocket', cd: 40, fn: (G, t) => G.boost(t, { dur: 9, extra: A({ rate: 0.05, dmg: 0, speed: 600, move: 'seek', seek: 6, sprite: 'missile', size: 8, dmgType: 'explosion', expl: { r: 30, dmg: 4, pierce: 12, dmgType: 'normal' }, noTarget: false, sound: false }) }) }; }),
        u('M.A.D.', 58000, 'Missiles that massacre MOAB-class bloons.', (s) => { m(s).expl.moab = 40; m(s).expl.dmg += 4; s.a.push(A({ rate: 0.5, dmg: 0, speed: 700, move: 'seek', seek: 5, sprite: 'bigmissile', size: 12, onlyMoab: true, targetStrong: true, dmgType: 'explosion', expl: { r: 50, dmg: 50, moab: 200, pierce: 10, dmgType: 'normal' } })); }),
      ],
      [
        u('Faster Swivel', 150, 'Turns faster and pierces 1 more.', (s) => { m(s).pierce += 1; }),
        u('Powerful Darts', 1200, 'Darts fly faster and pop Lead.', (s) => { m(s).speed *= 1.5; m(s).pierce += 2; m(s).dmgType = 'normal'; }),
        u('Buckshot', 5000, 'Fires a spread of 6 heavy bullets.', (s) => { m(s).count = 6; m(s).spread = 0.1; m(s).dmg = 3; m(s).rate *= 2; m(s).fx = { knock: 6 }; }),
        u('Bloon Area Denial System', 21000, 'Auto-aims and fires from four guns.', (s) => { s.aimCursor = false; m(s).jitter = 0.05; m(s).count = 4; m(s).rate *= 0.5; m(s).dmg += 1; s.range = 60 * U; }),
        u('Bloon Exclusion Zone', 110000, 'Total exclusion: eight guns of doom.', (s) => { m(s).count = 8; m(s).dmg += 4; m(s).moab = 4; s.range = 80 * U; }),
      ],
    ],
  };

  // ================= MAGIC =================
  T.wizard = {
    name: 'Wizard Monkey', cat: 'magic', cost: 375, key: 'a', r: 15,
    desc: 'Casts magic bolts that pop several bloons. Can\'t pop Purple.',
    base: { range: 40 * U, a: [A({ rate: 1.1, pierce: 3, speed: 520, dmgType: 'energy', sprite: 'magic', size: 8 })] },
    up: [
      [
        u('Guided Magic', 150, 'Bolts home in on bloons.', (s) => { m(s).move = 'seek'; m(s).seek = 6; s.range += 4 * U; }),
        u('Arcane Blast', 600, 'Bolts pop 2 layers.', (s) => { m(s).dmg = 2; }),
        u('Arcane Mastery', 1300, 'Much faster bolts with more pierce and range.', (s) => { m(s).rate *= 0.5; m(s).pierce += 4; s.range += 6 * U; }),
        u('Arcane Spike', 10900, 'Bolts deal big damage to MOAB-class bloons.', (s) => { m(s).dmg = 5; m(s).moab = 10; m(s).sprite = 'spike'; }),
        u('Archmage', 32000, 'Master of all magic: faster bolts plus fireballs and dragon\'s breath.', (s) => { m(s).dmg = 8; m(s).rate *= 0.6; m(s).dmgType = 'normal'; s.camo = true; if (!s.a.some((a) => a.sprite === 'fireball')) s.a.push(A({ rate: 1.2, dmg: 0, speed: 500, sprite: 'fireball', size: 9, dmgType: 'fire', expl: { r: 36, dmg: 4, pierce: 20, dmgType: 'fire', color: '#ff7a1a' } })); }),
      ],
      [
        u('Fireball', 300, 'Also casts explosive fireballs.', (s) => { s.a.push(A({ rate: 2.2, dmg: 0, speed: 500, sprite: 'fireball', size: 9, dmgType: 'fire', expl: { r: 30, dmg: 1, pierce: 10, dmgType: 'fire', color: '#ff7a1a' } })); }),
        u('Wall of Fire', 900, 'Creates walls of fire on the track.', (s) => { s.a.push(A({ kind: 'patch', rate: 5.5, dmg: 1, pierce: 15, radius: 28, life: 4.5, every: 0.2, dmgType: 'fire', color: '#ff7a1a', sound: false })); }),
        u("Dragon's Breath", 3000, 'Breathes a constant stream of fire.', (s) => { s.a.push(A({ rate: 0.1, dmg: 1, pierce: 4, speed: 380, jitter: 0.25, sprite: 'flame', size: 10, life: 0.35, dmgType: 'fire', fx: { burn: { dmg: 1, every: 1, dur: 2 } }, sound: false })); }),
        u('Summon Phoenix', 4000, 'Ability: summons a blazing phoenix for 20 seconds.', (s) => { s.ability = { name: 'Summon Phoenix', icon: 'phoenix', cd: 45, fn: (G, t) => G.boost(t, { dur: 20, phoenix: true, extra: A({ kind: 'radial', rate: 0.1, count: 4, rotate: true, dmg: 2, pierce: 5, speed: 500, sprite: 'flame', size: 10, dmgType: 'fire', lifeDist: 700, fromTower: true, sound: false }) }) }; }),
        u('Wizard Lord Phoenix', 54000, 'A permanent Phoenix, and an even bigger one on demand.', (s) => { s.a.push(A({ kind: 'radial', rate: 0.12, count: 4, rotate: true, dmg: 3, moab: 3, pierce: 8, speed: 500, sprite: 'flame', size: 10, dmgType: 'normal', lifeDist: 800, sound: false })); s.ability = { name: 'Lord Phoenix', icon: 'phoenix', cd: 40, fn: (G, t) => G.boost(t, { dur: 20, phoenix: true, extra: A({ kind: 'radial', rate: 0.05, count: 8, rotate: true, dmg: 10, moab: 10, pierce: 20, speed: 520, sprite: 'flame', size: 12, dmgType: 'normal', lifeDist: 900, sound: false }) }) }; }),
      ],
      [
        u('Intense Magic', 300, 'Bolts are faster and pop more.', (s) => { m(s).pierce += 2; m(s).speed *= 1.3; m(s).dmg += 1; }),
        u('Monkey Sense', 300, 'Detects Camo bloons.', (s) => { s.camo = true; }),
        u('Shimmer', 1700, 'Strips Camo from all bloons in range.', (s) => { s.a.push(A({ kind: 'aura', rate: 2.5, dmg: 0, pierce: 300, fx: { decamo: true }, color: 'rgba(200,150,255,0.3)', hitCamo: true, sound: false })); }),
        u('Necromancer: Unpopped Army', 2200, 'Raises popped bloons as zombies that march back up the track.', (s) => { s.a.push(A({ kind: 'zombie', rate: 0.6, dmg: 1, pierce: 10, speed: 70, sprite: 'zombie', sound: false })); }),
        u('Prince of Darkness', 24000, 'Zombie MOABs and much stronger undead.', (s) => { const z = s.a[s.a.length - 1]; z.dmg = 4; z.pierce = 40; z.moab = 6; z.dmgType = 'normal'; s.a.push(A({ kind: 'zombie', rate: 3, dmg: 20, moab: 40, pierce: 100, speed: 50, sprite: 'zmoab', dmgType: 'normal', sound: false })); }),
      ],
    ],
  };

  T.super = {
    name: 'Super Monkey', cat: 'magic', cost: 2500, key: 's', r: 17,
    desc: 'Throws a constant stream of darts. Insanely fast.',
    base: { range: 50 * U, a: [A({ rate: 0.045, pierce: 1, speed: 1100, sound: 'tick' })] },
    up: [
      [
        u('Laser Blasts', 2500, 'Lasers pop 2 bloons each.', (s) => { Object.assign(m(s), { pierce: 2, dmgType: 'energy', sprite: 'laser' }); }),
        u('Plasma Blasts', 4500, 'Plasma pops 2 layers through 3 bloons.', (s) => { Object.assign(m(s), { pierce: 3, dmg: 2, dmgType: 'plasma', sprite: 'plasma' }); }),
        u('Sun Avatar', 20000, 'Fires sun beams that pop almost anything.', (s) => { Object.assign(m(s), { kind: 'proj', count: 3, spread: 0.12, dmg: 5, pierce: 10, dmgType: 'normal', sprite: 'sun', size: 10 }); m(s).rate *= 1.4; }),
        u('Sun Temple', 100000, 'A temple of the sun. Devastating sun beams.', (s) => { Object.assign(m(s), { count: 5, dmg: 15, pierce: 25, moab: 15 }); s.range += 15 * U; }),
        u('True Sun God', 500000, 'Ascended to godhood.', (s) => { Object.assign(m(s), { dmg: 50, pierce: 50, moab: 50 }); m(s).rate *= 0.6; s.camo = true; }),
      ],
      [
        u('Super Range', 1000, 'More range.', (s) => { s.range += 12 * U; }),
        u('Epic Range', 1400, 'Even more range and faster darts.', (s) => { s.range += 10 * U; m(s).speed *= 1.2; }),
        u('Robo Monkey', 5500, 'Robot arms: two attacks at once.', (s) => { m(s).count = 2; m(s).spread = 0.25; m(s).dmg += 1; }),
        u('Tech Terror', 25000, 'Ability: annihilates every bloon in range.', (s) => { m(s).dmg += 2; s.ability = { name: 'Annihilation', icon: 'annihilate', cd: 45, fn: (G, t) => G.damageAll({ dmg: 1000, dmgType: 'normal', range: G.range(t) * 1.2, color: '#ff4040' }, t) }; }),
        u('The Anti-Bloon', 90000, 'Ability: global annihilation.', (s) => { m(s).dmg += 6; m(s).moab = 10; s.ability = { name: 'Eradication', icon: 'annihilate', cd: 45, fn: (G, t) => G.damageAll({ dmg: 2500, dmgType: 'normal', color: '#ff4040' }, t) }; }),
      ],
      [
        u('Knockback', 3000, 'Darts knock bloons back.', (s) => { m(s).fx = { knock: 6, knockMoab: true }; }),
        u('Ultravision', 1200, 'Detects Camo bloons and sees further.', (s) => { s.camo = true; s.range += 6 * U; }),
        u('Dark Knight', 5500, 'Dark blades deal extra damage to MOABs and pop everything.', (s) => { Object.assign(m(s), { dmg: 2, moab: 2, dmgType: 'normal', sprite: 'darkblade', pierce: 3 }); }),
        u('Dark Champion', 60000, 'Dark blades shred MOABs.', (s) => { Object.assign(m(s), { dmg: 6, moab: 8, pierce: 6 }); }),
        u('Legend of the Night', 240000, 'Ability: opens a black hole that consumes bloons.', (s) => { Object.assign(m(s), { dmg: 12, moab: 20, pierce: 10 }); s.ability = { name: 'Black Hole', icon: 'blackhole', cd: 90, fn: (G, t) => G.damageAll({ dmg: 10000, dmgType: 'normal', fx: { stun: 10, stunMoab: true }, color: '#1a0026' }, t) }; }),
      ],
    ],
  };

  T.ninja = {
    name: 'Ninja Monkey', cat: 'magic', cost: 500, key: 'd', r: 15,
    desc: 'Throws seeking shurikens fast. Detects Camo bloons.',
    base: { range: 40 * U, camo: true, a: [A({ rate: 0.7, pierce: 2, speed: 800, move: 'seek', seek: 3, sprite: 'shuriken', spin: 20 })] },
    up: [
      [
        u('Ninja Discipline', 300, 'Throws faster with more range.', (s) => { m(s).rate *= 0.6; s.range += 7 * U; }),
        u('Sharp Shurikens', 350, 'Shurikens pop 4 bloons.', (s) => { m(s).pierce = 4; }),
        u('Double Shot', 850, 'Throws 2 shurikens.', (s) => { m(s).count = 2; }),
        u('Bloonjitsu', 2750, 'Throws 5 shurikens.', (s) => { m(s).count = 5; }),
        u('Grandmaster Ninja', 35000, '8 shurikens at a ridiculous rate.', (s) => { m(s).count = 8; m(s).rate *= 0.5; m(s).dmg = 2; }),
      ],
      [
        u('Distraction', 350, 'Some bloons get knocked back.', (s) => { m(s).fx = { knock: 60, knockChance: 0.15 }; }),
        u('Counter-Espionage', 500, 'Strips Camo from bloons it hits.', (s) => { m(s).fx = Object.assign(m(s).fx || {}, { decamo: true }); m(s).pierce += 1; }),
        u('Shinobi Tactics', 900, 'Boosts all Ninjas in range.', (s) => { s.buff = { only: isType('ninja'), rate: 0.92, pierceMult: 1.08 }; }),
        u('Bloon Sabotage', 5200, 'Ability: all bloons move at half speed for 15 seconds.', (s) => { s.ability = { name: 'Bloon Sabotage', icon: 'sabotage', cd: 60, fn: (G) => { G.sabotage = 15; } }; }),
        u('Grand Saboteur', 22000, 'Sabotage also weakens new MOAB-class bloons.', (s) => { m(s).dmg += 2; s.ability = { name: 'Grand Sabotage', icon: 'sabotage', cd: 60, fn: (G) => { G.sabotage = 25; G.sabotageMoab = 25; } }; }),
      ],
      [
        u('Seeking Shuriken', 250, 'Shurikens seek bloons hard.', (s) => { m(s).seek = 8; }),
        u('Caltrops', 400, 'Drops caltrops on the track.', (s) => { s.a.push(A({ kind: 'spikes', rate: 4.4, pierce: 6, sprite: 'caltrops', life: 35 })); }),
        u('Flash Bomb', 2750, 'Throws flash bombs that stun groups of bloons.', (s) => { s.a.push(A({ rate: 2.8, dmg: 0, speed: 600, sprite: 'flashbomb', size: 8, dmgType: 'explosion', expl: { r: 50, dmg: 1, pierce: 50, dmgType: 'normal', fx: { stun: 1 }, color: '#ffffff' } })); }),
        u('Sticky Bomb', 4500, 'Sticks bombs on MOABs that explode for big damage.', (s) => { s.a.push(A({ kind: 'hit', rate: 4, dmg: 500, onlyMoab: true, targetStrong: true, dmgType: 'normal', color: '#ff4040', sound: false })); }),
        u('Master Bomber', 40000, 'Sticky bombs for everything, and huge ones for blimps.', (s) => { const sb = s.a[s.a.length - 1]; sb.dmg = 4000; sb.rate = 1; s.a.forEach((a) => { if (a.sprite === 'flashbomb') { a.expl.dmg = 10; a.rate = 1; } }); }),
      ],
    ],
  };

  T.alchemist = {
    name: 'Alchemist', cat: 'magic', cost: 550, key: 'f', r: 15,
    desc: 'Throws acid potions and brews buffs for nearby monkeys.',
    base: { range: 45 * U, a: [A({ rate: 2, dmg: 0, speed: 500, sprite: 'potion', size: 8, dmgType: 'normal', spin: 10, expl: { r: 26, dmg: 1, pierce: 15, dmgType: 'normal', fx: { acid: { dmg: 1, every: 1.5, dur: 4.5 } }, color: '#79ff4b' } })] },
    up: [
      [
        u('Larger Potions', 250, 'Bigger splash.', (s) => { m(s).expl.r *= 1.3; m(s).expl.pierce += 10; }),
        u('Acidic Mixture Dip', 350, 'Coats a nearby monkey\'s attacks in acid: extra damage to MOABs and ceramics.', (s) => { s.a.push(A({ kind: 'brew', rate: 4, brew: { dur: 12, moab: 1, dmg: 0 }, sound: false })); }),
        u('Berserker Brew', 1250, 'Brews that make monkeys stronger, faster and see further.', (s) => { s.a[s.a.length - 1].brew = { dur: 14, dmg: 1, pierce: 2, rate: 0.85, range: 1.1, moab: 1 }; }),
        u('Stronger Stimulant', 3000, 'Stronger brews that last longer.', (s) => { s.a[s.a.length - 1].brew = { dur: 25, dmg: 1, pierce: 3, rate: 0.8, range: 1.15, moab: 2 }; s.a[s.a.length - 1].rate = 2; }),
        u('Permanent Brew', 60000, 'Brews last forever.', (s) => { s.a[s.a.length - 1].brew = { dur: 1e9, dmg: 2, pierce: 4, rate: 0.75, range: 1.2, moab: 3 }; s.a[s.a.length - 1].rate = 1; }),
      ],
      [
        u('Stronger Acid', 250, 'Acid dissolves bloons faster.', (s) => { m(s).expl.fx.acid = { dmg: 1, every: 1, dur: 5 }; }),
        u('Perishing Potions', 475, 'Potions deal extra damage to MOABs.', (s) => { m(s).expl.moab = 10; m(s).expl.ceram = 3; }),
        u('Unstable Concoction', 3000, 'Hurls unstable potions at MOABs that blow up.', (s) => { s.a.push(A({ rate: 6, dmg: 0, speed: 500, sprite: 'potion', size: 10, onlyMoab: true, targetStrong: true, expl: { r: 50, dmg: 200, moab: 200, pierce: 30, dmgType: 'normal', color: '#7aff4b' } })); }),
        u('Transforming Tonic', 4500, 'Ability: becomes a laser-shooting monster for 20 seconds.', (s) => { s.ability = { name: 'Transforming Tonic', icon: 'tonic', cd: 60, fn: (G, t) => G.boost(t, { dur: 20, tonic: true, extra: A({ kind: 'beam', rate: 0.06, dmg: 5, pierce: 10, width: 6, len: 300, dmgType: 'normal', color: '#a0ff40', sound: false }) }) }; }),
        u('Total Transformation', 45000, 'Ability: transforms up to 5 nearby monkeys into monsters.', (s) => { s.ability = { name: 'Total Transformation', icon: 'tonic', cd: 40, fn: (G, t) => { const list = G.towers.filter((x) => !x.temp && Math.hypot(x.x - t.x, x.y - t.y) < G.range(t) * 1.5).sort((p, q) => q.spent - p.spent).slice(0, 5); list.push(t); for (const x of list) G.boost(x, { dur: 20, tonic: true, extra: A({ kind: 'beam', rate: 0.05, dmg: 10, moab: 10, pierce: 20, width: 8, len: 350, dmgType: 'normal', color: '#a0ff40', sound: false }) }); } }; }),
      ],
      [
        u('Faster Throwing', 650, 'Throws faster.', (s) => { m(s).rate *= 0.75; }),
        u('Acid Pool', 450, 'Leaves acid pools on the track.', (s) => { s.a.push(A({ kind: 'patch', rate: 3, dmg: 1, pierce: 15, radius: 24, life: 6, every: 0.5, dmgType: 'normal', color: '#7aff4b', sound: false })); }),
        u('Lead to Gold', 1000, 'Lead bloons pop into $50.', (s) => { s.leadGold = 50; m(s).lead = 1; }),
        u('Rubber to Gold', 2750, 'Bloons hit turn golden and give double cash.', (s) => { m(s).expl.fx.gold = true; s.leadGold = 80; }),
        u('Bloon Master Alchemist', 40000, 'Shrinks bloons, even MOABs and BFBs, down to Reds.', (s) => { s.a.push(A({ rate: 2, dmg: 0, speed: 500, sprite: 'potion', size: 10, targetStrong: true, expl: { r: 30, dmg: 0, pierce: 6, dmgType: 'normal', fx: { shrink: true, shrinkMax: 2 }, color: '#ffd84b' } })); }),
      ],
    ],
  };

  T.druid = {
    name: 'Druid', cat: 'magic', cost: 425, key: 'g', r: 15,
    desc: 'Throws a spread of thorns. Can call on storms and vines.',
    base: { range: 35 * U, a: [A({ rate: 1.1, count: 5, spread: 0.12, pierce: 1, speed: 700, sprite: 'thorn' })] },
    up: [
      [
        u('Hard Thorns', 250, 'Thorns pop 2 bloons and pop Lead.', (s) => { m(s).pierce = 2; m(s).dmgType = 'normal'; }),
        u('Heart of Thunder', 1000, 'Calls chain lightning.', (s) => { s.a.push(A({ kind: 'chain', rate: 2.3, dmg: 1, pierce: 14, jump: 100, dmgType: 'energy', color: '#cfe8ff', sound: 'zap' })); }),
        u('Druid of the Storm', 1650, 'Whirlwinds blow bloons back.', (s) => { s.a.push(A({ rate: 2.5, dmg: 0, pierce: 30, speed: 280, sprite: 'tornado', size: 18, fx: { knock: 140 }, lifeDist: 500, dmgType: 'normal', sound: false })); }),
        u('Ball Lightning', 4500, 'Balls of lightning that zap everything nearby.', (s) => { s.a.push(A({ kind: 'chain', rate: 1.3, dmg: 3, pierce: 30, jump: 130, dmgType: 'energy', color: '#ffffff', sound: 'zap' })); }),
        u('Superstorm', 70000, 'A vast storm that blows back blimps.', (s) => { s.a.forEach((a) => { if (a.sprite === 'tornado') { a.dmg = 50; a.moab = 50; a.fx = { knock: 200, knockMoab: true }; a.size = 26; a.rate = 1.5; } if (a.kind === 'chain') { a.dmg += 10; } }); }),
      ],
      [
        u('Thorn Swarm', 250, 'Throws 8 thorns.', (s) => { m(s).count = 8; }),
        u('Heart of Oak', 350, 'Thorns strip Regrow.', (s) => { m(s).fx = { degrow: true }; }),
        u('Druid of the Jungle', 950, 'Vines grab bloons from the ground.', (s) => { s.a.push(A({ kind: 'hit', rate: 1.6, dmg: 6, dmgType: 'normal', targetStrong: true, color: '#3fbf2a', sound: false })); }),
        u("Jungle's Bounty", 5000, 'Ability: harvests cash from the jungle.', (s) => { s.income = 100; s.ability = { name: "Jungle's Bounty", icon: 'bounty', cd: 60, fn: (G, t) => { G.addCash(500); G.fx.push({ k: 'cash', x: t.x, y: t.y - 30, t: 0, life: 1.4, n: 500 }); } }; }),
        u('Spirit of the Forest', 35000, 'Thorny vines grow along the whole track. $3000 per round.', (s) => { s.income = 3000; s.a.push(A({ kind: 'aura', rate: 0.5, dmg: 2, moab: 4, pierce: 400, radius: 2000, dmgType: 'normal', hitCamo: true, color: 'rgba(0,0,0,0)', sound: false })); }),
      ],
      [
        u('Druidic Reach', 100, 'More range.', (s) => { s.range += 8 * U; }),
        u('Heart of Vengeance', 300, 'Attacks faster.', (s) => { m(s).rate *= 0.85; }),
        u('Druid of Wrath', 600, 'Attacks faster the more bloons it pops.', (s) => { s.wrath = true; }),
        u('Poplust', 2500, 'Nearby Druids boost each other.', (s) => { s.buff = { only: isType('druid'), pierceMult: 1.15, rate: 0.85 }; }),
        u('Avatar of Wrath', 45000, 'A towering avatar that grows stronger with more bloons on screen.', (s) => { m(s).dmg += 4; m(s).moab = 6; m(s).count = 10; m(s).dmgType = 'normal'; }),
      ],
    ],
  };

  // ================= SUPPORT =================
  T.farm = {
    name: 'Banana Farm', cat: 'support', cost: 1250, key: 'h', r: 20,
    desc: 'Grows bananas each round. Collect them for cash.',
    targets: [],
    base: { range: 30 * U, bananas: { n: 4, val: 20 }, a: [] },
    up: [
      [
        u('Increased Production', 500, '6 bananas per round.', (s) => { s.bananas.n = 6; }),
        u('Greater Production', 600, '8 bananas per round.', (s) => { s.bananas.n = 8; }),
        u('Banana Plantation', 3000, '16 bananas per round.', (s) => { s.bananas.n = 16; }),
        u('Banana Research Facility', 19000, 'Crates of bananas worth $300 each.', (s) => { s.bananas = { n: 5, val: 300, crate: true, life: s.bananas.life }; }),
        u('Banana Central', 100000, 'Huge crates worth $1200 each.', (s) => { s.bananas.val = 1200; }),
      ],
      [
        u('Long Life Bananas', 300, 'Bananas last twice as long.', (s) => { s.bananas.life = 30; }),
        u('Valuable Bananas', 800, 'Bananas are worth 25% more.', (s) => { s.bananas.val = Math.round(s.bananas.val * 1.25); }),
        u('Monkey Bank', 3500, 'Cash goes into a bank that earns 15% interest each round.', (s) => { s.bank = 0; s.bankCap = 7000; s.bananas.val = Math.round(s.bananas.val * 1.1); }),
        u('IMF Loan', 7500, 'Ability: borrow $10,000.', (s) => { s.bankCap = 10000; s.ability = { name: 'IMF Loan', icon: 'loan', cd: 90, fn: (G, t) => { G.addCash(10000); G.fx.push({ k: 'cash', x: t.x, y: t.y - 30, t: 0, life: 1.4, n: 10000 }); } }; }),
        u('Monkey-Nomics', 100000, 'Ability: $10,000 free, every 60 seconds.', (s) => { s.bankCap = 14000; s.interest = 0.2; s.ability = { name: 'Monkey-Nomics', icon: 'loan', cd: 60, fn: (G, t) => { G.addCash(10000); G.fx.push({ k: 'cash', x: t.x, y: t.y - 30, t: 0, life: 1.4, n: 10000 }); } }; }),
      ],
      [
        u('EZ Collect', 250, 'Bananas collect themselves.', (s) => { s.autoCollect = true; }),
        u('Banana Salvage', 200, 'Sells for 90%.', (s) => { s.sellRate = 0.9; }),
        u('Marketplace', 2900, 'Sells 16 bananas a round straight to your bank.', (s) => { s.market = true; s.bananas.n = 16; s.bananas.val = 20; }),
        u('Central Market', 15000, 'Big market income and boosts nearby merchants.', (s) => { s.bananas.val = 70; s.buff = { only: isType('buccaneer'), dmg: 1, self: false }; }),
        u('Monkey Wall Street', 60000, '$4000 extra at the end of every round.', (s) => { s.income = 4000; s.bananas.val = 100; }),
      ],
    ],
  };

  T.spike = {
    name: 'Spike Factory', cat: 'support', cost: 1000, key: 'j', r: 18,
    desc: 'Lays piles of spikes on the track. Great last line of defence.',
    targets: ['Normal', 'Close', 'Far', 'Smart'],
    base: { range: 34 * U, a: [A({ kind: 'spikes', rate: 1.75, pierce: 5, life: 40, sound: false })] },
    up: [
      [
        u('Bigger Stacks', 800, 'Spike piles pop 10 bloons.', (s) => { m(s).pierce = 10; }),
        u('White Hot Spikes', 600, 'Spikes pop Lead and frozen bloons.', (s) => { m(s).dmgType = 'normal'; m(s).sprite = 'hotspikes'; }),
        u('Spiked Balls', 2300, 'Spiked balls do extra damage to ceramics.', (s) => { m(s).dmg = 2; m(s).ceram = 3; m(s).sprite = 'spikeballs'; }),
        u('Spiked Mines', 10000, 'Spikes explode when they run out.', (s) => { m(s).expl = { r: 50, dmg: 10, moab: 10, pierce: 30, dmgType: 'normal' }; m(s).sprite = 'mines'; }),
        u('Super Mines', 150000, 'Mines that obliterate anything.', (s) => { m(s).expl = { r: 90, dmg: 500, moab: 500, pierce: 60, dmgType: 'normal', fx: { burn: { dmg: 50, every: 0.5, dur: 4 } } }; m(s).dmg = 10; }),
      ],
      [
        u('Faster Production', 600, 'Produces spikes faster.', (s) => { m(s).rate *= 0.75; }),
        u('Even Faster Production', 800, 'Produces spikes even faster.', (s) => { m(s).rate *= 0.7; }),
        u('MOAB SHREDR', 2500, 'Spikes shred MOAB-class bloons.', (s) => { m(s).moab = 2; m(s).dmg += 1; }),
        u('Spike Storm', 4000, 'Ability: covers the track in spikes.', (s) => { s.ability = { name: 'Spike Storm', icon: 'spikestorm', cd: 40, fn: (G, t) => G.spikeStorm(t, { n: 120, pierce: 10, dmg: 2, dmgType: 'normal', moab: 2 }) }; }),
        u('Carpet of Spikes', 40000, 'Spike storms happen on their own every 15 seconds.', (s) => { m(s).dmg += 2; m(s).moab += 3; s.carpet = 15; s.ability = { name: 'Spike Storm', icon: 'spikestorm', cd: 30, fn: (G, t) => G.spikeStorm(t, { n: 200, pierce: 20, dmg: 4, dmgType: 'normal', moab: 4 }) }; }),
      ],
      [
        u('Long Reach', 150, 'More range.', (s) => { s.range += 8 * U; }),
        u('Smart Spikes', 400, 'Spikes land right in front of the first bloon.', (s) => { m(s).pierce += 2; }),
        u('Long Life Spikes', 1400, 'Spikes stay through the next round.', (s) => { m(s).persist = true; m(s).rounds = 2; m(s).life = 120; }),
        u('Deadly Spikes', 3500, 'Spikes do 2 extra damage.', (s) => { m(s).dmg += 2; m(s).ceram = (m(s).ceram || 0) + 2; }),
        u('Perma-Spike', 30000, 'Spikes that last for ages with huge pierce.', (s) => { m(s).pierce += 40; m(s).rounds = 6; m(s).life = 600; m(s).dmg += 3; m(s).moab = (m(s).moab || 0) + 6; m(s).sprite = 'permaspike'; }),
      ],
    ],
  };

  T.village = {
    name: 'Monkey Village', cat: 'support', cost: 1200, key: 'k', r: 24,
    desc: 'Boosts every monkey in range. More range for everyone nearby.',
    targets: [],
    base: { range: 40 * U, village: true, buff: { range: 1.1 }, a: [] },
    up: [
      [
        u('Bigger Radius', 400, 'Bigger influence radius.', (s) => { s.range *= 1.2; }),
        u('Jungle Drums', 1500, 'Monkeys in range attack 15% faster.', (s) => { s.buff.rate = 0.85; }),
        u('Primary Training', 800, 'Primary monkeys get more pierce and range.', (s) => { s.buff.pierce = 1; s.buff.range = 1.15; }),
        u('Primary Mentoring', 2500, 'Primary monkeys deal extra damage.', (s) => { s.buff.dmg = 1; }),
        u('Primary Expertise', 25000, 'Fires a giant ball of destruction.', (s) => { s.a.push(A({ rate: 2, dmg: 30, moab: 30, pierce: 300, speed: 400, sprite: 'ujugg', size: 26, dmgType: 'normal', lifeDist: 900, spin: 6 })); }),
      ],
      [
        u('Grow Blocker', 250, 'Bloons in range can\'t regrow.', (s) => { s.a.push(A({ kind: 'aura', rate: 0.5, dmg: 0, pierce: 999, fx: { degrow: true }, hitCamo: true, color: 'rgba(0,0,0,0)', sound: false })); }),
        u('Radar Scanner', 2000, 'All monkeys in range see Camo.', (s) => { s.buff.camo = true; }),
        u('Monkey Intelligence Bureau', 7500, 'All monkeys in range can pop every bloon type.', (s) => { s.buff.normal = true; }),
        u('Call to Arms', 20000, 'Ability: monkeys in range attack much faster for 12 seconds.', (s) => { s.ability = { name: 'Call to Arms', icon: 'cta', cd: 45, fn: (G, t) => G.boostArea(t, G.range(t), null, { dur: 12, rate: 0.66, pierceMult: 1.5 }) }; }),
        u('Homeland Defense', 40000, 'Ability: every monkey on the map attacks twice as fast.', (s) => { s.ability = { name: 'Homeland Defense', icon: 'cta', cd: 60, fn: (G, t) => G.boostArea(t, 99999, null, { dur: 20, rate: 0.5, pierceMult: 2 }) }; }),
      ],
      [
        u('Monkey Business', 500, '10% off upgrades (tiers 1-3) and monkeys in range.', (s) => { s.discount = 0.1; }),
        u('Monkey Commerce', 500, '15% off.', (s) => { s.discount = 0.15; }),
        u('Monkey Town', 10000, 'Monkeys in range earn 50% more pop cash.', (s) => { s.buff.cashMult = 1.5; }),
        u('Monkey City', 20000, 'Even more pop cash and $1000 per round.', (s) => { s.buff.cashMult = 2; s.income = 1000; }),
        u('Monkeyopolis', 75000, 'A sprawling city: $5000 per round.', (s) => { s.income = 5000; s.buff.cashMult = 2.5; }),
      ],
    ],
  };

  T.engineer = {
    name: 'Engineer Monkey', cat: 'support', cost: 450, key: 'l', r: 15,
    desc: 'Shoots nails and builds sentry guns.',
    base: { range: 40 * U, a: [A({ rate: 0.7, pierce: 3, speed: 900, sprite: 'nail' })] },
    up: [
      [
        u('Sentry Gun', 500, 'Builds temporary sentry guns nearby.', (s) => { s.a.push(A({ kind: 'summon', rate: 10, summon: { life: 25, max: 4, stats: { range: 45 * U, a: [A({ rate: 0.6, pierce: 2, speed: 900, sprite: 'nail', sound: false })] } }, sound: false })); }),
        u('Faster Engineering', 400, 'Builds sentries faster.', (s) => { s.a[1].rate *= 0.6; }),
        u('Sprockets', 525, 'Everything attacks faster.', (s) => { m(s).rate *= 0.6; s.a[1].summon.stats.a[0].rate *= 0.6; }),
        u('Sentry Expert', 2500, 'Builds specialised sentries: crushing, boom, cold and energy.', (s) => {
          s.a[1].summon.stats = () => {
            const kinds = [
              A({ rate: 0.6, dmg: 2, pierce: 3, speed: 900, sprite: 'nail', dmgType: 'normal', ceram: 2, sound: false }),
              A({ rate: 1, dmg: 0, speed: 600, sprite: 'bomb', dmgType: 'explosion', expl: { r: 34, dmg: 2, pierce: 12, dmgType: 'explosion' }, sound: false }),
              A({ kind: 'aura', rate: 1.5, dmg: 1, pierce: 20, dmgType: 'cold', fx: { freeze: 1 }, color: '#bff1ff', sound: false }),
              A({ kind: 'beam', rate: 0.6, dmg: 2, pierce: 8, width: 6, len: 200, dmgType: 'energy', color: '#60d0ff', sound: false }),
            ];
            return { range: 45 * U, camo: false, a: [kinds[(Math.random() * 4) | 0]] };
          };
        }),
        u('Sentry Champion', 32000, 'Builds plasma champion sentries.', (s) => { s.a[1].summon.stats = { range: 55 * U, a: [A({ rate: 0.04, dmg: 2, pierce: 3, moab: 2, speed: 1100, sprite: 'plasma', dmgType: 'normal', sound: false })] }; s.a[1].summon.max = 5; }),
      ],
      [
        u('Larger Service Area', 250, 'More range.', (s) => { s.range += 12 * U; }),
        u('Deconstruction', 350, 'Extra damage to MOABs and Fortified bloons.', (s) => { m(s).moab += 1; m(s).fort = 1; }),
        u('Cleansing Foam', 800, 'Sprays foam that strips Regrow and Camo.', (s) => { s.a.push(A({ kind: 'patch', rate: 2.5, dmg: 1, pierce: 10, radius: 28, life: 5, every: 0.5, dmgType: 'normal', fx: { degrow: true, decamo: true }, color: '#bfe4ff', sound: false })); }),
        u('Overclock', 13500, 'Ability: overclocks the strongest nearby monkey for 45 seconds.', (s) => { s.ability = { name: 'Overclock', icon: 'overclock', cd: 45, fn: (G, t) => { const c = G.towers.filter((x) => x !== t && !x.temp && !x.stats.bananas && !x.stats.village && Math.hypot(x.x - t.x, x.y - t.y) < G.range(t) * 1.6).sort((p, q) => q.spent - p.spent)[0]; if (c) { G.boost(c, { dur: 45, rate: 0.6, range: 1.1, overclock: true }); G.fx.push({ k: 'ring', x: c.x, y: c.y, r: 40, t: 0, life: 0.6, color: '#4bd5ff' }); } } }; }),
        u('Ultraboost', 105000, 'Overclocks permanently and more strongly.', (s) => { s.ability = { name: 'Ultraboost', icon: 'overclock', cd: 30, fn: (G, t) => { const c = G.towers.filter((x) => x !== t && !x.temp && !x.stats.bananas && !x.stats.village).sort((p, q) => q.spent - p.spent)[0]; if (c) G.boost(c, { dur: 1e9, rate: 0.9, overclock: true }); } }; }),
      ],
      [
        u('Oversize Nails', 450, 'Huge nails pop 8 bloons and pop Lead.', (s) => { m(s).pierce = 8; m(s).dmgType = 'normal'; m(s).size = 9; }),
        u('Pin', 220, 'Nails pin bloons in place for a moment.', (s) => { m(s).fx = { stun: 0.5 }; }),
        u('Double Gun', 3500, 'Shoots twice as fast.', (s) => { m(s).rate *= 0.5; }),
        u('Bloon Trap', 3900, 'Places a trap that catches bloons for cash.', (s) => { s.a.push(A({ kind: 'spikes', rate: 6, pierce: 500, sprite: 'trap', life: 60, trap: true, dmgType: 'normal', dmg: 9999, sound: false })); }),
        u('XXXL Trap', 40000, 'Traps that can even catch MOABs, BFBs and ZOMGs.', (s) => { const tr = s.a[s.a.length - 1]; tr.pierce = 5000; tr.dmg = 99999; tr.rate = 4; }),
      ],
    ],
  };

  BTD.TOWERS = T;
  BTD.TOWER_ORDER = ['dart', 'boomerang', 'bomb', 'tack', 'ice', 'glue', 'sniper', 'sub', 'buccaneer', 'ace', 'heli', 'mortar', 'dartling', 'wizard', 'super', 'ninja', 'alchemist', 'druid', 'farm', 'spike', 'village', 'engineer'];
  BTD.CATS = { primary: '#45a8ff', military: '#71c43a', magic: '#b35cff', support: '#ff9a2e' };
  for (const k in T) { T[k].k = k; if (!T[k].targets) T[k].targets = ['First', 'Last', 'Close', 'Strong']; }
  BTD.A = A;
})();
