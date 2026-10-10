/*
 * Unit tests for js/logic.js. No dependencies: node tools/test.cjs
 * Uses the shipped words.txt for the solver and timing checks.
 */
'use strict';

const fs = require('fs');
const path = require('path');
const assert = require('assert');
const L = require('../js/logic.js');

let passed = 0;
let failed = 0;
function test(name, fn) {
  try {
    fn();
    passed++;
    console.log('  ok   ' + name);
  } catch (e) {
    failed++;
    console.log('  FAIL ' + name + '\n       ' + (e && e.stack ? e.stack.split('\n').slice(0, 3).join('\n       ') : e));
  }
}

const ROOT = path.join(__dirname, '..');
const dict = L.parseWordList(fs.readFileSync(path.join(ROOT, 'words.txt'), 'utf8'));

// Fixed board used by several tests:
//   T  A  P  E
//   R  E  S  T
//   Qu I  N  G
//   O  L  D  S
const FIXED = ['t', 'a', 'p', 'e', 'r', 'e', 's', 't', 'qu', 'i', 'n', 'g', 'o', 'l', 'd', 's'];

console.log('dice');
test('classic set is the 16 modern Boggle dice', () => {
  assert.strictEqual(L.CLASSIC_DICE.length, 16);
  L.CLASSIC_DICE.forEach((d) => assert.match(d, /^[A-Z]{6}$/));
  assert.strictEqual(L.CLASSIC_DICE.filter((d) => d.includes('Q')).length, 1);
  assert.ok(L.CLASSIC_DICE.includes('HIMNUQ'));
  // Letter totals of the modern set.
  const counts = {};
  L.CLASSIC_DICE.join('').split('').forEach((c) => { counts[c] = (counts[c] || 0) + 1; });
  assert.strictEqual(counts.E, 11);
  assert.strictEqual(counts.T, 9);
  assert.strictEqual(L.CLASSIC_DICE.join('').length, 96);
});
test('big set is the 25 Big Boggle dice', () => {
  assert.strictEqual(L.BIG_DICE.length, 25);
  L.BIG_DICE.forEach((d) => assert.match(d, /^[A-Z]{6}$/));
  assert.strictEqual(L.BIG_DICE.filter((d) => d === 'DHLNOR').length, 2);
  assert.ok(L.BIG_DICE.includes('BJKQXZ'));
  assert.strictEqual(L.BIG_DICE.join('').length, 150);
});
test('modes: sizes, timers, minimum lengths', () => {
  assert.deepStrictEqual([L.MODES[4].seconds, L.MODES[4].minLen], [180, 3]);
  assert.deepStrictEqual([L.MODES[5].seconds, L.MODES[5].minLen], [240, 4]);
});
test('shake uses every die exactly once and shows one of its faces', () => {
  for (const size of [4, 5]) {
    const dice = L.diceFor(size);
    for (let s = 1; s <= 200; s++) {
      const board = L.shake(size, L.mulberry32(s));
      assert.strictEqual(board.length, size * size);
      // Every face must come from a different die: bipartite matching
      // of cells to dice (Kuhn's augmenting paths).
      const fits = (face, die) => die.toLowerCase().includes(face === 'qu' ? 'q' : face);
      const owner = new Array(dice.length).fill(-1);
      const tryCell = (i, seen) => {
        for (let d = 0; d < dice.length; d++) {
          if (seen[d] || !fits(board[i], dice[d])) continue;
          seen[d] = true;
          if (owner[d] < 0 || tryCell(owner[d], seen)) { owner[d] = i; return true; }
        }
        return false;
      };
      const assign = () => board.every((_, i) => tryCell(i, new Array(dice.length).fill(false)));
      assert.ok(assign(), 'board ' + board.join(',') + ' is not a roll of the dice');
    }
  }
});
test('shake actually varies the layout', () => {
  const seen = new Set();
  for (let s = 0; s < 50; s++) seen.add(L.shake(4, L.mulberry32(s)).join(''));
  assert.ok(seen.size > 45);
});

