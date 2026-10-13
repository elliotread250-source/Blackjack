import {
  BUILDINGS, UPGRADE, ACHIEVEMENTS, newState, load, price, cps, clickValue, click, tick, buy, affordable,
  availableUpgrades, buyUpgrade, checkAchievements, golden, offline, format, buildingCps,
} from './logic.js';
import { sound } from './audio.js';

const $ = id => document.getElementById(id);
const KEY = 'cookieclicker.v1';
const prefs = Object.assign({ name: 'Your', amount: 1, muted: false }, read('cookieclicker.prefs') || {});
let s = load(read(KEY));
sound.muted = prefs.muted;
function read(k) { try { return JSON.parse(localStorage.getItem(k)); } catch { return null; } }
function write(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch { /* storage blocked */ } }
function save() { s.saved = Date.now(); write(KEY, s); write('cookieclicker.prefs', prefs); }

// ---------------------------------------------------------------- building rows (built once)
const rows = BUILDINGS.map((b, i) => {
  const el = document.createElement('button');
  el.className = 'building';
  el.innerHTML = `<span class="ic">${b.icon}</span><span><div class="nm"></div><div class="pr"></div></span><span class="own"></span>`;
  el.addEventListener('click', () => {
    const n = prefs.amount;
    if (buy(s, b.id, n)) { sound.buy(); refresh(true); }
  });
  hover(el, () => {
    const owned = s.owned[b.id] || 0, each = buildingCps(s, b.id);
    if (locked(i)) return `<b>???</b><div class="q">Keep baking to discover this.</div>`;
    return `<b>${b.icon} ${b.name}</b> <span class="c">🍪 ${format(price(b.id, owned, prefs.amount))}</span><div class="q">“${b.desc}”</div>` +
      `<div>Each makes <b>${format(each, 1)}</b> per second.</div>` + (owned ? `<div>${owned} make <b>${format(each * owned, 1)}</b> per second (${Math.round(each * owned / Math.max(cps(s), 1e-9) * 100)}% of total).</div>` : '');
  });
  $('buildings').append(el);
  return { el, nm: el.querySelector('.nm'), pr: el.querySelector('.pr'), own: el.querySelector('.own') };
});
// Cursor is known from the start; each later building shows as "???" until you've baked a third of its price,
// and only the next unknown one is listed.
const locked = i => i > 0 && !(s.owned[BUILDINGS[i].id] || s.baked >= BUILDINGS[i].cost / 3);
const visible = i => i < 2 || !locked(i - 1);

// ---------------------------------------------------------------- tooltips
const tip = $('tooltip');
function hover(el, html) {
  el.addEventListener('pointerenter', e => { if (e.pointerType !== 'mouse') return; tip.innerHTML = html(); tip.hidden = false; place(e); });
  el.addEventListener('pointermove', e => { if (!tip.hidden) { tip.innerHTML = html(); place(e); } });
  el.addEventListener('pointerleave', () => { tip.hidden = true; });
}
function place(e) {
  const w = tip.offsetWidth, h = tip.offsetHeight;
  tip.style.left = Math.max(8, Math.min(innerWidth - w - 8, e.clientX - w - 16)) + 'px';
  tip.style.top = Math.max(8, Math.min(innerHeight - h - 8, e.clientY - h / 2)) + 'px';
}

// ---------------------------------------------------------------- upgrades (rebuilt when the set changes)
let upgradeKey = '';
function renderUpgrades() {
  const list = availableUpgrades(s), key = list.map(u => u.id).join();
  if (key !== upgradeKey) {
    upgradeKey = key;
    $('upgrades').innerHTML = '';
    for (const u of list) {
      const b = document.createElement('button');
      b.className = 'upgrade'; b.dataset.id = u.id;
      b.innerHTML = u.icon + (u.building ? `<span class="tier">${'I'.repeat(+u.id.slice(-1) + 1).replace('IIII', 'IV')}</span>` : '');
      b.setAttribute('aria-label', `${u.name}: ${u.desc} Costs ${format(u.cost)} cookies.`);
      b.addEventListener('click', () => { if (buyUpgrade(s, u.id)) { sound.upgrade(); tip.hidden = true; toast(`<b>${u.name}</b> bought. ${u.desc}`); refresh(true); } });
      hover(b, () => `<b>${u.icon} ${u.name}</b> <span class="c">🍪 ${format(u.cost)}</span><div>${u.desc}</div>`);
      $('upgrades').append(b);
    }
    $('no-upgrades').hidden = list.length > 0;
  }
  for (const b of $('upgrades').children) { const can = s.cookies >= UPGRADE[b.dataset.id].cost; b.classList.toggle('can', can); b.classList.toggle('cant', !can); }
}

