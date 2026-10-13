// Screens, the game loop, HUD, sound and effects hooks, saving, and the window.__nn debug hook used
// by the browser smoke test.
import { World } from './world.js';
import { Renderer } from './render.js';
import { Sound } from './audio.js';
import { Input } from './input.js';
import { store } from './store.js';
import { STEPS } from './puzzle.js';
import { DIFFICULTY } from './ai.js';
import { ITEM_TYPES, doorCenter, windowCenter, MISSIONS } from './level.js';

const $ = id => document.getElementById(id);
const isTouch = (('ontouchstart' in window) || navigator.maxTouchPoints > 0) && window.matchMedia && window.matchMedia('(pointer: coarse)').matches;
if (isTouch) document.body.classList.add('touch');

const settings = Object.assign({ sens: 1, invertY: false, volume: 0.8, quality: isTouch ? 'low' : 'high', difficulty: 'normal' }, store.get('settings', {}));
const saveSettings = () => store.set('settings', settings);

let selectedMission = 0;
let world = new World({ difficulty: settings.difficulty, seed: (Math.random() * 1e9) | 0 });
let renderer;
try {
  renderer = new Renderer($('game'), world, { quality: settings.quality, touch: isTouch });
} catch (e) {
  $('loading').hidden = true;
  const d = document.createElement('div'); d.id = 'err';
  d.innerHTML = '<div><h2>WebGL is not available</h2><p>Nosy Neighbour needs WebGL. Try another browser or enable hardware acceleration.</p><p><a class="arcade" style="position:static" href="https://open-arcade.up.railway.app">&larr; Arcade</a></p></div>';
  document.body.appendChild(d);
  throw e;
}
const sound = new Sound(settings.volume);
const input = new Input($('game'), isTouch ? $('touch') : null);
input.sens = settings.sens; input.invertY = settings.invertY;
$('loading').hidden = true;

let mode = 'title';           // title | play | pause | win
let overlay = null;           // settings/help opened from title or pause
let acc = 0, last = performance.now();
let nStepDist = 0, lastAi = null;
let saveT = 0;
let rotateOk = false;
let winT = -1;
const override = { input: null, frozen: false };

// ------------------------------------------------------------------ icons
const ICON = {
  crate: '<rect x="5" y="9" width="30" height="26" rx="2" fill="#c89a62" stroke="#6a4a2a" stroke-width="2.5"/><path d="M7 11l26 22M5 22h30" stroke="#6a4a2a" stroke-width="2.5"/>',
  crowbar: '<path d="M8 32 L30 10 q4 -4 6 0" stroke="#d8342a" stroke-width="5" fill="none" stroke-linecap="round"/><path d="M8 32 l-3 1" stroke="#999" stroke-width="5" stroke-linecap="round"/>',
  redkey: '<circle cx="12" cy="20" r="7" fill="none" stroke="#ff4a3a" stroke-width="4"/><path d="M18 20h17M29 20v6M34 20v5" stroke="#ff4a3a" stroke-width="4" stroke-linecap="round"/>',
  fuse: '<rect x="14" y="9" width="12" height="22" rx="3" fill="#efe6c8"/><rect x="13" y="5" width="14" height="6" rx="2" fill="#b0b4bc"/><rect x="13" y="29" width="14" height="6" rx="2" fill="#b0b4bc"/><path d="M20 14v12" stroke="#c8a040" stroke-width="2"/>',
  can: '<rect x="12" y="8" width="16" height="25" rx="3" fill="#c0c4cc"/><rect x="12" y="14" width="16" height="10" fill="#c8402a"/>',
  bottle: '<path d="M17 5h6v8l4 5v17h-14v-17l4-5z" fill="#3a9a4a"/>',
  apple: '<circle cx="20" cy="23" r="11" fill="#d8322a"/><path d="M20 12q2 -5 6 -6" stroke="#5a3a20" stroke-width="2.5" fill="none"/>',
  vase: '<path d="M15 6h10v5q8 6 6 16q-2 8 -11 8q-9 0 -11 -8q-2 -10 6 -16z" fill="#3a6a9a"/>',
  radio: '<rect x="5" y="12" width="30" height="20" rx="3" fill="#7a4a2a"/><rect x="9" y="16" width="13" height="12" fill="#d8c8a0"/><circle cx="28" cy="22" r="3.5" fill="#222"/><path d="M10 12l10 -7" stroke="#888" stroke-width="2"/>',
  ball: '<circle cx="20" cy="20" r="13" fill="#d83a3a"/><path d="M7 20h26" stroke="#fff" stroke-width="3"/>',
  book: '<rect x="8" y="8" width="24" height="24" rx="2" fill="#2a4a7a"/><rect x="11" y="10" width="19" height="20" fill="#f0e8d0" opacity=".25"/>',
  paint: '<rect x="10" y="12" width="20" height="22" rx="3" fill="#d8d8d0"/><rect x="10" y="12" width="20" height="5" fill="#3a8ac8"/><path d="M10 13q10 -12 20 0" stroke="#666" stroke-width="2" fill="none"/>',
  plate: '<ellipse cx="20" cy="22" rx="15" ry="8" fill="#f2f0ea"/><ellipse cx="20" cy="21" rx="9" ry="4" fill="#e0ddd4"/>',
};
const icon = t => `<svg viewBox="0 0 40 40">${ICON[t] || ''}</svg>`;

