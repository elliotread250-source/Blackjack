/* English pool (UK 8-ball / blackball) rules.
 *
 * Two rule sets:
 *  - 'pub'  Pub rules: a foul gives the opponent two visits ("2 shots"), the
 *           first of which is a free shot (any ball may be hit first). Only
 *           one visit when the incoming player is on the black. After an
 *           in-off or the cue ball leaving the table the cue ball is in hand
 *           behind the baulk line and must be played out of baulk.
 *  - 'wpa'  Blackball (WPA/EPA): a foul gives the opponent ball in hand
 *           anywhere and one visit.
 *
 * Ball numbers: 0 cue, 1-7 red, 8 black, 9-15 yellow. Groups: 1 red, 2 yellow.
 * Pure functions on plain objects, so the same code runs in the browser, in
 * node unit tests, inside the bot's look-ahead and in network sync.
 */
(function (root) {
  'use strict';

  var RED = 1, YELLOW = 2;
  var GROUP_NAME = ['', 'Red', 'Yellow'];

  function groupOf(b) { return b >= 1 && b <= 7 ? RED : (b >= 9 && b <= 15 ? YELLOW : 0); }
  function ballsOf(g) { return g === RED ? [1, 2, 3, 4, 5, 6, 7] : g === YELLOW ? [9, 10, 11, 12, 13, 14, 15] : []; }

  function newFrame(opts) {
    opts = opts || {};
    return {
      mode: opts.mode === 'wpa' ? 'wpa' : 'pub',
      callBlack: !!opts.callBlack,
      turn: opts.breaker ? 1 : 0,
      breaker: opts.breaker ? 1 : 0,
      groups: [0, 0],
      brk: true,          // next shot is the break
      visits: 1,          // visits left this turn, counting the current one
      free: false,        // pub: this shot is a free shot
      bih: true,          // cue ball in hand
      baulk: true,        // ...but only behind the baulk line
      outOfBaulk: false,  // must play out of baulk (pub, after an in-off)
      down: [],           // object balls potted so far
      winner: -1,
      reason: '',
      shots: 0
    };
  }

  function clone(s) {
    var o = {};
    for (var k in s) o[k] = Array.isArray(s[k]) ? s[k].slice() : s[k];
    return o;
  }

  function remaining(st, g) {
    if (!g) return 7;
    var n = 0, list = ballsOf(g);
    for (var i = 0; i < list.length; i++) if (st.down.indexOf(list[i]) < 0) n++;
    return n;
  }
  function isOpen(st) { return !st.groups[0] && !st.groups[1]; }
  function onBlack(st, p) { var g = st.groups[p]; return !!g && remaining(st, g) === 0; }

  /** May the current shooter hit ball b first? (ignores the baulk rule) */
  function legalFirst(st, b) {
    if (b <= 0) return false;
    if (st.brk || st.free) return true;
    var p = st.turn;
    if (isOpen(st)) return b !== 8;
    if (onBlack(st, p)) return b === 8;
    return groupOf(b) === st.groups[p];
  }

  /** Balls the shooter is trying to pot. */
  function potTargets(st) {
    var p = st.turn, out = [], b;
    if (onBlack(st, p)) return [8];
    if (isOpen(st)) { for (b = 1; b <= 15; b++) if (b !== 8 && st.down.indexOf(b) < 0) out.push(b); return out; }
    var list = ballsOf(st.groups[p]);
    for (var i = 0; i < list.length; i++) if (st.down.indexOf(list[i]) < 0) out.push(list[i]);
    return out;
  }

  var FOUL_TEXT = {
    inoff: 'in-off',
    off: 'cue ball off the table',
    nohit: 'no ball hit',
    wrongfirst: 'wrong ball hit first',
    blackfirst: 'hit the black first',
    notblack: 'must hit the black first',
    potopp: "potted an opponent's ball",
    norail: 'no ball reached a cushion',
    baulk: 'must play out of baulk',
    badbreak: 'illegal break (fewer than two balls hit a cushion)'
  };

  /**
   * Apply one shot. shot = {
   *   first: first ball the cue ball hit (-1 none),
   *   potted: balls potted in order (0 = in-off),
   *   rail: a ball touched a cushion after first contact,
   *   cueOff: cue ball left the table,
   *   railBalls: number of object balls that touched a cushion (break),
   *   firstInBaulk: the first ball hit was in baulk when the shot started,
   *   cueLeftBaulk: the cue ball crossed the baulk line before first contact,
   *   blackPocket: pocket the black went into (-1), call: called pocket (-1)
   * }
   * Returns { state, foul, cont, assigned, winner, reason, rerack, ownPotted }.
   */
  function evaluate(st, shot) {
    var p = st.turn, o = 1 - p;
    var ns = clone(st);
    ns.shots = st.shots + 1;
    var potted = shot.potted || [];
    var cueIn = potted.indexOf(0) >= 0;
    var cueOff = !!shot.cueOff;
    var blackIn = potted.indexOf(8) >= 0;
    var colours = [];
    for (var i = 0; i < potted.length; i++) if (potted[i] !== 0 && potted[i] !== 8) colours.push(potted[i]);
    var first = shot.first === undefined ? -1 : shot.first;
    var res = { state: ns, foul: '', cont: false, assigned: 0, winner: -1, reason: '', rerack: false, ownPotted: 0, potted: colours.slice(), shooter: p };

    // ---------------------------------------------------------- break
    if (st.brk) {
      if (blackIn) {
        var fresh = newFrame({ mode: st.mode, callBlack: st.callBlack, breaker: p });
        fresh.shots = ns.shots;
        res.state = fresh; res.rerack = true; res.reason = 'blackbreak';
        return res;
      }
      var bf = '';
      if (cueOff) bf = 'off';
      else if (cueIn) bf = 'inoff';
      else if (first < 0) bf = 'nohit';
      else if (colours.length === 0 && (shot.railBalls || 0) < 2) bf = 'badbreak';
      for (var k = 0; k < colours.length; k++) if (ns.down.indexOf(colours[k]) < 0) ns.down.push(colours[k]);
      ns.brk = false;
      res.foul = bf;
      return finish(st, ns, res, !bf && colours.length > 0);
    }

    // ---------------------------------------------------------- fouls
    var open = isOpen(st);
    var myG = st.groups[p], oppG = st.groups[o];
    var wasOnBlack = onBlack(st, p);
    var foul = '';
    if (cueOff) foul = 'off';
    else if (cueIn) foul = 'inoff';
    else if (first < 0) foul = 'nohit';
    else if (!st.free) {
      if (open) { if (first === 8) foul = 'blackfirst'; }
      else if (wasOnBlack) { if (first !== 8) foul = 'notblack'; }
      else if (first === 8) foul = 'blackfirst';
      else if (groupOf(first) !== myG) foul = 'wrongfirst';
      if (!foul && st.outOfBaulk && shot.firstInBaulk && !shot.cueLeftBaulk) foul = 'baulk';
    }
    if (!foul && !open) {
      for (var c = 0; c < colours.length; c++) if (groupOf(colours[c]) === oppG) { foul = 'potopp'; break; }
    }
    if (!foul && potted.length === 0 && !shot.rail) foul = 'norail';
    res.foul = foul;

    for (var d = 0; d < potted.length; d++) {
      var b = potted[d];
      if (b !== 0 && ns.down.indexOf(b) < 0) ns.down.push(b);
    }

    // ---------------------------------------------------------- the black
    if (blackIn) {
      var win;
      if (!wasOnBlack) { win = o; res.reason = 'blackearly'; }
      else if (foul) { win = o; res.reason = 'blackfoul'; }
      else if (st.callBlack && shot.call >= 0 && shot.blackPocket !== shot.call) { win = o; res.reason = 'blackpocket'; }
      else { win = p; res.reason = 'black'; }
      ns.winner = win; ns.reason = res.reason; res.winner = win;
      ns.bih = false; ns.free = false; ns.outOfBaulk = false; ns.baulk = false;
      return res;
    }

    // ---------------------------------------------------------- groups
    if (!foul && open && colours.length) {
      var g = groupOf(colours[0]);
      ns.groups[p] = g; ns.groups[o] = g === RED ? YELLOW : RED;
      res.assigned = g;
    }
    var mine = ns.groups[p];
    var own = 0;
    for (var e = 0; e < colours.length; e++) if (mine && groupOf(colours[e]) === mine) own++;
    res.ownPotted = own;
    return finish(st, ns, res, !foul && own > 0);
  }

  // turn hand-over after a shot (no winner)
  function finish(st, ns, res, potted) {
    var p = st.turn, o = 1 - p;
    ns.free = false; ns.bih = false; ns.baulk = false; ns.outOfBaulk = false;
    if (res.foul) {
      ns.turn = o;
      if (st.mode === 'wpa') {
        ns.visits = 1; ns.bih = true;
      } else {
        var oppBlack = onBlack(ns, o);
        ns.visits = oppBlack ? 1 : 2;
        ns.free = !oppBlack;
        if (res.foul === 'inoff' || res.foul === 'off') { ns.bih = true; ns.baulk = true; ns.outOfBaulk = true; }
      }
      res.cont = false;
      return res;
    }
    if (potted) {
      ns.turn = p;
      if (onBlack(ns, p) && ns.visits > 1) ns.visits = 1;   // two shots are not carried onto the black
      res.cont = true;
      return res;
    }
    var left = st.visits - 1;
    if (left > 0 && !onBlack(ns, p)) {
      ns.turn = p; ns.visits = left;
      res.cont = true; res.visitUsed = true;
    } else {
      ns.turn = o; ns.visits = 1;
      res.cont = false;
    }
    return res;
  }

  function label(st, p, names) {
    var g = st.groups[p];
    return g ? GROUP_NAME[g] : (names && names[p]) || ('Player ' + (p + 1));
  }

  /** Human-readable messages for a shot result. */
  function describe(prev, res, names) {
    var st = res.state, out = [];
    var p = prev.turn, o = 1 - p;
    var who = function (q) { return label(st, q, names); };
    var nm = function (q) { return (names && names[q]) || ('Player ' + (q + 1)); };
    if (res.rerack) {
      out.push('Black potted on the break. Re-rack: ' + nm(p) + ' breaks again');
      return out;
    }
    if (res.winner >= 0) {
      var w = res.winner;
      var why = {
        black: nm(w) + ' pots the black and wins the frame!',
        blackearly: nm(p) + ' potted the black too early. ' + nm(w) + ' wins',
        blackfoul: nm(p) + ' fouled on the black. ' + nm(w) + ' wins',
        blackpocket: 'Black went in the wrong pocket. ' + nm(w) + ' wins'
      }[res.reason] || (nm(w) + ' wins');
      out.push(why);
      return out;
    }
    if (res.assigned) out.push(nm(p) + ' is ' + GROUP_NAME[res.assigned].toLowerCase());
    if (res.foul) {
      var t = 'Foul: ' + FOUL_TEXT[res.foul] + '. ';
      if (st.mode === 'wpa') t += who(o) + ' has ball in hand';
      else {
        t += who(o) + ' has ' + (st.visits === 2 ? '2 shots' : '1 shot');
        if (st.visits === 1 && onBlack(st, o)) t += ' (on the black)';
        if (st.bih) t += ', ball in hand behind baulk';
      }
      out.push(t);
      return out;
    }
    if (res.cont && res.visitUsed) out.push(who(p) + ': second shot');
    else if (!res.cont) out.push(nm(st.turn) + "'s turn");
    if (onBlack(st, st.turn) && !onBlack(prev, st.turn)) out.push(nm(st.turn) + ' is on the black');
    return out;
  }

  /** Compact, validated copy of a rules state for the network. */
  function sanitize(s) {
    if (!s || typeof s !== 'object') return null;
    var ok = function (v, a, b) { return typeof v === 'number' && v === Math.floor(v) && v >= a && v <= b; };
    if (!ok(s.turn, 0, 1) || !ok(s.breaker, 0, 1) || !ok(s.visits, 0, 2) || !ok(s.winner, -1, 1)) return null;
    if (!Array.isArray(s.groups) || s.groups.length !== 2 || !ok(s.groups[0], 0, 2) || !ok(s.groups[1], 0, 2)) return null;
    if (!Array.isArray(s.down) || s.down.length > 15) return null;
    var down = [];
    for (var i = 0; i < s.down.length; i++) { if (!ok(s.down[i], 1, 15)) return null; if (down.indexOf(s.down[i]) < 0) down.push(s.down[i]); }
    return {
      mode: s.mode === 'wpa' ? 'wpa' : 'pub', callBlack: !!s.callBlack,
      turn: s.turn, breaker: s.breaker, groups: [s.groups[0], s.groups[1]],
      brk: !!s.brk, visits: s.visits, free: !!s.free, bih: !!s.bih, baulk: !!s.baulk, outOfBaulk: !!s.outOfBaulk,
      down: down, winner: s.winner, reason: typeof s.reason === 'string' ? s.reason.slice(0, 16) : '',
      shots: ok(s.shots, 0, 100000) ? s.shots : 0
    };
  }

  var api = {
    RED: RED, YELLOW: YELLOW, GROUP_NAME: GROUP_NAME, FOUL_TEXT: FOUL_TEXT,
    groupOf: groupOf, ballsOf: ballsOf, newFrame: newFrame, clone: clone, remaining: remaining,
    isOpen: isOpen, onBlack: onBlack, legalFirst: legalFirst, potTargets: potTargets,
    evaluate: evaluate, describe: describe, label: label, sanitize: sanitize
  };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.PoolRules = api;
})(typeof window !== 'undefined' ? window : globalThis);