// ---------------------------------------------------------------- the big cookie
const cookieEl = $('cookie'), fx = $('fx');
cookieEl.addEventListener('pointerdown', e => {
  e.preventDefault();
  const v = click(s, Date.now());
  sound.click();
  cookieEl.classList.add('press'); setTimeout(() => cookieEl.classList.remove('press'), 70);
  const r = fx.getBoundingClientRect(), x = (e.clientX || r.width / 2 + r.left) - r.left, y = (e.clientY || r.height / 2 + r.top) - r.top;
  floatText('+' + format(v, 1), x, y);
  for (let i = 0; i < 2; i++) {
    const c = document.createElement('div'); c.className = 'crumb';
    c.style.left = x + 'px'; c.style.top = y + 'px'; c.style.setProperty('--dx', (Math.random() * 120 - 60) + 'px');
    fx.append(c); setTimeout(() => c.remove(), 1000);
  }
  refresh();
});
cookieEl.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); const v = click(s, Date.now()); sound.click(); const r = fx.getBoundingClientRect(); floatText('+' + format(v, 1), r.width / 2, r.height / 2); refresh(); } });
function floatText(text, x, y) {
  const f = document.createElement('div'); f.className = 'float'; f.textContent = text;
  f.style.left = x + 'px'; f.style.top = y + 'px'; fx.append(f); setTimeout(() => f.remove(), 1000);
}

// ---------------------------------------------------------------- golden cookies
const goldenEl = $('golden');
let nextGolden = Date.now() + 40000 + Math.random() * 50000, goldenGone = 0;
function spawnGolden(now) {
  goldenEl.hidden = false; goldenEl.classList.remove('fade');
  goldenEl.style.left = (40 + Math.random() * (innerWidth - 170)) + 'px';
  goldenEl.style.top = (60 + Math.random() * (innerHeight - 200)) + 'px';
  goldenGone = now + 13000;
}
goldenEl.addEventListener('click', e => {
  const r = golden(s, Date.now());
  goldenEl.hidden = true; goldenGone = 0; nextGolden = Date.now() + 60000 + Math.random() * 120000;
  sound.golden();
  const msg = r.kind === 'lucky' ? `<b>Lucky!</b> +${format(r.gain)} cookies` : r.kind === 'frenzy' ? '<b>Frenzy!</b> Cookie production ×7 for 77 seconds' : '<b>Click frenzy!</b> Clicking power ×777 for 13 seconds';
  toast(msg);
  const fr = fx.getBoundingClientRect(); floatText(r.kind === 'lucky' ? '+' + format(r.gain) : r.kind === 'frenzy' ? 'Frenzy!' : 'Click frenzy!', e.clientX - fr.left, e.clientY - fr.top);
  refresh(true);
});