// ------------------------------------------------------------------ screens
function show(id, on = true) { $(id).hidden = !on; }
function setMode(m) {
  mode = m;
  show('s-title', m === 'title');
  show('s-pause', m === 'pause');
  show('s-win', m === 'win');
  show('hud', m === 'play');
  show('touch', isTouch && m === 'play');
  $('arcade').hidden = m === 'play';
  input.active = m === 'play';
  if (m !== 'play') { input.unlock(); input.reset(); }
  if (m === 'title') refreshTitle();
  checkRotate();
}
function refreshTitle() {
  const s = store.get('save', null);
  $('t-continue').hidden = !s;
  const best = store.get('best', null);
  const parts = [];
  if (s && s.stats) parts.push(`Saved: ${fmt(s.stats.time)} in, caught ${s.stats.caught}x (${DIFFICULTY[s.diff] ? DIFFICULTY[s.diff].name : ''})`);
  if (best) parts.push(`Best: ${fmt(best.time)} (${best.diff})`);
  $('t-foot').textContent = parts.join(' · ');
}
const fmt = s => { s = Math.max(0, s | 0); return `${(s / 60) | 0}:${String(s % 60).padStart(2, '0')}`; };

function openOverlay(id) { overlay = id; show(id, true); if (id === 's-settings') syncSettings(); }
function closeOverlay() { if (overlay) show(overlay, false); overlay = null; }

function newGame(diff, mission = selectedMission) {
  selectedMission = mission;
  settings.difficulty = diff; saveSettings();
  store.del('save');
  startWorld(null);
}
function startWorld(save) {
  world = new World({ mission: save ? (save.mission || 0) : selectedMission, difficulty: save ? save.diff : settings.difficulty, seed: (Math.random() * 1e9) | 0 });
  if (save) world.load(save);
  selectedMission = world.level.mission || 0;
  renderer.setWorld(world);
  hudReset();
  nStepDist = 0; lastAi = null; winT = -1;
  setMode('play');
  sound.unlock(); sound.play('wake');
  if (!isTouch) input.lock();
  toast(MISSIONS[world.level.mission || 0].brief, 'step');
}
function rebuildRenderer() {
  const old = renderer;
  try { old.gl.dispose(); } catch { /* ignore */ }
  renderer = new Renderer($('game'), world, { quality: settings.quality, touch: isTouch });
}
function pause() { if (mode !== 'play') return; setMode('pause'); sound.suspend(); persist(); }
function resume() { closeOverlay(); setMode('play'); sound.resume(); if (!isTouch) input.lock(); }
function quitToTitle() { persist(); closeOverlay(); setMode('title'); sound.resume(); }
function persist() { if (world && !world.flags.won && (world.stats.time > 1 || world.stats.caught)) store.set('save', world.serialize()); }