console.log('Qu');
test('Q is always the Qu face and counts as two letters', () => {
  assert.strictEqual(L.faceOf('Q'), 'qu');
  assert.strictEqual(L.faceOf('a'), 'a');
  for (let s = 0; s < 500; s++) {
    const b = L.shake(4, L.mulberry32(s));
    assert.ok(!b.includes('q'));
  }
  assert.strictEqual(L.wordFromPath(FIXED, [8, 9, 4, 5]), 'quire');
  assert.strictEqual(L.scoreWord('quire'), 2); // five letters
  assert.strictEqual(L.scoreWord('quit'), 1);
});
test('words with Qu are found via the Qu face; bare q is not', () => {
  const p = L.findPath(FIXED, 'quire');
  assert.deepStrictEqual(p, [8, 9, 4, 5]);
  assert.strictEqual(L.findPath(FIXED, 'qire'), null);
  // Partial typing: a lone trailing q lights the Qu tile.
  assert.deepStrictEqual(L.findPath(FIXED, 'q', true), [8]);
  assert.strictEqual(L.findPath(FIXED, 'q', false), null);
});

console.log('adjacency and paths');
test('adjacency counts: corners 3, edges 5, middle 8', () => {
  for (const size of [4, 5]) {
    const adj = L.adjacency(size);
    assert.strictEqual(adj.length, size * size);
    const n = size - 1;
    assert.strictEqual(adj[0].length, 3);
    assert.strictEqual(adj[n].length, 3);
    assert.strictEqual(adj[n * size].length, 3);
    assert.strictEqual(adj[size * size - 1].length, 3);
    assert.strictEqual(adj[1].length, 5);
    assert.strictEqual(adj[size + 1].length, 8);
    // Symmetric
    adj.forEach((list, a) => list.forEach((b) => assert.ok(adj[b].includes(a))));
  }
  assert.ok(L.isAdjacent(4, 0, 5));
  assert.ok(!L.isAdjacent(4, 3, 4)); // row wrap is not adjacent
  assert.ok(!L.isAdjacent(4, 0, 2));
  assert.ok(!L.isAdjacent(4, 5, 5));
});
test('isValidPath rejects reuse, gaps and wraps', () => {
  assert.ok(L.isValidPath(FIXED, [0, 1, 2, 3]));
  assert.ok(L.isValidPath(FIXED, [0, 5, 10, 15]));
  assert.ok(!L.isValidPath(FIXED, [0, 1, 0]));
  assert.ok(!L.isValidPath(FIXED, [0, 2]));
  assert.ok(!L.isValidPath(FIXED, [3, 4]));
  assert.ok(!L.isValidPath(FIXED, [15, 16]));
  assert.ok(!L.isValidPath(FIXED, []));
});
test('findPath returns a valid path that spells the word', () => {
  for (const w of ['tape', 'rest', 'tapes', 'sing', 'sings', 'old', 'olds', 'quire']) {
    const p = L.findPath(FIXED, w);
    assert.ok(p, w);
    assert.ok(L.isValidPath(FIXED, p), w);
    assert.strictEqual(L.wordFromPath(FIXED, p), w);
  }
  assert.strictEqual(L.findPath(FIXED, 'tat'), null); // the two t's are not neighbours of one a
  assert.strictEqual(L.findPath(FIXED, 'zebra'), null);
});