// ---------------------------------------------------------------- toasts, news, stats
function toast(html) {
  const t = document.createElement('div'); t.className = 'toast'; t.innerHTML = html;
  $('toasts').append(t); setTimeout(() => t.remove(), 4500);
  while ($('toasts').children.length > 3) $('toasts').firstChild.remove();
}
function news() {
  const o = id => s.owned[id] || 0, c = cps(s), lines = [];
  if (s.baked < 5) lines.push('You feel like making cookies. But nobody wants to eat your cookies.');
  if (s.baked >= 5 && s.baked < 1000) lines.push('Your first batch goes to the bin. The neighbourhood raccoon refuses to touch it.', 'Your cookies are popular with the family. Mostly with you.');
  if (s.baked >= 1000) lines.push('People are starting to talk about your cookies.', 'Your cookies are talked about for miles around.');
  if (o('grandma')) lines.push('News: grandmas report "warm fuzzy feelings" after hours of baking.', `${o('grandma')} grandma${o('grandma') > 1 ? 's' : ''} say${o('grandma') > 1 ? '' : 's'}: "Eat up, dear."`);
  if (o('farm')) lines.push('News: cookie crops are blooming across the countryside.', 'News: farmers puzzled as fields of chocolate chips sprout overnight.');
  if (o('mine')) lines.push('News: miners strike a rich vein of cookie dough.', 'News: "We just keep digging," say chocolate miners.');
  if (o('factory')) lines.push('News: factories churn out cookies at an alarming rate.', 'News: local factory accused of "too many cookies".');
  if (o('bank')) lines.push('News: cookie now accepted as currency in three countries.');
  if (o('temple')) lines.push('News: explorers uncover a temple made entirely of biscuits.');
  if (o('wizard')) lines.push('News: wizard turns a mayor into a gingerbread man. "Improvement," say residents.');
  if (o('shipment')) lines.push('News: first cookie shipment arrives from the cookie planet.');
  if (o('portal') || o('time')) lines.push('News: scientists warn about "cookie-related distortions in spacetime".');
  if (c >= 1e6) lines.push('News: the world now runs on your cookies.', 'News: cookies have replaced oxygen as the most abundant substance on Earth.');
  const el = $('news'); el.textContent = lines[Math.floor(Math.random() * lines.length)];
  el.style.animation = 'none'; void el.offsetWidth; el.style.animation = '';
}
function openStats() {
  const mins = Math.floor((Date.now() - s.started) / 60000);
  const stats = [['Cookies in bank', format(s.cookies)], ['Cookies baked (all time)', format(s.baked)], ['Cookies per second', format(cps(s, Date.now()), 1)],
    ['Cookies per click', format(clickValue(s, Date.now()), 1)], ['Cookie clicks', format(s.clicks)], ['Hand-made cookies', format(s.handmade)],
    ['Buildings owned', format(Object.values(s.owned).reduce((a, b) => a + b, 0))], ['Upgrades bought', s.upgrades.length], ['Golden cookies clicked', s.goldens],
    ['Playing for', mins < 60 ? `${mins} min` : `${Math.floor(mins / 60)} h ${mins % 60} min`], ['Achievement bonus', `+${s.achievements.length}% production`]];
  $('stat-list').innerHTML = stats.map(([k, v]) => `<dt>${k}</dt><dd>${v}</dd>`).join('');
  $('ach-count').textContent = `(${s.achievements.length} / ${ACHIEVEMENTS.length})`;
  $('ach-grid').innerHTML = ACHIEVEMENTS.map(a => `<div class="ach${s.achievements.includes(a.id) ? ' got' : ''}" title="${a.name}: ${a.desc}">${s.achievements.includes(a.id) ? '🏆' : '🔒'}</div>`).join('');
  $('stats').showModal();
}
$('stats-btn').addEventListener('click', openStats);
$('wipe').addEventListener('click', () => {
  if (!confirm('Wipe your save and start a brand new bakery? This cannot be undone.')) return;
  s = newState(); upgradeKey = ''; save(); $('stats').close(); refresh(true); news();
});
$('rename').addEventListener('click', () => {
  const n = prompt('Name your bakery:', prefs.name);
  if (n !== null && n.trim()) { prefs.name = n.trim().slice(0, 28); save(); refresh(true); }
});
$('mute').addEventListener('click', () => { prefs.muted = sound.muted = !prefs.muted; save(); refresh(true); });
document.querySelectorAll('.amounts button').forEach(b => b.addEventListener('click', () => { prefs.amount = +b.dataset.amt; save(); refresh(true); }));