$('t-continue').onclick = () => { sound.unlock(); const s = store.get('save', null); if (s) startWorld(s); };
$('t-new').onclick = () => { sound.unlock(); openOverlay('s-diff'); pickDiff(settings.difficulty); };
$('t-settings').onclick = () => openOverlay('s-settings');
$('t-help').onclick = () => openOverlay('s-help');
let chosenDiff = settings.difficulty;
function pickDiff(d) { $('mission-select').value = String(selectedMission); $('mission-brief').textContent = MISSIONS[selectedMission].brief; chosenDiff = d; for (const b of $('dpick').children) b.classList.toggle('on', b.dataset.d === d); }
for (const b of $('dpick').children) b.onclick = () => pickDiff(b.dataset.d);
$('d-back').onclick = closeOverlay;
$('d-go').onclick = () => { closeOverlay(); newGame(chosenDiff); };
$('o-done').onclick = closeOverlay;
$('h-done').onclick = closeOverlay;
$('b-pause').onclick = pause;
$('p-resume').onclick = resume;
$('p-settings').onclick = () => openOverlay('s-settings');
$('p-help').onclick = () => openOverlay('s-help');
$('p-restart').onclick = () => { closeOverlay(); newGame(world.diffKey, world.level.mission || 0); };
$('p-quit').onclick = quitToTitle;
$('w-next').onclick = () => newGame(world.diffKey, (world.level.mission || 0) + 1);
$('mission-select').onchange = e => { selectedMission = +e.target.value; $('mission-brief').textContent = MISSIONS[selectedMission].brief; };
$('mission-brief').textContent = MISSIONS[0].brief;
$('w-again').onclick = () => { setMode('title'); openOverlay('s-diff'); pickDiff(world.diffKey); };
$('w-menu').onclick = () => setMode('title');

function syncSettings() {
  $('o-sens').value = settings.sens; $('o-vol').value = settings.volume;
  const seg = (id, v) => { for (const b of $(id).children) b.classList.toggle('on', b.dataset.v === String(v)); };
  seg('o-inv', settings.invertY ? 1 : 0); seg('o-q', settings.quality); seg('o-diff', world && mode !== 'title' ? world.diffKey : settings.difficulty);
}
$('o-sens').oninput = e => { settings.sens = +e.target.value; input.sens = settings.sens; saveSettings(); };
$('o-vol').oninput = e => { settings.volume = +e.target.value; sound.setVolume(settings.volume); saveSettings(); };
for (const b of $('o-inv').children) b.onclick = () => { settings.invertY = b.dataset.v === '1'; input.invertY = settings.invertY; saveSettings(); syncSettings(); };
for (const b of $('o-q').children) b.onclick = () => { if (settings.quality === b.dataset.v) return; settings.quality = b.dataset.v; saveSettings(); rebuildRenderer(); syncSettings(); };
for (const b of $('o-diff').children) b.onclick = () => {
  settings.difficulty = b.dataset.v; saveSettings();
  if (world && mode !== 'title') { world.diffKey = b.dataset.v; world.diff = DIFFICULTY[b.dataset.v]; world.ai.diff = world.diff; }
  syncSettings();
};

input.onKey = (k) => {
  if (k === 'Escape' || k === 'KeyP') {
    if (overlay) { closeOverlay(); return; }
    if (mode === 'play') pause(); else if (mode === 'pause') resume();
  }
};
input.onUnlock = () => { if (mode === 'play' && !world.flags.won) pause(); };
document.addEventListener('visibilitychange', () => { if (document.hidden) { if (mode === 'play') pause(); sound.suspend(); } });

// ------------------------------------------------------------------ HUD
const slots = [];
for (let i = 0; i < 4; i++) {
  const s = document.createElement('div'); s.className = 'slot'; s.innerHTML = `<i>${i + 1}</i><span></span>`;
  s.addEventListener('pointerdown', e => { e.preventDefault(); input.slot = i; });
  $('hotbar').appendChild(s); slots.push(s);
}
let hudCache = {};
function hudReset() { hudCache = {}; wakeAt = -99; $('toast').innerHTML = ''; $('black').style.opacity = 0; $('black').style.transition = 'none'; refreshNotes(); }
function setText(id, txt) { if (hudCache[id] !== txt) { hudCache[id] = txt; $(id).innerHTML = txt; } }
function toast(text, kind = 'info') {
  const d = document.createElement('div'); d.className = kind; d.textContent = text;
  const box = $('toast'); box.appendChild(d);
  while (box.children.length > 3) box.removeChild(box.firstChild);
  setTimeout(() => { d.style.transition = 'opacity .5s'; d.style.opacity = 0; setTimeout(() => d.remove(), 520); }, kind === 'step' ? 4200 : 3000);
}
const CLUES = {
  basement: 'Basement door: red padlock and chains. Need a red key.',
  studyLock: 'Study door upstairs: electric lock, no power.',
  fusebox: 'Fuse box in the pantry: one fuse missing.',
  garageBoards: 'Garage side window is boarded up.',
  redkey: 'There\'s a red key on the study desk!',
};
function refreshNotes() {
  const out = [];
  if (world.level.exit) { $('notes').textContent = MISSIONS[world.level.mission].brief; return; }
  for (const id in CLUES) if (world.clues[id]) out.push(`<li${(id === 'basement' && world.steps.basement) || (id === 'studyLock' && world.flags.power) || (id === 'fusebox' && world.flags.power) || (id === 'garageBoards' && world.steps.garageWindow) || (id === 'redkey' && world.steps.redkey) ? ' class="done"' : ''}>${CLUES[id]}</li>`);
  for (const id of ['crowbar', 'fuse', 'power', 'garageRoof', 'studyWindow', 'redkey']) if (world.steps[id] !== undefined && !(id === 'redkey' && world.clues.redkey)) out.push(`<li class="done">${STEPS[id].label}</li>`);
  $('notes').innerHTML = out.slice(-6).join('');
}