console.log('solver');
const sol = L.solve(FIXED, dict, 3);
const solWords = new Set(sol.map((s) => s.word));
test('finds known words on the fixed board', () => {
  for (const w of ['tape', 'tapes', 'rest', 'sing', 'sings', 'quire', 'pest', 'pets', 'step', 'tare', 'olds', 'ding', 'dings', 'nil']) {
    assert.ok(solWords.has(w), 'missing ' + w);
  }
});
test('every solver word is a dictionary word, long enough, with a path that spells it', () => {
  assert.ok(sol.length > 50, 'only ' + sol.length);
  for (const s of sol) {
    assert.ok(dict.set.has(s.word), s.word);
    assert.ok(s.word.length >= 3);
    assert.ok(L.isValidPath(FIXED, s.path), s.word);
    assert.strictEqual(L.wordFromPath(FIXED, s.path), s.word);
  }
  assert.strictEqual(new Set(sol.map((s) => s.word)).size, sol.length, 'duplicates');
});
test('solver agrees with brute force (findPath over the whole dictionary)', () => {
  const brute = dict.words.filter((w) => L.findPath(FIXED, w));
  assert.deepStrictEqual([...solWords].sort(), brute.sort());
});
test('words that are not traceable are not found', () => {
  for (const w of ['zebra', 'tat', 'apes', 'quit', 'gnat', 'stair']) {
    if (L.findPath(FIXED, w) === null) assert.ok(!solWords.has(w), w);
  }
  assert.ok(!solWords.has('qire'));
});
test('minimum length is respected', () => {
  const sol4 = L.solve(FIXED, dict, 4);
  assert.ok(sol4.every((s) => s.word.length >= 4));
  assert.strictEqual(sol4.length, sol.filter((s) => s.word.length >= 4).length);
});
test('sorted longest first, then alphabetical', () => {
  for (let i = 1; i < sol.length; i++) assert.ok(L.compareWords(sol[i - 1], sol[i]) < 0);
});
test('solver is fast (well under 200 ms) on 4x4 and 5x5 boards', () => {
  let worst = 0;
  for (const size of [4, 5]) {
    for (let s = 0; s < 40; s++) {
      const b = L.shake(size, L.mulberry32(1000 + s));
      const t0 = process.hrtime.bigint();
      L.solve(b, dict, L.MODES[size].minLen);
      const ms = Number(process.hrtime.bigint() - t0) / 1e6;
      worst = Math.max(worst, ms);
    }
  }
  console.log('       worst solve: ' + worst.toFixed(1) + ' ms');
  assert.ok(worst < 100, 'worst ' + worst + 'ms');
});
test('generateBoard rerolls thin boards', () => {
  for (let s = 0; s < 30; s++) {
    const g = L.generateBoard(4, L.mulberry32(s), dict);
    assert.ok(g.solution.length >= L.MIN_BOARD_WORDS);
  }
  // A dictionary too small to ever reach 30 keeps going until the cap.
  const tiny = L.makeDictionary(['tea', 'eat', 'ate']);
  const g = L.generateBoard(4, L.mulberry32(5), tiny);
  assert.strictEqual(g.tries, 200);
});

console.log('scoring and cancellation');
test('scoring table', () => {
  const table = { ab: 0, abc: 1, abcd: 1, abcde: 2, abcdef: 3, abcdefg: 5, abcdefgh: 11, abcdefghijklmnop: 11 };
  for (const w in table) assert.strictEqual(L.scoreWord(w), table[w], w);
  assert.strictEqual(L.scoreList(['tea', 'tapes', 'quire', 'stinger']), 1 + 2 + 2 + 5);
});
test('words both players found are cancelled', () => {
  const r = L.cancelWords(['tape', 'rest', 'quire', 'tapes'], ['rest', 'sting', 'tapes', 'olds']);
  assert.deepStrictEqual(r.shared.sort(), ['rest', 'tapes']);
  assert.deepStrictEqual(r.mine, ['tape', 'quire']);
  assert.deepStrictEqual(r.theirs, ['sting', 'olds']);
  assert.strictEqual(r.myScore, 1 + 2);
  assert.strictEqual(r.theirScore, 2 + 1);
  const none = L.cancelWords(['a1'], []);
  assert.deepStrictEqual(none.shared, []);
  const all = L.cancelWords(['tea', 'eat'], ['eat', 'tea']);
  assert.strictEqual(all.myScore + all.theirScore, 0);
});

