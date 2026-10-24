// One match: the game state (score, clock, downs, possessions) and the on-field play simulation.
// Units are yards. x runs along the field: our goal line is x = 0, theirs is x = 100 (end zones to -10 and 110).
// y runs across it, 0 (top sideline) to 53.3 (bottom). Our offense always attacks to the right.
// Rendering and input live elsewhere; this module only takes intents (snap, aim, throw, steer, dive, kick).
import { driveOutcome } from './career.js';
import { rating } from './data.js';

export const FIELD_W = 53.3;
const MID = FIELD_W / 2;
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);

const ROUTES = {
  go: [[30, 0]], slant: [[3, 0], [14, 9]], out: [[8, 0], [8.5, -9]], in: [[9, 0], [9.5, 12]], post: [[11, 0], [30, 9]],
  corner: [[11, 0], [26, -10]], curl: [[12, 0], [10, 1.5]], comeback: [[14, 0], [11.5, -3]], drag: [[2, 0], [5, 22]],
  seam: [[25, 1]], wheel: [[4, -3], [26, -4]], hitch: [[6, 0], [5, 0.5]],
};
const STOP_ROUTES = new Set(['curl', 'comeback', 'hitch']);
const WR_ROUTES = ['go', 'slant', 'out', 'in', 'post', 'corner', 'curl', 'comeback', 'hitch'];
const TE_ROUTES = ['seam', 'drag', 'out', 'curl', 'in', 'corner'];

export class Match {
  constructor({ us, them, roster, oppRating, ourDef, quarter = 4, playoff = false, seed = Date.now(), facilities = {} }) {
    this.us = us; this.them = them;                       // team objects {id, city, c1, c2}
    this.roster = roster;                                  // slot -> player (backups already substituted)
    this.opp = oppRating;                                  // {off, def}
    this.ourDef = ourDef;
    this.qLen = quarter * 60;
    this.playoff = playoff;
    this.fac = facilities;
    this.rs = seed >>> 0;
    this.score = { us: 0, them: 0 };
    this.q = 1; this.clock = this.qLen;
    this.timeouts = 3;
    this.stage = 'coin';
    this.msg = null;
    this.log = [];
    this.stats = {};
    this.drives = { us: 0, them: 0 };
    this.ot = null;
    this.clockRunning = false;
    this.pendingRunoff = 0;
    this.weReceive2nd = null;
    this.down = 1; this.toGo = 10; this.los = 25; this.fd = 35;
    this.hash = MID;
    this.play = null;
    this.kick = null;
    this.summary = null;
  }

  rand() {
    let t = (this.rs = (this.rs + 0x6D2B79F5) >>> 0);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }
  gauss() { return (this.rand() + this.rand() + this.rand() - 1.5) / 1.5 * 1.7; }
  stat(p, k, n = 1) { if (p && p.id > 0) { const s = (this.stats[p.id] ||= {}); s[k] = (s[k] || 0) + n; } }
  say(text, kind = 'info') { this.log.unshift({ text, kind, q: this.q, clock: this.clock }); this.log.length = Math.min(this.log.length, 40); }

  // ------------------------------------------------------------ game flow
  coinToss() {
    const weWin = this.rand() < 0.5;
    this.weReceive2nd = !weWin;
    this.msg = { big: 'COIN TOSS', small: weWin ? `${this.us.city} win the toss and will receive` : `${this.them.city} win the toss and will receive` };
    this.after = weWin ? () => this.kickoffToUs() : () => this.oppPossession(75, 'kickoff');
    this.stage = 'banner';
    this.bannerT = 2.2;
  }

  kickoffToUs() {
    const ret = this.rand();
    const at = ret < 0.65 ? 25 : clamp(Math.round(15 + this.rand() * 25 + (ret > 0.98 ? 60 : 0)), 5, 100);
    if (at >= 100) {   // a kick return all the way
      this.score.us += 6;
      this.say(`${this.us.city} return the kickoff for a TOUCHDOWN!`, 'td');
      this.msg = { big: 'TOUCHDOWN!', small: 'Kick return all the way!' };
      this.stage = 'banner'; this.bannerT = 2.2; this.after = () => this.toPat();
      return;
    }
    this.newDrive(at);
  }

  newDrive(at) {
    this.drives.us++;
    this.los = at; this.down = 1; this.toGo = 10; this.fd = Math.min(100, at + 10);
    this.hash = MID;
    this.clockRunning = false;
    this.twoPoint = false;
    this.setupPlay();
  }

  setupPlay() {
    this.stage = 'presnap';
    this.play = buildPlay(this);
    this.msg = null;
  }

  // the play clock: a running game clock ticks while you line up (4x speed, up to 30 game seconds)
  update(dt) {
    if (this.stage === 'presnap' && this.clockRunning) {
      const step = Math.min(dt * 4, this.pendingRunoff);
      if (step > 0) { this.pendingRunoff -= step; this.tick(step); }
      if (this.clock <= 0 && !this.twoPoint) this.endOfPeriod();
    } else if (this.stage === 'live') {
      this.tick(dt);
      stepPlay(this, dt);
    } else if (this.stage === 'kick') {
      stepKick(this, dt);
    } else if (this.stage === 'banner' || this.stage === 'result') {
      this.bannerT -= dt;
      if (this.play && this.stage === 'result') stepPlay(this, dt, true);
      if (this.bannerT <= 0 && this.after) { const f = this.after; this.after = null; f(); }
    } else if (this.stage === 'opp') {
      this.oppT += dt;
      const lines = this.oppLines;
      while (this.oppShown < lines.length && this.oppT > lines[this.oppShown].at) this.oppShown++;
      if (this.oppT > this.oppDone) { this.stage = 'opp-wait'; }
    }
  }

  // game clock; returns true when the half/game has run out (handled at the next dead ball)
  tick(sec) {
    if (this.clock <= 0) return;
    this.clock = Math.max(0, this.clock - sec);
  }

  timeout() {
    if (this.stage !== 'presnap' || this.timeouts <= 0 || !this.clockRunning) return false;
    this.timeouts--;
    this.clockRunning = false;
    this.pendingRunoff = 0;
    this.say(`Timeout ${this.us.city} (${this.timeouts} left)`);
    return true;
  }

