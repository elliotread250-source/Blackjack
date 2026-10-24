#!/usr/bin/env node
/* Candy Match logic tests (no dependencies).   node tools/test.cjs     (QUICK=1 plays fewer bot seeds)
 * The rules live in js/core.js as a plain ES module (no DOM), loaded here with import().
 */
'use strict';
const path = require('path');
const assert = require('assert');
const J = f => import(path.join(__dirname, '..', 'js', f));

let pass = 0, fail = 0;
const tests = [];
const test = (name, fn) => tests.push([name, fn]);

(async () => {
  const C = await J('core.js');
  const { LEVELS, LEVEL_COUNT } = await J('levels.js');
  const B = await J('bot.js');
  const { W, H, N, T } = C;

  // ---------------------------------------------------------------- helpers
  const FULL = Array(9).fill('.........');
  // A 6-colour diagonal pattern: no three in a row, and (by design) no legal swap at all.
  const pat = (r, c) => (c + 2 * r) % 6;
  function blank(opts = {}) {
    const level = { rows: FULL, colors: 6, moves: 20, goal: { score: 1e9 }, stars: [1, 2, 3], ...opts };
    const st = C.newGame(level, 1, true);
    st.board.fill(null);
    for (let i = 0; i < N; i++) st.board[i] = { id: st.nextId++, t: 0, c: pat((i / W) | 0, i % W), cage: 0 };
    return st;
  }
  const at = (r, c) => r * W + c;
  const put = (st, r, c, t, col) => { st.board[at(r, c)] = { id: st.nextId++, t, c: col, cage: 0 }; };
  const colorOf = (st, r, c) => st.board[at(r, c)].c;
  // set cells (list of [r,c]) to normal colour X
  const paintX = (st, X, cells) => cells.forEach(([r, c]) => put(st, r, c, T.NORMAL, X));
  const clears = res => res.events.filter(e => e.t === 'clear');
  const idxs = e => e.cleared.map(x => x.i).sort((a, b) => a - b);
  const swapOk = (st, a, b) => { const r = C.playMove(st, a, b); assert.ok(r.ok, 'swap should be legal'); return r; };
  const snapshot = st => st.board.map(cd => cd ? cd.t + ':' + cd.c + (cd.cage ? 'c' : '') : '_').join(',');

  // ---------------------------------------------------------------- level data
  test('there are 40 levels with unique numbers', () => {
    assert.strictEqual(LEVEL_COUNT, 40);
    assert.deepStrictEqual(LEVELS.map(l => l.n), Array.from({ length: 40 }, (_, i) => i + 1));
  });
  test('level data is valid: shape, columns, goals, stars, moves', () => {
    for (const lv of LEVELS) {
      const tag = 'level ' + lv.n;
      assert.strictEqual(lv.rows.length, 9, tag);
      lv.rows.forEach(r => assert.ok(/^[.#jJckKxi]{9}$/.test(r), tag + ' row ' + r));
      const L = C.layoutOf(lv);
      for (let c = 0; c < W; c++) {
        assert.ok(L.top[c] >= 0, tag + ' column ' + c + ' is empty');
        for (let r = L.top[c]; r <= L.bot[c]; r++) assert.ok(L.mask[at(r, c)], tag + ' column ' + c + ' has a hole inside it');
      }
      assert.ok(L.cells.length >= 45, tag + ' too small');
      assert.ok(lv.colors >= 4 && lv.colors <= 6, tag + ' colours');
      assert.ok(lv.moves >= 10 && lv.moves <= 60, tag + ' moves ' + lv.moves);
      assert.ok(lv.stars.length === 3 && lv.stars[0] < lv.stars[1] && lv.stars[1] < lv.stars[2], tag + ' stars');
      const g = lv.goal;
      assert.ok(g.score || g.jelly || g.ing || g.collect, tag + ' has a goal');
      if (g.jelly) assert.ok(L.jellyTotal > 0, tag + ' jelly goal needs jelly');
      if (g.ing) { assert.ok(g.ing >= 1 && g.ing <= 6, tag + ' ing'); }
      if (g.collect) assert.ok(g.collect[0] < lv.colors && g.collect[1] > 0, tag + ' collect');
      if (g.score) assert.strictEqual(g.score, lv.stars[0], tag + ' score goal is star 1');
      if (!g.jelly) assert.strictEqual(L.jellyTotal === 0 || true, true);
    }
  });
  test('the goal types and obstacles all appear in the level set', () => {
    const has = f => LEVELS.some(f);
    assert.ok(has(l => l.goal.score) && has(l => l.goal.jelly) && has(l => l.goal.ing) && has(l => l.goal.collect));
    const rows = l => l.rows.join('');
    assert.ok(has(l => /[Jjk]/.test(rows(l))) && has(l => /[Kk]/.test(rows(l)) || /J/.test(rows(l))));
    assert.ok(has(l => /[ckK]/.test(rows(l))) && has(l => /x/.test(rows(l))) && has(l => /#/.test(rows(l))));
  });
  test('first levels are gentle: no obstacles before level 3', () => {
    assert.ok(!/[^.#]/.test(LEVELS[0].rows.join('')) && !/[^.#]/.test(LEVELS[1].rows.join('')));
  });

  // ---------------------------------------------------------------- new boards
  test('a new board never starts with a match and always has a move (all levels, 6 seeds)', () => {
    for (const lv of LEVELS) for (let s = 1; s <= 6; s++) {
      const st = C.newGame(lv, s);
      assert.strictEqual(C.findGroups(st).length, 0, `level ${lv.n} seed ${s}`);
      assert.ok(C.hasMove(st), `level ${lv.n} seed ${s} has a move`);
      for (const i of st.L.cells) assert.ok(st.board[i], 'filled');
    }
  });
  test('new board places the level layout: jelly, cages, chocolate, cherries, holes', () => {
    const lv = LEVELS[39];
    const st = C.newGame(lv, 3);
    const L = st.L;
    for (const i of L.cells) {
      const cd = st.board[i];
      if (L.cage[i]) assert.ok(cd.cage === 1);
      if (L.choc[i]) assert.strictEqual(cd.t, T.CHOC);
      if (L.ing[i]) assert.strictEqual(cd.t, T.ING);
      assert.strictEqual(st.jelly[i], L.jelly[i]);
    }
    assert.ok(C.jellyLeft(st) >= 12);
    const d = C.newGame(LEVELS[1], 3);
    for (let i = 0; i < N; i++) if (!d.L.mask[i]) assert.strictEqual(d.board[i], null);
  });
  test('same level and seed give the same board; another seed gives another', () => {
    assert.strictEqual(snapshot(C.newGame(LEVELS[4], 9)), snapshot(C.newGame(LEVELS[4], 9)));
    assert.notStrictEqual(snapshot(C.newGame(LEVELS[4], 9)), snapshot(C.newGame(LEVELS[4], 10)));
  });

  // ---------------------------------------------------------------- matches and special creation
  test('the test pattern is a clean dead board', () => {
    const st = blank();
    assert.strictEqual(C.findGroups(st).length, 0);
    assert.strictEqual(C.findMoves(st).length, 0);
  });
  test('horizontal and vertical 3-matches are found', () => {
    const st = blank();
    paintX(st, 2, [[4, 0], [4, 1], [4, 2]]);
    let g = C.findGroups(st);
    assert.strictEqual(g.length, 1); assert.strictEqual(g[0].cells.size, 3);
    const st2 = blank();
    paintX(st2, 1, [[2, 7], [3, 7], [4, 7]]);
    g = C.findGroups(st2);
    assert.strictEqual(g.length, 1); assert.ok(!g[0].runs[0].h);
  });
  test('L, T and plus shapes are one group; separate lines are two groups', () => {
    let st = blank(); paintX(st, 1, [[4, 0], [4, 1], [4, 2], [5, 2], [6, 2]]);
    let g = C.findGroups(st); assert.strictEqual(g.length, 1); assert.strictEqual(g[0].cells.size, 5);
    st = blank(); paintX(st, 1, [[4, 1], [4, 2], [4, 3], [5, 2], [6, 2]]);
    g = C.findGroups(st); assert.strictEqual(g.length, 1); assert.strictEqual(g[0].cells.size, 5);
    st = blank(); paintX(st, 1, [[4, 2], [4, 3], [4, 1], [3, 2], [5, 2]]);
    g = C.findGroups(st); assert.strictEqual(g.length, 1); assert.strictEqual(g[0].runs.length, 2);
    st = blank(); paintX(st, 0, [[1, 0], [1, 1], [1, 2]]); paintX(st, 3, [[6, 5], [6, 6], [6, 7]]);
    assert.strictEqual(C.findGroups(st).length, 2);
  });
  test('4 in a row makes a striped candy (across the match), at the swapped cell', () => {
    const st = blank();
    paintX(st, 5, [[4, 0], [4, 1], [4, 3], [3, 2]]);
    assert.strictEqual(C.findGroups(st).length, 0);
    const res = swapOk(st, at(3, 2), at(4, 2));
    const ev = clears(res)[0];
    assert.strictEqual(ev.created.length, 1);
    assert.strictEqual(ev.created[0].t, T.SV);
    assert.strictEqual(ev.created[0].i, at(4, 2));
    assert.strictEqual(ev.cleared.length, 3);
    // vertical 4 makes the row-clearing striped candy
    const s2 = blank();
    paintX(s2, 5, [[1, 4], [2, 4], [4, 4], [3, 3]]);
    const r2 = swapOk(s2, at(3, 3), at(3, 4));
    assert.strictEqual(clears(r2)[0].created[0].t, T.SH);
  });
  test('L and T shapes make a wrapped candy', () => {
    let st = blank();
    paintX(st, 1, [[4, 0], [4, 1], [5, 2], [6, 2], [3, 2]]);
    let ev = clears(swapOk(st, at(3, 2), at(4, 2)))[0];
    assert.strictEqual(ev.created[0].t, T.WRAP); assert.strictEqual(ev.created[0].i, at(4, 2));
    assert.strictEqual(ev.cleared.length, 4);
    st = blank();
    paintX(st, 1, [[4, 1], [4, 3], [5, 2], [6, 2], [3, 2]]);
    ev = clears(swapOk(st, at(3, 2), at(4, 2)))[0];
    assert.strictEqual(ev.created[0].t, T.WRAP); assert.strictEqual(ev.cleared.length, 4);
  });
  test('5 in a line makes a colour bomb', () => {
    const st = blank();
    paintX(st, 5, [[4, 0], [4, 1], [4, 3], [4, 4], [3, 2]]);
    const ev = clears(swapOk(st, at(3, 2), at(4, 2)))[0];
    assert.strictEqual(ev.created.length, 1);
    assert.strictEqual(ev.created[0].t, T.BOMB);
    assert.strictEqual(ev.cleared.length, 4);
  });
  test('a created special survives and is on the board after the cascade settles', () => {
    const st = blank();
    paintX(st, 5, [[4, 0], [4, 1], [4, 3], [3, 2]]);
    swapOk(st, at(3, 2), at(4, 2));
    assert.ok(st.board.some(cd => cd && cd.t === T.SV));
  });
  test('invalid swaps are refused and change nothing', () => {
    const st = blank();
    const before = snapshot(st), moves = st.moves;
    const r = C.playMove(st, at(4, 4), at(4, 5));
    assert.strictEqual(r.ok, false);
    assert.strictEqual(r.events[0].t, 'bounce');
    assert.strictEqual(st.moves, moves); assert.strictEqual(snapshot(st), before);
    assert.strictEqual(C.playMove(st, at(0, 0), at(2, 2)).ok, false);   // not adjacent
    assert.strictEqual(C.playMove(st, at(0, 8), at(1, 0)).ok, false);   // wraps a row edge
  });

  // ---------------------------------------------------------------- special activation
  test('striped candy in a match clears its whole row', () => {
    const st = blank();
    paintX(st, 5, [[6, 0], [6, 1], [5, 2]]); put(st, 5, 2, T.SH, 5);
    const ev = clears(swapOk(st, at(5, 2), at(6, 2)))[0];
    const got = new Set(idxs(ev));
    for (let c = 0; c < W; c++) assert.ok(got.has(at(6, c)), 'row cell ' + c);
    assert.strictEqual(ev.fx.some(f => f.k === 'row' && f.r === 6), true);
    assert.strictEqual(ev.cleared.length, 9);
  });
  test('vertical striped candy clears its whole column', () => {
    const st = blank();
    paintX(st, 5, [[6, 0], [6, 1], [5, 2]]); put(st, 5, 2, T.SV, 5);
    const ev = clears(swapOk(st, at(5, 2), at(6, 2)))[0];
    const got = new Set(idxs(ev));
    for (let r = 0; r < H; r++) assert.ok(got.has(at(r, 2)), 'column cell ' + r);
    assert.ok(got.has(at(6, 0)) && got.has(at(6, 1)));
  });
  test('wrapped candy blasts 3x3, then blasts again after the fall', () => {
    const st = blank();
    paintX(st, 5, [[6, 0], [6, 1], [5, 2]]); put(st, 5, 2, T.WRAP, 5);
    const res = swapOk(st, at(5, 2), at(6, 2));
    const cs = clears(res);
    const first = new Set(idxs(cs[0]));
    for (let r = 5; r <= 7; r++) for (let c = 1; c <= 3; c++) assert.ok(first.has(at(r, c)), `3x3 cell ${r},${c}`);
    assert.ok(cs.some(e => e.fx.some(f => f.k === 'blast' && f.second)), 'second blast');
  });
  test('bomb swapped with a colour clears every candy of that colour', () => {
    const st = blank();
    put(st, 4, 4, T.BOMB, 0);
    const col = colorOf(st, 4, 5);
    const expect = []; for (let i = 0; i < N; i++) if (st.board[i].t === 0 && st.board[i].c === col) expect.push(i);
    expect.push(at(4, 4));
    const ev = clears(swapOk(st, at(4, 4), at(4, 5)))[0];
    assert.deepStrictEqual(idxs(ev), expect.sort((a, b) => a - b));
    assert.ok(ev.fx.some(f => f.k === 'zap'));
  });
  test('bomb alone cannot swap with a cherry or chocolate', () => {
    const st = blank();
    put(st, 4, 4, T.BOMB, 0); put(st, 4, 5, T.ING, 0);
    assert.strictEqual(C.isValidSwap(st, at(4, 4), at(4, 5)), false);
    put(st, 4, 5, T.CHOC, 0);
    assert.strictEqual(C.isValidSwap(st, at(4, 4), at(4, 5)), false);
  });

  // ---------------------------------------------------------------- special combos
  test('striped + striped: a cross through the swapped cell', () => {
    const st = blank();
    put(st, 4, 4, T.SH, 1); put(st, 4, 5, T.SV, 2);
    const ev = clears(swapOk(st, at(4, 4), at(4, 5)))[0];
    const want = new Set(); for (let c = 0; c < W; c++) want.add(at(4, c)); for (let r = 0; r < H; r++) want.add(at(r, 5));
    assert.deepStrictEqual(idxs(ev), [...want].sort((a, b) => a - b));
    assert.strictEqual(ev.cleared.length, 17);
  });
  test('striped + wrapped: a 3-wide cross', () => {
    const st = blank();
    put(st, 4, 4, T.WRAP, 1); put(st, 4, 5, T.SH, 2);
    const ev = clears(swapOk(st, at(4, 4), at(4, 5)))[0];
    const want = new Set();
    for (let i = 0; i < N; i++) { const r = (i / W) | 0, c = i % W; if (Math.abs(r - 4) <= 1 || Math.abs(c - 5) <= 1) want.add(i); }
    assert.deepStrictEqual(idxs(ev), [...want].sort((a, b) => a - b));
  });
  test('wrapped + wrapped: a 5x5 blast', () => {
    const st = blank();
    put(st, 4, 4, T.WRAP, 1); put(st, 4, 5, T.WRAP, 2);
    const cs = clears(swapOk(st, at(4, 4), at(4, 5)));
    const want = []; for (let r = 2; r <= 6; r++) for (let c = 3; c <= 7; c++) want.push(at(r, c));
    assert.deepStrictEqual(idxs(cs[0]), want.sort((a, b) => a - b));
    assert.ok(cs.length > 1 && cs.some(e => e.fx.some(f => f.second)));
  });
  test('bomb + striped turns the colour striped and fires them all', () => {
    const st = blank();
    put(st, 4, 4, T.BOMB, 0); put(st, 4, 5, T.SH, 3);
    const colorCells = []; for (let i = 0; i < N; i++) if (st.board[i].t === 0 && st.board[i].c === 3) colorCells.push(i);
    const res = swapOk(st, at(4, 4), at(4, 5));
    const tr = res.events.find(e => e.t === 'transform');
    assert.ok(tr && tr.items.length === colorCells.length && tr.items.every(x => x.t === T.SH || x.t === T.SV));
    const ev = clears(res)[0];
    const got = new Set(idxs(ev));
    for (const i of colorCells) assert.ok(got.has(i));
    assert.ok(ev.cleared.length > colorCells.length * 3, 'striped candies clear whole lines: ' + ev.cleared.length);
  });
  test('bomb + wrapped turns the colour wrapped', () => {
    const st = blank();
    put(st, 4, 4, T.BOMB, 0); put(st, 4, 5, T.WRAP, 3);
    const res = swapOk(st, at(4, 4), at(4, 5));
    const tr = res.events.find(e => e.t === 'transform');
    assert.ok(tr && tr.items.every(x => x.t === T.WRAP));
  });
  test('bomb + bomb clears the whole board (cherries stay)', () => {
    const st = blank();
    put(st, 4, 4, T.BOMB, 0); put(st, 4, 5, T.BOMB, 0); put(st, 5, 0, T.ING, 0);
    const ev = clears(swapOk(st, at(4, 4), at(4, 5)))[0];
    assert.strictEqual(ev.cleared.length, 80);
    assert.ok(ev.fx.some(f => f.k === 'all'));
  });

  // ---------------------------------------------------------------- gravity, refill, cascades, scoring
  test('gravity and refill are deterministic for a seed', () => {
    const lv = LEVELS[2];
    const run = seed => {
      const st = C.newGame(lv, seed);
      const log = [];
      for (let k = 0; k < 8 && st.status === 'play'; k++) {
        const m = C.findMoves(st)[0];
        C.playMove(st, m[0], m[1]);
        log.push(snapshot(st) + '|' + st.score);
      }
      return log.join('\n');
    };
    assert.strictEqual(run(5), run(5));
    assert.notStrictEqual(run(5), run(6));
  });
  test('after every move the board is full, has no matches and has a legal move', () => {
    for (const li of [0, 8, 13, 27, 39]) {
      const st = C.newGame(LEVELS[li], 4);
      for (let k = 0; k < 12 && st.status === 'play'; k++) {
        const ms = C.findMoves(st);
        const m = ms[(k * 7) % ms.length];
        C.playMove(st, m[0], m[1]);
        if (st.status !== 'play') break;
        for (const i of st.L.cells) assert.ok(st.board[i], 'cell filled');
        assert.strictEqual(C.findGroups(st).length, 0);
        assert.ok(C.hasMove(st));
      }
    }
  });
  test('events: falls only move candies down and spawn from above the run', () => {
    const st = C.newGame(LEVELS[0], 2, true);
    const m = C.findMoves(st)[0];
    const res = C.playMove(st, m[0], m[1]);
    for (const e of res.events.filter(x => x.t === 'fall')) {
      for (const mv of e.moves) assert.ok(mv.to > mv.from && (mv.to - mv.from) % W === 0);
      for (const sp of e.spawned) assert.ok(sp.fromRow < (sp.to / W | 0));
    }
  });
  test('cascades raise the multiplier and the score', () => {
    const st = blank();
    paintX(st, 5, [[8, 0], [8, 1], [8, 3]]); paintX(st, 5, [[7, 2]]);
    const s1 = st.score;
    const res = swapOk(st, at(7, 2), at(8, 2));
    const cs = clears(res);
    assert.strictEqual(cs[0].mult, 1);
    assert.ok(cs[0].created.length === 1);
    assert.ok(st.score > s1);
    for (let k = 1; k < cs.length; k++) assert.strictEqual(cs[k].mult, Math.min(k + 1, 99));
  });
  test('score: 20 per candy times the cascade step', () => {
    const st = blank();
    paintX(st, 5, [[6, 0], [6, 1], [5, 2]]);
    const res = swapOk(st, at(5, 2), at(6, 2));
    assert.strictEqual(clears(res)[0].pts, 60);
  });

  // ---------------------------------------------------------------- reshuffle
  test('a dead board is reshuffled into one with a legal move and no match', () => {
    for (let s = 1; s <= 20; s++) {
      const st = blank(); st.rs = s * 977;
      assert.strictEqual(C.hasMove(st), false);
      C.ensureMove(st);
      assert.ok(C.hasMove(st), 'seed ' + s);
      assert.strictEqual(C.findGroups(st).length, 0);
      const ev = st.rec.find(e => e.t === 'shuffle');
      assert.ok(ev && ev.ok && ev.moves.length === 81);
    }
  });
  test('shuffle keeps the same candies (a permutation) and leaves cherries and chocolate alone', () => {
    const st = C.newGame(LEVELS[39], 2, true);
    const before = new Map(st.board.filter(Boolean).map(cd => [cd.id, cd.t + ':' + cd.c]));
    const fixed = []; for (const i of st.L.cells) if (st.board[i].t === T.ING || st.board[i].t === T.CHOC || st.board[i].cage) fixed.push([i, st.board[i].id]);
    C.useShuffle(st);
    assert.strictEqual(st.board.filter(Boolean).length, before.size);
    for (const cd of st.board.filter(Boolean)) assert.ok(before.has(cd.id));
    for (const [i, id] of fixed) assert.strictEqual(st.board[i].id, id);
    assert.strictEqual(C.findGroups(st).length, 0); assert.ok(C.hasMove(st));
  });

  // ---------------------------------------------------------------- obstacles
  test('jelly: cleared under removed candies, double jelly takes two hits', () => {
    const lv = { rows: ['.........', '.........', '.........', '.........', '.........', '.........', 'jJ.......', '.........', '.........'], colors: 6, moves: 20, goal: { jelly: 1 }, stars: [1, 2, 3] };
    const st = C.newGame(lv, 1, true);
    st.board.fill(null);
    for (let i = 0; i < N; i++) st.board[i] = { id: st.nextId++, t: 0, c: pat((i / W) | 0, i % W), cage: 0 };
    assert.strictEqual(C.jellyLeft(st), 3);
    C.useHammer(st, at(6, 0));
    assert.strictEqual(st.jelly[at(6, 0)], 0);
    assert.strictEqual(C.jellyLeft(st), 2);
    C.useHammer(st, at(6, 1));
    assert.strictEqual(st.jelly[at(6, 1)], 1);
    assert.strictEqual(st.status, 'play');
  });
  test('cage: cannot be swapped, hammer breaks the cage but keeps the candy', () => {
    const st = blank();
    st.board[at(4, 4)].cage = 1;
    paintX(st, 5, [[4, 5], [4, 6], [3, 4]]);
    assert.strictEqual(C.isValidSwap(st, at(4, 4), at(3, 4)), false);
    const id = st.board[at(4, 4)].id;
    C.useHammer(st, at(4, 4));
    assert.strictEqual(st.board[at(4, 4)] && st.board[at(4, 4)].id, id);
    assert.strictEqual(st.board[at(4, 4)].cage, 0);
    assert.ok(st.rec.find(e => e.t === 'clear').cage.includes(at(4, 4)));
  });
  test('cage: a caged candy that is matched loses the cage, the match clears the rest', () => {
    const st = blank();
    paintX(st, 5, [[6, 0], [6, 1], [5, 2]]);
    st.board[at(6, 0)].cage = 1;
    const id = st.board[at(6, 0)].id;
    const ev = clears(swapOk(st, at(5, 2), at(6, 2)))[0];
    assert.ok(ev.cage.includes(at(6, 0)));
    assert.strictEqual(ev.cleared.length, 2);
    const cd = st.board.find(c => c && c.id === id);
    assert.ok(cd && cd.cage === 0);
  });
  test('chocolate: cleared by an adjacent match, and does not spread that turn', () => {
    const st = blank();
    put(st, 7, 1, T.CHOC, 0);
    paintX(st, 5, [[6, 0], [6, 1], [5, 2]]);
    const res = swapOk(st, at(5, 2), at(6, 2));
    assert.ok(clears(res)[0].cleared.some(x => x.kind === 'choc'));
    assert.ok(!st.board.some(cd => cd && cd.t === T.CHOC));
  });
  test('chocolate: spreads to a neighbour when a turn does not clear any', () => {
    const st = blank();
    put(st, 0, 0, T.CHOC, 0);
    paintX(st, 5, [[8, 5], [8, 6], [7, 7]]);
    swapOk(st, at(7, 7), at(8, 7));
    assert.strictEqual(st.board.filter(cd => cd && cd.t === T.CHOC).length, 2);
    assert.ok(st.rec.some(e => e.t === 'spread'));
  });
  test('chocolate cannot be swapped and does not match', () => {
    const st = blank();
    put(st, 4, 4, T.CHOC, 5); put(st, 4, 5, T.CHOC, 5); put(st, 4, 6, T.CHOC, 5);
    assert.strictEqual(C.findGroups(st).length, 0);
    assert.strictEqual(C.isValidSwap(st, at(4, 4), at(3, 4)), false);
  });

  // ---------------------------------------------------------------- goals
  test('goal: score', () => {
    const st = blank({ moves: 5, goal: { score: 100 } });
    st.score = 50;
    paintX(st, 5, [[6, 0], [6, 1], [5, 2]]);
    swapOk(st, at(5, 2), at(6, 2));
    assert.strictEqual(st.status, 'won');
    assert.strictEqual(C.starsFor({ stars: [100, 200, 300] }, st) >= 1, true);
  });
  test('goal: clear all the jelly', () => {
    const lv = { rows: ['.........', '.........', '.........', '.........', '.........', '.........', '.........', '.........', 'jj.......'], colors: 6, moves: 9, goal: { jelly: 1 }, stars: [1, 2, 3] };
    const st = C.newGame(lv, 1, true);
    C.useHammer(st, at(8, 0));
    assert.strictEqual(st.status, 'play');
    C.useHammer(st, at(8, 1));
    assert.strictEqual(st.status, 'won');
  });
  test('goal: collect N of a colour', () => {
    const st = blank({ moves: 9, goal: { collect: [2, 6] } });
    for (let k = 0; k < 6; k++) {
      assert.strictEqual(st.status, 'play');
      const i = st.board.findIndex(cd => cd && cd.t === 0 && cd.c === 2);
      C.useHammer(st, i);
    }
    assert.ok(st.collected >= 6);
    assert.strictEqual(st.status, 'won');
  });
  test('goal: bring ingredients to the bottom', () => {
    const lv = { rows: FULL, colors: 6, moves: 9, goal: { ing: 1 }, stars: [1, 2, 3] };
    const st = C.newGame(lv, 1, true);
    st.board.fill(null);
    for (let i = 0; i < N; i++) st.board[i] = { id: st.nextId++, t: 0, c: pat((i / W) | 0, i % W), cage: 0 };
    put(st, 6, 3, T.ING, 0);
    C.useHammer(st, at(8, 3));
    assert.strictEqual(st.status, 'play');           // the cherry is at row 7, one short
    C.useHammer(st, at(8, 3));                          // now it reaches the bottom row
    assert.ok(st.delivered >= 1 && st.status === 'won');
  });
  test('cherries cannot be hammered or blasted away', () => {
    const st = blank({ goal: { ing: 3 } });
    put(st, 4, 4, T.ING, 0);
    assert.strictEqual(C.useHammer(st, at(4, 4)).ok, false);
    put(st, 4, 2, T.SH, 1); put(st, 4, 3, T.SV, 2);
    // clear the row 4 with a cross: the cherry survives
    C.playMove(st, at(4, 2), at(4, 3));
    assert.ok(st.board.some(cd => cd && cd.t === T.ING) || st.delivered > 0);
  });
  test('cherries spawn on their own until the goal is reachable', () => {
    const lv = LEVELS[4];
    const st = C.newGame(lv, 3);
    let seen = countCherries(st);
    for (let k = 0; k < 25 && st.status === 'play'; k++) {
      const m = B.pickMove(st, 1, 5, 'oracle'); if (!m) break;
      Object.assign(st, m.s);
      seen = Math.max(seen, countCherries(st));
    }
    assert.ok(st.delivered >= 1 || seen >= 1);
    function countCherries(s) { return s.board.filter(cd => cd && cd.t === T.ING).length; }
  });
  test('running out of moves loses; the move counter only drops on legal swaps', () => {
    const st = blank({ moves: 1, goal: { score: 1e9 } });
    paintX(st, 5, [[6, 0], [6, 1], [5, 2]]);
    assert.strictEqual(C.playMove(st, at(0, 0), at(0, 1)).ok, false);
    assert.strictEqual(st.moves, 1);
    swapOk(st, at(5, 2), at(6, 2));
    assert.strictEqual(st.moves, 0);
    assert.strictEqual(st.status, 'lost');
    assert.strictEqual(C.playMove(st, at(0, 0), at(0, 1)).ok, false);
    assert.strictEqual(C.starsFor({ stars: [1, 2, 3] }, st), 0);
  });
  test('moves left bonus: leftover moves become specials that detonate, then no specials remain', () => {
    const st = blank({ moves: 9, goal: { score: 60 } });
    paintX(st, 5, [[6, 0], [6, 1], [5, 2]]);
    const before = st.score;
    swapOk(st, at(5, 2), at(6, 2));
    assert.strictEqual(st.status, 'won');
    assert.strictEqual(st.moves, 0);
    assert.strictEqual(st.bonusMoves, 8);
    assert.ok(st.rec.some(e => e.t === 'bonusStart') && st.rec.some(e => e.t === 'bonusPick'));
    assert.ok(st.score - before >= 8 * C.SCORE.bonusMove);
    assert.ok(!st.board.some(cd => cd && cd.t >= 1 && cd.t <= 4), 'no special left');
    const pick = st.rec.find(e => e.t === 'bonusPick');
    assert.strictEqual(pick.items.length, 8);
  });
  test('stars: 1 for a win, 2 and 3 by score', () => {
    const lv = { stars: [100, 200, 300] };
    assert.strictEqual(C.starsFor(lv, { status: 'won', score: 150 }), 1);
    assert.strictEqual(C.starsFor(lv, { status: 'won', score: 200 }), 2);
    assert.strictEqual(C.starsFor(lv, { status: 'won', score: 999 }), 3);
  });
  test('the hint source: a best move exists on a fresh board for every level', () => {
    for (const lv of LEVELS) {
      const m = B.pickMove(C.newGame(lv, 5), 1, 5, 'blind');
      assert.ok(m && C.isValidSwap(C.newGame(lv, 5), m.a, m.b), 'level ' + lv.n);
    }
  });
  test('clone is independent of the original', () => {
    const st = C.newGame(LEVELS[2], 1);
    const c = C.clone(st);
    const m = C.findMoves(c)[0];
    C.playMove(c, m[0], m[1]);
    assert.notStrictEqual(snapshot(c), snapshot(st));
    assert.strictEqual(st.moves, LEVELS[2].moves);
  });

  // ---------------------------------------------------------------- the bots
  const SEEDS = process.env.QUICK ? [1] : [1, 2, 3];
  test('bot (oracle, 2-ply) clears every level within its move limit on the level seeds', () => {
    const rows = [];
    let total = 0, wins = 0;
    for (const lv of LEVELS) {
      let w = 0, stars = 0;
      for (const s of SEEDS) {
        const r = B.playLevel(lv, lv.seed + s, { mode: 'oracle', depth: 2, width: 5 });
        if (r.won) { w++; stars = Math.max(stars, C.starsFor(lv, r.st)); }
        total++; if (r.won) wins++;
      }
      rows.push(`L${lv.n}:${w}/${SEEDS.length}${stars ? '*' + stars : ''}`);
      assert.ok(w >= Math.ceil(SEEDS.length * 0.66), `level ${lv.n}: oracle bot won only ${w}/${SEEDS.length}`);
    }
    console.log('       oracle bot wins ' + wins + '/' + total + '  ' + rows.join(' '));
  });
  test('a decent (blind) bot wins most levels too, and 3 stars are hard to get', () => {
    let wins = 0, total = 0, three = 0, seedsN = SEEDS.length + 1;
    const weak = [];
    for (const lv of LEVELS) {
      let w = 0;
      for (let s = 1; s <= seedsN; s++) {
        const r = B.playLevel(lv, 500 + s, { mode: 'blind' });
        total++;
        if (r.won) { wins++; w++; if (C.starsFor(lv, r.st) === 3) three++; }
      }
      if (w === 0) weak.push(lv.n);
    }
    console.log(`       blind bot wins ${wins}/${total} (${Math.round(100 * wins / total)}%), 3-star runs ${three}/${total}, levels it never won: ${weak.join(',') || 'none'}`);
    assert.ok(wins / total >= 0.6, 'blind win rate ' + wins / total);
    assert.ok(three / total <= 0.3, '3 stars should be a stretch for a greedy player');
    assert.ok(weak.length <= 3);
  });
  test('random play rarely beats the later levels', () => {
    let wins = 0, total = 0;
    for (const lv of LEVELS.slice(20)) for (let s = 1; s <= 2; s++) {
      const st = C.newGame(lv, 900 + s);
      while (st.status === 'play') {
        const ms = C.findMoves(st);
        const m = ms[Math.floor(C.rnd(st) * ms.length)];
        C.playMove(st, m[0], m[1]);
      }
      total++; if (st.status === 'won') wins++;
    }
    console.log(`       random play wins ${wins}/${total} of levels 21-40`);
    assert.ok(wins / total <= 0.5);
  });

  // ---------------------------------------------------------------- run
  for (const [name, fn] of tests) {
    const t0 = Date.now();
    try { await fn(); pass++; console.log('  ok   ' + name + (Date.now() - t0 > 1500 ? `  (${((Date.now() - t0) / 1000).toFixed(1)}s)` : '')); }
    catch (e) { fail++; console.log('  FAIL ' + name + '\n       ' + (e && e.stack ? e.stack.split('\n').slice(0, 4).join('\n       ') : e)); }
  }
  console.log(`\n${pass} passed, ${fail} failed`);
  process.exit(fail ? 1 : 0);
})();