console.log('daily seed');
test('daily seed is deterministic and differs by day and size', () => {
  const d = new Date(2026, 9, 10, 15, 30);
  assert.strictEqual(L.dateKey(d), '2026-10-10');
  assert.strictEqual(L.dateKey(new Date(2026, 9, 10, 0, 1)), '2026-10-10');
  assert.strictEqual(L.dailySeed('2026-10-10', 4), L.dailySeed('2026-10-10', 4));
  assert.notStrictEqual(L.dailySeed('2026-10-10', 4), L.dailySeed('2026-10-11', 4));
  assert.notStrictEqual(L.dailySeed('2026-10-10', 4), L.dailySeed('2026-10-10', 5));
  assert.strictEqual(L.dailyNumber(new Date(2026, 0, 1)), 1);
  assert.strictEqual(L.dailyNumber(new Date(2026, 9, 10)), 283);
});
test('same day gives the same board (after rerolls)', () => {
  for (const size of [4, 5]) {
    const seed = L.dailySeed('2026-10-10', size);
    const a = L.generateBoard(size, L.mulberry32(seed), dict);
    const b = L.generateBoard(size, L.mulberry32(seed), dict);
    assert.deepStrictEqual(a.board, b.board);
    assert.strictEqual(a.solution.length, b.solution.length);
    const c = L.generateBoard(size, L.mulberry32(L.dailySeed('2026-10-11', size)), dict);
    assert.notDeepStrictEqual(a.board, c.board);
  }
});

console.log('cpu');
test('bot plans are subsets of the solution, sorted by time, within the round', () => {
  const g = L.generateBoard(4, L.mulberry32(77), dict);
  const all = new Set(g.solution.map((s) => s.word));
  const counts = {};
  for (const level of ['easy', 'normal', 'hard']) {
    let total = 0, len = 0, n = 0;
    for (let s = 0; s < 20; s++) {
      const plan = L.planBot(g.solution, level, 180, L.mulberry32(s), 3, dict);
      assert.ok(plan.length >= 1);
      assert.strictEqual(new Set(plan.map((p) => p.word)).size, plan.length);
      for (let i = 0; i < plan.length; i++) {
        assert.ok(all.has(plan[i].word));
        assert.ok(plan[i].t > 0 && plan[i].t < 180);
        if (i) assert.ok(plan[i].t >= plan[i - 1].t);
        len += plan[i].word.length; n++;
      }
      total += plan.length;
    }
    counts[level] = { words: total / 20, avgLen: len / n };
  }
  console.log('       ' + g.solution.length + ' words on board; bot avg ' + JSON.stringify(counts));
  assert.ok(counts.easy.words < counts.normal.words && counts.normal.words < counts.hard.words);
  assert.ok(counts.easy.avgLen < counts.hard.avgLen);
});
test('familiarity prefers everyday words', () => {
  assert.ok(L.familiarity('lie', dict) > L.familiarity('edh', dict));
  assert.ok(L.familiarity('tea', dict) > L.familiarity('qat', dict));
  assert.strictEqual(L.prefixCount(dict, 'zzzzq'), 0);
});
test('stats record best, outcomes and longest word', () => {
  let s = L.newStats();
  let r = L.recordGame(s, 10, ['tea', 'tapes'], 'win');
  assert.ok(r.isBest);
  r = L.recordGame(r.stats, 4, ['stinger'], 'loss');
  assert.ok(!r.isBest);
  assert.deepStrictEqual([r.stats.played, r.stats.best, r.stats.wins, r.stats.losses, r.stats.longest, r.stats.totalWords], [2, 10, 1, 1, 'stinger', 3]);
  assert.deepStrictEqual(L.sanitizeStats({ played: -3, best: 'x', longest: '<b>' }), L.newStats());
});

console.log('\n' + passed + ' passed, ' + failed + ' failed');
process.exit(failed ? 1 : 0);
