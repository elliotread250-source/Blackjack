// Kart: boot, menus, garage, modes (single race, Grand Prix, time trial, online) and the
// render loop. The race itself lives in game.js.
import * as THREE from 'three';
import { KART_TYPES, KART_BY_ID, DRIVERS, WHEELS, PALETTE, BOT_NAMES, GP_POINTS, DIFFICULTY, cleanConfig, defaultConfig, fmtTime, ordinal, rng } from './data.js';
import { TRACK_DEFS, CUPS } from './tracks.js';
import { loadKartAssets, KartView } from './kartmodel.js';
import { THEMES } from './trackmesh.js';
import { GameSession, getTrack } from './game.js';
import { Hud, drawTrackThumb } from './hud.js';
import { Input } from './input.js';
import { Sound } from './audio.js';
import { Net } from './net.js';
import { store } from './store.js';
import { startRespawn } from './physics.js';

const $ = id => document.getElementById(id);
const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const isTouch = (('ontouchstart' in window) || navigator.maxTouchPoints > 0) && window.matchMedia && window.matchMedia('(pointer: coarse)').matches;
if (isTouch) document.body.classList.add('has-touch');

// ---------- settings
const settings = {
  muted: store.get('muted', false),
  music: store.get('music', true),
  quality: store.get('quality', 'auto'),
  autoAccel: store.get('autoAccel', isTouch),
  tilt: store.get('tilt', false),
  fps: store.get('fps', false),
  laps: store.get('laps', 3),
  difficulty: store.get('difficulty', 'normal'),
  track: store.get('track', 0),
  cup: store.get('cup', 'outdoor'),
};
if (!Number.isInteger(settings.track) || settings.track < 0 || settings.track >= TRACK_DEFS.length) settings.track = 0;
const quality = () => (settings.quality === 'auto' ? (isTouch ? 'low' : 'high') : settings.quality);
let cfg = cleanConfig(store.get('cfg', null) || defaultConfig('standard'));
let playerName = String(store.get('name', '') || '').slice(0, 14);
if (!playerName) { playerName = 'Racer' + Math.floor(100 + Math.random() * 900); store.set('name', playerName); }

const input = new Input();
input.autoAccel = isTouch && settings.autoAccel;
const sound = new Sound(settings);
const hud = new Hud(input);
hud.setTilt(isTouch && settings.tilt);
hud.setMute(settings.muted);

const app = {
  settings, sound, input, hud, touch: isTouch, fpsVal: 60,
  session: null, net: null, room: null, me: null, gp: null,
  raceOver: s => onRaceOver(s),
  confetti: () => confetti(),
};

// ---------- renderer
const canvas = $('game');
let renderer;
try {
  renderer = new THREE.WebGLRenderer({ canvas, antialias: quality() === 'high', powerPreference: 'high-performance' });
} catch (e) {
  $('loading').textContent = 'WebGL is not available in this browser.';
  throw e;
}
renderer.outputColorSpace = THREE.SRGBColorSpace;
app.renderer = renderer;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFShadowMap;
function applyPixelRatio() {
  const cap = isTouch ? (quality() === 'high' ? 1.5 : 1.25) : quality() === 'high' ? 2 : 1.25;
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, cap));
  renderer.setSize(window.innerWidth, window.innerHeight, false);
}
applyPixelRatio();

// ---------- showroom (menus): your kart on a turntable
const show = { scene: new THREE.Scene(), camera: new THREE.PerspectiveCamera(32, 1, 0.1, 200), kart: null, spin: 0, offset: 0 };
{
  const s = show.scene;
  const bgTex = (() => {
    const c = document.createElement('canvas'); c.width = 4; c.height = 256;
    const x = c.getContext('2d');
    const g = x.createLinearGradient(0, 0, 0, 256);
    g.addColorStop(0, '#2a1f7a'); g.addColorStop(0.55, '#5b3aa8'); g.addColorStop(0.75, '#d9568f'); g.addColorStop(1, '#ffb46b');
    x.fillStyle = g; x.fillRect(0, 0, 4, 256);
    const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
  })();
  s.background = bgTex;
  s.add(new THREE.HemisphereLight('#e8e4ff', '#4a2a6a', 1.6));
  const key = new THREE.DirectionalLight('#fff4e0', 2.6); key.position.set(4, 7, 5); key.castShadow = true;
  key.shadow.mapSize.set(1024, 1024); const sc = key.shadow.camera; sc.left = -4; sc.right = 4; sc.top = 4; sc.bottom = -4;
  s.add(key);
  const rim = new THREE.DirectionalLight('#7fdcff', 1.4); rim.position.set(-5, 3, -6); s.add(rim);
  const plat = new THREE.Group();
  const disc = new THREE.Mesh(new THREE.CylinderGeometry(3.3, 3.5, 0.3, 48), new THREE.MeshStandardMaterial({ color: '#2b2560', roughness: 0.5, metalness: 0.2 }));
  disc.position.y = -0.15; disc.receiveShadow = true;
  const ring = new THREE.Mesh(new THREE.TorusGeometry(3.38, 0.06, 8, 64), new THREE.MeshBasicMaterial({ color: '#ffd23f' }));
  ring.rotation.x = Math.PI / 2; ring.position.y = 0.01;
  plat.add(disc, ring);
  s.add(plat);
  show.plat = plat;
}
function rebuildShowKart() {
  if (show.kart) { show.kart.setConfig(cfg); return; }
  show.kart = new KartView(cfg, 'high', { castShadow: true });
  show.kart.update(0.016, { speed: 0 });
  show.plat.add(show.kart.root);
}