  snap() {
    if (this.stage !== 'presnap') return;
    if (this.clock <= 0 && !this.untimed) { this.endOfPeriod(); return; }
    this.stage = 'live';
    this.play.t = 0;
    this.play.live = true;
  }

  // called when the ball is dead after one of our plays
  playOver(res) {
    const P = this.play;
    P.live = false;
    this.stage = 'result';
    this.bannerT = res.banner === false ? 0.6 : 1.5;
    const qb = this.roster.QB;
    let spot = clamp(res.spot ?? this.los, 0.5, 99.5);
    const gained = Math.round(spot - this.los);
    this.clockRunning = !!res.running;
    // a minute of a real NFL quarter is about 2 plays; scale the between-play runoff to the chosen quarter length
    const hurry = (this.q === 2 || this.q >= 4) && this.clock < 120;
    this.pendingRunoff = this.clockRunning ? Math.round((hurry ? 6 : 26) * this.qLen / 900 * 2.2) : 0;
    if (res.kind === 'td') {
      if (this.twoPoint) {
        this.score.us += 2;
        this.msg = { big: '2 POINTS!', small: '' };
        this.say(`${this.us.city} 2-point conversion is GOOD`, 'td');
        this.after = () => this.kickoffAfterScore();
        return;
      }
      this.score.us += 6;
      this.msg = { big: 'TOUCHDOWN!', small: res.who ? `${res.who} scores` : '' };
      this.say(`TOUCHDOWN ${this.us.city}! ${res.who || ''}`, 'td');
      this.after = () => this.toPat();
      return;
    }
    if (this.twoPoint) {
      this.msg = { big: 'NO GOOD', small: '2-point try fails' };
      this.say('2-point conversion fails');
      this.after = () => this.kickoffAfterScore();
      return;
    }
    if (res.kind === 'int' || res.kind === 'fumble') {
      this.msg = { big: res.kind === 'int' ? 'INTERCEPTED!' : 'FUMBLE!', small: `${this.them.city} ball` };
      this.say(`${res.kind === 'int' ? 'Interception' : 'Fumble lost'}. ${this.them.city} take over.`, 'bad');
      if (res.kind === 'int') this.stat(qb, 'int');
      const pick6 = res.kind === 'int' && this.rand() < 0.06;
      this.after = () => {
        if (pick6) { this.score.them += 7; this.say(`${this.them.city} return it for a touchdown`, 'bad'); this.kickoffToUs(); return; }
        this.oppPossession(clamp(spot - Math.floor(this.rand() * 15), 5, 95), 'turnover');
      };
      return;
    }
    if (res.kind === 'safety') {
      this.score.them += 2;
      this.msg = { big: 'SAFETY', small: `2 points ${this.them.city}` };
      this.say(`Safety. 2 points to ${this.them.city}`, 'bad');
      this.after = () => this.oppPossession(60, 'free kick');
      return;
    }
    // ordinary result: spot the ball, move the chains
    this.los = spot;
    this.hash = clamp(res.y ?? MID, 19, FIELD_W - 19);
    let big = '', small = '';
    if (res.kind === 'incomplete') { big = res.label || 'INCOMPLETE'; }
    else if (res.kind === 'sack') { big = 'SACKED!'; small = `Loss of ${-gained}`; }
    else { small = gained === 0 ? 'No gain' : gained > 0 ? `Gain of ${gained}` : `Loss of ${-gained}`; }
    if (spot >= this.fd) {
      this.down = 1; this.fd = Math.min(100, spot + 10); this.toGo = this.fd - spot;
      if (res.kind !== 'incomplete') big = 'FIRST DOWN';
    } else {
      this.down++;
      this.toGo = this.fd - spot;
    }
    this.msg = { big, small };
    if (this.down > 4) {
      this.msg = { big: 'TURNOVER ON DOWNS', small: '' };
      this.say('Turnover on downs', 'bad');
      this.after = () => this.oppPossession(clamp(spot, 1, 99), 'downs');
      return;
    }
    this.after = () => {
      if (this.clock <= 0) return this.endOfPeriod();
      if (this.down === 4) { this.stage = 'fourth'; return; }
      this.setupPlay();
    };
  }

  // ------------------------------------------------------------ 4th down, kicks, conversions
  fgDistance() { return Math.round(100 - this.los + 17); }
  canKickFG() { return this.fgDistance() <= 62; }
  fourthChoice(choice) {
    if (choice === 'go') return this.setupPlay();
    if (choice === 'punt') return this.punt();
    if (choice === 'fg') return this.startKick('fg');
  }
  punt() {
    const K = this.roster.K;
    const len = 36 + K.a.pow * 1.6 + this.gauss() * 5;
    const land = this.los + len;
    const at = land >= 100 ? 80 : clamp(land - this.rand() * 9, 1, 99);
    this.say(`Punt ${Math.round(len)} yards`);
    this.msg = { big: 'PUNT', small: land >= 100 ? 'Touchback' : `${Math.round(len)} yards` };
    this.stage = 'banner'; this.bannerT = 1.5;
    this.tick(8);
    this.after = () => this.oppPossession(Math.round(at), 'punt');
  }
  toPat() {
    if (this.ot && this.ot.sudden) return this.finishOTPossession();
    this.stage = 'pat';
  }
  patChoice(choice) {
    if (choice === 'kick') return this.startKick('pat');
    this.twoPoint = true;
    this.los = 98; this.down = 1; this.fd = 100; this.toGo = 2; this.hash = MID;
    this.setupPlay();
  }
  kickoffAfterScore() {
    if (this.ot) return this.finishOTPossession();
    if (this.clock <= 0) return this.endOfPeriod(true);
    this.oppPossession(75, 'kickoff');
  }