function updateHud() {
  const p = world.player, ai = world.ai;
  setText('obj', `Level ${(world.level.mission || 0) + 1}: ${world.objective()}`);
  setText('stats', `${fmt(world.stats.time)} &middot; caught ${world.stats.caught}${world.traps.length ? ` &middot; traps ${world.traps.length}` : ''}${world.cams.length ? ` &middot; cameras ${world.cams.length}` : ''}`);
  // look hint
  const h = !p.hiding && !p.caught ? world.hint() : null;
  const cross = $('cross');
  if (h) {
    const key = isTouch ? (h.act === 'take' ? 'USE' : h.act === 'hide' ? 'USE' : 'USE') : (h.act === 'take' ? 'E' : h.act === 'hide' ? 'F' : 'E');
    setText('hint', h.act === 'none' ? h.text : `<kbd>${key}</kbd>${h.text}`);
    $('hint').hidden = false; $('hint').classList.toggle('dim', h.act === 'none');
    cross.className = 'cross on' + (h.act === 'none' ? ' no' : '');
  } else { $('hint').hidden = true; cross.className = 'cross'; }
  if (isTouch) document.querySelector('.tb[data-b=use]').classList.toggle('hl', !!h && h.act !== 'none');
  // hotbar
  for (let i = 0; i < 4; i++) {
    const id = p.inv[i], t = id ? world.propById[id].type : '';
    const k = t + (i === p.sel ? '*' : '');
    if (hudCache['s' + i] !== k) { hudCache['s' + i] = k; slots[i].classList.toggle('sel', i === p.sel); slots[i].querySelector('span').innerHTML = t ? icon(t) : ''; }
  }
  const sel = world.selected();
  const nm = sel ? ITEM_TYPES[sel.type].name : '';
  if (hudCache.nm !== nm + p.sel) { hudCache.nm = nm + p.sel; $('itemname').textContent = nm; $('itemname').classList.add('show'); clearTimeout(hudCache.nmT); hudCache.nmT = setTimeout(() => $('itemname').classList.remove('show'), 1400); }
  $('charge').hidden = !p.charging;
  if (p.charging) $('chargefill').style.width = (p.charge * 100).toFixed(0) + '%';
  // eye
  const eye = $('eye');
  const st = ai.state === 'chase' ? 'chase' : (ai.state === 'suspicious' || ai.state === 'search') ? 'sus' : '';
  eye.className = (ai.aware > 0.02 || st ? 'show ' : '') + st;
  $('eyefill').style.width = (Math.min(1, ai.state === 'chase' ? 1 : ai.aware) * 100).toFixed(0) + '%';
  $('stuck').hidden = !(p.stuck > 0);
  $('slats').hidden = !p.hiding;
  // red vignette when he's chasing and close
  const d = Math.hypot(ai.x - p.x, ai.z - p.z);
  updateBlack();
  $('vig').style.opacity = ai.state === 'chase' ? Math.min(0.9, 0.35 + Math.max(0, 1 - d / 12) * 0.6).toFixed(2) : p.stuck > 0 ? '0.5' : '0';
}