// ---------- screens
const screens = ['title', 'mode', 'garage', 'tracks', 'results', 'pause', 'settings', 'online', 'lobby'];
let current = 'title';
const stack = [];
function go(name, push = true) {
  if (push && current && current !== name) stack.push(current);
  current = name;
  for (const s of screens) $('s-' + s).hidden = s !== name;
  $('arcade').hidden = !['title', 'mode', 'online', 'settings'].includes(name);
  if (name === 'garage') { $('g-done').textContent = garageNext ? 'Next: track' : 'Done'; buildGarage(); }
  else garageNext = null;
  if (name === 'tracks') buildTracks();
  if (name === 'settings') buildSettings();
  if (name === 'online') enterOnline();
  if (name === 'lobby') renderLobby();
  show.offset = name === 'title' ? -0.22 : name === 'garage' ? 0 : 0.18;
  if (!app.session && ['title', 'mode', 'garage', 'online', 'lobby', 'settings', 'tracks'].includes(name)) sound.playMusic('menu');
}
function back() {
  sound.play('back');
  const prev = stack.pop();
  if (current === 'garage' && app.room && prev === 'lobby') sendProfile();
  if (prev === 'garage' && current === 'tracks') garageNext = 'tracks';
  go(prev || 'title', false);
}
document.addEventListener('click', e => {
  sound.unlock();
  const b = e.target.closest('[data-go]');
  if (b) { sound.play('click'); if (b.dataset.go === 'garage') garageNext = null; go(b.dataset.go); return; }
  if (e.target.closest('[data-back]')) back();
});
document.addEventListener('pointerdown', () => sound.unlock(), { capture: true });
document.addEventListener('keydown', () => sound.unlock(), { capture: true });

function toast(msg, ms = 2400) {
  const t = $('toast');
  t.textContent = msg; t.hidden = false; t.style.opacity = '1';
  clearTimeout(toast.t);
  toast.t = setTimeout(() => { t.style.opacity = '0'; setTimeout(() => { t.hidden = true; }, 220); }, ms);
}

// ---------- mode select
let mode = 'race';
document.querySelectorAll('[data-mode]').forEach(b => b.addEventListener('click', () => {
  sound.play('click');
  mode = b.dataset.mode;
  if (mode === 'online') go('online');
  else { garageNext = 'tracks'; go('garage'); }
}));