  startKick(purpose) {
    const K = this.roster.K;
    const distance = purpose === 'pat' ? 33 : this.fgDistance();
    const windSpeed = Math.round(this.rand() * 14);
    this.kick = {
      purpose, distance, wind: (this.rand() < 0.5 ? -1 : 1) * windSpeed, K,
      phase: 'aim', aim: 0, power: 0, ball: null, result: null, t: 0,
      maxRange: 46 + K.a.pow * 2.6,
    };
    this.stage = 'kick';
  }
  kickRelease(aim, power) {
    const k = this.kick;
    if (!k || k.phase !== 'aim') return;
    power = clamp(power, 0.05, 1.05);
    const K = k.K;
    const clutch = this.clock < 120 && this.q >= 4 && Math.abs(this.score.us - this.score.them) <= 3 ? (10 - K.a.cmp) * 0.012 : 0;
    const wobble = this.gauss() * ((10 - K.a.acc) * 0.011 + clutch);
    k.phase = 'flight';
    k.range = k.maxRange * power;
    k.slope = aim + wobble;           // lateral yards per yard forward
    k.ball = { z: 0, x: 0, h: 0 };
    k.t = 0;
  }

  finishKick() {
    const k = this.kick;
    const good = k.result === 'good';
    if (k.purpose === 'pat') {
      if (good) { this.score.us += 1; this.say('Extra point is GOOD'); } else this.say('Extra point is NO GOOD', 'bad');
      this.kick = null;
      return this.kickoffAfterScore();
    }
    if (good) {
      this.score.us += 3;
      this.stat(k.K, 'fg');
      this.say(`${k.distance}-yard field goal is GOOD`, 'td');
      this.kick = null;
      if (this.ot) return this.finishOTPossession();
      if (this.clock <= 0) return this.endOfPeriod(true);
      return this.oppPossession(75, 'kickoff');
    }
    this.say(`${k.distance}-yard field goal is NO GOOD`, 'bad');
    this.kick = null;
    this.tick(5);
    this.oppPossession(clamp(Math.round(this.los - 7), 20, 99), 'missed FG');
  }

  // ------------------------------------------------------------ the other team's drives (simulated)
  oppPossession(start, how) {
    if (this.ot && !this.ot.sudden && how !== 'ot') {
      return this.finishOTPossession();
    }
    start = Math.round(start);
    const left = this.clock + (this.q === 1 || this.q === 3 ? this.qLen : 0);
    if (left < 3 && !this.ot) return this.endOfPeriod();
    this.drives.them++;
    const scale = this.qLen / 900;
    const out = driveOutcome(() => this.rand(), this.opp.off, this.ourDef, start);
    out.yards = Math.round(out.yards);
    let time = Math.max(20, Math.round(out.time * scale * 1.6));
    let kind = out.kind;
    if (time > left) {      // they run out of time before finishing the drive
      if (left < time * 0.55 && (kind === 'td' || kind === 'fg')) kind = left > 25 * scale && this.rand() < 0.5 ? 'fg' : 'clock';
      time = left;
    }
    const T = this.them.city;
    const lines = [{ at: 0.2, text: `${T} ball on ${yardText(100 - start)}` }];
    const plays = 3 + Math.floor(this.rand() * 8);
    let pts = 0, next = null, label = '';
    if (kind === 'td') {
      pts = out.pts;
      lines.push({ at: 1.0, text: `${plays} plays, ${start} yards` }, { at: 1.8, text: 'TOUCHDOWN', big: true });
      if (pts === 6) lines.push({ at: 2.4, text: 'Extra point missed!' });
      label = 'TOUCHDOWN'; next = 'kick';
    } else if (kind === 'fg') {
      pts = 3;
      lines.push({ at: 1.0, text: `${plays} plays, ${out.yards} yards` }, { at: 1.8, text: 'FIELD GOAL GOOD', big: true });
      label = 'FIELD GOAL'; next = 'kick';
    } else if (kind === 'int' || kind === 'fumble') {
      lines.push({ at: 1.0, text: `${plays} plays, ${out.yards} yards` }, { at: 1.8, text: kind === 'int' ? 'INTERCEPTED by our defense!' : 'FUMBLE! We recover!', big: true, good: true });
      label = 'TURNOVER'; next = { at: clamp(Math.round(out.spot), 1, 99) };
    } else if (kind === 'downs') {
      lines.push({ at: 1.0, text: `${plays} plays, ${out.yards} yards` }, { at: 1.8, text: 'Stopped on 4th down!', big: true, good: true });
      label = 'STOPPED'; next = { at: clamp(Math.round(out.spot), 1, 99) };
    } else if (kind === 'clock') {
      lines.push({ at: 1.0, text: `${plays} plays, ${out.yards} yards` }, { at: 1.8, text: 'Time runs out', big: true });
      label = 'CLOCK'; next = 'clock';
    } else {
      const land = out.spot - (38 + this.rand() * 12);
      lines.push({ at: 1.0, text: `${plays} plays, ${out.yards} yards` }, { at: 1.8, text: 'Defense holds. Punt.', big: true, good: true });
      label = 'PUNT'; next = { at: land <= 0 ? 20 : clamp(Math.round(land), 3, 70) };
    }
    lines.push({ at: 2.6, text: `Drive time ${fmtClock(time)}` });
    this.oppLines = lines; this.oppShown = 0; this.oppT = 0; this.oppDone = 3.0;
    this.oppResult = { pts, next, time, label, how };
    this.stage = 'opp';
  }

  oppContinue() {
    if (this.stage !== 'opp' && this.stage !== 'opp-wait') return;
    const r = this.oppResult;
    // run their drive time off the clock, across quarter breaks
    let time = r.time, endHalf = false;
    while (time > 0) {
      const take = Math.min(time, this.clock);
      this.clock -= take; time -= take;
      if (this.clock <= 0) {
        if (this.q === 1 || this.q === 3) { this.q++; this.clock = this.qLen; this.say(`End of Q${this.q - 1}`); }
        else { endHalf = true; break; }
      }
    }
    if (r.pts) { this.score.them += r.pts; this.say(`${this.them.city} ${r.label === 'TOUCHDOWN' ? 'touchdown' : 'field goal'}`, 'bad'); }
    else this.say(`${this.them.city} drive: ${r.label.toLowerCase()}`);
    if (this.ot) {
      this.ot.poss.them++;
      if (r.pts && this.ot.sudden) return this.endGame();
      if (r.pts === 7 || r.pts === 6) { if (this.ot.poss.us === 0) return this.endGame(); }
      return this.otNext(r.next && r.next.at ? r.next.at : 25);
    }
    if (endHalf || r.next === 'clock') return this.endOfPeriod(true);
    if (r.next === 'kick') return this.kickoffToUs();
    this.newDrive(r.next.at);
  }