// ------------------------------------------------------------------ events
function handleEvents() {
  const p = world.player;
  for (const e of world.events) {
    switch (e.type) {
      case 'step': sound.play('step', e); break;
      case 'jump': case 'mantle': case 'vault': case 'pickup': case 'drop': sound.play(e.type, e); break;
      case 'land': sound.play('land', e); break;
      case 'throw': sound.play('throw', e); break;
      case 'door': { const d = world.doorById[e.door]; sound.play('door', { open: e.open, pos: doorCenter(d) }); break; }
      case 'locked': sound.play('locked', { pos: doorCenter(world.doorById[e.door]) }); break;
      case 'unlock': sound.play('unlock', { pos: doorCenter(world.doorById[e.door]) }); break;
      case 'chain': sound.play('chain'); break;
      case 'glass': sound.play('glass', { pos: [e.x, e.y, e.z] }); renderer.burst('glass', e.x, e.y, e.z, 22); break;
      case 'impact': sound.play('impact', Object.assign({ pos: [e.x, e.y, e.z] }, e)); if (e.v > 5) renderer.burst('dust', e.x, e.y, e.z, 4); break;
      case 'shatter': sound.play('shatter', { pos: [e.x, e.y, e.z] }); renderer.burst('glass', e.x, e.y, e.z, 12); break;
      case 'bonk': sound.play('bonk', { pos: [e.x, e.y, e.z] }); toast('Bonk! That got his attention.', 'bad'); break;
      case 'boards': { const w = world.winById[e.win], c = windowCenter(w); sound.play('boards', { pos: c }); renderer.burst('wood', c[0], c[1], c[2], 14); break; }
      case 'trap': sound.play('trap', { pos: [e.x, e.y, e.z] }); renderer.burst('spark', e.x, e.y + 0.2, e.z, 16); flash(0.35); break;
      case 'alarm': sound.play('alarm', { pos: [e.x, e.y, e.z] }); break;
      case 'kick': sound.play('kick', { pos: [e.x, 0.5, e.z] }); break;
      case 'power': sound.play('power'); refreshNotes(); break;
      case 'hide': sound.play('hide'); break;
      case 'unhide': sound.play('hide'); break;
      case 'hide-open': { const h = world.hides.find(s => s.id === e.id); sound.play('hideopen', { pos: [h.x, h.y + 1, h.z] }); break; }
      case 'ai-spotted': sound.play('spotted', { pos: [world.ai.x, world.ai.y + 1.8, world.ai.z] }); break;
      case 'ai-glimpse': sound.play('glimpse', { pos: [world.ai.x, world.ai.y + 1.8, world.ai.z] }); break;
      case 'ai-heard': sound.play('heard', { pos: [world.ai.x, world.ai.y + 1.8, world.ai.z] }); break;
      case 'ai-hurt': break;
      case 'caught': caughtFx(e.n); break;
      case 'wake': wakeFx(e.msgs); break;
      case 'msg': toast(e.text, e.kind); break;
      case 'progress': if (STEPS[e.id] && e.id !== 'basement') toast(STEPS[e.id].label, 'step'); refreshNotes(); break;
      case 'clue': refreshNotes(); break;
      case 'win': winT = 0; sound.play('unlock'); break;
    }
  }
  world.events.length = 0;
  void p;
}

function flash(a) { const f = $('flash'); f.style.transition = 'none'; f.style.opacity = a; requestAnimationFrame(() => { f.style.transition = 'opacity .5s'; f.style.opacity = 0; }); }
let wakeAt = -99;
function caughtFx(n) {
  sound.play('caught');
  $('b-title').textContent = 'CAUGHT';
  $('b-sub').textContent = n === 1 ? 'He drags you out and throws you back across the road.' : `Caught ${n} times. He drags you home again.`;
  $('b-learn').textContent = '';
}
// the black caught/wake screen follows game time, so pausing (or a test) holds it in place
function updateBlack() {
  const p = world.player;
  let a = 0;
  if (p.caught) a = Math.min(1, Math.max(0, (p.caught.t - 1.1) / 0.9));
  else a = 1 - Math.min(1, Math.max(0, (world.t - wakeAt - 1.8) / 1.4));
  const v = a.toFixed(2);
  if (hudCache.black !== v) { hudCache.black = v; $('black').style.opacity = v; }
}
function wakeFx(msgs) {
  sound.play('wake');
  wakeAt = world.t;
  $('b-learn').innerHTML = msgs && msgs.length ? 'He\'s learning:<br>' + msgs.join('<br>') : '';
  for (const m of msgs || []) setTimeout(() => toast(m, 'bad'), 3200);
  refreshNotes();
  persist();
}

