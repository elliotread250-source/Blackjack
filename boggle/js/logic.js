/*
 * Pure Boggle logic, no DOM: dice, shaking, adjacency, the solver, path
 * finding, scoring, cancellation, the daily seed and the CPU's plan.
 * Loaded as a plain script in the browser (window.BoggleLogic) and with
 * require() in node for tools/test.cjs.
 *
 * A board is an array of faces in row-major order. A face is a lowercase
 * string: one letter, or "qu" for the Qu face, which counts as two letters
 * everywhere (in the word, in its length and in its score).
 */
(function (root) {
  'use strict';

  // The 16 dice of modern Boggle (Hasbro, 2008 on). "Q" on a die is the Qu face.
  var CLASSIC_DICE = [
    'AAEEGN', 'ABBJOO', 'ACHOPS', 'AFFKPS',
    'AOOTTW', 'CIMOTU', 'DEILRX', 'DELRVY',
    'DISTTY', 'EEGHNW', 'EEINSU', 'EHRTVW',
    'EIOSST', 'ELRTTY', 'HIMNUQ', 'HLNNRZ'
  ];

  // The 25 dice of Big Boggle (5x5). DHLNOR really is in there twice.
  var BIG_DICE = [
    'AAAFRS', 'AAEEEE', 'AAFIRS', 'ADENNN', 'AEEEEM',
    'AEEGMU', 'AEGMNN', 'AFIRSY', 'BJKQXZ', 'CCENST',
    'CEIILT', 'CEILPT', 'CEIPST', 'DDHNOT', 'DHHLOR',
    'DHLNOR', 'DHLNOR', 'EIIITT', 'EMOTTT', 'ENSSSU',
    'FIPRSY', 'GORRVW', 'IPRRRY', 'NOOTUW', 'OOOTTU'
  ];

  var MODES = {
    4: { size: 4, dice: CLASSIC_DICE, minLen: 3, seconds: 180, name: 'Classic' },
    5: { size: 5, dice: BIG_DICE, minLen: 4, seconds: 240, name: 'Big Boggle' }
  };

  // Boards with fewer findable words than this are reshaken.
  var MIN_BOARD_WORDS = 30;

  function faceOf(ch) {
    ch = String(ch).toLowerCase();
    return ch === 'q' ? 'qu' : ch;
  }

  function diceFor(size) {
    return MODES[size] ? MODES[size].dice : null;
  }

  /* ---------- random numbers ---------- */

  function mulberry32(a) {
    a = a >>> 0;
    return function () {
      a = (a + 0x6D2B79F5) | 0;
      var t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  // FNV-1a, for turning a date string into a seed.
  function hashString(s) {
    var h = 0x811c9dc5;
    for (var i = 0; i < s.length; i++) {
      h ^= s.charCodeAt(i);
      h = Math.imul(h, 0x01000193);
    }
    return h >>> 0;
  }

  function pad2(n) { return (n < 10 ? '0' : '') + n; }

  // Local calendar date, so the daily board changes at the player's midnight.
  function dateKey(date) {
    date = date || new Date();
    return date.getFullYear() + '-' + pad2(date.getMonth() + 1) + '-' + pad2(date.getDate());
  }

  // Daily #1 is 1 January 2026.
  function dailyNumber(date) {
    date = date || new Date();
    var t = Date.UTC(date.getFullYear(), date.getMonth(), date.getDate());
    return Math.round((t - Date.UTC(2026, 0, 1)) / 86400000) + 1;
  }

  // Same date + size gives the same seed for everyone. Don't change the
  // format or every daily board changes with it.
  function dailySeed(key, size) {
    return hashString('boggle-daily:' + key + ':' + size);
  }

  function randomSeed() {
    var c = root && root.crypto;
    if (c && c.getRandomValues) {
      var a = new Uint32Array(1);
      c.getRandomValues(a);
      return a[0];
    }
    return (Math.random() * 4294967296) >>> 0;
  }

  /* ---------- the board ---------- */

  // Shake: every die lands in a random cell, showing a random face.
  function shake(size, rnd) {
    var dice = diceFor(size);
    if (!dice) throw new Error('No dice for size ' + size);
    var order = dice.slice();
    for (var i = order.length - 1; i > 0; i--) {
      var j = Math.floor(rnd() * (i + 1));
      var t = order[i]; order[i] = order[j]; order[j] = t;
    }
    var board = new Array(order.length);
    for (var k = 0; k < order.length; k++) {
      board[k] = faceOf(order[k].charAt(Math.floor(rnd() * 6)));
    }
    return board;
  }

  var adjCache = {};
  function adjacency(size) {
    if (adjCache[size]) return adjCache[size];
    var adj = [];
    for (var r = 0; r < size; r++) {
      for (var c = 0; c < size; c++) {
        var list = [];
        for (var dr = -1; dr <= 1; dr++) {
          for (var dc = -1; dc <= 1; dc++) {
            if (!dr && !dc) continue;
            var rr = r + dr, cc = c + dc;
            if (rr >= 0 && rr < size && cc >= 0 && cc < size) list.push(rr * size + cc);
          }
        }
        adj.push(list);
      }
    }
    adjCache[size] = adj;
    return adj;
  }

  function sizeOf(board) {
    return Math.round(Math.sqrt(board.length));
  }

  function isAdjacent(size, a, b) {
    if (a === b) return false;
    var ra = Math.floor(a / size), ca = a % size;
    var rb = Math.floor(b / size), cb = b % size;
    return Math.abs(ra - rb) <= 1 && Math.abs(ca - cb) <= 1;
  }

  // A legal path: in bounds, no cell twice, each step to a neighbour.
  function isValidPath(board, path) {
    var size = sizeOf(board);
    if (!path || !path.length) return false;
    var seen = {};
    for (var i = 0; i < path.length; i++) {
      var p = path[i];
      if (typeof p !== 'number' || p < 0 || p >= board.length || p !== Math.floor(p) || seen[p]) return false;
      seen[p] = true;
      if (i > 0 && !isAdjacent(size, path[i - 1], p)) return false;
    }
    return true;
  }

  function wordFromPath(board, path) {
    var s = '';
    for (var i = 0; i < path.length; i++) s += board[path[i]];
    return s;
  }

  /*
   * Find a path that spells `word` (or, with allowPartial, a prefix of it
   * where a trailing "q" may stand for the start of a Qu face, so a typed
   * word lights up as it is typed). Returns cell indices or null.
   */
  function findPath(board, word, allowPartial) {
    word = String(word || '').toLowerCase();
    if (!word) return null;
    var size = sizeOf(board);
    var adj = adjacency(size);
    var used = new Array(board.length);
    var path = [];

    function matchAt(cell, pos) {
      var f = board[cell];
      if (word.substr(pos, f.length) === f) return f.length;
      if (allowPartial && f === 'qu' && pos === word.length - 1 && word.charAt(pos) === 'q') return 1;
      return 0;
    }

    function dfs(cell, pos) {
      var n = matchAt(cell, pos);
      if (!n) return false;
      used[cell] = true;
      path.push(cell);
      if (pos + n >= word.length) return true;
      var nb = adj[cell];
      for (var i = 0; i < nb.length; i++) {
        if (!used[nb[i]] && dfs(nb[i], pos + n)) return true;
      }
      used[cell] = false;
      path.pop();
      return false;
    }

    for (var c = 0; c < board.length; c++) {
      if (dfs(c, 0)) return path.slice();
    }
    return null;
  }

  /* ---------- dictionary ---------- */

  /*
   * A dictionary is the sorted word list plus a Set. The solver needs no
   * trie: the words sharing a prefix are a contiguous run of the sorted
   * list, so each step down the board narrows [lo, hi) with two binary
   * searches on the next character, and an empty run prunes the branch.
   */
  function makeDictionary(words) {
    var list = [];
    for (var i = 0; i < words.length; i++) {
      var w = words[i];
      if (w && /^[a-z]+$/.test(w)) list.push(w);
    }
    list.sort();
    var out = [];
    for (var j = 0; j < list.length; j++) if (j === 0 || list[j] !== list[j - 1]) out.push(list[j]);
    return { words: out, set: new Set(out) };
  }

  function parseWordList(text) {
    var lines = String(text).split('\n');
    var words = [];
    for (var i = 0; i < lines.length; i++) {
      var w = lines[i].trim().toLowerCase();
      if (w.length >= 3 && w.length <= 25 && /^[a-z]+$/.test(w)) words.push(w);
    }
    return makeDictionary(words);
  }

  function isWord(dict, word) {
    return dict.set.has(word);
  }

  // First index in [lo, hi) whose char at pos is >= code (words that end
  // before pos sort first and count as -1).
  function lowerBound(words, lo, hi, pos, code) {
    while (lo < hi) {
      var mid = (lo + hi) >>> 1;
      var w = words[mid];
      var ch = pos < w.length ? w.charCodeAt(pos) : -1;
      if (ch < code) lo = mid + 1; else hi = mid;
    }
    return lo;
  }

  /*
   * Every dictionary word on the board of at least minLen letters, each with
   * one path that spells it. Returns [{word, path}] sorted longest first,
   * then alphabetically.
   */
  function solve(board, dict, minLen) {
    minLen = minLen || 3;
    var words = dict.words;
    var size = sizeOf(board);
    var adj = adjacency(size);
    var used = new Array(board.length);
    var path = [];
    var found = {};
    var results = [];

    function dfs(cell, lo, hi, pos) {
      var f = board[cell];
      for (var k = 0; k < f.length; k++) {
        var code = f.charCodeAt(k);
        var a = lowerBound(words, lo, hi, pos + k, code);
        var b = lowerBound(words, a, hi, pos + k, code + 1);
        if (a >= b) return;
        lo = a; hi = b;
      }
      var len = pos + f.length;
      used[cell] = true;
      path.push(cell);
      var w = words[lo];
      if (w.length === len && len >= minLen && !found[w]) {
        found[w] = true;
        results.push({ word: w, path: path.slice() });
      }
      // Only go deeper if some word in the run is longer than the prefix.
      if (words[hi - 1].length > len) {
        var nb = adj[cell];
        for (var i = 0; i < nb.length; i++) {
          if (!used[nb[i]]) dfs(nb[i], lo, hi, len);
        }
      }
      used[cell] = false;
      path.pop();
    }

    for (var c = 0; c < board.length; c++) dfs(c, 0, words.length, 0);
    results.sort(compareWords);
    return results;
  }

  function compareWords(a, b) {
    var wa = a.word || a, wb = b.word || b;
    if (wa.length !== wb.length) return wb.length - wa.length;
    return wa < wb ? -1 : wa > wb ? 1 : 0;
  }

  /*
   * Shake boards from rnd until one has at least minWords words. Seeded rnd
   * in, same board out, so the daily board is the same for everyone.
   */
  function generateBoard(size, rnd, dict, opts) {
    opts = opts || {};
    var minWords = opts.minWords == null ? MIN_BOARD_WORDS : opts.minWords;
    var minLen = opts.minLen || MODES[size].minLen;
    var board, sol, tries = 0;
    do {
      board = shake(size, rnd);
      sol = dict ? solve(board, dict, minLen) : [];
      tries++;
    } while (dict && sol.length < minWords && tries < 200);
    return { board: board, solution: sol, tries: tries };
  }

  /* ---------- scoring ---------- */

  // Letters, with Qu as two: the word string already spells it out.
  function scoreWord(word) {
    var n = String(word).length;
    if (n < 3) return 0;
    if (n <= 4) return 1;
    if (n === 5) return 2;
    if (n === 6) return 3;
    if (n === 7) return 5;
    return 11;
  }

  function scoreList(words) {
    var s = 0;
    for (var i = 0; i < words.length; i++) s += scoreWord(words[i]);
    return s;
  }

  /*
   * Standard Boggle cancellation: a word that both players found scores for
   * neither. Returns each side's surviving words, the shared ones and scores.
   */
  function cancelWords(mine, theirs) {
    var a = {}, b = {}, i;
    for (i = 0; i < mine.length; i++) a[mine[i]] = true;
    for (i = 0; i < theirs.length; i++) b[theirs[i]] = true;
    var shared = [], mineOnly = [], theirsOnly = [];
    for (i = 0; i < mine.length; i++) {
      var w = mine[i];
      if (b[w]) { if (shared.indexOf(w) < 0) shared.push(w); } else mineOnly.push(w);
    }
    for (i = 0; i < theirs.length; i++) if (!a[theirs[i]]) theirsOnly.push(theirs[i]);
    return {
      mine: mineOnly,
      theirs: theirsOnly,
      shared: shared,
      myScore: scoreList(mineOnly),
      theirScore: scoreList(theirsOnly)
    };
  }

  /* ---------- the CPU ---------- */

  // Rough "how familiar is this word" from its letters: common letters in,
  // rare ones out. Lacking a frequency list, this keeps the easy bot on
  // words like "tea" and away from "qats".
  var LETTER_EASE = {
    e: 1, t: 1, a: 1, o: 1, i: 1, n: 1, s: 1, r: 1, h: 0.95, l: 0.95, d: 0.95,
    c: 0.9, u: 0.9, m: 0.9, p: 0.85, g: 0.85, b: 0.8, f: 0.8, w: 0.8, y: 0.8,
    k: 0.6, v: 0.6, j: 0.35, x: 0.35, q: 0.35, z: 0.35
  };

  // How many dictionary words start with this one (itself included). Common
  // short words head long runs (lie: lied, lien, lies, lieu...), oddities
  // like "edh" barely any.
  function prefixCount(dict, word) {
    var w = dict.words;
    var lo = 0, hi = w.length;
    for (var k = 0; k < word.length; k++) {
      var code = word.charCodeAt(k);
      lo = lowerBound(w, lo, hi, k, code);
      hi = lowerBound(w, lo, hi, k, code + 1);
      if (lo >= hi) return 0;
    }
    return hi - lo;
  }

  // 0..1. Letters are scored per letter (geometric mean) so length is
  // weighed separately; with a dictionary, prefix runs count too.
  function familiarity(word, dict) {
    var f = 1;
    for (var i = 0; i < word.length; i++) f *= LETTER_EASE[word.charAt(i)] || 0.5;
    f = Math.pow(f, 1 / Math.max(1, word.length));
    if (dict) {
      var need = word.length <= 4 ? 5 : word.length <= 6 ? 3 : 1.5;
      f *= Math.min(1, Math.log(1 + prefixCount(dict, word)) / Math.LN2 / need);
    }
    // Long consonant runs read as obscure (big word lists are full of them).
    if (/(?:[^aeiou]{4})/.test(word)) f *= 0.5;
    return f;
  }

  var BOT_LEVELS = {
    easy: { share: 0.07, base: 3, cap: 12, lenPow: 1.6, famPow: 6, maxLen: 6 },
    normal: { share: 0.16, base: 5, cap: 30, lenPow: 0.8, famPow: 3, maxLen: 8 },
    hard: { share: 0.32, base: 8, cap: 70, lenPow: 0.1, famPow: 1, maxLen: 25 }
  };

  /*
   * Decide up front which words the CPU will "find" and when, as a sorted
   * [{word, t}] with t in seconds. Weighted sampling without replacement
   * (Efraimidis-Spirakis), short familiar words weighted up on easy.
   * Finds come quicker early in the round and thin out, like a person's.
   */
  function planBot(solution, level, seconds, rnd, minLen, dict) {
    var cfg = BOT_LEVELS[level] || BOT_LEVELS.normal;
    minLen = minLen || 3;
    var pool = [];
    for (var i = 0; i < solution.length; i++) {
      var w = solution[i].word || solution[i];
      if (w.length > cfg.maxLen) continue;
      var extra = w.length - minLen + 1;
      var weight = Math.pow(1 / extra, cfg.lenPow) * Math.pow(familiarity(w, dict), cfg.famPow);
      if (weight <= 0) continue;
      var u = rnd();
      if (u <= 0) u = 1e-9;
      pool.push({ word: w, key: Math.log(u) / weight });
    }
    pool.sort(function (a, b) { return b.key - a.key; });
    var target = Math.min(cfg.cap, Math.round(cfg.base + solution.length * cfg.share));
    // A little round-to-round variation.
    target = Math.max(1, Math.round(target * (0.85 + rnd() * 0.3)));
    var picks = pool.slice(0, Math.min(target, pool.length));
    var plan = [];
    for (var j = 0; j < picks.length; j++) {
      // A few seconds to get going, then a decreasing rate.
      var t = 3 + (seconds - 5) * Math.pow(rnd(), 1.35);
      plan.push({ word: picks[j].word, t: Math.round(t * 10) / 10 });
    }
    plan.sort(function (a, b) { return a.t - b.t; });
    return plan;
  }

  /* ---------- stats ---------- */

  function newStats() {
    return { played: 0, best: 0, totalScore: 0, totalWords: 0, longest: '', wins: 0, losses: 0, ties: 0 };
  }

  function sanitizeStats(s) {
    var d = newStats();
    if (!s || typeof s !== 'object') return d;
    for (var k in d) {
      if (!Object.prototype.hasOwnProperty.call(d, k)) continue;
      if (typeof d[k] === 'number') d[k] = isFinite(s[k]) && s[k] >= 0 ? Math.floor(s[k]) : 0;
      else d[k] = typeof s[k] === 'string' && /^[a-z]{0,25}$/.test(s[k]) ? s[k] : '';
    }
    return d;
  }

  // outcome: 'win' | 'loss' | 'tie' | null (solo)
  function recordGame(stats, score, words, outcome) {
    var s = sanitizeStats(stats);
    s.played++;
    s.totalScore += score;
    s.totalWords += words.length;
    var isBest = score > s.best;
    if (isBest) s.best = score;
    for (var i = 0; i < words.length; i++) {
      if (words[i].length > s.longest.length) s.longest = words[i];
    }
    if (outcome === 'win') s.wins++;
    else if (outcome === 'loss') s.losses++;
    else if (outcome === 'tie') s.ties++;
    return { stats: s, isBest: isBest && score > 0 };
  }

  var api = {
    CLASSIC_DICE: CLASSIC_DICE,
    BIG_DICE: BIG_DICE,
    MODES: MODES,
    MIN_BOARD_WORDS: MIN_BOARD_WORDS,
    BOT_LEVELS: BOT_LEVELS,
    faceOf: faceOf,
    diceFor: diceFor,
    mulberry32: mulberry32,
    hashString: hashString,
    dateKey: dateKey,
    dailyNumber: dailyNumber,
    dailySeed: dailySeed,
    randomSeed: randomSeed,
    shake: shake,
    adjacency: adjacency,
    isAdjacent: isAdjacent,
    isValidPath: isValidPath,
    wordFromPath: wordFromPath,
    findPath: findPath,
    makeDictionary: makeDictionary,
    parseWordList: parseWordList,
    isWord: isWord,
    solve: solve,
    compareWords: compareWords,
    generateBoard: generateBoard,
    scoreWord: scoreWord,
    scoreList: scoreList,
    cancelWords: cancelWords,
    familiarity: familiarity,
    prefixCount: prefixCount,
    planBot: planBot,
    newStats: newStats,
    sanitizeStats: sanitizeStats,
    recordGame: recordGame
  };

  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.BoggleLogic = api;
})(typeof window !== 'undefined' ? window : this);
