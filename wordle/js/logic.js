/*
 * Pure game logic, no DOM. Loaded as a plain script in the browser
 * (window.WordleLogic) and with require() in node for the unit tests.
 */
(function (root) {
  'use strict';

  var WORD_LEN = 5;
  var MAX_GUESSES = 6;

  // Puzzle #1 is 1 January 2026 (local date). Changing this, the seed or the
  // answer list would change everyone's daily word, so don't.
  var EPOCH = { y: 2026, m: 0, d: 1 };
  var DAILY_SEED = 0x5eed2026;
  var DAY_MS = 86400000;

  var CORRECT = 'correct';
  var PRESENT = 'present';
  var ABSENT = 'absent';
  var RANK = { absent: 1, present: 2, correct: 3 };

  /*
   * Colour a guess against the answer. Two passes so duplicate letters come
   * out right: exact matches first claim their letters, then each remaining
   * guess letter (left to right) is "present" only while an unclaimed copy of
   * it is left in the answer. ABBEY vs BABES -> present present correct
   * correct absent.
   */
  function scoreGuess(guess, answer) {
    guess = String(guess).toLowerCase();
    answer = String(answer).toLowerCase();
    var n = answer.length;
    var marks = new Array(n);
    var left = {};
    var i, ch;
    for (i = 0; i < n; i++) {
      if (guess[i] === answer[i]) {
        marks[i] = CORRECT;
      } else {
        ch = answer[i];
        left[ch] = (left[ch] || 0) + 1;
      }
    }
    for (i = 0; i < n; i++) {
      if (marks[i]) continue;
      ch = guess[i];
      if (left[ch] > 0) {
        marks[i] = PRESENT;
        left[ch]--;
      } else {
        marks[i] = ABSENT;
      }
    }
    return marks;
  }

  function isWin(marks) {
    for (var i = 0; i < marks.length; i++) if (marks[i] !== CORRECT) return false;
    return marks.length > 0;
  }

  function ordinal(n) {
    var s = ['th', 'st', 'nd', 'rd'];
    var v = n % 100;
    return n + (s[(v - 20) % 10] || s[v] || s[0]);
  }

  var TIMES = ['', '', 'twice', 'three times', 'four times', 'five times'];

  /*
   * Hard mode: every revealed hint must be used. Greens must stay where they
   * are, and every letter shown green or yellow must appear at least as many
   * times as it was revealed in any single earlier row (two yellow Es means
   * the next guess needs two Es). Grey letters may be reused, as in the NYT
   * game. Returns the toast text for the first rule broken, or null.
   *
   * history: [{ word: 'crane', marks: [...] }, ...]
   */
  function hardModeError(guess, history) {
    guess = String(guess).toLowerCase();
    var i, j, h;
    for (j = 0; j < history.length; j++) {
      h = history[j];
      for (i = 0; i < h.word.length; i++) {
        if (h.marks[i] === CORRECT && guess[i] !== h.word[i]) {
          return ordinal(i + 1) + ' letter must be ' + h.word[i].toUpperCase();
        }
      }
    }
    var need = {};
    var order = [];
    for (j = 0; j < history.length; j++) {
      h = history[j];
      var counts = {};
      for (i = 0; i < h.word.length; i++) {
        if (h.marks[i] === CORRECT || h.marks[i] === PRESENT) {
          var c = h.word[i];
          counts[c] = (counts[c] || 0) + 1;
          if (order.indexOf(c) < 0) order.push(c);
        }
      }
      for (var k in counts) {
        if (Object.prototype.hasOwnProperty.call(counts, k) && (!need[k] || counts[k] > need[k])) need[k] = counts[k];
      }
    }
    for (j = 0; j < order.length; j++) {
      var letter = order[j];
      var have = 0;
      for (i = 0; i < guess.length; i++) if (guess[i] === letter) have++;
      if (have < need[letter]) {
        var msg = 'Guess must contain ' + letter.toUpperCase();
        if (need[letter] > 1) msg += ' ' + (TIMES[need[letter]] || need[letter] + ' times');
        return msg;
      }
    }
    return null;
  }

  // Best state known for each letter, for colouring the keyboard.
  function letterStates(history) {
    var out = {};
    for (var j = 0; j < history.length; j++) {
      var h = history[j];
      for (var i = 0; i < h.word.length; i++) {
        var c = h.word[i];
        var m = h.marks[i];
        if (!out[c] || RANK[m] > RANK[out[c]]) out[c] = m;
      }
    }
    return out;
  }

  /*
   * Day number of a local calendar date, counted from EPOCH. Built from the
   * local year/month/day through Date.UTC so daylight-saving shifts can't
   * make a day 23 or 25 hours long and skip or repeat a puzzle.
   */
  function dayIndex(date) {
    date = date || new Date();
    var t = Date.UTC(date.getFullYear(), date.getMonth(), date.getDate());
    var e = Date.UTC(EPOCH.y, EPOCH.m, EPOCH.d);
    return Math.round((t - e) / DAY_MS);
  }

  function puzzleNumber(day) {
    return day + 1;
  }

  // Milliseconds until the next local midnight.
  function msUntilTomorrow(now) {
    now = now || new Date();
    var next = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 0, 0, 0, 0);
    return Math.max(0, next.getTime() - now.getTime());
  }

  function mulberry32(a) {
    return function () {
      a = (a + 0x6D2B79F5) | 0;
      var t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  // A fixed shuffle of 0..n-1, so consecutive days don't walk the list in
  // alphabetical order and no word repeats until every word has been used.
  var permCache = {};
  function permutation(n, seed) {
    var key = n + ':' + seed;
    if (permCache[key]) return permCache[key];
    var p = new Array(n);
    var i;
    for (i = 0; i < n; i++) p[i] = i;
    var rnd = mulberry32(seed);
    for (i = n - 1; i > 0; i--) {
      var j = Math.floor(rnd() * (i + 1));
      var t = p[i]; p[i] = p[j]; p[j] = t;
    }
    permCache[key] = p;
    return p;
  }

  function dailyAnswerForDay(day, answers) {
    var n = answers.length;
    var idx = ((day % n) + n) % n;
    return answers[permutation(n, DAILY_SEED)[idx]];
  }

  function dailyAnswer(date, answers) {
    return dailyAnswerForDay(dayIndex(date), answers);
  }

  // Random answer for Unlimited, avoiding recently played words.
  function randomAnswer(answers, recent, rnd) {
    rnd = rnd || Math.random;
    var avoid = {};
    (recent || []).forEach(function (w) { avoid[w] = true; });
    for (var tries = 0; tries < 50; tries++) {
      var w = answers[Math.floor(rnd() * answers.length)];
      if (!avoid[w]) return w;
    }
    return answers[Math.floor(rnd() * answers.length)];
  }

  var WIN_WORDS = ['Genius', 'Magnificent', 'Impressive', 'Splendid', 'Great', 'Phew'];
  function winMessage(guessCount) {
    return WIN_WORDS[Math.max(0, Math.min(WIN_WORDS.length - 1, guessCount - 1))];
  }

  var EMOJI = {
    normal: { correct: '🟩', present: '🟨' },      // green, yellow squares
    contrast: { correct: '🟧', present: '🟦' }     // orange, blue squares
  };

  /*
   * opts: { label, rows: [marks...], won, hard, dark, contrast, url }
   * -> "Wordle (Open Arcade) 281 4/6*\n\n<grid>"
   */
  function shareText(opts) {
    var set = opts.contrast ? EMOJI.contrast : EMOJI.normal;
    var absent = opts.dark ? '⬛' : '⬜';   // black / white large square
    var score = (opts.won ? opts.rows.length : 'X') + '/' + MAX_GUESSES + (opts.hard ? '*' : '');
    var lines = ['Wordle (Open Arcade) ' + opts.label + ' ' + score, ''];
    opts.rows.forEach(function (marks) {
      lines.push(marks.map(function (m) {
        return m === CORRECT ? set.correct : m === PRESENT ? set.present : absent;
      }).join(''));
    });
    if (opts.url) lines.push('', opts.url);
    return lines.join('\n');
  }

  // ---- statistics ----

  function newStats() {
    return {
      played: 0,
      wins: 0,
      currentStreak: 0,
      maxStreak: 0,
      dist: [0, 0, 0, 0, 0, 0],
      fails: 0,
      lastDay: null,     // daily: day index of the last recorded game
      lastWinDay: null   // daily: day index of the last win
    };
  }

  function sanitizeStats(s) {
    var d = newStats();
    if (!s || typeof s !== 'object') return d;
    ['played', 'wins', 'currentStreak', 'maxStreak', 'fails'].forEach(function (k) {
      var v = Number(s[k]);
      d[k] = isFinite(v) && v >= 0 ? Math.floor(v) : 0;
    });
    if (Array.isArray(s.dist)) {
      for (var i = 0; i < 6; i++) {
        var v = Number(s.dist[i]);
        d.dist[i] = isFinite(v) && v >= 0 ? Math.floor(v) : 0;
      }
    }
    if (typeof s.lastDay === 'number') d.lastDay = s.lastDay;
    if (typeof s.lastWinDay === 'number') d.lastWinDay = s.lastWinDay;
    return d;
  }

  /*
   * Record a finished game. For daily games pass day: a daily streak only
   * continues from yesterday's win, and the same day is never counted twice.
   * Returns false if the result was already recorded.
   */
  function recordResult(stats, result) {
    var daily = typeof result.day === 'number';
    if (daily && stats.lastDay !== null && result.day <= stats.lastDay) return false;
    stats.played++;
    if (result.won) {
      stats.wins++;
      stats.dist[result.guesses - 1]++;
      if (daily) {
        stats.currentStreak = stats.lastWinDay === result.day - 1 ? stats.currentStreak + 1 : 1;
        stats.lastWinDay = result.day;
      } else {
        stats.currentStreak++;
      }
      if (stats.currentStreak > stats.maxStreak) stats.maxStreak = stats.currentStreak;
    } else {
      stats.fails++;
      stats.currentStreak = 0;
    }
    if (daily) stats.lastDay = result.day;
    return true;
  }

  // The streak to show today: a daily streak lapses once a day is missed.
  function displayStreak(stats, today) {
    if (typeof today === 'number' && stats.lastWinDay !== null && stats.lastWinDay < today - 1) return 0;
    return stats.currentStreak;
  }

  var api = {
    WORD_LEN: WORD_LEN,
    MAX_GUESSES: MAX_GUESSES,
    CORRECT: CORRECT,
    PRESENT: PRESENT,
    ABSENT: ABSENT,
    scoreGuess: scoreGuess,
    isWin: isWin,
    ordinal: ordinal,
    hardModeError: hardModeError,
    letterStates: letterStates,
    dayIndex: dayIndex,
    puzzleNumber: puzzleNumber,
    msUntilTomorrow: msUntilTomorrow,
    permutation: permutation,
    dailyAnswer: dailyAnswer,
    dailyAnswerForDay: dailyAnswerForDay,
    randomAnswer: randomAnswer,
    winMessage: winMessage,
    shareText: shareText,
    newStats: newStats,
    sanitizeStats: sanitizeStats,
    recordResult: recordResult,
    displayStreak: displayStreak
  };

  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.WordleLogic = api;
})(typeof window !== 'undefined' ? window : this);