// ---------- garage
function statBars(st) {
  const row = (n, v) => `<div class="stat"><span>${n}</span><div class="bar"><i style="width:${(v / 5) * 100}%"></i></div></div>`;
  return row('Top speed', st.speed) + row('Acceleration', st.accel) + row('Handling', st.handling) + row('Weight', st.weight);
}
function swatchRow(el, key) {
  el.innerHTML = PALETTE.slice(0, 15).map(c => `<button class="sw${cfg[key] === c ? ' sel' : ''}" style="background:${c}" data-c="${c}" aria-label="${c}"></button>`).join('') +
    `<label class="sw picker${PALETTE.slice(0, 15).includes(cfg[key]) ? '' : ' sel'}" title="Custom colour"><input type="color" value="${cfg[key]}"></label>`;
  el.onclick = e => { const b = e.target.closest('[data-c]'); if (!b) return; setCfg({ [key]: b.dataset.c }); };
  el.querySelector('input').oninput = e => setCfg({ [key]: e.target.value }, false);
  el.querySelector('input').onchange = e => setCfg({ [key]: e.target.value });
}
function setCfg(patch, rebuild = true) {
  const prevType = cfg.type;
  cfg = cleanConfig({ ...cfg, ...patch });
  store.set('cfg', cfg);
  rebuildShowKart();
  if (rebuild || patch.type !== prevType) buildGarage();
  clearTimeout(setCfg.t);
  setCfg.t = setTimeout(() => { if (app.room) sendProfile(); }, 400);
}
function buildGarage() {
  $('g-types').innerHTML = KART_TYPES.map(k => `<button class="ktype${cfg.type === k.id ? ' sel' : ''}" data-t="${k.id}"><b>${k.name}</b><p>${k.blurb}</p>${statBars(k.stats)}</button>`).join('');
  $('g-types').onclick = e => {
    const b = e.target.closest('[data-t]'); if (!b) return;
    sound.play('click');
    const d = KART_BY_ID[b.dataset.t].defaults;
    // keep your colours unless they were the old kart's defaults
    const old = KART_BY_ID[cfg.type].defaults;
    setCfg({ type: b.dataset.t, body: cfg.body === old.body ? d.body : cfg.body, accent: cfg.accent === old.accent ? d.accent : cfg.accent, wheel: cfg.wheel === old.wheel ? d.wheel : cfg.wheel });
  };
  swatchRow($('g-body'), 'body'); swatchRow($('g-accent'), 'accent'); swatchRow($('g-suit'), 'suit'); swatchRow($('g-helmet'), 'helmet');
  $('g-wheel').innerHTML = WHEELS.map(w => `<button class="${cfg.wheel === w.id ? 'sel' : ''}" data-w="${w.id}">${w.name}</button>`).join('');
  $('g-wheel').onclick = e => { const b = e.target.closest('[data-w]'); if (b) { sound.play('click'); setCfg({ wheel: b.dataset.w }); } };
  $('g-driver').innerHTML = DRIVERS.map(d => `<button class="${cfg.driver === d.id ? 'sel' : ''}" data-d="${d.id}" style="background:${d.color}">${d.name}</button>`).join('');
  $('g-driver').onclick = e => { const b = e.target.closest('[data-d]'); if (b) { sound.play('click'); const dd = DRIVERS.find(x => x.id === b.dataset.d); setCfg({ driver: dd.id, suit: dd.color }); } };
  $('g-num').textContent = cfg.num;
  $('g-spoiler').classList.toggle('on', cfg.spoiler);
  $('g-flag').classList.toggle('on', cfg.flag);
  const nm = $('g-name');
  if (document.activeElement !== nm) nm.value = playerName;
}
$('g-num-m').onclick = () => setCfg({ num: (cfg.num + 99) % 100 });
$('g-num-p').onclick = () => setCfg({ num: (cfg.num + 1) % 100 });
$('g-spoiler').onclick = () => { sound.play('click'); setCfg({ spoiler: !cfg.spoiler }); };
$('g-flag').onclick = () => { sound.play('click'); setCfg({ flag: !cfg.flag }); };
$('g-rand').onclick = () => {
  sound.play('click');
  const p = () => PALETTE[Math.floor(Math.random() * PALETTE.length)];
  const d = DRIVERS[Math.floor(Math.random() * DRIVERS.length)];
  setCfg({ body: p(), accent: p(), suit: d.color, driver: d.id, helmet: Math.random() < 0.6 ? '#f4f4fa' : p(), wheel: WHEELS[Math.floor(Math.random() * WHEELS.length)].id, num: Math.floor(Math.random() * 100), spoiler: Math.random() < 0.5, flag: Math.random() < 0.3 });
};
$('g-name').addEventListener('input', e => {
  playerName = e.target.value.replace(/[^\p{L}\p{N} _.\-!?']/gu, '').slice(0, 14);
  store.set('name', playerName || 'Racer');
  clearTimeout(setCfg.t);
  setCfg.t = setTimeout(() => { if (app.room) sendProfile(); }, 500);
});
let garageNext = null;
$('g-done').onclick = () => {
  if (garageNext) { const n = garageNext; garageNext = null; sound.play('click'); go(n); }
  else back();
};

// ---------- track select (tracks grouped Outdoor / Indoor; in Grand Prix mode, the cups)
const thumbs = [];
const cupOf = () => CUPS.find(c => c.id === settings.cup) || CUPS[0];
function buildTracks() {
  const gp = mode === 'gp', tt = mode === 'tt';
  $('t-title').textContent = gp ? 'Grand Prix: choose a cup' : tt ? 'Time Trial: choose a track' : 'Choose a track';
  const best = id => store.get('best.' + id, null);
  const list = $('t-list');
  list.classList.toggle('cups', gp);
  if (gp) {
    const stats = store.get('gpstats', {}) || {};
    list.innerHTML = CUPS.map(c => {
      const st = stats[c.id + '.' + settings.difficulty];
      const won = st ? (st.cups ? `Won ${st.cups}×` : `Best: ${ordinal(st.best)}`) : '';
      return `<button class="tcard cup${cupOf().id === c.id ? ' sel' : ''}" data-c="${c.id}"><div class="cupthumbs">${c.tracks.map(() => '<canvas width="120" height="90"></canvas>').join('')}</div><b>${c.name}</b><small>${c.blurb} ${c.tracks.map(i => TRACK_DEFS[i].name).join(' · ')}</small><span class="best">${won}</span></button>`;
    }).join('');
    list.querySelectorAll('.cup').forEach(card => {
      const c = CUPS.find(x => x.id === card.dataset.c);
      card.querySelectorAll('canvas').forEach((cv, k) => drawTrackThumb(cv, getTrack(c.tracks[k]), THEMES[TRACK_DEFS[c.tracks[k]].theme]));
    });
    list.onclick = e => {
      const b = e.target.closest('[data-c]'); if (!b) return;
      sound.play('click');
      settings.cup = b.dataset.c; store.set('cup', settings.cup);
      list.querySelectorAll('.tcard').forEach(x => x.classList.toggle('sel', x === b));
    };
  } else {
    const short = window.matchMedia('(max-height: 520px)').matches; // phones in landscape: wider, flatter thumbnails so both groups fit
    const card = i => {
      const t = TRACK_DEFS[i], b = best(t.id);
      const bl = b ? (tt && b.lap ? `Best lap ${fmtTime(b.lap * 1000)}` : b.race ? `Best ${fmtTime(b.race * 1000)}` : '') : '';
      return `<button class="tcard${settings.track === i ? ' sel' : ''}" data-i="${i}"><canvas width="240" height="${short ? 120 : 180}"></canvas><b>${t.name}</b><small>${t.blurb}</small><span class="best">${bl}</span></button>`;
    };
    const idx = TRACK_DEFS.map((t, i) => i);
    const out = idx.filter(i => !TRACK_DEFS[i].indoor), ind = idx.filter(i => TRACK_DEFS[i].indoor);
    list.innerHTML = `<h3 class="tgroup">Outdoor</h3>${out.map(card).join('')}<h3 class="tgroup">Indoor</h3>${ind.map(card).join('')}`;
    list.querySelectorAll('canvas').forEach(c => { const i = +c.parentElement.dataset.i; drawTrackThumb(c, getTrack(i), THEMES[TRACK_DEFS[i].theme]); });
    list.onclick = e => {
      const b = e.target.closest('[data-i]'); if (!b) return;
      sound.play('click');
      settings.track = +b.dataset.i; store.set('track', settings.track);
      list.querySelectorAll('.tcard').forEach(x => x.classList.toggle('sel', x === b));
    };
  }
  $('o-laps').innerHTML = [1, 2, 3, 4, 5].map(n => `<button class="${settings.laps === n ? 'sel' : ''}" data-l="${n}">${n}</button>`).join('');
  $('o-laps').onclick = e => { const b = e.target.closest('[data-l]'); if (!b) return; settings.laps = +b.dataset.l; store.set('laps', settings.laps); buildTracks(); };
  $('o-diff-wrap').hidden = tt;
  $('o-diff').innerHTML = Object.entries(DIFFICULTY).map(([k, d]) => `<button class="${settings.difficulty === k ? 'sel' : ''}" data-d="${k}">${d.name}</button>`).join('');
  $('o-diff').onclick = e => { const b = e.target.closest('[data-d]'); if (!b) return; settings.difficulty = b.dataset.d; store.set('difficulty', settings.difficulty); buildTracks(); };
  $('t-start').textContent = gp ? 'Start Grand Prix' : tt ? 'Start' : 'Race!';
}
$('t-start').onclick = () => {
  sound.play('click');
  if (mode === 'gp') startGP();
  else startOffline(mode, settings.track);
};

// ---------- settings
function toggle(el, on) { el.classList.toggle('on', !!on); }
function buildSettings() {
  toggle($('st-sound'), !settings.muted); toggle($('st-music'), settings.music); toggle($('st-auto'), settings.autoAccel); toggle($('st-fps'), settings.fps);
  $('st-quality').innerHTML = [['auto', 'Auto'], ['low', 'Low'], ['high', 'High']].map(([k, n]) => `<button class="${settings.quality === k ? 'sel' : ''}" data-q="${k}">${n}</button>`).join('');
  toggle($('st-tilt'), settings.tilt);
}
function setMuted(m) { settings.muted = m; store.set('muted', m); sound.setMuted(m); hud.setMute(m); toggle($('st-sound'), !m); toggle($('p-sound'), !m); }
function setMusic(m) { settings.music = m; store.set('music', m); sound.setMusic(m); toggle($('st-music'), m); toggle($('p-music'), m); }
$('st-sound').onclick = () => setMuted(!settings.muted);
$('st-music').onclick = () => setMusic(!settings.music);
$('st-auto').onclick = () => { settings.autoAccel = !settings.autoAccel; store.set('autoAccel', settings.autoAccel); input.autoAccel = isTouch && settings.autoAccel; buildSettings(); };
$('st-fps').onclick = () => { settings.fps = !settings.fps; store.set('fps', settings.fps); buildSettings(); };
$('st-quality').onclick = e => { const b = e.target.closest('[data-q]'); if (!b) return; settings.quality = b.dataset.q; store.set('quality', settings.quality); applyPixelRatio(); buildSettings(); toast('Graphics: applies from the next race'); };
async function setTilt(on) {
  if (on && typeof DeviceOrientationEvent !== 'undefined' && DeviceOrientationEvent.requestPermission) {
    try { if (await DeviceOrientationEvent.requestPermission() !== 'granted') { toast('Tilt needs motion access'); return; } } catch { return; }
  }
  settings.tilt = on; store.set('tilt', on);
  hud.setTilt(on && isTouch);
  toggle($('st-tilt'), on);
  if (current === 'race') toast(on ? 'Tilt steering on (hold level to centre)' : 'Drag-pad steering');
}
$('st-tilt').onclick = () => setTilt(!settings.tilt);
$('h-tilt').onclick = () => setTilt(!settings.tilt);

// ---------- bots
function makeBots(seed, n, difficulty) {
  const r = rng(seed);
  const names = [...BOT_NAMES];
  const out = [];
  for (let i = 0; i < n; i++) {
    const type = KART_TYPES[(i + Math.floor(r() * 5)) % KART_TYPES.length].id;
    const d = DRIVERS[Math.floor(r() * DRIVERS.length)];
    const name = names.splice(Math.floor(r() * names.length), 1)[0] || 'Bot' + i;
    const c = cleanConfig({ type, body: PALETTE[Math.floor(r() * 12)], accent: PALETTE[10 + Math.floor(r() * 4)], wheel: KART_BY_ID[type].defaults.wheel, driver: d.id, suit: d.color, helmet: r() < 0.7 ? '#f4f4fa' : PALETTE[Math.floor(r() * 12)], num: Math.floor(r() * 100), spoiler: r() < 0.35, flag: r() < 0.2 });
    out.push({ id: 'b' + i, name, cfg: c, bot: true, botTraits: { seed: Math.floor(r() * 1e6) + 1 } });
  }
  return out;
}

// ---------- starting races
let firstRace = !store.get('raced', false);
function enterRace() {
  for (const s of screens) $('s-' + s).hidden = true;
  $('arcade').hidden = true;
  hud.show(true);
  hud.showTouch(isTouch);
  current = 'race';
}
function startSession(opts) {
  if (app.session) { app.session.dispose(); app.session = null; }
  const s = new GameSession(app, { ...opts, quality: quality() });
  s.build();
  s.firstRace = firstRace;
  app.session = s;
  enterRace();
  sound.playMusic(TRACK_DEFS[opts.trackIndex].theme);
  store.set('raced', true); firstRace = false;
  return s;
}
function startOffline(m, trackIndex, gpEntrants) {
  const seed = (Date.now() & 0xffffff) + 1;
  const me = { id: 'me', name: playerName || 'You', cfg, player: true };
  let entrants;
  if (m === 'tt') entrants = [{ ...me, slot: 0 }];
  else {
    const bots = gpEntrants || makeBots(seed, 7, settings.difficulty);
    entrants = [...bots];
    const pslot = m === 'gp' && app.gp ? gpGridSlot() : 4;
    entrants.splice(pslot, 0, me);
    entrants = entrants.map((e, i) => ({ ...e, slot: i }));
  }
  const ghost = m === 'tt' ? store.get('ghost.' + TRACK_DEFS[trackIndex].id, null) : null;
  startSession({ mode: m, trackIndex, laps: settings.laps, difficulty: settings.difficulty, entrants, seed, me: 'me', ghost });
}

// ---------- Grand Prix
function startGP() {
  const seed = (Date.now() & 0xffffff) + 7;
  const bots = makeBots(seed, 7, settings.difficulty);
  const cup = cupOf();
  app.gp = { cup: cup.id, cupName: cup.name, tracks: cup.tracks.slice(), round: 0, bots, points: { me: 0 }, difficulty: settings.difficulty, laps: settings.laps };
  for (const b of bots) app.gp.points[b.id] = 0;
  startOffline('gp', app.gp.tracks[0], bots);
}
function gpGridSlot() {
  // after the first round, start in reverse order of the standings (leader at the back)
  if (!app.gp || app.gp.round === 0) return 4;
  const order = Object.entries(app.gp.points).sort((a, b) => a[1] - b[1]).map(e => e[0]);
  return Math.max(0, order.indexOf('me'));
}

// ---------- race over (offline)
function onRaceOver(s) {
  const r = s.race;
  const res = r.results();
  const tid = s.track.id;
  const p = s.player;
  // best times
  const best = store.get('best.' + tid, {}) || {};
  let rec = '';
  if (p.finished) {
    if (s.mode !== 'tt' || true) {
      if (!best.race || p.finishTime < best.race) { if (best.race) rec = 'New record time!'; best.race = p.finishTime; }
      if (!best.lap || p.bestLap < best.lap) { best.lap = p.bestLap; }
      store.set('best.' + tid, best);
    }
  }
  const rows = res.map((e, i) => {
    const t = e.finished ? fmtTime(e.time * 1000) : '~' + fmtTime(e.est * 1000);
    return `<tr class="${e.isPlayer ? 'me' : ''}"><td>${ordinal(i + 1)}</td><td><span class="chip" style="background:${e.cfg.body}"></span>${esc(e.name)}</td><td class="muted">${KART_BY_ID[e.cfg.type].name}</td><td class="t-right">${t}</td><td class="t-right muted">${e.best ? fmtTime(e.best * 1000) : ''}</td></tr>`;
  });
  const head = '<tr><th>Pos</th><th>Racer</th><th>Kart</th><th class="t-right">Time</th><th class="t-right">Best lap</th></tr>';
  let title = `${ordinal(p.place)} place`, sub = `${s.track.name} · ${r.laps} lap${r.laps > 1 ? 's' : ''}`;
  const btns = [];
  if (s.mode === 'tt') {
    title = 'Time Trial';
    const laps = p.lapTimes.map((t, i) => `<tr><td>L${i + 1}</td><td>${fmtTime(t * 1000)}</td><td class="t-right muted">${t === p.bestLap ? 'best' : ''}</td></tr>`).join('');
    $('r-table').innerHTML = `<tr><th>Lap</th><th>Time</th><th></th></tr>${laps}<tr class="me"><td>Total</td><td>${fmtTime(p.finishTime * 1000)}</td><td class="t-right">${rec}</td></tr><tr><td></td><td class="muted">Track record ${fmtTime((best.race || p.finishTime) * 1000)} · best lap ${fmtTime((best.lap || p.bestLap) * 1000)}</td><td></td></tr>`;
    btns.push(['Retry', 'primary', () => startOffline('tt', s.opts.trackIndex)], ['Tracks', '', () => { endSession(); go('tracks', false); }], ['Menu', '', () => { endSession(); stack.length = 0; go('title', false); }]);
  } else if (s.mode === 'gp') {
    const gp = app.gp;
    res.forEach((e, i) => { gp.points[e.id] = (gp.points[e.id] || 0) + (GP_POINTS[i] || 0); });
    gp.round++;
    const done = gp.round >= gp.tracks.length;
    const names = { me: playerName || 'You' }; const cfgs = { me: cfg };
    for (const b of gp.bots) { names[b.id] = b.name; cfgs[b.id] = b.cfg; }
    const stand = Object.entries(gp.points).sort((a, b) => b[1] - a[1]);
    const myPos = stand.findIndex(e => e[0] === 'me') + 1;
    title = done ? `${gp.cupName}: ${ordinal(myPos)} overall` : `Race ${gp.round}/${gp.tracks.length}: ${ordinal(p.place)}`;
    sub = done ? (myPos === 1 ? 'Champion! The cup is yours.' : myPos <= 3 ? 'On the podium!' : 'Better luck next cup.') : `Next up: ${TRACK_DEFS[gp.tracks[gp.round]].name}`;
    const st = stand.map(([id, pts], i) => `<tr class="${id === 'me' ? 'me' : ''}"><td>${ordinal(i + 1)}</td><td><span class="chip" style="background:${cfgs[id].body}"></span>${esc(names[id])}</td><td class="t-right">${pts} pt${pts === 1 ? '' : 's'}</td><td class="t-right muted">+${GP_POINTS[res.findIndex(e => e.id === id)] || 0}</td></tr>`).join('');
    $('r-table').innerHTML = `<tr><th>Pos</th><th>Standings</th><th class="t-right">Points</th><th class="t-right">This race</th></tr>${st}`;
    if (done) {
      const stats = store.get('gpstats', {}) || {};
      const k = gp.cup + '.' + gp.difficulty;
      stats[k] = stats[k] || { cups: 0, best: 9 };
      stats[k].cups += myPos === 1 ? 1 : 0; stats[k].best = Math.min(stats[k].best, myPos);
      store.set('gpstats', stats);
      if (myPos <= 3) confetti();
      btns.push(['New cup', 'primary', () => { endSession(); startGP(); }], ['Menu', '', () => { endSession(); app.gp = null; stack.length = 0; go('title', false); }]);
    } else {
      btns.push(['Next race', 'primary', () => startOffline('gp', gp.tracks[gp.round], gp.bots)], ['Quit cup', '', () => { endSession(); app.gp = null; stack.length = 0; go('title', false); }]);
    }
  } else {
    sub += rec ? ' · ' + rec : '';
    $('r-table').innerHTML = head + rows.join('');
    btns.push(['Race again', 'primary', () => startOffline('race', s.opts.trackIndex)], ['Tracks', '', () => { endSession(); go('tracks', false); }], ['Menu', '', () => { endSession(); stack.length = 0; go('title', false); }]);
  }
  showResults(title, sub, btns);
}
function showResults(title, sub, btns) {
  $('r-title').textContent = title;
  $('r-sub').textContent = sub;
  const box = $('r-btns');
  box.innerHTML = '';
  for (const [label, cls, fn] of btns) {
    const b = document.createElement('button');
    b.className = 'btn ' + cls; b.textContent = label;
    b.onclick = () => { sound.play('click'); fn(); };
    box.appendChild(b);
  }
  hud.showTouch(false);
  for (const s of screens) $('s-' + s).hidden = s !== 'results';
  current = 'results';
}
function endSession() {
  if (app.session) { app.session.dispose(); app.session = null; }
  hud.show(false); hud.showTouch(false);
  sound.enginesOff();
  sound.playMusic('menu');
}

// ---------- pause
function pause(on) {
  const s = app.session; if (!s) return;
  if (on) {
    if (!s.online) s.paused = true;
    sound.enginesOff();
    toggle($('p-sound'), !settings.muted); toggle($('p-music'), settings.music);
    $('p-restart').hidden = !!s.online;
    $('p-quit').textContent = s.online ? 'Leave race' : 'Quit to menu';
    $('s-pause').hidden = false; current = 'pause';
    hud.showTouch(false);
  } else {
    s.paused = false;
    $('s-pause').hidden = true; current = 'race';
    hud.showTouch(isTouch);
  }
}
$('p-resume').onclick = () => pause(false);
$('p-reset').onclick = () => { const s = app.session; if (!s) return; if (s.race.phase === 'race' && !s.player.finished) startRespawn(s.player, 'manual'); pause(false); };
$('h-pause').onclick = () => pause(true);
$('h-mute').onclick = () => setMuted(!settings.muted);
$('p-sound').onclick = () => setMuted(!settings.muted);
$('p-music').onclick = () => setMusic(!settings.music);
$('p-restart').onclick = () => {
  const s = app.session; if (!s) return;
  pause(false);
  if (s.mode === 'gp') startOffline('gp', app.gp.tracks[app.gp.round], app.gp.bots);
  else startOffline(s.mode, s.opts.trackIndex);
};
$('p-quit').onclick = () => {
  const s = app.session; if (!s) return;
  $('s-pause').hidden = true;
  if (s.online) { leaveRoom(); return; }
  endSession(); app.gp = null; stack.length = 0; go('title', false);
};

// ---------- online
function sendProfile() { if (app.net) app.net.send({ t: 'profile', name: playerName, kart: cfg }); }
function onlineStatus(t) { $('on-status').textContent = t; }
async function ensureNet() {
  if (app.net && app.net.open) return true;
  if (!app.net) app.net = new Net({ message: onNetMessage, close: onNetClose });
  onlineStatus('Connecting…');
  try { await app.net.connect(); app.me = app.net.id; onlineStatus('Connected.'); return true; } catch { onlineStatus('Could not reach the server. Try again in a moment.'); return false; }
}
function enterOnline() {
  $('on-name').value = playerName;
  if (!(app.net && app.net.open)) onlineStatus('');
  ensureNet();
}
$('on-name').addEventListener('input', e => { playerName = e.target.value.slice(0, 14); store.set('name', playerName || 'Racer'); });
$('on-quick').onclick = async () => { sound.play('click'); if (await ensureNet()) { onlineStatus('Finding a race…'); app.net.send({ t: 'quick', name: playerName, kart: cfg }); } };
$('on-create').onclick = async () => { sound.play('click'); if (await ensureNet()) app.net.send({ t: 'create', name: playerName, kart: cfg }); };
const doJoin = async code => {
  code = String(code || '').toUpperCase().replace(/[^A-Z]/g, '').slice(0, 4);
  if (code.length !== 4) { onlineStatus('Room codes are 4 letters.'); return; }
  if (await ensureNet()) { onlineStatus('Joining ' + code + '…'); app.net.send({ t: 'join', code, name: playerName, kart: cfg }); }
};
$('on-join').onclick = () => { sound.play('click'); doJoin($('on-code').value); };
$('on-code').addEventListener('keydown', e => { if (e.key === 'Enter') doJoin(e.target.value); });
function leaveRoom() {
  if (app.net) app.net.send({ t: 'leave' });
  app.room = null;
  endSession();
  try { history.replaceState(null, '', location.pathname); } catch {}
  stack.length = 0; stack.push('title');
  go('online', false);
}
$('lb-leave').onclick = () => { sound.play('back'); leaveRoom(); };
function onNetClose() {
  const wasRoom = !!app.room;
  app.room = null;
  if (app.session && app.session.online) { endSession(); }
  if (wasRoom || current === 'online' || current === 'lobby') { toast('Disconnected from the server'); stack.length = 0; stack.push('title'); go('online', false); onlineStatus('Disconnected.'); }
}
function shareLink() { return `${location.origin}${location.pathname}?room=${app.room ? app.room.code : ''}`; }
$('lb-copy').onclick = async () => {
  const link = shareLink();
  try { await navigator.clipboard.writeText(link); toast('Link copied'); }
  catch { prompt('Copy this link:', link); }
};
$('lb-share').onclick = async () => {
  const link = shareLink();
  if (navigator.share) { try { await navigator.share({ title: 'Kart', text: 'Race me in Kart! Room ' + app.room.code, url: link }); } catch {} }
  else { try { await navigator.clipboard.writeText(link); toast('Link copied'); } catch { prompt('Copy this link:', link); } }
};
$('lb-ready').onclick = () => {
  if (!app.room) return;
  sound.play('click');
  const me = app.room.players.find(p => p.id === app.me);
  app.net.send({ t: 'ready', v: !(me && me.ready) });
};
$('lb-start').onclick = () => { sound.play('click'); app.net.send({ t: 'start' }); };
$('lb-bots').onclick = () => { if (app.room && app.room.host === app.me) app.net.send({ t: 'settings', bots: !app.room.settings.bots }); };
const lobbyThumbs = [];
function renderLobby() {
  const R = app.room;
  if (!R) return;
  const isHost = R.host === app.me;
  $('lb-code').textContent = R.code;
  $('lb-status').textContent = R.public ? 'Quick match room' : 'Private room';
  if (!lobbyThumbs.length) {
    $('lb-tracks').innerHTML = TRACK_DEFS.map((t, i) => `<button data-i="${i}"><canvas width="120" height="90"></canvas>${t.name}</button>`).join('');
    $('lb-tracks').querySelectorAll('canvas').forEach((c, i) => { drawTrackThumb(c, getTrack(i), THEMES[TRACK_DEFS[i].theme]); lobbyThumbs.push(c); });
    $('lb-tracks').onclick = e => { const b = e.target.closest('[data-i]'); if (b && app.room && app.room.host === app.me) { sound.play('click'); app.net.send({ t: 'settings', track: +b.dataset.i }); } };
    $('lb-laps').onclick = e => { const b = e.target.closest('[data-l]'); if (b && app.room && app.room.host === app.me) app.net.send({ t: 'settings', laps: +b.dataset.l }); };
  }
  $('lb-tracks').querySelectorAll('button').forEach((b, i) => { b.classList.toggle('sel', R.settings.track === i); b.disabled = !isHost; b.style.opacity = isHost || R.settings.track === i ? '1' : '0.55'; });
  $('lb-laps').innerHTML = [1, 2, 3, 4, 5].map(n => `<button class="${R.settings.laps === n ? 'sel' : ''}" data-l="${n}" ${isHost ? '' : 'disabled'}>${n}</button>`).join('');
  toggle($('lb-bots'), R.settings.bots);
  $('lb-bots').disabled = !isHost;
  $('lb-count').textContent = `Players ${R.players.length}/8`;
  $('lb-players').innerHTML = R.players.map(p => {
    const k = cleanConfig(p.kart);
    const status = R.state === 'race' ? (p.racing ? 'racing' : 'waiting') : p.id === R.host ? 'host' : p.ready ? 'ready' : 'not ready';
    return `<div class="pl"><div class="kc" style="background:${k.body};border-color:${k.accent}"></div><div><b>${esc(p.name)}${p.id === app.me ? ' (you)' : ''}</b><br><small>${KART_BY_ID[k.type].name} · #${k.num}</small></div><span class="rd ${p.ready || p.id === R.host ? 'ok' : ''}">${status}</span></div>`;
  }).join('');
  const me = R.players.find(p => p.id === app.me);
  const others = R.players.filter(p => p.id !== R.host);
  const allReady = others.every(p => p.ready);
  $('lb-ready').hidden = isHost;
  $('lb-ready').textContent = me && me.ready ? 'Not ready' : 'Ready';
  $('lb-ready').className = 'btn ' + (me && me.ready ? '' : 'pink');
  $('lb-start').hidden = !isHost;
  $('lb-start').disabled = !allReady || R.state !== 'lobby';
  $('lb-hostnote').textContent = R.state === 'race' ? 'A race is running. You will join the next one.' : isHost ? (allReady ? (R.players.length === 1 && !R.settings.bots ? 'Waiting for players… (or switch bots on and race now)' : 'Everyone is ready.') : 'Waiting for everyone to be ready…') : 'The host picks the track and starts the race.';
}
function onNetMessage(msg) {
  const s = app.session;
  switch (msg.t) {
    case 'room': {
      const firstJoin = !app.room;
      app.room = msg;
      app.me = msg.you;
      try { history.replaceState(null, '', `${location.pathname}?room=${msg.code}`); } catch {}
      if (firstJoin && !s) { stack.length = 0; stack.push('title', 'online'); go('lobby', false); }
      else if (current === 'lobby') renderLobby();
      break;
    }
    case 'start': {
      if (!msg.racing) { toast('Race in progress: you are in for the next one'); break; }
      startOnline(msg);
      break;
    }
    case 'st': if (s && s.online) s.onState(msg.id, msg.ts, msg.s); break;
    case 'bots': if (s && s.online && Array.isArray(msg.b)) s.onBots(msg.ts, msg.b); break;
    case 'ev': if (s && s.online && msg.e && typeof msg.e === 'object') s.onEvent(msg.id, msg.e); break;
    case 'fin': if (s && s.online) s.onFin(msg.id, msg.time); break;
    case 'results': showOnlineResults(msg); break;
    case 'left': {
      toast(`${msg.name} left the room`);
      if (s && s.online) { s.kartLeft(msg.id); if (msg.host === app.me && !s.online.host) { s.online.host = true; s.adoptBots(); toast('You are now the host'); } }
      break;
    }
    case 'error': {
      const m = { 'no room': 'That room does not exist (check the code).', 'room full': 'That room is full.', busy: 'The server is busy. Try again soon.', 'not ready': 'Not everyone is ready yet.', expired: 'The room expired.' }[msg.msg] || 'Something went wrong.';
      if (current === 'online') onlineStatus(m); else toast(m);
      if (msg.msg === 'expired') { app.room = null; go('online', false); }
      break;
    }
    case 'leftroom': app.room = null; break;
  }
}
function startOnline(msg) {
  const R = app.room;
  const bots = makeBots(msg.seed, 8, 'normal');
  const host = msg.host === app.me;
  const entrants = [];
  msg.grid.forEach((g, i) => {
    if (g.bot) {
      const b = bots[parseInt(String(g.id).slice(1), 10) || 0] || bots[0];
      entrants.push({ ...b, id: g.id, slot: i, remote: !host });
    } else {
      const me = g.id === app.me;
      entrants.push({ id: g.id, name: String(g.name || 'Player').slice(0, 14), cfg: cleanConfig(g.kart), slot: i, player: me, remote: !me });
    }
  });
  if (!entrants.some(e => e.player)) return;
  const trackIndex = Math.max(0, Math.min(TRACK_DEFS.length - 1, msg.track | 0));
  startSession({ mode: 'online', trackIndex, laps: Math.max(1, Math.min(5, msg.laps | 0)), difficulty: 'normal', entrants, seed: msg.seed, me: app.me, online: { net: app.net, go: msg.go, me: app.me, host } });
  void R;
}
function showOnlineResults(msg) {
  const s = app.session;
  const list = Array.isArray(msg.list) ? msg.list : [];
  const cfgOf = id => { const k = s && s.race.kartById(id); return k ? k.cfg : cleanConfig(null); };
  const nameOf = (id, n) => { const k = s && s.race.kartById(id); return k ? k.name : n; };
  const rows = list.map((e, i) => `<tr class="${e.id === app.me ? 'me' : ''}"><td>${ordinal(i + 1)}</td><td><span class="chip" style="background:${cfgOf(e.id).body}"></span>${esc(nameOf(e.id, e.name))}${e.bot ? ' <span class="muted">(bot)</span>' : ''}</td><td class="t-right">${e.dnf ? 'DNF' : fmtTime(e.time)}</td><td class="t-right muted">${e.best ? fmtTime(e.best) : ''}</td></tr>`).join('');
  $('r-table').innerHTML = '<tr><th>Pos</th><th>Racer</th><th class="t-right">Time</th><th class="t-right">Best lap</th></tr>' + rows;
  const mine = list.findIndex(e => e.id === app.me);
  if (mine >= 0 && mine < 3 && !list[mine].dnf) confetti();
  showResults(mine >= 0 ? `${ordinal(mine + 1)} place` : 'Results', `${TRACK_DEFS[msg.track | 0] ? TRACK_DEFS[msg.track | 0].name : ''} · online`, [['Back to lobby', 'primary', () => { endSession(); stack.length = 0; stack.push('title', 'online'); go('lobby', false); }]]);
}

// ---------- confetti overlay
function confetti() {
  const c = $('confetti'), x = c.getContext('2d');
  c.width = window.innerWidth; c.height = window.innerHeight;
  const cols = ['#ff5f5f', '#ffd23f', '#3fa9ff', '#8bd448', '#ff8fd0', '#ffffff'];
  const P = Array.from({ length: 160 }, () => ({ x: Math.random() * c.width, y: -20 - Math.random() * c.height * 0.5, vx: (Math.random() - 0.5) * 2, vy: 2 + Math.random() * 3, r: Math.random() * 6, s: 6 + Math.random() * 6, c: cols[(Math.random() * cols.length) | 0] }));
  let t0 = performance.now();
  const step = now => {
    const t = (now - t0) / 1000;
    x.clearRect(0, 0, c.width, c.height);
    for (const p of P) { p.x += p.vx; p.y += p.vy; p.r += 0.1; x.save(); x.translate(p.x, p.y); x.rotate(p.r); x.fillStyle = p.c; x.fillRect(-p.s / 2, -p.s / 4, p.s, p.s / 2); x.restore(); }
    if (t < 5) requestAnimationFrame(step); else x.clearRect(0, 0, c.width, c.height);
  };
  requestAnimationFrame(step);
}

// ---------- keyboard shortcuts outside driving
input.onKey = (code) => {
  if (code === 'KeyM' && current !== 'garage') setMuted(!settings.muted);
  if ((code === 'Escape' || code === 'KeyP') && app.session && (current === 'race' || current === 'pause')) pause(current === 'race');
  else if (code === 'Escape' && !app.session && current !== 'title' && current !== 'results') back();
};

// ---------- portrait prompt
let rotateOk = false;
$('rotate-ok').onclick = () => { rotateOk = true; $('rotate').hidden = true; };
function checkRotate() { $('rotate').hidden = !(isTouch && !rotateOk && window.innerHeight > window.innerWidth); }

// ---------- resize
function resize() {
  applyPixelRatio();
  show.camera.aspect = window.innerWidth / window.innerHeight;
  show.camera.updateProjectionMatrix();
  if (app.session) app.session.resize();
  checkRotate();
}
window.addEventListener('resize', resize);
let tracksShort = null;
window.addEventListener('resize', () => { const sh = window.matchMedia('(max-height: 520px)').matches; if (current === 'tracks' && tracksShort !== null && sh !== tracksShort) buildTracks(); tracksShort = sh; });
window.addEventListener('orientationchange', () => setTimeout(resize, 200));

// ---------- main loop
let last = performance.now();
let fpsAcc = 0, fpsN = 0;
function frame(now) {
  const dt = Math.min(0.1, Math.max(0, (now - last) / 1000));
  last = now;
  fpsAcc += dt; fpsN++;
  if (fpsAcc > 0.5) { app.fpsVal = Math.round(fpsN / fpsAcc); fpsAcc = 0; fpsN = 0; }
  const inp = input.poll();
  if (inp.mutePress) { /* handled by onKey for keyboards; gamepad back button toggles here */ }
  const s = app.session;
  if (s && (current === 'race' || current === 'pause' || current === 'results')) {
    if (inp.pausePress && current !== 'results' && input.pad()) pause(current === 'race');
    s.update(dt, current === 'race' ? inp : { throttle: 0, steer: 0, drift: false, item: false, back: false });
    renderer.render(s.scene, s.camera);
  } else {
    sound.update();
    show.spin += dt * 0.45;
    if (show.kart) { show.kart.root.rotation.y = show.spin; show.kart.update(dt, { speed: 2 }); }
    const w = window.innerWidth, h = window.innerHeight;
    const cam = show.camera;
    const narrow = w / h < 1.25;
    const dist = narrow ? 13 : 10.5;
    cam.position.set(0, 3.2, dist);
    cam.lookAt(0, 0.7, 0);
    if (show.offset) cam.setViewOffset(w, h, show.offset * w, 0, w, h); else cam.clearViewOffset();
    renderer.render(show.scene, cam);
  }
  requestAnimationFrame(frame);
}

// ---------- debug hook for tests
window.__kart = {
  app,
  get session() { return app.session; },
  get screen() { return current; },
  timeScale(k) { if (app.session) app.session.timeScale = k; },
  warp(frac, d = 0) {
    const s = app.session; if (!s) return;
    const p = s.player, tr = s.track;
    const target = tr.wrapS(frac * tr.L);
    let ds = target - p.s; if (ds > tr.L / 2) ds -= tr.L; if (ds < -tr.L / 2) ds += tr.L;
    const pt = tr.pointAt(target, d);
    p.x = pt.x; p.z = pt.z; p.y = pt.y + 0.1; p.yaw = Math.atan2(pt.fx, pt.fz); p.vx = pt.fx * 20; p.vz = pt.fz * 20; p.vy = 0;
    p.progress += ds; p.s = target; p.sPrev = target; p.hint = tr.idx(target); p.grounded = true;
  },
  cam(c) { if (app.session) app.session.debugCam = c || null; },
  tpoint(frac, d = 0) { const s = app.session; if (!s) return null; const tr = s.track; const p = tr.pointAt(tr.wrapS(frac * tr.L), d); return { x: p.x, y: p.y, z: p.z, fx: p.fx, fz: p.fz }; },
  room3d() { const w = app.session && app.session.world; return w && w.room ? { ...w.room } : null; },
  autopilot(on = true) { if (app.session) app.session.autopilot = on; },
  give(item, n = 1) { const s = app.session; if (s) { s.player.item = item; s.player.itemCount = n; } },
  state() {
    const s = app.session; if (!s) return { screen: current };
    const p = s.player;
    return { screen: current, phase: s.race.phase, time: s.race.time, lap: p.lapsDone, place: p.place, finished: p.finished, x: p.x, y: p.y, z: p.z, s: p.s, speed: p.speed, drift: p.drift, stage: p.driftStage, boost: p.boostT, item: p.item, rolling: p.rollT > 0, progress: p.progress, karts: s.race.karts.length, track: s.track.id, bananas: s.race.bananas.length, shells: s.race.shells.length };
  },
  go, startOffline: (m, i) => { mode = m; startOffline(m, i); },
  get room() { return app.room; },
  netInfo() { const n = app.net; return n ? { offset: n.offset, rtt: n.rtt, server: n.serverNow(), wall: Date.now() } : null; },
  kart(id) { const s = app.session; const k = s && s.race.kartById(id); return k ? { x: k.x, y: k.y, z: k.z, local: k.local, spin: k.spinT > 0, finished: k.finished, progress: k.progress, gone: !!k.gone, bot: !!k.meta.bot } : null; },
  raceTime() { const s = app.session; return s ? { t: s.race.time, wall: Date.now(), phase: s.race.phase } : null; },
  get me() { return app.me; },
  net: () => app.net,
};

// ---------- boot
(async function boot() {
  try {
    await loadKartAssets('models/karts.glb');
  } catch (e) {
    $('loading').textContent = 'Could not load the kart models.';
    console.warn(e);
    return;
  }
  rebuildShowKart();
  resize();
  const room = new URLSearchParams(location.search).get('room');
  go('title', false);
  if (room) {
    stack.length = 0; stack.push('title');
    go('online', false);
    doJoin(room);
  }
  $('loading').classList.add('fade');
  setTimeout(() => { $('loading').hidden = true; }, 350);
  requestAnimationFrame(frame);
})();