  endOfPeriod() {
    if (this.q === 2) {
      this.q = 3; this.clock = this.qLen; this.timeouts = 3;
      this.msg = { big: 'HALFTIME', small: `${this.us.city} ${this.score.us} - ${this.score.them} ${this.them.city}` };
      this.say('Halftime');
      this.stage = 'banner'; this.bannerT = 2.5;
      this.after = this.weReceive2nd ? () => this.kickoffToUs() : () => this.oppPossession(75, 'kickoff');
      return;
    }
    if (this.q === 1 || this.q === 3) { this.q++; this.clock = this.qLen; return this.setupPlay(); }
    if (this.q >= 4 && this.score.us === this.score.them && !this.ot) return this.startOT();
    if (this.ot && this.score.us === this.score.them && this.playoff) return this.startOT(true);
    this.endGame();
  }

  startOT(again) {
    this.q = 5; this.clock = this.qLen * 0.75; this.timeouts = 2;
    this.ot = { poss: { us: 0, them: 0 }, sudden: false, first: null };
    const weFirst = this.rand() < 0.5;
    this.ot.first = weFirst ? 'us' : 'them';
    this.msg = { big: again ? 'MORE OVERTIME' : 'OVERTIME', small: weFirst ? `${this.us.city} get the ball first` : `${this.them.city} get the ball first` };
    this.say('Overtime');
    this.stage = 'banner'; this.bannerT = 2.5;
    this.after = weFirst ? () => { this.ot.poss.us++; this.newDrive(25); } : () => this.oppPossession(75, 'ot');
  }
  finishOTPossession() {
    // called after each of our OT possessions ends (score, punt, turnover)
    const o = this.ot;
    if (o.sudden && this.score.us !== this.score.them) return this.endGame();
    if (o.poss.us >= 1 && o.poss.them >= 1) {
      if (this.score.us !== this.score.them) return this.endGame();
      o.sudden = true;
    } else if (this.score.us - this.score.them >= 6 && o.poss.them === 0) return this.endGame();
    if (this.clock <= 0) return this.endGame();
    if (o.poss.them <= o.poss.us) return this.oppPossession(75, 'ot');
    o.poss.us++; this.newDrive(25);
  }
  otNext(at) {
    const o = this.ot;
    if (o.poss.us >= 1 && o.poss.them >= 1 && this.score.us !== this.score.them) return this.endGame();
    if (o.poss.us >= 1 && o.poss.them >= 1) o.sudden = true;
    if (this.clock <= 0) return this.endGame();
    o.poss.us++;
    this.newDrive(at);
  }

  endGame() {
    if (this.playoff && this.score.us === this.score.them) return this.startOT(true);
    this.stage = 'final';
    this.say('Final');
  }
}