function showWin() {
  setMode('win');
  const s = world.stats;
  $('w-time').textContent = fmt(s.time); $('w-caught').textContent = s.caught; $('w-diff').textContent = world.diff.name;
  const mission = world.level.mission || 0;
  $('w-heading').textContent = MISSIONS[mission].name + ' complete';
  $('w-sub').textContent = MISSIONS[mission].win;
  $('w-next').hidden = mission >= MISSIONS.length - 1;
  const bestKey = (mission ? 'best.v2.' : 'best.') + mission + '.' + world.diffKey;  // v2: levels 2-3 were replaced
  const best = store.get(bestKey, null);
  let msg = '';
  if (!best || s.time < best.time) { store.set(bestKey, { time: s.time, caught: s.caught, diff: world.diff.name }); msg = best ? 'A new best time.' : 'Level complete.'; }
  else msg = `Best: ${fmt(best.time)} (${best.diff}).`;
  $('w-best').textContent = msg + (mission < MISSIONS.length - 1 ? ' Your next mission awaits.' : ' Every level is available from New game.');
  store.del('save');
  sound.play('win');
}

// ------------------------------------------------------------------ loop
function stepWorld(dt) {
  const inp = input.poll();
  if (override.input) Object.assign(inp, override.input);
  world.step(dt, inp);
}
function aiFootsteps() {
  const ai = world.ai;
  if (lastAi) {
    const d = Math.hypot(ai.x - lastAi[0], ai.z - lastAi[1]);
    nStepDist += d;
    const stride = ai.anim === 'run' ? 1.1 : 0.8;
    if (nStepDist > stride && d > 0) { nStepDist = 0; sound.play('nstep', { pos: [ai.x, ai.y + 0.1, ai.z], run: ai.anim === 'run' }); }
  }
  lastAi = [ai.x, ai.z];
}
function audioState() {
  const p = world.player, ai = world.ai;
  const d = Math.hypot(ai.x - p.x, ai.z - p.z) + Math.abs(ai.y - p.y);
  const heart = p.hiding ? Math.max(0, 1 - d / 9) : (ai.state === 'chase' ? Math.max(0, 1 - d / 7) : 0);
  return { chase: ai.state === 'chase' && !p.caught, tension: Math.min(1, ai.aware + (ai.state === 'search' ? 0.4 : 0)), heart, inside: world.inside(p.x, p.y + 1, p.z) };
}

function frame(now) {
  requestAnimationFrame(frame);
  let dt = (now - last) / 1000; last = now;
  if (!(dt > 0)) dt = 0;
  dt = Math.min(dt, 0.1);
  if (mode === 'play' && !overlay && override.frozen) { updateHud(); }
  else if (mode === 'play' && !overlay) {
    acc += dt;
    let n = 0;
    while (acc >= 1 / 60 && n < 6) { stepWorld(1 / 60); acc -= 1 / 60; n++; handleEvents(); }
    if (n === 6) acc = 0;
    aiFootsteps();
    updateHud();
    if (winT >= 0) { winT += dt; if (winT > 1.4) showWin(); }
    saveT += dt;
    if (saveT > 4 && world.dirty) { saveT = 0; world.dirty = false; persist(); }
  } else if (mode === 'title') {
    // the neighbour goes about his day behind the title screen
    world.ai.update(dt, world); world.ai.events.length = 0;
  }
  const p = world.player;
  sound.listener(p.x, p.y + 1.6, p.z, p.yaw);
  sound.update(dt, mode === 'play' ? audioState() : { chase: false, tension: 0.15, heart: 0, inside: false });
  renderer.frame(dt, { mode: mode === 'title' ? 'title' : 'play' });
  renderer.render();
}

// ------------------------------------------------------------------ misc
function checkRotate() { $('rotate').hidden = !(isTouch && !rotateOk && window.innerHeight > window.innerWidth); }
window.addEventListener('resize', () => { renderer.resize(); checkRotate(); });
window.addEventListener('orientationchange', () => setTimeout(() => { renderer.resize(); checkRotate(); }, 200));
document.addEventListener('pointerdown', () => sound.unlock(), { once: false, passive: true });

