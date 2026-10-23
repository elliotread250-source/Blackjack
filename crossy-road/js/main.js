// Glue: accounts, screens, the fixed-timestep loop, input, sound and progress.
import { Game, TICK, CHARACTERS, CHALLENGES, charById, entityX, trainState, zoneOf, PRIZE_PRICE, PRIZE_MAX_PRICE, SECRET_WORDS, NEW_2026, qualityOf, GEM_VALUE, QUICK_SKIN } from './logic.js';
import { dailyById, liveValue } from './dailies.js';
import { BIOME_NAMES } from './models.js';
import { Renderer } from './render.js';
import { Sound } from './audio.js';
import { Input } from './input.js';
import { store } from './store.js';
import { Autopilot } from './autopilot.js';
import { api, GuestProfile, AccountProfile, localSave } from './account.js';
import { RaceClient, raceFromUrl, raceLink } from './race.js';

const $ = id => document.getElementById(id);
const params = new URLSearchParams(location.search);
const testRun = params.has('autopilot') || params.has('seed');
let profile = new GuestProfile();
const sound = new Sound(profile.muted);
const canvas = $('game');
let renderer;
try {
  renderer = new Renderer(canvas);
} catch (err) {
  document.body.insertAdjacentHTML('beforeend', '<div style="position:fixed;inset:0;display:grid;place-items:center;padding:24px;text-align:center;font:700 18px system-ui;color:#fff;background:#2c3448">This game needs WebGL, which is not available in this browser.</div>');
  throw err;
}
const autopilot = params.has('autopilot') ? new Autopilot() : null;
const touchUI = window.matchMedia && window.matchMedia('(pointer: coarse)').matches;
const esc = t => String(t ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
const fmt = n => Number(n || 0).toLocaleString();

const THEME_NOTE = { metro: 'Comes with a hero city world', volcano: 'Comes with a volcano world', retro: 'Comes with a retro world', snow: 'Comes with a snowy world', autumn: 'Comes with an autumn world', night: 'Comes with a night world', candy: 'Comes with a candy world', desert: 'Comes with a desert world', jungle: 'Comes with a jungle world', spooky: 'Comes with a spooky world', space: 'Comes with a space world' };
const DEATH_TEXT = {
  car: ['Splat!', 'Flattened!', 'Road pizza!'],
  train: ['Choo choo!', 'Derailed!', 'Train wreck!'],
  drown: ['Sploosh!', 'Can’t swim!', 'Glub glub!'],
  drift: ['Swept away!', 'Bye bye!', 'Over the edge!'],
  eagle: ['Snatched!', 'Eagle got you!', 'Too slow!'],
};

let game = null;
let ticket = null;              // the server seed this run is played on (accounts)
let state = 'boot';             // boot | account | title | playing | dying | over | paused | chars | board | challenges | settings | shop | race | countdown
let pausedFrom = null;
let deathTime = 0;
let runSeed = params.has('seed') ? Number(params.get('seed')) >>> 0 : null;
let sel = 0;
let lastOver = 0;
let champion = null;
let lastZone = 0, bannerTimer = 0, toastTimer = 0;
let pendingFast = false, suited = false, typed = '';
let announced = new Set();      // daily milestones already shown this run

// ------------------------------------------------------------ settings
function applySettings() {
  const s = profile.settings;
  sound.setVolume(s.volume ?? 0.8, s.sfx ?? 1);
  sound.setMuted(!!s.muted);
  renderer.applySettings({ quality: s.quality || 'high', reducedMotion: !!s.reducedMotion, shake: s.shake !== false, trainWarning: s.trainWarning || 'strong' });
  renderer.setBatWings(s.batWings === 'tucked');
  document.body.classList.toggle('hc', !!s.highContrast);
  document.body.classList.toggle('rm', !!s.reducedMotion);
  updateMute();
}
async function saveSetting(part) {
  $('set-save').textContent = 'Saving…';
  Object.assign(profile.settings, part);
  applySettings();
  try { await profile.saveSettings(part); $('set-save').textContent = profile.isGuest ? 'Saved on this device.' : 'Saved to your account ✓'; }
  catch { $('set-save').textContent = 'Couldn’t save to your account right now — it’s kept for this session.'; }
}

// ------------------------------------------------------------ game lifecycle
function newGame() {
  // a game that never started can hand its seed back for next time
  if (game && ticket && !game.started && profile.giveBack) profile.giveBack(ticket);
  ticket = testRun ? null : profile.ticket();
  const seed = runSeed !== null ? runSeed++ : ticket ? ticket.seed : undefined;
  const hopTicks = ticket ? ticket.hopTicks : profile.hopTicks;
  game = new Game({ seed, hopTicks });
  game.practiceReason = autopilot ? 'autopilot' : (!profile.isGuest && !ticket) ? 'offline' : null;
  renderer.setTheme(charById(profile.selected).theme);
  renderer.setCharacter(profile.selected);
  renderer.setCrown(!profile.isGuest && profile.champion);
  renderer.reset(game);
  lastZone = 0; suited = false; announced = new Set();
  if (pendingFast) { pendingFast = false; game.makeInvincible(); }
  updateHud();
  prevPhase.clear(); passed.clear();
}

const SCREENS = ['s-title', 's-pause', 's-over', 's-chars', 's-board', 's-challenges', 's-account', 's-settings', 's-shop', 's-race'];
function show(id) {
  for (const s of SCREENS) $(s).hidden = s !== id;
  $('arcade').hidden = !(id === 's-title' || id === 's-over' || id === 's-account');
  $('hud').hidden = !(id === null || id === 's-pause' || id === 's-over');
  $('hud').classList.toggle('over', id === 's-over');
  if (id !== null) $('trainwarn').hidden = true;
}

function toTitle() {
  state = 'title';
  newGame();
  $('t-best').textContent = 'Best ' + fmt(profile.best);
  $('t-best').hidden = profile.best <= 0;
  updateAccountChip();
  show('s-title');
  setThemeColor();
  refreshChampion();
  refreshDailyDot();
}

// A run that is about to start without a server seed (the tickets were still arriving) takes one
// now; the game hasn't started, so swapping its world costs nothing.
function ensureTicket() {
  if (profile.isGuest || ticket || testRun || !game || game.started) return;
  const t = profile.ticket();
  if (!t) return;
  ticket = t;
  game = new Game({ seed: t.seed, hopTicks: t.hopTicks });
  game.practiceReason = null;
  renderer.reset(game);
  if (pendingFast) { pendingFast = false; game.makeInvincible(); }
}

function startPlaying() {
  ensureTicket();
  state = 'playing';
  show(null);
  $('hint').hidden = true;
  $('practice').hidden = !(game.practiceReason || game.usedFast);
  $('practice').textContent = game.practiceReason === 'offline' ? 'Offline — this run can’t earn coins or progress' : 'Practice run — no coins or progress';
}

function retry() {
  newGame();
  ensureTicket();
  state = 'playing';
  show(null);
  $('practice').hidden = !game.practiceReason;
  $('hint').textContent = touchUI ? 'Tap to hop • swipe to turn' : 'Arrows / WASD to hop';
  $('hint').hidden = false;
  setThemeColor();
}

function pause() {
  if (state !== 'playing' && state !== 'dying') return;
  pausedFrom = state;
  state = 'paused';
  show('s-pause');
  $('p-racenote').hidden = !racing();
  sound.rumble(0);
}

function resume() {
  if (state !== 'paused') return;
  state = pausedFrom || 'playing';
  show(null);
  last = performance.now();
}

// leaving a run from the pause menu still sends it (its coins and progress count)
function quitRun() {
  if (racing()) { raceRunOver('quit'); return; }
  if (game && game.started && !game.player.dead && ticket) profile.finishRun(game, ticket, { autopilot: !!autopilot }).then(updateHud);
  ticket = null;
  toTitle();
}

async function gameOver() {
  if (racing()) { raceRunOver('out'); return; }
  state = 'over';
  lastOver = performance.now();
  const g = game, t = ticket;
  ticket = null;
  const lines = DEATH_TEXT[g.player.dead ? g.player.dead.type : 'car'];
  $('o-why').textContent = lines[Math.floor(Math.random() * lines.length)];
  $('o-score').textContent = g.score;
  const prevBest = profile.best;
  $('o-best').textContent = 'Best ' + fmt(Math.max(prevBest, g.score));
  $('o-new').hidden = !(g.score > prevBest && g.score > 0 && !g.usedFast && !g.practiceReason);
  $('o-coins').textContent = '+' + g.coins;
  $('o-cstate').textContent = profile.isGuest ? '' : (g.usedFast || g.practiceReason) ? 'practice — no coins' : 'confirming…';
  $('o-extra').innerHTML = '';
  setRank('');
  show('s-over');
  sound.rumble(0);
  const dailyBefore = profile.dailyState ? profile.dailyState.challenges.map(c => c.value) : null;
  const res = await profile.finishRun(g, t, { autopilot: !!autopilot });
  if (state !== 'over') { updateHud(); return; }
  const extra = [];
  if (profile.isGuest) {
    if (res.isBest) sound.best(); else sound.over();
    extra.push(`<div class="pill">Playing as a guest: coins stay on this device. <b>Sign in</b> to keep them everywhere and join daily challenges.</div>`);
  } else if (res.confirmed) {
    $('o-coins').textContent = '+' + res.coins;
    $('o-cstate').textContent = res.practice ? 'practice — no coins' : 'added ✓';
    $('o-new').hidden = !(res.score > prevBest && res.score > 0 && !res.practice);
    $('o-best').textContent = 'Best ' + fmt(profile.best);
    if (!$('o-new').hidden) sound.best(); else sound.over();
    if (res.daily && dailyBefore) {
      res.daily.challenges.forEach((c, i) => {
        const gained = c.value - (dailyBefore[i] || 0);
        if (c.done && !c.claimed) extra.push(`<div class="pill go">🎉 ${esc(c.name)} complete — claim ${c.reward} coins!</div>`);
        else if (gained > 0) extra.push(`<div class="pill">${esc(c.name)} ${c.value}/${c.goal} <b>(+${gained})</b></div>`);
      });
    }
    if (profile.rank) setRank(profile.rank === 1 ? '👑 World #1 — you hold the crown!' : `World rank #${profile.rank}`, profile.rank <= 3);
    if (res.champion) setChampion(res.champion);
  } else {
    sound.over();
    $('o-cstate').textContent = res.pending ? 'saved — will be added when you’re back online' : (res.practice ? 'practice — no coins' : `not added: ${res.error || 'run rejected'}`);
  }
  for (const id of res.unlocked || []) { const c = charById(id); extra.push(`<div class="pill gold">🏆 Unlocked ${esc(c.name)}!</div>`); }
  if ((res.unlocked || []).length) { sound.buy(); if (renderer.carousel.length) renderer.setCarouselOwned(profile.owned); }
  $('o-extra').innerHTML = extra.join('');
  refreshDailyDot();
  updateHud();
}

function setRank(text, gold) {
  $('o-rank').textContent = text;
  $('o-rank').classList.toggle('gold', !!gold);
  $('o-rank').hidden = !text;
}

// ------------------------------------------------------------ leaderboard + champion
let boardFrom = 'title', boardTab = 'top', boardData = null;
function setChampion(c) {
  champion = c;
  if (!profile.isGuest) {
    profile.champion = !!(c && c.id === profile.id);
    renderer.setCrown(profile.champion);
  }
  $('t-world').textContent = c ? `👑 Current champion: ${c.name} · ${fmt(c.score)}` : '';
  $('t-world').hidden = !c;
}
function refreshChampion() {
  if (testRun) return;
  api('/api/leaderboard').then(d => { boardData = d; setChampion(d.champion); if (state === 'board') renderBoard(); }).catch(() => {});
}
function renderBoard(msg) {
  const rows = boardData ? (boardTab === 'top' ? boardData.top : boardData.legacy) : [];
  const meId = profile.isGuest ? null : profile.id;
  $('b-list').innerHTML = msg ? `<li class="msg">${esc(msg)}</li>` : rows.length
    ? rows.map((r, i) => `<li class="${r.id && r.id === meId ? 'me ' : ''}${boardTab === 'top' && i === 0 ? 'crown' : ''}"><span class="rk">${i + 1}</span><span class="nm">${esc(r.name)}<span class="ch">${esc(charById(r.char || 'chicken').name)}</span></span><span class="sc">${fmt(r.score)}</span></li>`).join('')
    : '<li class="msg">No scores yet. Be the first!</li>';
  for (const b of document.querySelectorAll('#s-board [data-lb]')) b.setAttribute('aria-selected', String(b.dataset.lb === boardTab));
  $('b-name').textContent = boardTab === 'legacy' ? 'Scores from before accounts. Names here are not linked to accounts.'
    : profile.isGuest ? 'Sign in to put your best score on the board.' : `Playing as ${profile.username}${profile.rank ? ' · rank #' + profile.rank : ''}`;
}
function openBoard() {
  boardFrom = state;
  state = 'board';
  show('s-board');
  renderBoard(boardData ? '' : 'Loading…');
  api('/api/leaderboard').then(d => { boardData = d; setChampion(d.champion); if (state === 'board') renderBoard(); })
    .catch(() => { if (state === 'board' && !boardData) renderBoard('Leaderboard offline. Try again soon.'); });
}
function closeBoard() {
  state = boardFrom;
  show(boardFrom === 'over' ? 's-over' : 's-title');
}
for (const b of document.querySelectorAll('#s-board [data-lb]')) b.addEventListener('click', e => { e.stopPropagation(); boardTab = b.dataset.lb; renderBoard(); });

// ------------------------------------------------------------ HUD
function updateHud() {
  $('score').textContent = game ? game.score : 0;
  $('top').textContent = 'Top ' + fmt(Math.max(profile.best, game ? game.score : 0));
  $('coins').textContent = fmt(profile.coins);
  const run = !profile.isGuest && game && game.coins && (state === 'playing' || state === 'dying') ? game.coins : 0;
  $('runcoins').hidden = !run;
  $('runcoins').textContent = '+' + run;
}

const MUTE_ON = '<svg viewBox="0 0 24 24"><path d="M4 9h4l5-4v14l-5-4H4z"/><path d="M16 8.5a5 5 0 0 1 0 7" stroke="#fff" stroke-width="2" fill="none" stroke-linecap="round"/><path d="M18.5 6a8.5 8.5 0 0 1 0 12" stroke="#fff" stroke-width="2" fill="none" stroke-linecap="round"/></svg>';
const MUTE_OFF = '<svg viewBox="0 0 24 24"><path d="M4 9h4l5-4v14l-5-4H4z"/><path d="M16 9l5 6M21 9l-5 6" stroke="#fff" stroke-width="2.2" fill="none" stroke-linecap="round"/></svg>';
function updateMute() {
  for (const b of document.querySelectorAll('.mute')) {
    b.innerHTML = profile.muted ? MUTE_OFF : MUTE_ON;
    b.setAttribute('aria-label', profile.muted ? 'Unmute' : 'Mute');
  }
}
function toggleMute() {
  sound.unlock();
  saveSetting({ muted: !profile.muted });
  if (!profile.muted) sound.click();
}

function setThemeColor() {
  const meta = document.querySelector('meta[name="theme-color"]');
  const sky = renderer.th ? '#' + renderer.th.sky.toString(16).padStart(6, '0') : '#9fd6f0';
  if (meta) meta.setAttribute('content', sky);
  document.body.style.background = sky;
}

function updateAccountChip() {
  $('t-user').innerHTML = profile.isGuest ? '👤 Guest · Sign in' : `${profile.champion ? '<span class="cr">👑</span> ' : '👤 '}${esc(profile.username)}`;
}

// ------------------------------------------------------------ account screens
let acctName = '', acctAfter = null;
function step(name, msg = '', ok = false) {
  for (const s of document.querySelectorAll('#s-account [data-step]')) s.hidden = s.dataset.step !== name;
  for (const w of document.querySelectorAll('#s-account .who')) w.textContent = acctName;
  $('acct-msg').textContent = msg;
  $('acct-msg').classList.toggle('ok', ok);
  const first = document.querySelector(`#s-account [data-step="${name}"] input`);
  if (first && !touchUI) setTimeout(() => first.focus(), 30);
}
function openAccount(stepName = 'welcome') {
  state = 'account';
  show('s-account');
  $('arcade').hidden = false;
  const known = (session && session.accounts) || [];
  $('acct-known').hidden = !known.length;
  $('acct-chips').innerHTML = known.map(n => `<button type="button" data-user="${esc(n)}">${esc(n)}</button>`).join('');
  step(stepName);
}
async function busy(btn, fn) {
  const b = btn instanceof HTMLElement ? btn : null;
  if (b) b.disabled = true;
  try { await fn(); } catch (e) { $('acct-msg').textContent = e.message || 'Something went wrong.'; $('acct-msg').classList.remove('ok'); }
  finally { if (b) b.disabled = false; }
}
$('f-name').addEventListener('submit', e => {
  e.preventDefault();
  busy(e.submitter, async () => {
    const d = await api('/api/auth/check', { username: $('acct-name').value });
    if (!d.ok) { $('acct-msg').textContent = d.error; return; }
    acctName = d.username;
    step(d.exists ? 'signin' : 'create');
  });
});
$('acct-chips').addEventListener('click', e => {
  const b = e.target.closest('[data-user]');
  if (!b) return;
  acctName = b.dataset.user;
  busy(b, async () => {
    try { const d = await api('/api/auth/switch', { username: acctName }); await signedIn(d.user); }
    catch (err) { if (err.data && err.data.needPin) step('signin', 'Enter your PIN to use this account here.'); else throw err; }
  });
});
$('f-signin').addEventListener('submit', e => {
  e.preventDefault();
  busy(e.submitter, async () => {
    const d = await api('/api/auth/login', { username: acctName, pin: $('acct-pin').value });
    $('acct-pin').value = '';
    await signedIn(d.user);
  });
});
$('f-create').addEventListener('submit', e => {
  e.preventDefault();
  const a = $('acct-new1').value, b = $('acct-new2').value;
  if (a.length < 4) { $('acct-msg').textContent = 'Your PIN needs at least 4 characters.'; return; }
  if (a !== b) { $('acct-msg').textContent = 'Those two PINs don’t match.'; return; }
  busy(e.submitter, async () => {
    const d = await api('/api/auth/register', { username: acctName, pin: a, settings: profile.settings });
    $('acct-new1').value = $('acct-new2').value = '';
    $('acct-rcode').textContent = d.recovery;
    acctAfter = d.user;
    step('recovery');
  });
});
$('acct-rdone').addEventListener('click', () => {
  const u = acctAfter;
  const save = localSave();
  if (save.worth > 0 && !store.get('migrated', false)) {
    $('acct-migtext').textContent = `This device has ${fmt(Math.min(save.coins, 1000))} coins${save.count ? ` and ${save.count} character${save.count === 1 ? '' : 's'}` : ''} from playing before accounts. Add them to ${acctName}?`;
    step('migrate');
  } else signedIn(u);
});
$('acct-migyes').addEventListener('click', e => busy(e.currentTarget, async () => {
  const s = localSave();
  const d = await api('/api/migrate', { coins: s.coins, owned: s.owned, selected: s.selected, records: s.records, settings: profile.settings });
  store.set('migrated', true);    // the old save stays on the device, but it can't be brought in twice
  await signedIn(d.user, `Brought in ${fmt(d.coins)} coins and ${d.owned.length} characters.`);
}));
$('acct-migno').addEventListener('click', () => signedIn(acctAfter));
$('f-recover').addEventListener('submit', e => {
  e.preventDefault();
  busy(e.submitter, async () => {
    const d = await api('/api/auth/recover', { username: $('rec-name').value, code: $('rec-code').value, pin: $('rec-pin').value });
    acctName = d.user.username;
    $('rec-code').value = $('rec-pin').value = '';
    $('acct-rcode').textContent = d.recovery;
    acctAfter = d.user;
    step('recovery', 'PIN changed. Here is your new recovery code — the old one no longer works.', true);
  });
});
for (const b of document.querySelectorAll('#s-account [data-go]')) b.addEventListener('click', () => step(b.dataset.go));
$('acct-forgot').addEventListener('click', () => { $('rec-name').value = $('acct-name').value; step('recover'); });
$('acct-guest').addEventListener('click', () => {
  store.set('guest', true);
  profile = new GuestProfile();
  applySettings();
  toTitle();
});

async function signedIn(user, note) {
  profile = new AccountProfile(user);
  store.set('guest', false);
  session = session || {};
  if (!(session.accounts || []).includes(user.username)) session.accounts = [user.username, ...(session.accounts || [])];
  applySettings();
  if (renderer.carousel.length) renderer.setCarouselOwned(profile.owned);
  profile.flush().then(updateHud).catch(() => {});
  profile.daily().then(refreshDailyDot).catch(() => {});
  toTitle();
  banner(note || `Hi, ${user.username}!`, note ? 'Welcome' : 'Signed in');
}

// ------------------------------------------------------------ settings screen
let settingsFrom = 'title';
function openSettings() {
  settingsFrom = state;
  state = 'settings';
  show('s-settings');
  renderSettings();
}
function closeSettings() {
  state = settingsFrom;
  if (state === 'paused') show('s-pause'); else if (state === 'over') show('s-over'); else toTitle();
}
function renderSettings() {
  const s = profile.settings;
  const seg = (id, v) => { for (const b of $(id).querySelectorAll('button')) b.setAttribute('aria-checked', String(b.dataset.v === String(v))); };
  const quick = profile.owned.has(QUICK_SKIN) && profile.selected === QUICK_SKIN;   // the secret 1-tick option
  $('set-speed-quick').hidden = !quick; $('set-speed-note').hidden = !quick;
  $('set-bat-wrap').hidden = !profile.owned.has('batcostume'); seg('set-bat', s.batWings === 'tucked' ? 'tucked' : 'spread');
  seg('set-speed', quick ? s.hopTicks : profile.hopTicks); seg('set-quality', s.quality || 'high'); seg('set-train', s.trainWarning || 'strong');
  $('set-vol').value = s.volume ?? 0.8; $('set-sfx').value = s.sfx ?? 1;
  $('set-mute').checked = !!s.muted; $('set-motion').checked = !!s.reducedMotion; $('set-contrast').checked = !!s.highContrast; $('set-shake').checked = s.shake !== false;
  $('set-save').textContent = profile.isGuest ? 'Settings are saved on this device.' : 'Settings are saved to your account and follow you to other devices.';
  if (profile.isGuest) {
    $('set-account').innerHTML = `<p class="small dimtext">You're playing as a guest — coins and characters are only on this device.</p><div class="acct-row"><button class="btn green" data-a="signin">Sign in or create an account</button></div>`;
  } else {
    const st = profile.stats;
    $('set-account').innerHTML = `<p><b>${esc(profile.username)}</b>${profile.champion ? ' 👑' : ''} <span class="small dimtext">· since ${new Date(st.created).toLocaleDateString()}</span></p>
      <div class="stat-grid"><div><b>${fmt(profile.coins)}</b>coins</div><div><b>${fmt(profile.best)}</b>best score</div><div><b>${fmt(st.runs)}</b>runs</div><div><b>${fmt(st.rows)}</b>rows crossed</div>
      <div><b>${fmt(st.coinsEarned)}</b>coins earned</div><div><b>${fmt(st.coinsSpent)}</b>coins spent</div><div><b>${fmt(profile.owned.size)}</b>characters</div><div><b>${profile.rank ? '#' + profile.rank : '—'}</b>world rank</div></div>
      <div class="acct-row"><button class="btn" data-a="switch">Switch account</button><button class="btn" data-a="pin">Change PIN</button><button class="btn" data-a="logout">Sign out here</button></div>
      ${profile.pending.length ? `<p class="small dimtext">${profile.pending.length} run(s) waiting to be sent.</p>` : ''}`;
  }
}
const segClick = (id, key, conv = v => v) => $(id).addEventListener('click', e => { const b = e.target.closest('button'); if (b) { saveSetting({ [key]: conv(b.dataset.v) }); renderSettings(); } });
segClick('set-speed', 'hopTicks', Number); segClick('set-bat', 'batWings'); segClick('set-quality', 'quality'); segClick('set-train', 'trainWarning');
$('set-vol').addEventListener('change', e => saveSetting({ volume: +e.target.value }));
$('set-sfx').addEventListener('change', e => saveSetting({ sfx: +e.target.value }));
$('set-mute').addEventListener('change', e => saveSetting({ muted: e.target.checked }));
$('set-motion').addEventListener('change', e => saveSetting({ reducedMotion: e.target.checked }));
$('set-contrast').addEventListener('change', e => saveSetting({ highContrast: e.target.checked }));
$('set-shake').addEventListener('change', e => saveSetting({ shake: e.target.checked }));
$('set-account').addEventListener('click', async e => {
  const a = e.target.closest('[data-a]');
  if (!a) return;
  if (a.dataset.a === 'signin' || a.dataset.a === 'switch') { openAccount('welcome'); return; }
  if (a.dataset.a === 'logout') {
    try { const d = await api('/api/auth/logout', {}); session = { ...(session || {}), accounts: d.accounts }; } catch { /* offline: forget locally anyway */ }
    profile = new GuestProfile(); applySettings(); openAccount('welcome'); return;
  }
  if (a.dataset.a === 'pin') {
    const old = prompt('Your current PIN:'); if (!old) return;
    const pin = prompt('New PIN (at least 4 characters):'); if (!pin) return;
    try { await api('/api/auth/pin', { old, pin }); banner('PIN changed', 'Account'); } catch (err) { alert(err.message); }
  }
});

// ------------------------------------------------------------ characters (carousel)
let charsFrom = 'title';
function openChars() {
  charsFrom = state;
  state = 'chars';
  sel = Math.max(0, CHARACTERS.findIndex(c => c.id === profile.selected));
  if (!renderer.carousel.length) renderer.buildCarousel(profile.owned);
  else renderer.setCarouselOwned(profile.owned);
  renderer.pPos = sel * 2.2;
  show('s-chars');
  updateChars();
}
function updateChars() {
  const c = CHARACTERS[sel];
  const owned = profile.owned.has(c.id);
  const q = qualityOf(c);
  $('c-quality').innerHTML = `<span class="q-${q}">${q}${NEW_2026.has(c.id) ? ' · New' : ''}</span>`;
  $('c-name').textContent = owned || c.price !== null ? c.name : '???';
  $('c-coins').textContent = fmt(profile.coins);
  const btn = $('c-action');
  const note = THEME_NOTE[c.theme] || '';
  if (owned) {
    const isSel = profile.selected === c.id;
    btn.textContent = isSel ? 'Selected' : 'Select';
    btn.disabled = isSel;
    btn.className = 'btn green';
    $('c-info').textContent = note || (isSel ? 'Ready to cross' : 'Unlocked');
  } else if (c.challenge || c.code) {
    btn.textContent = c.code ? '🎟️ Secret' : '🏆 Challenge';
    btn.disabled = true;
    btn.className = 'btn';
    const ch = c.challenge;
    $('c-info').textContent = ch ? `${ch.text} (best ${Math.min(profile.records[ch.stat] || 0, ch.goal)}/${ch.goal})` + (note ? ' • ' + note.toLowerCase() : '') : 'Unlocked with a secret redeem code';
  } else {
    btn.innerHTML = '<span class="coin-ic"></span>' + fmt(c.price);
    btn.disabled = false;
    btn.className = 'btn orange';
    $('c-info').textContent = (profile.coins < c.price ? 'Need ' + fmt(c.price - profile.coins) + ' more coins' : 'Unlock ' + c.name) + (note ? ' • ' + note.toLowerCase() : '');
  }
  $('c-dots').textContent = `${sel + 1} / ${CHARACTERS.length} • ${profile.owned.size} unlocked`;
  const left = CHARACTERS.filter(x => x.price !== null && x.price <= PRIZE_MAX_PRICE && !profile.owned.has(x.id)).length;
  $('c-prize').disabled = !left || profile.coins < PRIZE_PRICE;
  $('c-prize').innerHTML = left ? `🎁 Prize <span class="coin-ic"></span>${PRIZE_PRICE}` : '🎁 You have every prize!';
}
function charsStep(d) {
  sel = (sel + d + CHARACTERS.length) % CHARACTERS.length;
  sound.click();
  updateChars();
}
async function charsAction() {
  const c = CHARACTERS[sel];
  if (profile.owned.has(c.id)) {
    if (await profile.select(c.id)) { sound.click(); renderer.setCharacter(profile.selected); }
  } else if (c.price !== null) {
    await purchase(c);
  }
  updateChars();
  updateHud();
}
function closeChars() {
  sound.click();
  toTitle();
}

// ------------------------------------------------------------ purchases (with confirmation)
function confirmBox({ title, text, yes = 'Buy', thumb, canYes = true }) {
  return new Promise(resolve => {
    $('cf-title').textContent = title; $('cf-text').innerHTML = text; $('cf-yes').textContent = yes;
    $('cf-yes').hidden = !canYes;
    $('cf-thumb').innerHTML = thumb ? `<img alt="" src="${thumb}">` : '';
    $('confirm').hidden = false;
    const done = v => { $('confirm').hidden = true; $('cf-yes').onclick = $('cf-no').onclick = null; resolve(v); };
    $('cf-yes').onclick = e => { e.stopPropagation(); done(true); };
    $('cf-no').onclick = e => { e.stopPropagation(); done(false); };
  });
}
async function purchase(c) {
  const short = c.price - profile.coins;
  const thumb = renderer.thumbnail(c.id, true);
  if (short > 0) {
    await confirmBox({ title: c.name, text: `Costs <b>${fmt(c.price)}</b> coins — you need <b>${fmt(short)}</b> more. Cross more roads or finish daily challenges to earn them!`, thumb, canYes: false, yes: '' });
    return false;
  }
  if (!await confirmBox({ title: `Buy ${c.name}?`, text: `Spend <b>${fmt(c.price)}</b> of your ${fmt(profile.coins)} coins.`, yes: `Buy for ${fmt(c.price)}`, thumb })) return false;
  const r = await profile.buy(c.id);
  if (!r.ok) { banner(r.error || 'Couldn’t buy that', 'Shop'); return false; }
  sound.buy();
  if (profile.isGuest) profile.local.select(c.id);
  renderer.setCarouselOwned(profile.owned);
  renderer.setCharacter(profile.selected);
  banner(c.name + '!', c.premium ? '✨ Premium unlocked' : 'New friend');
  return true;
}
async function prize() {
  if (!await confirmBox({ title: 'Prize machine', text: `Spend <b>${PRIZE_PRICE}</b> coins for a random character you don't have yet (any of the ordinary characters up to ${PRIZE_MAX_PRICE} coins, each equally likely).`, yes: `Spin for ${PRIZE_PRICE}` })) return;
  const r = await profile.prize();
  if (!r.ok) { banner(r.error || 'Couldn’t spin', 'Prize'); return; }
  sound.buy();
  renderer.setCarouselOwned(profile.owned);
  sel = CHARACTERS.indexOf(r.char);
  updateChars();
  updateHud();
  $('c-info').textContent = 'You won ' + r.char.name + '!';
}

// ------------------------------------------------------------ shop list
let shopFrom = 'chars';
function openShop() {
  shopFrom = state;
  state = 'shop';
  show('s-shop');
  renderShop();
}
function renderShop() {
  const q = $('shop-q').value.trim().toLowerCase(), sort = $('shop-sort').value;
  const afford = $('shop-afford').checked, hideOwned = $('shop-owned').checked;
  $('shop-coins').textContent = fmt(profile.coins);
  let list = CHARACTERS.filter(c => (!q || c.name.toLowerCase().includes(q)) && (!afford || (c.price !== null && c.price <= profile.coins && !profile.owned.has(c.id))) && (!hideOwned || !profile.owned.has(c.id)));
  const P = c => (c.price === null ? 1e9 : c.price);
  if (sort === 'price') list.sort((a, b) => P(a) - P(b));
  else if (sort === '-price') list.sort((a, b) => (b.price ?? -1) - (a.price ?? -1));   // unbuyable skins last
  else if (sort === 'name') list.sort((a, b) => a.name.localeCompare(b.name));
  else list.sort((a, b) => (NEW_2026.has(b.id) - NEW_2026.has(a.id)) || P(a) - P(b));
  $('shop-grid').innerHTML = list.map(c => {
    const own = profile.owned.has(c.id), eq = profile.selected === c.id, quality = qualityOf(c);
    const show = own || c.price !== null;
    const price = own ? (eq ? 'Equipped' : 'Owned') : c.price !== null ? `<span class="coin-ic"></span>${fmt(c.price)}` : c.challenge ? '🏆 Challenge' : '🎟️ Secret';
    return `<button class="scard${own ? ' owned' : ''}${eq ? ' eq' : ''}${!own && c.price !== null && c.price > profile.coins ? ' poor' : ''}${c.premium ? ' premium' : ''}" data-id="${c.id}">
      ${own ? `<span class="flag">${eq ? '★' : '✓'}</span>` : ''}<img alt="" loading="lazy" data-thumb="${c.id}" data-show="${show ? 1 : 0}"><span class="nm">${show ? esc(c.name) : '???'}</span>
      <span class="q q-${quality}">${quality}</span><span class="pr">${price}</span></button>`;
  }).join('') || '<p>No characters match.</p>';
  // draw thumbnails a few at a time so the list appears instantly
  const imgs = [...$('shop-grid').querySelectorAll('img[data-thumb]')];
  let i = 0;
  const work = () => { const end = Math.min(imgs.length, i + 8); for (; i < end; i++) imgs[i].src = renderer.thumbnail(imgs[i].dataset.thumb, imgs[i].dataset.show === '1'); if (i < imgs.length && state === 'shop') requestAnimationFrame(work); };
  requestAnimationFrame(work);
}
for (const id of ['shop-q', 'shop-sort', 'shop-afford', 'shop-owned']) $(id).addEventListener('input', renderShop);
$('shop-grid').addEventListener('click', async e => {
  const b = e.target.closest('[data-id]');
  if (!b) return;
  const c = charById(b.dataset.id);
  if (profile.owned.has(c.id)) { await profile.select(c.id); renderer.setCharacter(profile.selected); sound.click(); }
  else if (c.price !== null) await purchase(c);
  else { await confirmBox({ title: c.challenge ? 'Challenge skin' : 'Secret skin', text: c.challenge ? `${esc(c.challenge.text)} to unlock it.` : 'Unlocked with a secret redeem code.', canYes: false }); }
  renderShop();
});
for (const ev of ['pointerdown', 'keydown']) for (const id of ['s-shop', 'confirm', 's-settings', 's-account']) $(id).addEventListener(ev, e => e.stopPropagation());

// ------------------------------------------------------------ challenges (daily + hero skins)
let challengesFrom = 'title', chTab = 'daily';
function openChallenges(tab = chTab) {
  challengesFrom = state;
  state = 'challenges';
  chTab = tab;
  show('s-challenges');
  renderHeroes();
  renderDaily();
  setTab();
  if (!profile.isGuest) profile.daily().then(() => { if (state === 'challenges') renderDaily(); refreshDailyDot(); }).catch(() => { if (state === 'challenges' && !profile.dailyState) $('d-cards').innerHTML = '<p class="ch-note">Daily challenges are offline. Try again soon.</p>'; });
}
function setTab() {
  for (const b of document.querySelectorAll('#s-challenges [data-tab]')) b.setAttribute('aria-selected', String(b.dataset.tab === chTab));
  $('ch-daily').hidden = chTab !== 'daily'; $('ch-heroes').hidden = chTab !== 'heroes';
}
for (const b of document.querySelectorAll('#s-challenges [data-tab]')) b.addEventListener('click', e => { e.stopPropagation(); chTab = b.dataset.tab; setTab(); });
function renderHeroes() {
  const done = CHALLENGES.filter(c => profile.owned.has(c.id)).length;
  $('ch-count').textContent = `${done} / ${CHALLENGES.length} heroes`;
  const order = { Easy: 0, Medium: 1, Hard: 2, Extreme: 3 };
  const list = CHALLENGES.slice().sort((a, b) => order[a.challenge.tier] - order[b.challenge.tier] || a.challenge.goal - b.challenge.goal);
  $('ch-list').innerHTML = list.map(c => {
    const ch = c.challenge, got = profile.owned.has(c.id), best = Math.min(profile.records[ch.stat] || 0, ch.goal);
    const pct = got ? 100 : Math.round(best / ch.goal * 100);
    return `<div class="ch${got ? ' done' : ''}"><b>${got ? '✅ ' + c.name : '🔒 ' + c.name}</b><span class="tier ${ch.tier}">${ch.tier}</span>
      <span class="goal">${ch.text}</span><span class="num">${got ? 'Unlocked' : best + ' / ' + ch.goal}</span><div class="bar"><i style="width:${pct}%"></i></div></div>`;
  }).join('');
}
const TIER_IC = { easy: '🌱', medium: '⚡', hard: '🔥' };
const RAR_NAME = { standard: 'Standard', rare: 'Rare', epic: 'Epic', legendary: 'Legendary' };
function renderDaily() {
  if (profile.isGuest) {
    $('d-reset').textContent = 'Three new challenges every day, worth up to 130 coins.';
    $('d-cards').innerHTML = '<div class="dcard"><span class="ic">🔒</span><span class="nm">Sign in to play daily challenges</span><span class="ds">Daily challenges, coins and characters are saved to your account so they follow you to any device.</span><div class="act"><button class="btn green" data-signin>Sign in or create an account</button></div></div>';
    $('d-note').textContent = '';
    return;
  }
  const st = profile.dailyState;
  if (!st) { $('d-cards').innerHTML = '<p class="ch-note">Loading today’s challenges…</p>'; return; }
  $('d-cards').innerHTML = st.challenges.map(c => {
    const pct = Math.round(Math.min(1, c.value / c.goal) * 100);
    const act = c.claimed ? '<span class="state">✓ Claimed</span>' : c.done ? `<button class="btn green" data-claim="${c.id}">Claim ${c.reward} coins</button>` : '';
    return `<div class="dcard r-${c.rarity}${c.done ? ' done' : ''}${c.done && !c.claimed ? ' ready' : ''}${c.claimed ? ' claimed' : ''}" data-card="${c.id}">
      <span class="ic">${TIER_IC[c.tier]}</span><span class="nm">${esc(c.name)}</span>
      <span class="tags"><span class="tg-${c.tier}">${c.tier}</span>${c.rarity !== 'standard' ? `<span class="rar r-${c.rarity}">${RAR_NAME[c.rarity]}</span>` : ''}</span>
      <span class="ds">${esc(c.desc)}</span>
      <span class="rw"><span class="coin-ic"></span>${c.base}${c.bonus ? `<small>+${c.bonus} bonus</small>` : ''}</span>
      <div class="bar"><i style="width:${pct}%"></i><em>${c.done ? 'Challenge complete!' : `${fmt(c.value)} / ${fmt(c.goal)}`}</em></div>
      <div class="act">${act}</div></div>`;
  }).join('');
  $('d-note').textContent = 'Progress counts from runs that start today (UTC). Runs using “fast” or the autopilot don’t count.';
  tickCountdown();
}
function tickCountdown() {
  const st = profile.dailyState;
  if (!st || profile.isGuest) return;
  const offset = st.now - (st.fetchedAt || (st.fetchedAt = Date.now()));
  const left = Math.max(0, st.resetAt - (Date.now() + offset));
  const h = Math.floor(left / 3600000), m = Math.floor(left / 60000) % 60, s = Math.floor(left / 1000) % 60;
  $('d-reset').textContent = `New challenges in ${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  // at the reset, fetch the new day's three without touching a run in progress
  if (left === 0 && !st.refreshing) { st.refreshing = true; profile.daily().then(() => { if (state === 'challenges') renderDaily(); refreshDailyDot(); }).catch(() => { st.refreshing = false; }); }
}
setInterval(() => { if (state === 'challenges' && chTab === 'daily') tickCountdown(); else if (profile.dailyState && !profile.isGuest) { const st = profile.dailyState; if (st.resetAt - (Date.now() + (st.now - (st.fetchedAt || Date.now()))) <= 0 && !st.refreshing) tickCountdown(); } }, 1000);
$('d-cards').addEventListener('click', async e => {
  if (e.target.closest('[data-signin]')) { openAccount('welcome'); return; }
  const b = e.target.closest('[data-claim]');
  if (!b) return;
  b.disabled = true; b.textContent = 'Claiming…';
  const day = profile.dailyState.day;
  try {
    const d = await profile.claim(day, b.dataset.claim);
    sound.cheer();
    renderDaily();
    const card = document.querySelector(`[data-card="${b.dataset.claim}"]`);
    if (card) { card.classList.add('pop'); coinShower(card); }
    banner(d.already ? 'Already claimed' : `+${d.awarded} coins`, d.already ? 'Daily' : 'Challenge reward');
    updateHud(); refreshDailyDot();
  } catch (err) {
    b.disabled = false; b.textContent = 'Try again';
    $('d-note').textContent = err.status === 0 ? 'Couldn’t reach the server — your reward is safe, try again in a moment.' : err.message;
  }
});
function coinShower(el) {
  const r = el.getBoundingClientRect();
  for (let i = 0; i < 14; i++) {
    const c = document.createElement('span');
    c.className = 'coin-ic';
    c.style.cssText = `position:fixed;left:${r.left + r.width / 2}px;top:${r.top + r.height / 2}px;z-index:40;pointer-events:none;transition:transform .9s cubic-bezier(.2,.7,.3,1),opacity .9s;`;
    document.body.appendChild(c);
    requestAnimationFrame(() => { c.style.transform = `translate(${(Math.random() - 0.5) * 260}px,${-60 - Math.random() * 160}px) rotate(${Math.random() * 360}deg)`; c.style.opacity = '0'; });
    setTimeout(() => c.remove(), 950);
  }
}
function refreshDailyDot() {
  const st = profile.dailyState;
  $('t-chdot').hidden = !(st && st.challenges.some(c => c.done && !c.claimed));
}
function closeChallenges() {
  state = challengesFrom === 'over' ? 'over' : 'title';
  show(state === 'over' ? 's-over' : 's-title');
}

// Live daily progress while running: milestone toasts, never one per hop.
function dailyLive() {
  const st = profile.dailyState;
  if (!st || profile.isGuest || !game || game.usedFast || game.practiceReason) return;
  const cur = game.runStats();
  for (const c of st.challenges) {
    if (c.claimed || c.done) continue;
    const d = dailyById[c.id];
    const v = liveValue(d, c.value, cur);
    const frac = v / c.goal;
    const mark = frac >= 1 ? 'done' : frac >= 0.75 ? '75' : frac >= 0.5 ? '50' : null;
    if (!mark || announced.has(c.id + mark)) continue;
    announced.add(c.id + mark);
    if (mark === 'done') { sound.cheer(); toast(`🎉 ${c.name} — complete! Claim ${c.reward} coins after the run`, 1); }
    else toast(`${c.name} — ${fmt(v)}/${fmt(c.goal)}`, frac);
  }
}
function toast(text, frac) {
  const t = $('toast');
  t.innerHTML = `<span>${esc(text)}</span>${frac < 1 ? `<span class="tbar"><i style="width:${Math.round(frac * 100)}%"></i></span>` : ''}`;
  t.classList.add('show');
  clearTimeout(toastTimer); toastTimer = setTimeout(() => t.classList.remove('show'), 2600);
}

// ------------------------------------------------------------ input
function onMove(dir, src) {
  sound.unlock();
  if (state === 'title') {
    startPlaying();
    game.input(dir);
  } else if (state === 'playing') {
    if (!game.started) $('hint').hidden = true;
    game.input(dir);
  } else if (state === 'chars') {
    if (dir === 'left') charsStep(src === 'swipe' ? 1 : -1);
    else if (dir === 'right') charsStep(src === 'swipe' ? -1 : 1);
  }
}

function onKey(e) {
  if (e.target && e.target.tagName === 'BUTTON' && (e.code === 'Space' || e.code === 'Enter')) return false;
  const k = e.code;
  if (state === 'account' || !$('confirm').hidden) return false;
  if (k === 'KeyM') { toggleMute(); return true; }
  if (state === 'board') {
    if (k === 'Escape' || k === 'Space' || k === 'Enter') { closeBoard(); return true; }
    return false;
  }
  if (state === 'challenges') { if (k === 'Escape') closeChallenges(); return true; }
  if (state === 'settings') { if (k === 'Escape') closeSettings(); return false; }
  if (state === 'shop') { if (k === 'Escape') { state = 'chars'; show('s-chars'); updateChars(); } return false; }
  if (k === 'KeyP' || k === 'Escape') {
    if (state === 'playing' || state === 'dying') pause();
    else if (state === 'paused') resume();
    else if (state === 'chars' && k === 'Escape') closeChars();
    return true;
  }
  if (k === 'Space' || k === 'Enter') {
    sound.unlock();
    if (state === 'title') { startPlaying(); game.input('up'); }
    else if (state === 'playing') game.input('up');
    else if (state === 'paused') resume();
    else if (state === 'over' && performance.now() - lastOver > 400) retry();
    else if (state === 'chars') charsAction();
    return true;
  }
  if (k === 'KeyC' && (state === 'title' || state === 'over')) { sound.unlock(); openChars(); return true; }
  if (state === 'race' && k === 'Escape') { leaveRace(); return true; }
  return false;
}

new Input(canvas, onMove, onKey);

const click = (id, fn) => $(id).addEventListener('click', e => { e.stopPropagation(); sound.unlock(); fn(); e.currentTarget.blur(); });
click('b-pause', pause);
click('p-resume', resume);
click('p-settings', () => { sound.click(); openSettings(); });
click('p-menu', () => { sound.click(); quitRun(); });
click('o-retry', () => { sound.click(); retry(); });
click('o-chars', () => { sound.click(); openChars(); });
click('o-challenges', () => { sound.click(); openChallenges('daily'); });
click('o-menu', () => { sound.click(); toTitle(); });
click('t-chars', () => { sound.click(); openChars(); });
click('t-challenges', () => { sound.click(); openChallenges('daily'); });
click('ch-close', () => { sound.click(); closeChallenges(); });
click('t-board', () => { sound.click(); openBoard(); });
click('o-board', () => { sound.click(); openBoard(); });
click('b-back', () => { sound.click(); closeBoard(); });
click('t-settings', () => { sound.click(); openSettings(); });
click('t-user', () => { sound.click(); if (profile.isGuest) openAccount('welcome'); else openSettings(); });
click('set-close', () => { sound.click(); closeSettings(); });
click('c-back', closeChars);
click('c-prev', () => charsStep(-1));
click('c-next', () => charsStep(1));
click('c-action', charsAction);
click('c-prize', prize);
click('c-shop', () => { sound.click(); openShop(); });
click('shop-close', () => { sound.click(); state = 'chars'; show('s-chars'); renderer.setCarouselOwned(profile.owned); sel = Math.max(0, CHARACTERS.findIndex(c => c.id === profile.selected)); updateChars(); });
click('t-redeem', askCode);
click('c-redeem', askCode);
// phones: hold the score during a run to type a code
{
  let holdT = 0;
  const sc = document.querySelector('#hud .score');
  sc.style.pointerEvents = 'auto';
  sc.addEventListener('pointerdown', e => { e.stopPropagation(); clearTimeout(holdT); holdT = setTimeout(askCode, 700); });
  for (const ev of ['pointerup', 'pointerleave', 'pointercancel']) sc.addEventListener(ev, () => clearTimeout(holdT));
}
for (const b of document.querySelectorAll('.mute')) b.addEventListener('click', e => { e.stopPropagation(); toggleMute(); b.blur(); });
// buttons should never start a hop underneath them
for (const b of document.querySelectorAll('button, a, input, select, label')) b.addEventListener('pointerdown', e => e.stopPropagation());

document.addEventListener('visibilitychange', () => {
  if (document.hidden) { pause(); sound.suspend(); } else { if (!profile.muted) sound.resume(); if (!profile.isGuest) profile.flush().then(updateHud).catch(() => {}); }
});
window.addEventListener('blur', () => pause());
window.addEventListener('online', () => { if (!profile.isGuest) { profile.flush().then(updateHud).catch(() => {}); profile.refill(); } });
window.addEventListener('resize', () => renderer.resize());
document.addEventListener('gesturestart', e => e.preventDefault());
document.addEventListener('touchmove', e => { if (e.cancelable && !e.target.closest('.panel-body, .shop-grid, .ch-list, #s-challenges, #s-account, .admin-list, .board-list')) e.preventDefault(); }, { passive: false });
document.addEventListener('dblclick', e => e.preventDefault());
document.addEventListener('contextmenu', e => { if (!e.target.closest('input')) e.preventDefault(); });

// ------------------------------------------------------------ events -> sound/effects
function handleEvents() {
  for (const e of game.takeEvents()) {
    switch (e.type) {
      case 'hop':
        sound.hop();
        if (renderer.charId === 'royalphoenix') { renderer.burst(game.player.x, 0.5, -game.player.row, 3, [0xffc030, 0xff6a1a, 0xe8302a], 1.2, 0.07, 0.5, 0.6, 3); sound.feathers(); }
        break;
      case 'bump': sound.bump(); break;
      case 'land': if (e.log) sound.plop(); else if (e.lane !== 'river') renderer.burst(game.player.x, 0.05, -game.player.row, 3, [0xffffff, 0xece4d4], 0.9, 0.07, 0.35, 0.4); break;
      case 'score': {
        updateHud();
        dailyLive();
        const zone = zoneOf(e.score);
        if (zone !== lastZone) { lastZone = zone; banner(BIOME_NAMES[renderer.themeForZone(zone)] || '', 'Entering'); }
        else if (e.score % 50 === 0) banner(e.score + ' rows!', 'Milestone');
        break;
      }
      case 'invincible': sound.buy(); banner('INVINCIBLE ' + e.seconds + 's', '⚡ fast · practice run'); $('practice').hidden = false; $('practice').textContent = 'Practice run — no coins or progress'; renderer.burst(game.player.x, 0.6, -game.player.row, 24, [0xc8202a, 0xffc93a, 0x9ff4ff], 3, 0.14, 0.9); break;
      case 'shrug': sound.bump(); break;
      case 'coin':
        if (!racing()) profile.runCoin(e.value || 1);
        dailyLive();
        sound.coin();
        if (e.gem) { setTimeout(() => sound.coin(), 90); setTimeout(() => sound.coin(), 180); renderer.burst(game.player.x, 0.7, -game.player.row, 10, [0x3ac8ff, 0x9ff4ff, 0xffffff], 2, 0.09, 0.6); banner('+' + GEM_VALUE, '💎 Blue jewel'); }
        renderer.collectCoin(e.row);
        updateHud();
        $('coinbox').classList.remove('pop'); void $('coinbox').offsetWidth; $('coinbox').classList.add('pop');
        break;
      case 'death':
        state = 'dying';
        deathTime = performance.now();
        renderer.onDeath(game);
        $('trainwarn').hidden = true;
        if (e.kind === 'car') sound.squish();
        else if (e.kind === 'train') sound.smash();
        else if (e.kind === 'drown' || e.kind === 'drift') sound.splash();
        else if (e.kind === 'eagle') { sound.screech(); setTimeout(() => sound.flap(), 450); }
        if (navigator.vibrate && touchUI) { try { navigator.vibrate(60); } catch { /* ignore */ } }
        break;
    }
  }
}

// ------------------------------------------------------------ secret words, codes, admin
function secret(word, src) {
  if (word === 'fast') {
    if (race) { banner('Not in a race!', '⚡ fast'); return true; }
    if (state === 'playing' || state === 'dying') { if (game && !game.player.dead) game.makeInvincible(); }
    else { pendingFast = true; banner('Invincible next run!', '⚡ fast · practice'); sound.buy(); }
    return true;
  }
  profile.redeem(word).then(r => {
    if (r.ok) {
      sound.buy(); banner(r.char.name + '!', 'Code redeemed');
      if (renderer.carousel.length) renderer.setCarouselOwned(profile.owned);
      if (state === 'chars') { sel = CHARACTERS.indexOf(r.char); updateChars(); }
      else if (state === 'title') { newGame(); }   // a fresh run, so the new skin's hop length applies
      updateHud();
    } else if (src === 'prompt') tryAdmin(word);
  });
  return true;
}
let adminCode = null, adminData = { rows: [], legacy: [] }, adminBoard = 'accounts';
function tryAdmin(code) {
  api('/api/admin', { code, action: 'list' }).then(d => { adminCode = code; adminData = d; openAdmin(); })
    .catch(e => banner(/many/i.test(e.message) ? e.message : 'Unknown code', 'Hmm'));
}
function adminRows() { return adminBoard === 'legacy' ? adminData.legacy : adminData.rows; }
function openAdmin(msg = '') {
  const rows = adminRows(), legacy = adminBoard === 'legacy';
  $('a-list').innerHTML = rows.map((r, i) => `<div class="r"><span>${i + 1}</span><input data-i="${i}" data-k="name" maxlength="14" value="${esc(r.name)}"${legacy ? '' : ' readonly title="Account names can’t be changed here"'}><input data-i="${i}" data-k="score" type="number" min="0" value="${r.score | 0}"><button data-del="${i}" aria-label="${legacy ? 'Delete' : 'Remove from board'}">✕</button></div>`).join('') || '<p>No scores yet.</p>';
  $('a-add').hidden = !legacy;
  for (const b of document.querySelectorAll('#s-admin [data-board]')) b.setAttribute('aria-selected', String(b.dataset.board === adminBoard));
  $('a-msg').textContent = msg || (legacy ? '' : 'Account scores: change a best score, or ✕ to take a player off the board (score 0).');
  $('s-admin').hidden = false;
}
function readAdmin() {
  for (const inp of $('a-list').querySelectorAll('input')) {
    const r = adminRows()[+inp.dataset.i];
    if (r) r[inp.dataset.k] = inp.dataset.k === 'score' ? Math.max(0, Math.floor(+inp.value || 0)) : inp.value;
  }
}
for (const b of document.querySelectorAll('#s-admin [data-board]')) b.addEventListener('click', e => { e.stopPropagation(); readAdmin(); adminBoard = b.dataset.board; openAdmin(); });
$('a-list').addEventListener('click', e => {
  const d = e.target.dataset.del;
  if (d === undefined) return;
  readAdmin();
  if (adminBoard === 'legacy') adminData.legacy.splice(+d, 1); else adminData.rows[+d].score = 0;
  openAdmin();
});
click('a-add', () => { readAdmin(); adminData.legacy.unshift({ name: 'New name', score: 0, char: 'chicken' }); openAdmin(); });
click('a-close', () => { $('s-admin').hidden = true; });
click('a-save', () => {
  readAdmin(); $('a-msg').textContent = 'Saving…';
  api('/api/admin', { code: adminCode, action: 'save', board: adminBoard, rows: adminRows() })
    .then(d => { adminData = d; openAdmin('Saved ✔'); refreshChampion(); })
    .catch(e => { $('a-msg').textContent = e.message; });
});
for (const ev of ['pointerdown', 'keydown']) $('s-admin').addEventListener(ev, e => e.stopPropagation());
function askCode() {
  const w = (prompt('Enter a code:') || '').trim().toLowerCase();
  if (w) secret(w, 'prompt');
}
// Typing a secret word: the letters that would make you hop (a, s, d...) are swallowed while
// you're partway through a word, so "fast" doesn't walk you into traffic.
window.addEventListener('keydown', e => {
  if (e.ctrlKey || e.metaKey || e.altKey || e.repeat) return;
  if (e.target && /INPUT|TEXTAREA|SELECT/.test(e.target.tagName)) return;
  if (state === 'account') return;
  if (!/^[a-z]$/i.test(e.key)) { typed = ''; return; }
  const next = (typed + e.key.toLowerCase()).slice(-12);
  for (const w of SECRET_WORDS) if (next.endsWith(w)) { typed = ''; secret(w); e.stopImmediatePropagation(); e.preventDefault(); return; }
  typed = next;
  const started = SECRET_WORDS.some(w => { for (let k = 2; k < w.length; k++) if (next.endsWith(w.slice(0, k))) return true; return false; });
  if (started && /^[wasd]$/i.test(e.key)) { e.stopImmediatePropagation(); e.preventDefault(); }
}, true);

function banner(text, kicker) {
  if (!text) return;
  const b = $('banner');
  b.innerHTML = `<small>${esc(kicker)}</small>${esc(text)}`;
  b.classList.remove('show'); void b.offsetWidth; b.classList.add('show');
  clearTimeout(bannerTimer); bannerTimer = setTimeout(() => b.classList.remove('show'), 2200);
}

// Traffic whooshes, horns, train bells and rumble near the player, and the on-screen train warning.
const prevPhase = new Map();
const passed = new Map();
function ambient() {
  if (state !== 'playing' && state !== 'dying') { sound.rumble(0); $('trainwarn').hidden = true; return; }
  const p = game.player, t = game.t;
  const row = game.curRow(), px = p.x;
  let rumble = 0, bell = false, warn = null;
  for (let r = row - 2; r <= row + 8; r++) {
    const lane = game.lanes.get(r);
    if (!lane) continue;
    if (lane.type === 'road' && Math.abs(r - row) <= 1) {
      for (let i = 0; i < lane.items.length; i++) {
        const v = lane.items[i];
        const dx = entityX(lane, v, t) - px;
        const key = r * 64 + i;
        const prev = passed.get(key);
        passed.set(key, dx);
        if (prev !== undefined && Math.sign(prev) !== Math.sign(dx) && Math.abs(dx) < 3 && !p.dead) sound.whoosh(r === row ? 1 : 0.6);
        if (r === row && !p.dead && lane.dir * -dx > 0 && Math.abs(dx) < 3.6 && Math.abs(dx) > v.len / 2 + 0.6) sound.horn();
      }
    } else if (lane.type === 'rail') {
      const s = trainState(lane, t);
      const near = 1 - Math.abs(r - row) / 9;
      if (s.phase === 'warn' && r - row <= 5) bell = true;
      // the on-screen warning covers any track from the one you're on to four rows ahead
      if (s.phase !== 'idle' && r >= row && r - row <= 4 && !p.dead) {
        const lo = s.phase === 'pass' ? Math.min(s.head, s.tail) : -Infinity, hi = s.phase === 'pass' ? Math.max(s.head, s.tail) : Infinity;
        const coming = s.phase === 'warn' || (lane.dir > 0 ? lo < px + 1 : hi > px - 1);
        if (coming && (!warn || r - row < warn.d)) warn = { d: r - row, dir: lane.dir };
      }
      if (s.phase === 'pass') {
        const lo = Math.min(s.head, s.tail), hi = Math.max(s.head, s.tail);
        const dist = px < lo ? lo - px : px > hi ? px - hi : 0;
        rumble = Math.max(rumble, near * Math.max(0, 1 - dist / 22));
        if (prevPhase.get(r) !== 'pass' && Math.abs(r - row) <= 4) sound.trainHorn();
      }
      prevPhase.set(r, s.phase);
    }
  }
  if (bell) sound.bell();
  sound.rumble(rumble);
  const tw = $('trainwarn');
  tw.hidden = !warn;
  if (warn) {
    const steady = profile.settings.reducedMotion || profile.settings.trainWarning === 'steady';
    tw.className = 'trainwarn' + (steady ? '' : ' flash') + (warn.dir > 0 ? ' side-l' : ' side-r');
  }
}

// ------------------------------------------------------------ online race (race.js / race.py)
// Everyone plays the same seed at the same time; the others show up as ghosts and in the bar at the
// top. When your run ends (out, time, or you quit) its hops go to the server, which replays them: the
// standings only ever show replayed scores. Races never pay coins or touch records.
const net = new RaceClient();
let race = null;       // { code, you, host, players: Map, phase, no, seed, hopTicks, startAt, limit, live: Map, results: Map, running, sent, final, speed }
let lastPosSent = 0, goShown = 0;
const RACE_ERR = {
  'no room': 'No room with that code.', 'room full': 'That room is full (4 players).', racing: 'That race has already started — try again when it ends.',
  'need two': 'You need at least two players to start.', busy: 'The race server is busy — try again shortly.', expired: 'The room closed after a while with no races.',
  'slow down': 'Slow down a little.', 'no session': 'That race has finished.',
};
const racing = () => !!(race && race.running && !race.sent && game && game.practiceReason === 'race');
const raceName = () => (store.get('race.name', '') || (!profile.isGuest && profile.username) || '').slice(0, 16);
function raceStatus(msg, err) { $('r-status').textContent = msg || ''; $('r-status').classList.toggle('err', !!err); }
function raceStep(step) {
  for (const sec of document.querySelectorAll('#s-race [data-rstep]')) sec.hidden = sec.dataset.rstep !== step;
  if (race) race.step = step;
}
function openRace() {
  state = 'race';
  show('s-race');
  $('r-name').value = raceName();
  if (race && race.code) { renderLobby(); raceStep(race.final ? 'results' : race.phase === 'lobby' ? 'lobby' : 'results'); if (race.final) renderStandings(); }
  else { raceStep('menu'); raceStatus(''); }
}
function ensureRace() { if (!race) race = { players: new Map(), live: new Map(), results: new Map(), speed: 8 }; return race; }
function wantName() {
  const n = $('r-name').value.trim();
  if (!n) { raceStatus('Type a name first.', true); $('r-name').focus(); return null; }
  store.set('race.name', n);
  return n;
}
function leaveRace() {
  net.close();
  race = null;
  renderer.setGhosts([]);
  $('racebar').hidden = true; $('countdown').hidden = true;
  if (location.search.includes('race=')) history.replaceState(null, '', location.pathname);
  toTitle();
}
function renderLobby() {
  if (!race) return;
  $('r-room').textContent = race.code || '····';
  const me = race.you;
  $('r-players').innerHTML = [...race.players.values()].map(p =>
    `<li class="${p.id === me ? 'me' : ''}">${esc(p.name)}<span class="tag">${esc(charById(p.ch).name)}${p.id === race.host ? ' · host' : ''}${p.away ? ' · away' : ''}</span></li>`).join('');
  const host = race.host === me;
  $('r-host').hidden = !host || race.quick;
  for (const b of $('r-speed').children) b.setAttribute('aria-checked', String(Number(b.dataset.v) === race.speed));
  if (race.phase === 'lobby') {
    const n = race.players.size;
    raceStatus(race.quick ? (n < 2 ? 'Waiting for another racer…' : race.soonAt ? '' : 'Starting soon…')
      : host ? (n < 2 ? 'Share the code or link. You need at least two players.' : 'Ready when you are.') : 'Waiting for the host to start…');
  }
}
function standingsRows() {
  if (race.final) return race.final;
  // live: verified results first, then the people still running by their current rows
  const rows = [...race.players.values()].map(p => {
    const r = race.results.get(p.id), l = race.live.get(p.id);
    return { id: p.id, name: p.name, ch: p.ch, score: r ? r.score : (l ? l.s : 0), status: r ? r.status : 'running' };
  });
  return rows.sort((a, b) => (a.status === 'dq') - (b.status === 'dq') || b.score - a.score);
}
function renderStandings() {
  if (!race) return;
  const rows = standingsRows(), me = race.you;
  const label = r => r.status === 'dq' ? 'disqualified' : r.status === 'dnf' ? 'didn’t finish' : r.status === 'running' ? 'still going' : race.final ? '' : 'out';
  $('r-standings').innerHTML = rows.map((r, i) =>
    `<li class="${r.id === me ? 'me' : ''}"><span class="pl">${race.final ? (r.place || '–') : i + 1}</span>${esc(r.name)}${label(r) ? `<span class="tag">${label(r)}</span>` : ''}<span class="sc">${fmt(r.score)}</span></li>`).join('');
  $('r-again-row').hidden = !race.final || (!race.quick && race.host !== me);
  $('r-again').textContent = race.quick ? 'Find another race' : 'Race again';
}
function syncGhosts() {
  if (!race) { renderer.setGhosts([]); return; }
  const list = [];
  for (const p of race.players.values()) {
    if (p.id === race.you) continue;
    const l = race.live.get(p.id);
    list.push({ id: p.id, name: p.name, ch: p.ch, r: l ? l.r : null, x: l ? l.x : 0, d: l ? l.d : false });
  }
  renderer.setGhosts(race.running || race.sent ? list : []);
}
function setPlayers(list) {
  race.players = new Map(list.map(p => [p.id, p]));
}

function beginRace(m) {
  ensureRace();
  race.no = m.race; race.seed = m.seed; race.hopTicks = m.hopTicks; race.limit = m.limit;
  race.startAt = performance.now() + (m.in || 0) - (m.elapsed || 0);
  race.you = m.you || race.you;
  setPlayers(m.players);
  race.live = new Map(); race.results = new Map(); race.final = null;
  race.running = true; race.sent = false; race.phase = 'countdown';
  ticket = null; pendingFast = false;
  game = new Game({ seed: m.seed, hopTicks: m.hopTicks });
  game.practiceReason = 'race';
  renderer.setTheme(charById(profile.selected).theme);
  renderer.setCharacter(profile.selected);
  renderer.setCrown(false);
  renderer.reset(game);
  lastZone = 0; suited = false; announced = new Set();
  prevPhase.clear(); passed.clear();
  state = 'countdown';
  show(null);
  $('hint').hidden = true;
  $('practice').hidden = true;        // the race bar says it all; races never pay coins
  $('racebar').hidden = false;
  goShown = 0;
  updateHud(); syncGhosts(); renderRaceBar(performance.now());
  sound.click();
}

// your run is over (out, time's up, or quit): send it for the replay and watch the others
function raceRunOver(why) {
  if (!race || race.sent) return;
  race.sent = true;
  net.finish({ inputs: game.inputs, endTick: game.tick, fast: game.fastTicks });
  race.live.set(race.you, { r: game.player.row, x: game.player.x, s: game.score, d: true });
  state = 'race';
  show('s-race');
  raceStep('results');
  renderStandings();
  raceStatus((why === 'time' ? 'Time’s up! ' : why === 'quit' ? 'You stopped. ' : 'Out! ') + `${fmt(game.score)} rows — checking your run and waiting for the others…`);
  sound.over();
}

function renderRaceBar(now) {
  if (!race || !race.running) return;
  const left = Math.max(0, race.limit * 1000 - (now - race.startAt));
  const sec = Math.ceil(Math.min(left, race.limit * 1000) / 1000);
  $('rb-time').textContent = `${Math.floor(sec / 60)}:${String(sec % 60).padStart(2, '0')}`;
  $('rb-time').classList.toggle('low', sec <= 15);
  const me = race.you;
  const rows = [...race.players.values()].map(p => {
    const l = p.id === me && game ? { s: game.score, d: !!game.player.dead } : race.live.get(p.id) || { s: 0, d: false };
    const r = race.results.get(p.id);
    return { id: p.id, name: p.id === me ? 'You' : p.name, s: r ? r.score : l.s, out: !!(r || l.d) };
  }).sort((a, b) => b.s - a.s);
  $('rb-list').innerHTML = rows.map(r => `<li class="${r.id === me ? 'me' : ''}${r.out ? ' out' : ''}"><span class="n">${esc(r.name)}</span><b>${r.s}</b></li>`).join('');
}

let barT = 0;
function raceFrame(now) {
  if (!race.running) return;
  const cd = $('countdown');
  if (state === 'countdown') {
    const left = race.startAt - now;
    if (left > 0) { cd.hidden = false; const n = String(Math.ceil(left / 1000)); if (cd.textContent !== n) { cd.textContent = n; sound.click(); } return; }
    state = 'playing'; last = now; acc = 0; goShown = now;
    cd.textContent = 'GO!'; cd.hidden = false; sound.cheer();
  }
  if (goShown && now - goShown > 700) { cd.hidden = true; goShown = 0; }
  if (now - barT > 250) { barT = now; renderRaceBar(now); }
  if (race.sent || !game) return;
  if (now - race.startAt >= race.limit * 1000 && (state === 'playing' || state === 'dying' || state === 'paused')) { raceRunOver('time'); return; }
  if (now - lastPosSent > 125 && (state === 'playing' || state === 'dying' || state === 'paused')) {
    lastPosSent = now;
    const pose = game.pose(0);
    net.pos({ k: game.tick, r: Math.round(pose.z * 100) / 100, x: Math.round(pose.x * 100) / 100, s: game.score, d: !!game.player.dead });
  }
}

net.on('lobby', m => {
  ensureRace();
  race.code = m.code; race.you = m.you; race.host = m.host; race.quick = m.quick;
  const wasRunning = race.running;
  setPlayers(m.players);
  race.phase = m.phase;
  if (m.phase === 'lobby') {
    race.running = false; race.final = null;
    if (state === 'race') { raceStep('lobby'); }
  } else if (m.phase === 'done' && m.standings) {
    race.final = m.standings; race.running = false;
    if (state === 'race') { raceStep('results'); renderStandings(); }
  } else if ((m.phase === 'countdown' || m.phase === 'racing') && m.race && !(wasRunning && race.no === m.race.race)) {
    // a race is on that this page isn't playing (e.g. after a reload): watch it, join the next one
    race.no = m.race.race; race.limit = m.race.limit; race.running = false;
    if (state === 'race') { raceStep('results'); renderStandings(); raceStatus('A race is under way — you’ll be in the next one.'); }
  }
  renderLobby();
  if (state === 'race' && race.step === 'menu') raceStep(race.final ? 'results' : 'lobby');
});
net.on('start', beginRace);
net.on('soon', m => { if (race && state === 'race') raceStatus(`Starting in ${Math.ceil(m.in / 1000)} seconds…`); });
net.on('pos', m => {
  if (!race) return;
  race.live.set(m.id, m);
  syncGhosts();
  if (state === 'race' && race.step === 'results' && !race.final) renderStandings();
});
net.on('result', m => {
  if (!race) return;
  race.results.set(m.id, m);
  if (m.id === race.you && state === 'race') raceStatus(m.status === 'ok' ? `Your run checks out: ${fmt(m.score)} rows. Waiting for the others…` : 'Your run couldn’t be verified, so it doesn’t count this time.', m.status !== 'ok');
  if (state === 'race' && race.step === 'results') renderStandings();
});
net.on('final', m => {
  if (!race) return;
  race.final = m.standings; race.running = false; race.phase = 'done';
  if (!race.sent && game && game.practiceReason === 'race') race.sent = true;   // the server closed the race (time)
  $('racebar').hidden = true; $('countdown').hidden = true;
  renderer.setGhosts([]);
  const mine = m.standings.find(r => r.id === race.you);
  if (state !== 'race') { state = 'race'; show('s-race'); }
  raceStep('results'); renderStandings();
  const firsts = m.standings.filter(r => r.place === 1).length;
  const hostName = (race.players.get(race.host) || {}).name || 'the host';
  const next = race.quick ? '' : race.host === race.you ? ' Race again whenever you like.' : ` Waiting for ${hostName} to start another race.`;
  raceStatus((mine && mine.place === 1 ? (firsts > 1 ? '🤝 A tie for first!' : '🏆 You won!') : mine && mine.place ? `You came ${ordinal(mine.place)}.` : 'Race over.') + next);
  if (mine && mine.place === 1) sound.best(); else sound.over();
});
net.on('away', m => { if (race && race.players.get(m.id)) { race.players.get(m.id).away = true; renderLobby(); } });
net.on('back', m => { if (race && race.players.get(m.id)) { race.players.get(m.id).away = false; renderLobby(); } });
net.on('left', m => { if (race) { race.players.delete(m.id); race.live.delete(m.id); syncGhosts(); renderLobby(); if (race.step === 'results') renderStandings(); } });
net.on('error', msg => {
  if (msg === 'expired' || msg === 'no session') { race = null; renderer.setGhosts([]); $('racebar').hidden = true; if (state === 'race') { raceStep('menu'); } }
  if (state === 'race') raceStatus(RACE_ERR[msg] || 'Something went wrong.', true);
  else banner(RACE_ERR[msg] || 'Race problem', '🏁');
});
net.on('lost', () => { if (state === 'race') raceStatus('Lost the connection to the race server.', true); else banner('Lost the race connection', '🏁'); });
const ordinal = n => n + (['th', 'st', 'nd', 'rd'][(n % 100 - 20) % 10] || ['th', 'st', 'nd', 'rd'][n % 100] || 'th');

click('t-race', () => { sound.click(); openRace(); });
click('r-close', () => { sound.click(); leaveRace(); });
click('r-quick', () => { const n = wantName(); if (!n) return; sound.click(); ensureRace(); raceStatus('Finding a race…'); net.quick(n, profile.selected); });
click('r-create', () => { const n = wantName(); if (!n) return; sound.click(); ensureRace(); raceStatus('Opening a room…'); net.create(n, profile.selected); });
$('r-joinf').addEventListener('submit', e => {
  e.preventDefault();
  const n = wantName(); if (!n) return;
  const code = $('r-code').value.trim().toUpperCase();
  if (code.length !== 4) { raceStatus('Room codes are 4 letters.', true); $('r-code').focus(); return; }
  sound.click(); ensureRace(); raceStatus('Joining…'); net.join(code, n, profile.selected);
});
click('r-copy', () => {
  if (!race || !race.code) return;
  const link = raceLink(race.code);
  (navigator.clipboard ? navigator.clipboard.writeText(link) : Promise.reject()).then(() => raceStatus('Invite link copied.'), () => raceStatus(link));
});
for (const b of $('r-speed').children) b.addEventListener('click', e => { e.stopPropagation(); if (race) { race.speed = Number(b.dataset.v); renderLobby(); } });
click('r-go', () => { if (race) { sound.click(); net.go(race.speed); } });
click('r-again', () => {
  if (!race) return;
  sound.click();
  if (race.quick) { race.final = null; raceStep('lobby'); raceStatus('Finding a race…'); net.quick(raceName() || 'Player', profile.selected); }
  else net.go(race.speed);
});
for (const id of ['r-name', 'r-code']) $(id).addEventListener('keydown', e => e.stopPropagation());

// ------------------------------------------------------------ main loop (fixed 60 Hz simulation)
let last = performance.now();
let acc = 0;
function frame(now) {
  requestAnimationFrame(frame);
  let dt = (now - last) / 1000;
  last = now;
  if (!(dt > 0)) dt = 0;
  if (dt > 0.25) dt = 0.25;
  if (state === 'chars') {
    renderer.renderCarousel(sel, dt, charById(CHARACTERS[sel].id).theme);
    return;
  }
  if (state === 'boot') { renderer.render(); return; }
  if (race) raceFrame(now);
  if (state !== 'paused' && state !== 'countdown' && game) {
    acc += dt;
    let n = 0;
    while (acc >= TICK) {
      if (autopilot && state === 'playing') autopilot.update(game);
      game.step();
      handleEvents();
      acc -= TICK;
      if (++n > 12) { acc = 0; break; }
    }
    if (state === 'dying' && now - deathTime > (game.player.dead.type === 'eagle' ? 1500 : 1150)) gameOver();
    ambient();
  }
  if (game) {
    // while "fast" is on you're in the iron suit, with a countdown
    const inv = game.invincible && !game.player.dead;
    if (inv !== suited) { suited = inv; renderer.setCharacter(inv ? 'ironsuit' : profile.selected); }
    $('inv').hidden = !inv || state === 'over';
    if (inv) { const l = game.invLeft(); $('inv-t').textContent = Math.ceil(l); $('inv').classList.toggle('low', l < 3); }
    renderer.shield = inv ? game.invLeft() : 0;
    renderer.update(state === 'paused' ? 0 : acc / TICK, state === 'paused' ? 0 : dt);
  }
  renderer.render();
}

// ------------------------------------------------------------ boot
let session = null;
async function boot() {
  $('t-keys').textContent = touchUI ? 'Tap to hop forward • swipe left, right or back' : 'Arrows / WASD to hop • P pause • M mute • C characters';
  $('tap').textContent = touchUI ? 'Tap to play' : 'Press ↑ to play';
  applySettings();
  newGame();
  requestAnimationFrame(frame);
  if (testRun) { $('loading').hidden = true; toTitle(); if (autopilot) startPlaying(); return; }
  const inviteCode = raceFromUrl();
  try { session = await api('/api/session'); } catch { session = null; }
  $('loading').hidden = true;
  if (session && session.champion) setChampion(session.champion);
  if (session && session.user) { await signedIn(session.user); raceAtBoot(inviteCode); return; }
  if (store.get('guest', false) || !session || inviteCode) {
    toTitle();
    raceAtBoot(inviteCode);
    if (!session) banner('Offline — playing as a guest', 'No connection');
    return;
  }
  newGame();
  openAccount('welcome');
}
function raceAtBoot(code) {
  if (code) { openRace(); $('r-code').value = code; raceStatus(raceName() ? 'Press Join to enter room ' + code + '.' : 'Type your name, then press Join.'); if (raceName()) $('r-code').form.requestSubmit(); return; }
  if (net.resume()) { ensureRace(); openRace(); raceStep('lobby'); raceStatus('Reconnecting to your race…'); }
}
boot();

// test hook
window.__crossy = { get state() { return state; }, get game() { return game; }, get race() { return race; }, net, get profile() { return profile; }, renderer, sound, api, resume, openChallenges, openShop, openSettings };