export const fmtClock = s => { s = Math.max(0, Math.ceil(s)); return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`; };
export const yardText = x => { x = Math.round(x); return x === 50 ? 'the 50' : x < 50 ? `own ${x}` : `opp ${100 - x}`; };
export const downText = m => {
  const d = ['1st', '2nd', '3rd', '4th'][Math.min(3, m.down - 1)];
  const goal = m.fd >= 100;
  return `${d} & ${goal ? 'Goal' : Math.max(1, Math.round(m.toGo))}`;
};

// ------------------------------------------------------------ building a play
function mk(team, role, x, y, sp, extra = {}) {
  return { team, role, x, y, vx: 0, vy: 0, sp, face: team === 'o' ? 1 : -1, anim: Math.random() * 10, hist: [], stun: 0, eng: null, ...extra };
}

function buildPlay(m) {
  const los = m.los, mid = m.hash;
  const R = () => m.rand();
  const r = m.roster;
  const o = [], d = [];
  const spd = (base, v) => base + v * 0.2;
  const oppDef = m.opp.def;
  // offense
  [-3.2, -1.6, 0, 1.6, 3.2].forEach((dy, i) => o.push(mk('o', 'OL', los - 0.7, mid + dy, 5.6, { p: r.OL, idx: i })));
  const qb = mk('o', 'QB', los - 4.5, mid, spd(6.2, r.QB.a.spd), { p: r.QB });
  const side = R() < 0.5 ? -1 : 1;
  const rb = mk('o', 'RB', los - 5.2, mid + 1.8 * side, spd(7.4, r.RB.a.spd), { p: r.RB, route: 'mesh', side });
  const wr1 = mk('o', 'WR', los - 0.6, clamp(mid - 18, 4, 20), spd(8.0, r.WR1.a.spd), { p: r.WR1, toward: 1 });
  const wr2 = mk('o', 'WR', los - 0.6, clamp(mid + 18, FIELD_W - 20, FIELD_W - 4), spd(8.0, r.WR2.a.spd), { p: r.WR2, toward: -1 });
  const te = mk('o', 'TE', los - 1.2, mid + 5.2 * -side, spd(7.0, r.TE.a.spd), { p: r.TE, toward: side });
  for (const w of [wr1, wr2]) w.route = R() < 0.5 ? WR_ROUTES[Math.floor(R() * WR_ROUTES.length)] : WR_ROUTES[Math.floor(R() * 5)];
  te.route = TE_ROUTES[Math.floor(R() * TE_ROUTES.length)];
  if (wr1.route === wr2.route && R() < 0.7) wr2.route = wr1.route === 'go' ? 'slant' : 'go';
  o.push(qb, rb, wr1, wr2, te);
  for (const w of [wr1, wr2, te]) w.path = routePath(w, los);
  // defense: four down linemen, three backers, two corners, two safeties
  const dsp = 0.86 + oppDef * 0.014;
  const react = clamp(0.42 - oppDef * 0.025, 0.12, 0.4);
  [-4.6, -1.6, 1.6, 4.6].forEach(dy => d.push(mk('d', 'DL', los + 0.9, mid + dy, 6.0 * dsp, { rush: true })));
  const lbs = [-5.5, 0, 5.5].map(dy => mk('d', 'LB', los + 5 + R(), mid + dy, 7.0 * dsp));
  const blitz = R() < 0.25 + oppDef * 0.02 ? Math.floor(R() * 3) : -1;
  lbs.forEach((lb, i) => { if (i === blitz) lb.rush = true; });
  // backers: one on the tight end, one on the back, one sits in the middle
  const teSideLB = te.y < mid ? lbs[0] : lbs[2];
  const rbSideLB = teSideLB === lbs[0] ? lbs[2] : lbs[0];
  if (!teSideLB.rush) teSideLB.man = te;
  if (!rbSideLB.rush) rbSideLB.man = rb;
  if (!lbs[1].rush) lbs[1].zone = { x: los + 7, y: mid };
  const cb1 = mk('d', 'CB', los + 5.5 + R() * 2, wr1.y + 0.5, 8.2 * dsp, { man: wr1, cushion: 2 });
  const cb2 = mk('d', 'CB', los + 5.5 + R() * 2, wr2.y - 0.5, 8.2 * dsp, { man: wr2, cushion: 2 });
  const s1 = mk('d', 'S', Math.min(108, los + 13), mid - 9, 8.0 * dsp, { deep: -1 });
  const s2 = mk('d', 'S', Math.min(108, los + 13), mid + 9, 8.0 * dsp, { deep: 1 });
  d.push(...lbs, cb1, cb2, s1, s2);
  for (const p of d) { p.react = react * (0.8 + R() * 0.5); p.x = Math.min(p.x, 109); }
  // blocking assignments
  const rushers = d.filter(p => p.rush);
  o.filter(p => p.role === 'OL').forEach((ol, i) => { ol.assign = rushers[Math.min(rushers.length - 1, Math.round(i * (rushers.length - 1) / 4))]; });
  for (const dl of rushers) {
    const olb = r.OL.a.blk + (m.fac.offense || 1) * 0.4;
    dl.shed = 2.0 + (olb - oppDef) * 0.22 + R() * 1.6;
  }
  return {
    o, d, qb, rb, ball: { holder: qb, x: qb.x, y: qb.y, z: 1, air: null }, carrier: null, t: 0, live: false,
    thrown: false, handoffOpen: true, aim: null, scramble: false, intent: { vy: 0, ty: null, slow: false, tx: null, kx: 0, ky: 0 },
    los, events: [], diving: 0, result: null,
  };
}

function routePath(p, los) {
  const pts = [];
  let x = p.x, y = p.y;
  const dirY = p.toward;               // which way is "in" (toward the middle)
  const R = ROUTES[p.route];
  for (const [dx, dy] of R) pts.push({ x: Math.min(109, los + dx), y: clamp(y + dy * dirY, 1.5, FIELD_W - 1.5) });
  void x;
  return pts;
}

// ------------------------------------------------------------ running a play
function moveToward(p, tx, ty, sp, dt, accel = 30) {
  const dx = tx - p.x, dy = ty - p.y;
  const L = Math.hypot(dx, dy);
  let wx = 0, wy = 0;
  if (L > 0.05) { const s = Math.min(sp, L / Math.max(dt, 1e-3)); wx = dx / L * s; wy = dy / L * s; }
  const ax = wx - p.vx, ay = wy - p.vy, A = Math.hypot(ax, ay), lim = accel * dt;
  if (A > lim) { p.vx += ax / A * lim; p.vy += ay / A * lim; } else { p.vx = wx; p.vy = wy; }
}

function integrate(p, dt) {
  p.x += p.vx * dt; p.y += p.vy * dt;
  const v = Math.hypot(p.vx, p.vy);
  p.anim += v * dt * 1.6;
  if (Math.abs(p.vx) > 0.4) p.face = p.vx > 0 ? 1 : -1;
  p.hist.push({ x: p.x, y: p.y });
  if (p.hist.length > 40) p.hist.shift();
}
const past = (p, sec) => p.hist[Math.max(0, p.hist.length - 1 - Math.round(sec * 60))] || p;

export function stepPlay(m, dt, ghost = false) {
  const P = m.play;
  if (!P) return;
  if (ghost) {           // after the whistle: everyone eases to a stop
    for (const p of [...P.o, ...P.d]) { p.vx *= 0.9; p.vy *= 0.9; integrate(p, dt); }
    if (P.ball.air) stepBall(m, dt, true);
    return;
  }
  P.t += dt;
  const qb = P.qb, rb = P.rb;
  const carrier = P.carrier;
  const ballAt = carrier || P.ball.holder || P.ball;

  // ----- offense
  for (const p of P.o) {
    if (p === carrier) continue;
    if (p.role === 'QB' && !carrier) {
      // dropback, then the player controls him (scramble) or he stands in the pocket
      const I = P.intent;
      if (P.scramble && (I.tx !== null)) moveToward(p, I.tx, I.ty, p.sp, dt);
      else if (I.kx || I.ky) moveToward(p, p.x + I.kx * 3, p.y + I.ky * 3, p.sp, dt);
      else if (P.t < 0.55) moveToward(p, P.los - 6.5, p.y, 5, dt);
      else moveToward(p, p.x, p.y, 0, dt);
    } else if (p.role === 'OL') {
      const tgt = carrier ? nearestThreat(P, p, carrier) : (p.assign && !p.assign.free ? p.assign : null);
      if (tgt) {
        const prot = carrier || qb;
        const L = Math.max(0.01, dist(tgt, prot));
        moveToward(p, tgt.x + (prot.x - tgt.x) / L * 0.95, tgt.y + (prot.y - tgt.y) / L * 0.95, p.sp, dt);
      } else moveToward(p, p.x - 0.2, p.y, 2, dt);
    } else if (p.role === 'RB' && !P.thrown && !carrier) {
      if (p.route === 'mesh') {
        // run past the quarterback (the hand-off window), then leak out to the flat as a check-down
        const meshX = qb.x + 0.9, meshY = qb.y + 0.2 * -p.side;
        if (P.t < 0.25) moveToward(p, p.x, p.y, 0, dt);
        else if (!p.meshed) { moveToward(p, meshX, meshY, p.sp * 0.7, dt); if (dist(p, { x: meshX, y: meshY }) < 0.5 || P.t > 1.4) p.meshed = true; }
        else { p.route = 'flat'; p.path = [{ x: P.los + 1, y: clamp(p.y - p.side * 8, 3, FIELD_W - 3) }, { x: P.los + 6, y: clamp(p.y - p.side * 13, 2, FIELD_W - 2) }]; }
        if (p.meshed && P.t > 1.5) P.handoffOpen = false;
      } else followPath(p, dt, P);
    } else if (p.track && P.ball.air) {
      moveToward(p, p.track.x, p.track.y, p.sp, dt);
    } else if (carrier) {
      // receivers and the back block for whoever has the ball
      const tgt = nearestThreat(P, p, carrier, 9);
      if (tgt) moveToward(p, tgt.x - 0.6, tgt.y, p.sp * 0.85, dt);
      else moveToward(p, carrier.x + 3, p.y, p.sp * 0.6, dt);
    } else {
      followPath(p, dt, P);
    }
  }

  // ----- the ball carrier: always runs downhill; the player steers up/down, can ease off or dive
  if (carrier) {
    const I = P.intent;
    if (P.diving > 0) {
      P.diving -= dt;
      carrier.vx = carrier.sp * 0.9; carrier.vy *= 0.8;
      if (P.diving <= 0) return endRun(m, 'tackle');
    } else {
      const fwd = I.slow ? carrier.sp * 0.25 : carrier.sp;
      let vy = 0;
      if (I.ty !== null && I.ty !== undefined) vy = clamp((I.ty - carrier.y) * 3, -1, 1) * carrier.sp * 0.85;
      else vy = I.vy * carrier.sp * 0.85;
      const tx = carrier.x + fwd * 0.3, ty = carrier.y + vy * 0.3;
      moveToward(carrier, tx, ty, Math.hypot(fwd, vy), dt, 26);
    }
  }

  // ----- defense
  const holder = carrier || (P.ball.air ? null : qb);
  for (const p of P.d) {
    if (p.stun > 0) { p.stun -= dt; p.vx *= 0.85; p.vy *= 0.85; continue; }
    const blocker = engagedBy(P, p);
    const slow = blocker ? (p.free ? 0.55 : 0.1) : 1;
    if (p.rush && !carrier && !P.ball.air) {
      if (blocker && !p.free) { p.engT = (p.engT || 0) + dt; if (p.engT > (p.shed || 2.5)) p.free = true; }
      moveToward(p, qb.x, qb.y, p.sp * slow, dt);
    } else if (carrier) {
      const tR = P.t - (p.sawT ??= P.t);
      const lead = Math.min(1, dist(p, carrier) / 9);
      const tx = carrier.x + carrier.vx * lead * 0.9, ty = carrier.y + carrier.vy * lead * 0.9;
      moveToward(p, tx, ty, p.sp * (tR < p.react ? 0.5 : 1) * slow, dt);
    } else if (P.ball.air) {
      const b = P.ball.air;
      if (p.ballT === undefined) p.ballT = P.t + p.react;
      const near = dist(p, b.to) < 9 || (p.man && p.man.track);
      if (P.t > p.ballT && near) moveToward(p, b.to.x, b.to.y, p.sp * 0.96, dt);
      else moveToward(p, p.x + p.vx * 0.2, p.y + p.vy * 0.2, p.sp * 0.6, dt);
    } else if (p.man) {
      const r = past(p.man, p.react);
      const behind = p.man.x + (p.cushion || 1.2) * (P.t < 1 ? 1 : 0.5);
      moveToward(p, Math.max(r.x + 0.8, Math.min(behind, r.x + 2.5)), r.y, p.sp, dt);
    } else if (p.deep) {
      // safeties: stay deeper than the deepest threat on their half
      const side = P.o.filter(o => ['WR', 'TE', 'RB'].includes(o.role) && Math.sign(o.y - MID) === p.deep);
      const deepest = side.reduce((a, b) => (b.x > a.x ? b : a), { x: P.los + 8, y: MID + p.deep * 9 });
      moveToward(p, Math.min(109, Math.max(P.los + 10, deepest.x + 5)), (deepest.y + MID + p.deep * 6) / 2, p.sp * 0.9, dt);
    } else if (p.zone) {
      // the middle backer drifts under whoever crosses his zone, else spies the quarterback
      const thr = P.o.filter(o => ['WR', 'TE', 'RB'].includes(o.role) && Math.abs(o.x - p.zone.x) < 6 && Math.abs(o.y - p.zone.y) < 10);
      const t = thr[0] || { x: p.zone.x, y: qb.y };
      moveToward(p, t.x + 1, t.y, p.sp * 0.8, dt);
    } else moveToward(p, holder ? holder.x : p.x, holder ? holder.y : p.y, p.sp * 0.7, dt);
  }

  for (const p of [...P.o, ...P.d]) integrate(p, dt);
  // keep everyone on the field (the carrier can step out of bounds: that ends the play)
  for (const p of [...P.o, ...P.d]) if (p !== carrier) { p.y = clamp(p.y, 0.5, FIELD_W - 0.5); p.x = clamp(p.x, -9.5, 109.5); }
  separate(P, carrier);

  // ----- the ball
  if (P.ball.air) stepBall(m, dt);
  else if (carrier) { P.ball.x = carrier.x; P.ball.y = carrier.y; P.ball.z = 1; }
  else { P.ball.x = qb.x; P.ball.y = qb.y; P.ball.z = 1.4; }

  // ----- quarterback: crossing the line makes him a runner
  if (!carrier && !P.thrown && qb.x > P.los + 0.3) {
    P.carrier = qb; P.handoffOpen = false; P.aim = null; P.scramble = false;
    P.events.push({ type: 'run' });
  }

  // ----- contact
  const ball = P.carrier || (!P.thrown ? qb : null);
  if (ball) {
    if (ball.y < 0 || ball.y > FIELD_W) return endRun(m, 'oob');
    if (P.carrier && ball.x >= 100) return endRun(m, 'td');
    if (P.diving > 0) return;
    for (const dfn of P.d) {
      if (dfn.stun > 0 || dist(dfn, ball) > 0.8) continue;
      if ((dfn.lastTry || -9) > P.t - 0.6) continue;
      dfn.lastTry = P.t;
      const bp = ball.p;
      const strength = bp.a.str || 3;
      const isSack = !P.carrier;
      let breakP = isSack ? 0.08 + (bp.a.spd || 3) * 0.012 : 0.05 + strength * 0.032 + ((m.fac.offense || 1) - 1) * 0.01;
      breakP *= 1.15 - m.opp.def * 0.04;
      if (Math.hypot(ball.vx, ball.vy) > ball.sp * 0.8 && Math.abs(ball.vy) > ball.sp * 0.5) breakP += 0.1;   // a hard cut
      if (m.rand() < breakP) { dfn.stun = 0.7; P.events.push({ type: 'break' }); continue; }
      if (isSack) return endRun(m, 'sack');
      return endRun(m, 'tackle');
    }
  }
}

function separate(P, carrier) {
  // simple body separation so players don't stack on one spot
  const all = [...P.o, ...P.d];
  for (let i = 0; i < all.length; i++) for (let j = i + 1; j < all.length; j++) {
    const a = all[i], b = all[j];
    const dx = b.x - a.x, dy = b.y - a.y, L = Math.hypot(dx, dy);
    if (L > 0.001 && L < 0.75) {
      if ((a === carrier && b.team === 'd') || (b === carrier && a.team === 'd')) continue;
      const push = (0.75 - L) / 2, ux = dx / L, uy = dy / L;
      a.x -= ux * push; a.y -= uy * push; b.x += ux * push; b.y += uy * push;
    }
  }
}

function engagedBy(P, d) {
  for (const o of P.o) if (o !== P.carrier && (o.role === 'OL' || (P.carrier && o !== P.qb)) && dist(o, d) < 1.15 && o.x <= d.x + 0.4) return o;
  return null;
}
function nearestThreat(P, p, carrier, range = 7) {
  let best = null, bd = range;
  for (const d of P.d) {
    if (d.stun > 0) continue;
    const dd = dist(d, p);
    if (dd < bd && d.x > carrier.x - 2) { bd = dd; best = d; }
  }
  return best;
}

function followPath(p, dt, P) {
  if (!p.path) return moveToward(p, p.x + 1, p.y, p.sp, dt);
  if (P.t < 0.15) return;
  const tgt = p.path[0];
  if (!tgt) {
    if (STOP_ROUTES.has(p.route)) return moveToward(p, p.x, p.y, 0, dt);
    // run on in the last direction
    return moveToward(p, p.x + (p.lx || 1) * 5, clamp(p.y + (p.ly || 0) * 5, 1.5, FIELD_W - 1.5), p.sp, dt);
  }
  const dx = tgt.x - p.x, dy = tgt.y - p.y, L = Math.hypot(dx, dy);
  if (L < 0.6) { p.lx = dx / (L || 1); p.ly = dy / (L || 1); p.path.shift(); return followPath(p, dt, P); }
  p.lx = dx / L; p.ly = dy / L;
  moveToward(p, tgt.x, tgt.y, p.sp, dt);
}

// ------------------------------------------------------------ handoff, aiming, throwing
export function handoff(m) {
  const P = m.play;
  if (!P || !P.live || P.thrown || P.carrier || !P.handoffOpen) return false;
  if (dist(P.rb, P.qb) > 2.6) return false;
  P.carrier = P.rb; P.rb.route = null; P.handoffOpen = false; P.aim = null;
  P.carrier.vx = Math.max(P.carrier.vx, 3);
  // run blocking: the line fires off and re-engages the rushers
  for (const d of P.d) if (d.role === 'DL') { d.free = false; d.engT = 0; d.shed = 0.8 + m.rand() * 0.9 + (P.qb.p && m.roster.OL.a.blk - m.opp.def) * 0.08; }
  P.events.push({ type: 'handoff' });
  return true;
}

export const maxThrow = qb => 38 + qb.a.arm * 3.2;
export function setAim(m, tx, ty) {
  const P = m.play;
  if (!P || !P.live || P.thrown || P.carrier) return;
  const qb = P.qb;
  let dx = tx - qb.x, dy = ty - qb.y;
  const L = Math.hypot(dx, dy), mx = maxThrow(qb.p);
  if (L > mx) { dx *= mx / L; dy *= mx / L; }
  let target = { x: qb.x + dx, y: qb.y + dy };
  if (m.aimAssist) {
    // gentle magnetism toward a receiver's lead spot
    let best = null, bd = 3.2;
    for (const r of P.o) {
      if (!['WR', 'TE', 'RB'].includes(r.role) || r === qb) continue;
      const T = flightTime(qb.p, dist(qb, r));
      const lead = { x: r.x + r.vx * T, y: r.y + r.vy * T };
      const dd = dist(lead, target);
      if (dd < bd) { bd = dd; best = lead; }
    }
    if (best) target = { x: target.x + (best.x - target.x) * 0.45, y: target.y + (best.y - target.y) * 0.45 };
  }
  P.aim = target;
  P.handoffOpen = false;
}
export const flightTime = (qbp, d) => 0.28 + d / (15 + qbp.a.arm * 1.5);

export function throwBall(m) {
  const P = m.play;
  if (!P || !P.live || P.thrown || P.carrier || !P.aim) return false;
  const qb = P.qb, q = qb.p;
  const to = { ...P.aim };
  const d = dist(qb, to);
  if (d < 2) { P.aim = null; return false; }
  const pressured = P.d.some(x => dist(x, qb) < 2.6);
  const sig = (0.22 + (10 - q.a.acc) * 0.085) * (0.45 + d / 32) * (pressured ? 1.7 : 1) * (Math.hypot(qb.vx, qb.vy) > 2 ? 1.3 : 1);
  to.x += m.gauss() * sig; to.y += m.gauss() * sig;
  const T = flightTime(q, d);
  P.ball.air = { from: { x: qb.x, y: qb.y }, to, t: 0, T, h: 1.2 + d * 0.11 };
  P.thrown = true; P.aim = null; P.handoffOpen = false;
  P.passFrom = qb.x;
  P.events.push({ type: 'throw' });
  m.stat(q, 'att');
  // the receiver who can get there goes for it
  let best = null, bt = 99;
  for (const r of P.o) {
    if (!['WR', 'TE', 'RB'].includes(r.role)) continue;
    const need = dist(r, to) / r.sp;
    if (need < T + 0.35 && need < bt) { bt = need; best = r; }
  }
  if (best) best.track = to;
  return true;
}

function stepBall(m, dt, ghost) {
  const P = m.play, b = P.ball.air;
  b.t += dt;
  const k = Math.min(1, b.t / b.T);
  P.ball.x = b.from.x + (b.to.x - b.from.x) * k;
  P.ball.y = b.from.y + (b.to.y - b.from.y) * k;
  P.ball.z = 1.4 + b.h * 4 * k * (1 - k);
  if (k < 1 || ghost) { if (ghost && k >= 1) P.ball.air = null; return; }
  P.ball.air = null;
  resolveCatch(m, b.to);
}

function resolveCatch(m, at) {
  const P = m.play;
  const qbp = P.qb.p;
  const near = (list, r) => list.map(p => ({ p, d: dist(p, at) })).filter(x => x.d < r).sort((a, b) => a.d - b.d)[0];
  const rec = near(P.o.filter(o => ['WR', 'TE', 'RB'].includes(o.role)), 2.4);
  const def = near(P.d.filter(d => d.stun <= 0), 1.6);
  const oob = at.y < 0 || at.y > FIELD_W || at.x > 110;
  for (const o of P.o) o.track = null;
  if (oob) return incomplete(m, 'OUT OF BOUNDS');
  if (rec && (!def || rec.d < def.d - 0.15)) {
    const hands = rec.p.p.a.hnd || 3;
    let pc = 0.6 + hands * 0.038;
    if (rec.d > 1.4) pc -= 0.28;               // a diving grab
    if (def && def.d < 1.6) pc -= 0.18 - m.opp.def * 0.005;
    if (m.rand() < pc) {
      const r = rec.p;
      r.x = at.x; r.y = at.y;
      P.carrier = r;
      P.catchX = at.x;
      P.events.push({ type: 'catch', dive: rec.d > 1.4 });
      m.stat(qbp, 'cmp');
      if (at.x >= 100) return endRun(m, 'td');
      return;
    }
    return incomplete(m, def && def.d < 1.8 ? 'BROKEN UP' : 'DROPPED');
  }
  if (def) {
    const pInt = 0.2 + m.opp.def * 0.03 + (rec ? -0.1 : 0.12);
    if (m.rand() < pInt) {
      P.events.push({ type: 'int' });
      return finish(m, { kind: 'int', spot: Math.min(at.x, 99) });
    }
    return incomplete(m, 'BROKEN UP');
  }
  return incomplete(m, rec ? 'INCOMPLETE' : 'INCOMPLETE');
}

function incomplete(m, label) {
  m.play.events.push({ type: 'incomplete' });
  finish(m, { kind: 'incomplete', label, spot: m.los, running: false });
}

export function dive(m) {
  const P = m.play;
  if (!P || !P.live || !P.carrier || P.diving > 0) return;
  P.diving = 0.32;
  P.events.push({ type: 'dive' });
}

function endRun(m, how) {
  const P = m.play, c = P.carrier || P.qb;
  const x = c.x, y = c.y;
  const p = c.p;
  // fumbles: rare, more likely on a blindside sack
  let fumble = false;
  if (how === 'tackle' && m.rand() < 0.012) fumble = true;
  if (how === 'sack' && m.rand() < 0.06) fumble = true;
  if (fumble && m.rand() < 0.55) { P.events.push({ type: 'fumble' }); return finish(m, { kind: 'fumble', spot: x }); }
  const yards = x - (P.catchX !== undefined ? P.passFrom ?? m.los : m.los);
  void yards;
  if (how === 'td' || x >= 100) {
    creditYards(m, 100);
    const scorer = c.p;
    if (P.catchX !== undefined) { m.stat(scorer, 'ctd'); m.stat(P.qb.p, 'ptd'); } else m.stat(scorer, 'rtd');
    P.events.push({ type: 'td' });
    return finish(m, { kind: 'td', who: scorer.name });
  }
  if (x <= 0 && how !== 'oob') { P.events.push({ type: 'tackle' }); return finish(m, { kind: 'safety', spot: 0 }); }
  creditYards(m, x);
  if (how === 'sack') m.stat(p, 'sk');
  P.events.push({ type: how === 'oob' ? 'oob' : 'tackle' });
  finish(m, { kind: how === 'sack' ? 'sack' : 'run', spot: x, y, running: how !== 'oob' });
}

function creditYards(m, x) {
  const P = m.play, c = P.carrier || P.qb;
  const gained = Math.round(Math.min(x, 100) - m.los);
  if (P.catchX !== undefined) { m.stat(c.p, 'cy', gained); m.stat(c.p, 'rec'); m.stat(P.qb.p, 'py', gained); }
  else if (c.role !== 'QB' || P.carrier) m.stat(c.p, 'ry', gained);
}

function finish(m, res) {
  m.play.result = res;
  m.playOver(res);
}

// ------------------------------------------------------------ the kicking game
function stepKick(m, dt) {
  const k = m.kick;
  if (!k || k.phase !== 'flight') {
    if (k && k.phase === 'done') { k.t += dt; if (k.t > 1.6) m.finishKick(); }
    return;
  }
  k.t += dt;
  const speed = 24;
  const b = k.ball;
  b.z = Math.min(k.range, b.z + speed * dt);
  const u = b.z / k.range;
  b.h = k.range * 0.3 * 4 * u * (1 - u);
  b.x = k.slope * b.z + k.wind * 0.018 * Math.pow(b.z / 30, 2) * 3;
  if (!k.crossed && b.z >= k.distance) {
    k.crossed = true;
    const inside = Math.abs(b.x) < 3.08;
    const over = b.h > 3.4;
    k.result = inside && over ? 'good' : 'miss';
    k.why = !over ? 'Short' : !inside ? (b.x < 0 ? 'Wide left' : 'Wide right') : '';
  }
  if (b.z >= k.range || (k.crossed && b.z > k.distance + 8)) {
    if (!k.crossed) { k.result = 'miss'; k.why = 'Short'; }
    k.phase = 'done'; k.t = 0;
  }
}

export function teamRatingForMatch(roster) {
  return ['QB', 'RB', 'WR1', 'WR2', 'TE', 'OL'].map(s => rating(roster[s])).reduce((a, b) => a + b) / 6;
}