// ---------------------------------------------------------------- display
let lastFull = 0;
function refresh(full = false) {
  const now = Date.now();
  $('cookies').textContent = format(s.cookies);
  const rate = cps(s, now);
  $('cps').textContent = format(rate, 1);
  const buffs = [];
  if (s.frenzyUntil > now) buffs.push(`Frenzy ×7 ${Math.ceil((s.frenzyUntil - now) / 1000)}s`);
  if (s.clickFrenzyUntil > now) buffs.push(`Click ×777 ${Math.ceil((s.clickFrenzyUntil - now) / 1000)}s`);
  $('buff').textContent = buffs.join(' · ');
  if (!full && now - lastFull < 150) return;
  lastFull = now;
  $('bakery-name').textContent = `${prefs.name}${prefs.name.toLowerCase().endsWith('s') ? "'" : "'s"} bakery`.replace("Your's", 'Your');
  rows.forEach((r, i) => {
    const b = BUILDINGS[i], owned = s.owned[b.id] || 0, cost = price(b.id, owned, prefs.amount), lock = locked(i);
    r.el.hidden = !visible(i);
    r.el.classList.toggle('locked', lock);
    r.el.classList.toggle('cant', s.cookies < cost); r.el.classList.toggle('can', s.cookies >= cost);
    r.nm.textContent = lock ? '???' : b.name; r.pr.textContent = format(cost); r.own.textContent = owned || '';
    r.el.setAttribute('aria-label', `${lock ? 'Unknown building' : b.name}, owned ${owned}, buy ${prefs.amount} for ${format(cost)} cookies`);
  });
  renderUpgrades();
  document.querySelectorAll('.amounts button').forEach(b => b.setAttribute('aria-checked', String(+b.dataset.amt === prefs.amount)));
  $('mute').textContent = prefs.muted ? '🔇' : '🔊';
  for (const a of checkAchievements(s)) { sound.achievement(); toast(`🏆 Achievement unlocked: <b>${a.name}</b><br>${a.desc}`); }
}

// ---------------------------------------------------------------- main loop
let last = performance.now(), lastSave = Date.now(), lastNews = 0, lastTitle = 0, rainAcc = 0;
function frame(t) {
  const dt = Math.min(1, (t - last) / 1000); last = t;
  const now = Date.now();
  tick(s, dt, now);
  if (!goldenGone && now > nextGolden && document.visibilityState === 'visible') spawnGolden(now);
  if (goldenGone && now > goldenGone - 1000) goldenEl.classList.add('fade');
  if (goldenGone && now > goldenGone) { goldenEl.hidden = true; goldenGone = 0; nextGolden = now + 60000 + Math.random() * 120000; }
  // a gentle rain of cookies that thickens with production
  rainAcc += dt * Math.min(4, Math.log10(cps(s, now) + 1) * 0.6);
  while (rainAcc > 1) {
    rainAcc--;
    const d = document.createElement('div'); d.className = 'rain'; d.textContent = '🍪';
    d.style.left = Math.random() * 100 + '%'; d.style.animationDuration = (3 + Math.random() * 3) + 's'; fx.append(d);
    setTimeout(() => d.remove(), 6000);
  }
  refresh();
  if (now - lastNews > 10000) { lastNews = now; if (lastTitle) news(); }
  if (now - lastTitle > 1000) { lastTitle = now; document.title = `${format(s.cookies)} cookies – Cookie Clicker`; }
  if (now - lastSave > 10000) { lastSave = now; save(); }
  requestAnimationFrame(frame);
}

const away = offline(s, Date.now());
if (away.secs > 60 && away.gain >= 1) toast(`While you were away for ${away.secs >= 3600 ? Math.floor(away.secs / 3600) + ' h ' : ''}${Math.floor(away.secs % 3600 / 60)} min, your bakery made <b>${format(away.gain)}</b> cookies.`);
addEventListener('pagehide', save);
document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'hidden') save(); });
refresh(true);
requestAnimationFrame(frame);
window.__cc = { get state() { return s; }, refresh, save, spawnGolden: () => spawnGolden(Date.now()) };