// ------------------------------------------------------------------ debug hook (smoke tests)
window.__nn = {
  get world() { return world; },
  get renderer() { return renderer; },
  get input() { return input; },
  get mode() { return mode; },
  start(diff = 'normal', mission = 0) { closeOverlay(); newGame(diff, mission); return true; },
  teleport(x, y, z, yaw = world.player.yaw, pitch = 0) { Object.assign(world.player, { x, y, z, yaw, pitch, vx: 0, vy: 0, vz: 0, onGround: true, fallFrom: y, hiding: null }); renderer.eyeY = null; return true; },
  look(yaw, pitch = 0) { world.player.yaw = yaw; world.player.pitch = pitch; },
  lookAt(x, y, z) {
    const [ex, ey, ez] = world.eye();
    world.player.yaw = Math.atan2(-(x - ex), -(z - ez));
    world.player.pitch = Math.atan2(y - ey, Math.hypot(x - ex, z - ez));
    world.look = world.lookTarget();
    return world.look ? world.look.kind + ':' + (world.look.ref.id || world.look.ref.type) : null;
  },
  giveItem(what) {
    const pr = world.propById[what] || world.props.find(q => q.type === what && !q.held && !q.gone);
    if (!pr) return false;
    return world.pickUp(pr);
  },
  setAIState(state, o = {}) {
    const ai = world.ai;
    if (o.x !== undefined) ai.teleport({ x: o.x, y: o.y || 0, z: o.z, look: o.look || 0 });
    if (o.lastKnown) ai.lastKnown = o.lastKnown.slice();
    if (o.aware !== undefined) ai.aware = o.aware;
    if (state) ai.setState(state, { pos: o.lastKnown || [world.player.x, world.player.y, world.player.z], run: true });
    if (o.hold) { ai.poi = { id: 'hold', x: ai.x, y: ai.y, z: ai.z, look: ai.yaw, dur: 1e9, anim: 'idle' }; ai.poiT = 1e9; ai.path = []; ai.pathI = 0; }
    return ai.state;
  },
  completeStep(id) {
    const W = world;
    switch (id) {
      case 'crowbar': case 'fuse': case 'redkey': return this.giveItem(id);
      case 'garageWindow': W.winById.garageW.boards = false; W.markStep('garageWindow'); return true;
      case 'power': W.setPower(true); return true;
      case 'studyWindow': W.breakWindow(W.winById.studyEW); return true;
      case 'basement': W.doorById.basement.locked = false; W.doorById.basement.target = 1; return true;
    }
    return false;
  },
  catchPlayer() { world.catchPlayer(); return true; },
  breakWindow(id) { return world.breakWindow(world.winById[id]); },
  // run the simulation synchronously (deterministic for tests); input applies every frame
  sim(seconds, inp = {}, until) {
    const n = Math.round(seconds * 60);
    for (let i = 0; i < n; i++) {
      const frameInp = typeof inp === 'function' ? inp(i / 60) : inp;
      world.step(1 / 60, Object.assign({}, frameInp));
      handleEvents();
      aiFootsteps();
      if (winT >= 0) { winT += 1 / 60; if (winT > 1.4 && mode === 'play') showWin(); }
      if (until && until(world)) return i / 60;
    }
    updateHud();
    return seconds;
  },
  setInput(o) { override.input = o; },
  freeze(on = true) { override.frozen = on; return on; },
  pause, resume,
  state() {
    const p = world.player, ai = world.ai;
    return {
      mode, mission: world.level.mission || 0, x: +p.x.toFixed(2), y: +p.y.toFixed(2), z: +p.z.toFixed(2), inv: p.inv.slice(), hiding: p.hiding, caught: !!p.caught, stuck: p.stuck,
      ai: { state: ai.state, x: +ai.x.toFixed(2), y: +ai.y.toFixed(2), z: +ai.z.toFixed(2), aware: +ai.aware.toFixed(2) },
      steps: Object.keys(world.steps), won: world.flags.won, caughtN: world.stats.caught, traps: world.traps.length, cams: world.cams.length,
      look: world.look ? world.look.kind + ':' + (world.look.ref.id || world.look.ref.type) : null,
    };
  },
};

setMode('title');
requestAnimationFrame(t => { last = t; frame(t); });
