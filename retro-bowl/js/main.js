// Screens and glue: accounts, the franchise hub, the match loop and its controls.
import { TEAMS, teamById, rating, stars, POS, ATTR_NAMES, SLOTS, slotPos, CONFS, DIVS } from './data.js';
import {
  newCareer, userGame, finishUserGame, standings, payroll, capRoom, SALARY_CAP, active, teamRatings, syncUserTeam,
  FACILITIES, facilityCost, upgradeFacility, trainPlayer, trainCost, freeAgents, signFreeAgent, draftPick, resign,
  startNextSeason, ROUNDS, SEASON_WEEKS,
} from './career.js';
import { Match, handoff, setAim, throwBall, dive, flightTime, fmtClock } from './match.js';
import { Renderer, W, H, PX_PER_YARD, UI_SCALE } from './render.js';
import { sfx, setSound } from './audio.js';

const $ = s => document.querySelector(s);
const $$ = s => [...document.querySelectorAll(s)];
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const touch = matchMedia('(pointer: coarse)').matches;

// ---------------------------------------------------------------- server
async function api(path, body) {
  let res;
  try {
    res = await fetch(path, body === undefined ? { credentials: 'same-origin', cache: 'no-store' }
      : { method: 'POST', credentials: 'same-origin', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
  } catch { const e = new Error('Can’t reach the server. Check your connection.'); e.status = 0; throw e; }
  const data = await res.json().catch(() => ({}));
  if (!res.ok) { const e = new Error(data.error || 'Request failed'); e.status = res.status; e.data = data; throw e; }
  return data;
}

const S = { user: null, accounts: [], career: null, rev: 0, saving: null, dirty: false, tab: 'team' };

function show(id) {
  $$('.screen').forEach(s => s.classList.toggle('on', s.id === id));
  window.scrollTo(0, 0);
}
let toastT;
function toast(msg) {
  const t = $('#toast');
  t.textContent = msg; t.classList.add('on');
  clearTimeout(toastT); toastT = setTimeout(() => t.classList.remove('on'), 2600);
}
function modal(html, onReady) {
  $('#modal-box').innerHTML = html;
  $('#modal').classList.add('on');
  onReady && onReady($('#modal-box'));
}
function closeModal() { $('#modal').classList.remove('on'); }
$('#modal').addEventListener('click', e => { if (e.target.id === 'modal') closeModal(); });

// ---------------------------------------------------------------- accounts
let authName = '', authExists = false;
function authStep(step) {
  for (const id of ['auth-name', 'auth-pin', 'auth-recover', 'auth-code']) $('#' + id).hidden = id !== step;
}
function renderRemembered() {
  const box = $('#remembered');
  if (!S.accounts.length) { box.innerHTML = ''; return; }
  box.innerHTML = `<label>ACCOUNTS ON THIS DEVICE</label><div class="chips">${S.accounts.map(a => `<button class="chip" data-acct="${esc(a)}">${esc(a)}</button>`).join('')}</div>`;
  box.querySelectorAll('[data-acct]').forEach(b => b.onclick = async () => {
    try { const r = await api('/api/auth/switch', { username: b.dataset.acct }); await signedIn(r.user); }
    catch (e) { $('#in-name').value = b.dataset.acct; nameContinue(); }
  });
}
async function nameContinue() {
  const name = $('#in-name').value.trim();
  $('#name-err').textContent = '';
  try {
    const r = await api('/api/auth/check', { username: name });
    if (!r.ok) { $('#name-err').textContent = r.error; return; }
    authName = r.username; authExists = r.exists;
    $('#pin-title').textContent = authExists ? `Welcome back, ${authName}` : `New coach: ${authName}`;
    $('#pin-help').textContent = authExists ? 'Enter your PIN to sign in.' : 'Make a PIN. You will type it every time you sign in on a new device.';
    $('#pin2-wrap').hidden = authExists;
    $('#btn-forgot').hidden = !authExists;
    $('#btn-pin').textContent = authExists ? 'Sign in' : 'Create account';
    $('#in-pin').value = ''; $('#in-pin2').value = ''; $('#pin-err').textContent = '';
    $('#in-pin').autocomplete = authExists ? 'current-password' : 'new-password';
    authStep('auth-pin');
    setTimeout(() => $('#in-pin').focus(), 50);
  } catch (e) { $('#name-err').textContent = e.message; }
}
async function pinContinue() {
  const pin = $('#in-pin').value.trim();
  $('#pin-err').textContent = '';
  if (!/^\d{4,8}$/.test(pin)) { $('#pin-err').textContent = 'Your PIN needs 4 to 8 numbers.'; return; }
  try {
    if (authExists) {
      const r = await api('/api/auth/login', { username: authName, pin });
      await signedIn(r.user);
    } else {
      if (pin !== $('#in-pin2').value.trim()) { $('#pin-err').textContent = "Those PINs don't match."; return; }
      const r = await api('/api/auth/register', { username: authName, pin });
      S.pendingUser = r.user;
      $('#rec-code').textContent = r.recovery;
      authStep('auth-code');
    }
  } catch (e) { $('#pin-err').textContent = e.message; }
}
$('#btn-name').onclick = nameContinue;
$('#in-name').addEventListener('keydown', e => { if (e.key === 'Enter') nameContinue(); });
$('#btn-pin').onclick = pinContinue;
$('#in-pin').addEventListener('keydown', e => { if (e.key === 'Enter') (authExists ? pinContinue() : $('#in-pin2').focus()); });
$('#in-pin2').addEventListener('keydown', e => { if (e.key === 'Enter') pinContinue(); });
$('#btn-back').onclick = () => authStep('auth-name');
$('#btn-forgot').onclick = () => { $('#rec-err').textContent = ''; authStep('auth-recover'); };
$('#btn-rec-back').onclick = () => authStep('auth-pin');
$('#btn-recover').onclick = async () => {
  try {
    const r = await api('/api/auth/recover', { username: authName, code: $('#in-rec').value, pin: $('#in-newpin').value.trim() });
    S.pendingUser = r.user;
    $('#rec-code').textContent = r.recovery;
    authStep('auth-code');
  } catch (e) { $('#rec-err').textContent = e.message; }
};
$('#btn-code-ok').onclick = () => signedIn(S.pendingUser);

async function signedIn(user) {
  S.user = user;
  try {
    const r = await api('/api/save');
    S.career = r.save && r.save.v ? r.save : null;
    S.rev = r.rev;
  } catch (e) { toast(e.message); S.career = null; }
  if (S.career) { applySettings(); syncUserTeam(S.career); openHub(); }
  else openPick();
}

async function signOut(forget) {
  await flushSave();
  const r = await api('/api/auth/logout', { forget: !!forget }).catch(() => ({ accounts: [] }));
  S.user = null; S.career = null; S.accounts = r.accounts || [];
  $('#in-name').value = '';
  renderRemembered();
  authStep('auth-name');
  show('auth');
}

// ---------------------------------------------------------------- saving the career to the account
function save() {
  S.dirty = true;
  clearTimeout(S.saveT);
  S.saveT = setTimeout(flushSave, 600);
}
async function flushSave() {
  clearTimeout(S.saveT);
  if (!S.dirty || !S.career || !S.user) return;
  if (S.saving) { await S.saving; if (!S.dirty) return; }
  S.dirty = false;
  const career = S.career;
  S.saving = api('/api/save', { save: career, rev: S.rev }).then(r => { S.rev = r.rev; })
    .catch(async e => {
      if (e.status === 409) {
        // saved somewhere else since we loaded: the newer save wins, so nothing is overwritten by an old tab
        const r = await api('/api/save').catch(() => null);
        if (r) { S.career = r.save; S.rev = r.rev; toast('Your career was updated on another device. Loaded the latest.'); if (S.career) openHub(); }
      } else { S.dirty = true; toast('Couldn’t save yet: ' + e.message); setTimeout(flushSave, 8000); }
    })
    .finally(() => { S.saving = null; });
  return S.saving;
}
window.addEventListener('pagehide', () => {
  if (S.dirty && S.career && navigator.sendBeacon) {
    navigator.sendBeacon('/api/save', new Blob([JSON.stringify({ save: S.career, rev: S.rev })], { type: 'application/json' }));
  }
});

// ---------------------------------------------------------------- team picker
let picked = null;
function openPick() {
  picked = null;
  $('#btn-pick').disabled = true; $('#btn-pick').textContent = 'Choose a team';
  $('#teams').innerHTML = TEAMS.map(t => `<button class="team" data-id="${t.id}" style="background:${t.c1}">
    <span class="ab">${t.id}</span><span class="nm">${esc(t.city.toUpperCase())}</span><span class="stripe" style="background:${t.c2}"></span></button>`).join('');
  $$('#teams .team').forEach(b => b.onclick = () => {
    $$('#teams .team').forEach(x => x.classList.toggle('sel', x === b));
    picked = b.dataset.id;
    $('#btn-pick').disabled = false; $('#btn-pick').textContent = `Coach ${teamById(picked).city}`;
  });
  show('pick');
}
$('#btn-pick').onclick = () => {
  if (!picked) return;
  S.career = newCareer(picked, S.user.username);
  S.career.teamName = teamById(picked).city;
  save();
  openHub();
};

// ---------------------------------------------------------------- the hub
const starHtml = n => {
  let s = '';
  for (let i = 1; i <= 5; i++) s += n >= i ? '★' : n >= i - 0.5 ? '<span style="opacity:.6">★</span>' : '<span class="off">★</span>';
  return `<span class="stars">${s}</span>`;
};
function openHub() {
  const c = S.career;
  const t = teamById(c.teamId);
  document.documentElement.style.setProperty('--team', t.c1);
  const me = c.teams[c.teamId];
  $('#hub-badge').style.background = t.c1; $('#hub-badge').style.color = t.c2; $('#hub-badge').textContent = t.id;
  $('#hub-team').textContent = t.city.toUpperCase();
  $('#hub-sub').textContent = `COACH ${S.user.username.toUpperCase()} · SEASON ${c.season} (${c.year}) · ${c.titles} TITLE${c.titles === 1 ? '' : 'S'}`;
  $('#st-rec').textContent = `${me.w}-${me.l}${me.t ? '-' + me.t : ''}`;
  $('#st-cc').textContent = c.cc;
  $('#st-fans').textContent = `${c.fans}%`;
  $('#st-cap').textContent = `$${capRoom(c).toFixed(1)}M`;
  // next action
  const g = userGame(c);
  let html = '';
  if (g) {
    const opp = teamById(g.opp);
    const o = c.teams[g.opp];
    html = `<div class="card" style="border-color:${opp.c1}">
      <div class="dim small">${esc(g.label.toUpperCase())} · ${g.home ? 'HOME' : 'AWAY'}</div>
      <h2 style="margin:8px 0">vs ${esc(opp.city.toUpperCase())} <span class="dim small">(${o.w}-${o.l}${o.t ? '-' + o.t : ''})</span></h2>
      <div class="small dim">THEIR OFFENSE ${starHtml(o.off / 2)} &nbsp; DEFENSE ${starHtml(o.def / 2)}</div>
      <button class="btn big" id="btn-play" style="margin-top:12px">PLAY ${esc(g.label.toUpperCase())}</button>
    </div>`;
  } else if (c.phase === 'offseason') {
    const champ = c.playoffs && c.playoffs.champion;
    html = `<div class="card"><h3>OFFSEASON</h3>
      <p class="small">${champ ? `${esc(teamById(champ).city)} won the Retro Bowl. ` : ''}Draft rookies, re-sign players with expiring deals, then start season ${c.season + 1}.</p>
      <button class="btn" id="btn-draft">DRAFT (${c.draft ? c.draft.picks - c.draft.taken.length : 0} PICKS LEFT)</button>
      <button class="btn alt" id="btn-contracts">CONTRACTS (${(c.expiring || []).length})</button>
      <button class="btn green big" id="btn-next-season">START SEASON ${c.season + 1}</button></div>`;
  }
  $('#hub-next').innerHTML = html;
  if ($('#btn-play')) $('#btn-play').onclick = () => startMatch();
  if ($('#btn-draft')) $('#btn-draft').onclick = openDraft;
  if ($('#btn-contracts')) $('#btn-contracts').onclick = openContracts;
  if ($('#btn-next-season')) $('#btn-next-season').onclick = () => {
    const unsigned = (c.expiring || []).length;
    const go = () => { startNextSeason(c); save(); closeModal(); openHub(); toast(`Season ${c.season} is go!`); };
    if (unsigned) modal(`<h3>START NEW SEASON?</h3><p class="small">${unsigned} player${unsigned > 1 ? 's have' : ' has'} an expiring contract and will leave if you don't re-sign them.</p>
      <button class="btn green" id="m-go">START ANYWAY</button><button class="btn alt" id="m-no">BACK</button>`, b => { b.querySelector('#m-go').onclick = go; b.querySelector('#m-no').onclick = closeModal; });
    else go();
  };
  renderTab();
  show('hub');
}
$$('#tabs .tab').forEach(b => b.onclick = () => { S.tab = b.dataset.tab; $$('#tabs .tab').forEach(x => x.classList.toggle('on', x === b)); renderTab(); });

function renderTab() {
  const c = S.career, p = $('#pane');
  const tab = S.tab;
  if (tab === 'team') {
    const r = teamRatings(c);
    p.innerHTML = `<div class="row small" style="margin-bottom:8px"><div>OFFENSE ${starHtml(r.off / 2)}</div><div>DEFENSE ${starHtml(r.def / 2)}</div><div class="dim">PAYROLL $${payroll(c).toFixed(1)}M / $${SALARY_CAP}M</div></div>
      ${SLOTS.map(s => {
        const pl = c.roster[s];
        return `<div class="player" data-slot="${s}"><div class="pos">${s}</div>
          <div class="nm">${esc(pl.name)}${pl.inj ? `<span class="tag">INJ ${pl.inj}W</span>` : ''}${pl.pts ? `<span class="tag g">+${pl.pts}</span>` : ''}${pl.years <= 1 ? '<span class="tag y">FINAL YR</span>' : ''}
          <small>#${pl.num} · AGE ${pl.age} · $${pl.sal}M × ${pl.years}Y</small><div class="bar"><i style="width:${pl.xp}%"></i></div></div>
          <div>${starHtml(stars(pl))}</div></div>`;
      }).join('')}
      <p class="small dim" style="margin-top:12px">Tap a player to train him. Green tags are level-ups: free upgrades. Otherwise training costs coach credits.</p>
      <button class="btn alt" id="btn-fa">FREE AGENTS</button>`;
    p.querySelectorAll('.player').forEach(el => el.onclick = () => openPlayer(el.dataset.slot));
    $('#btn-fa').onclick = openFreeAgents;
  } else if (tab === 'fac') {
    p.innerHTML = Object.entries(FACILITIES).map(([k, f]) => {
      const lvl = c.facilities[k];
      return `<div class="player" style="cursor:default"><div class="nm">${esc(f.name.toUpperCase())} <span class="gold">LV ${lvl}</span><small>${esc(f.what)}</small>
        <div class="bar"><i style="width:${lvl * 20}%;background:var(--gold)"></i></div></div>
        <button class="btn small" data-fac="${k}" ${lvl >= 5 ? 'disabled' : ''}>${lvl >= 5 ? 'MAX' : `UPGRADE ${facilityCost(lvl)} CC`}</button></div>`;
    }).join('') + `<p class="small dim" style="margin-top:12px">You have ${c.cc} coach credits. Win games to earn more.</p>`;
    p.querySelectorAll('[data-fac]').forEach(b => b.onclick = () => {
      const r = upgradeFacility(c, b.dataset.fac);
      if (!r.ok) return toast(r.error);
      sfx.click(); save(); openHub();
    });
  } else if (tab === 'table') {
    const st = standings(c);
    p.innerHTML = st.map((conf, ci) => `<h3>${CONFS[ci].toUpperCase()} CONFERENCE</h3>` + conf.map((div, di) => `
      <table style="margin-bottom:12px"><tr><th>${DIVS[di].toUpperCase()}</th><th class="num">W</th><th class="num">L</th><th class="num">T</th><th class="num">PF</th><th class="num">PA</th></tr>
      ${div.map(id => { const t = c.teams[id]; return `<tr class="${id === c.teamId ? 'me' : ''}"><td>${esc(teamById(id).city)}</td><td class="num">${t.w}</td><td class="num">${t.l}</td><td class="num">${t.t}</td><td class="num">${t.pf}</td><td class="num">${t.pa}</td></tr>`; }).join('')}
      </table>`).join('')).join('') + playoffHtml(c);
  } else if (tab === 'sched') {
    const rows = c.schedule.map((wk, i) => {
      const g = wk.find(x => x.includes(c.teamId));
      const home = g[0] === c.teamId, opp = home ? g[1] : g[0];
      const res = c.results[i] && c.results[i].find(x => x[0] === c.teamId || x[1] === c.teamId);
      let out = '';
      if (res) { const us = home ? res[2] : res[3], them = home ? res[3] : res[2]; out = `<span class="${us > them ? 'ok' : us < them ? 'gold' : ''}">${us > them ? 'W' : us < them ? 'L' : 'T'} ${us}-${them}</span>`; }
      return `<tr class="${i === c.week && c.phase === 'regular' ? 'me' : ''}"><td>WK ${i + 1}</td><td>${home ? 'vs' : '@'} ${esc(teamById(opp).city)}</td><td class="num">${out}</td></tr>`;
    }).join('');
    p.innerHTML = `<table><tr><th>WEEK</th><th>OPPONENT</th><th class="num">RESULT</th></tr>${rows}</table>` +
      (c.history.length ? `<h3 style="margin-top:16px">PAST SEASONS</h3><table>${c.history.map(h => `<tr><td>${h.year}</td><td>${h.w}-${h.l}${h.t ? '-' + h.t : ''}</td><td>${esc(h.finish)}</td></tr>`).join('')}</table>` : '');
  } else if (tab === 'news') {
    p.innerHTML = `<div class="news">${c.news.map(n => `<p><span class="dim">S${n.s} W${n.w + 1}</span> ${esc(n.text)}</p>`).join('')}</div>`;
  } else if (tab === 'lb') {
    p.innerHTML = '<p class="dim small">Loading the world leaderboard…</p>';
    api('/api/leaderboard').then(r => {
      if (S.tab !== 'lb') return;
      const me = r.me;
      p.innerHTML = `<p class="small dim">Every coach on Open Arcade. Ranked by Retro Bowl titles, then wins, then points scored. ${r.players} coaches so far.</p>
        <table><tr><th>#</th><th>COACH</th><th>TEAM</th><th class="num">🏆</th><th class="num">W-L</th><th class="num">PTS</th></tr>
        ${r.top.map(x => `<tr class="${me && x.name === me.username ? 'me' : ''}"><td>${x.rank}</td><td>${esc(x.name)}</td><td>${esc(x.team)}</td><td class="num">${x.titles}</td><td class="num">${x.wins}-${x.losses}${x.ties ? '-' + x.ties : ''}</td><td class="num">${x.pf}</td></tr>`).join('') || '<tr><td colspan="6" class="dim">No games yet. Be the first!</td></tr>'}
        </table>
        ${me ? `<p class="small" style="margin-top:12px">YOU: ${me.rank ? '#' + me.rank : 'unranked'} · ${me.titles} titles · ${me.wins}-${me.losses}${me.ties ? '-' + me.ties : ''} · ${me.pf} pts</p>` : ''}`;
    }).catch(e => { p.innerHTML = `<p class="err">${esc(e.message)}</p>`; });
  } else if (tab === 'more') {
    p.innerHTML = `<h3>SETTINGS</h3>
      <div class="row"><label style="margin:0">QUARTER LENGTH</label>
      <select id="set-q" style="background:#000;color:#fff;border:2px solid var(--line);padding:8px">${[2, 3, 4, 5, 6, 8].map(n => `<option value="${n}" ${c.settings.quarter === n ? 'selected' : ''}>${n} MIN</option>`).join('')}</select></div>
      <p></p>
      <button class="btn alt" id="set-sound">SOUND: ${c.settings.sound ? 'ON' : 'OFF'}</button>
      <button class="btn alt" id="set-assist">AIM ASSIST: ${c.settings.aimAssist ? 'ON' : 'OFF'}</button>
      <h3 style="margin-top:16px">HOW TO PLAY</h3>
      <p class="small">You call the offense. Tap to snap. To pass, drag back from anywhere and let go: the dotted line shows where the ball will land, so lead your receiver. To run, tap your running back (or press H) as he passes the quarterback. With the ball, hold your finger where you want to go and the runner steers toward it; tap to dive. Drag forward instead to scramble with the QB. Your defense plays itself; good defenders make it more likely the other team comes up empty.</p>
      <p class="small">Keyboard: Space snaps and dives, arrows steer, 1-4 throw to WR1, WR2, TE and RB, H hands off, T calls a timeout.</p>
      <h3 style="margin-top:16px">ACCOUNT</h3>
      <p class="small">Signed in as <span class="gold">${esc(S.user.username)}</span>. Your career saves to your account, so it follows you to any device.</p>
      <button class="btn alt" id="btn-chpin">CHANGE PIN</button>
      <button class="btn alt" id="btn-out">SWITCH COACH</button>
      <button class="btn red" id="btn-reset">NEW CAREER</button>`;
    $('#set-q').onchange = e => { c.settings.quarter = +e.target.value; save(); };
    $('#set-sound').onclick = () => { c.settings.sound = !c.settings.sound; applySettings(); save(); renderTab(); };
    $('#set-assist').onclick = () => { c.settings.aimAssist = !c.settings.aimAssist; save(); renderTab(); };
    $('#btn-out').onclick = () => signOut(false);
    $('#btn-chpin').onclick = () => modal(`<h3>CHANGE PIN</h3><label>CURRENT PIN</label><input id="m-old" class="pin" type="password" inputmode="numeric" maxlength="8">
      <label>NEW PIN</label><input id="m-new" class="pin" type="password" inputmode="numeric" maxlength="8"><div class="err" id="m-err"></div>
      <button class="btn" id="m-ok">SAVE</button><button class="btn alt" id="m-x">CANCEL</button>`, b => {
      b.querySelector('#m-x').onclick = closeModal;
      b.querySelector('#m-ok').onclick = async () => {
        try { await api('/api/auth/pin', { old: b.querySelector('#m-old').value, pin: b.querySelector('#m-new').value }); closeModal(); toast('PIN changed.'); }
        catch (e) { b.querySelector('#m-err').textContent = e.message; }
      };
    });
    $('#btn-reset').onclick = () => modal(`<h3>START A NEW CAREER?</h3><p class="small">Your current franchise will be gone for good. Your leaderboard record stays.</p>
      <button class="btn red" id="m-y">YES, START OVER</button><button class="btn alt" id="m-n">KEEP MY TEAM</button>`, b => {
      b.querySelector('#m-n').onclick = closeModal;
      b.querySelector('#m-y').onclick = () => { closeModal(); S.career = null; openPick(); };
    });
  }
}

function playoffHtml(c) {
  const P = c.playoffs;
  if (!P) return '';
  return `<h3>PLAYOFFS</h3>` + P.games.map((games, i) => games.length ? `<div class="small" style="margin:8px 0"><span class="dim">${ROUNDS[i].toUpperCase()}</span><br>${games.map(g =>
    `${g.winner === g.home ? '<b class="gold">' : ''}${esc(teamById(g.home).city)} ${g.hs}${g.winner === g.home ? '</b>' : ''} - ${g.winner === g.away ? '<b class="gold">' : ''}${g.as} ${esc(teamById(g.away).city)}${g.winner === g.away ? '</b>' : ''}`).join('<br>')}</div>` : '').join('') +
    (P.champion ? `<p class="gold">CHAMPIONS: ${esc(teamById(P.champion).city.toUpperCase())}</p>` : '');
}

function openPlayer(slot) {
  const c = S.career, p = c.roster[slot];
  const d = POS[p.pos];
  const cost = trainCost(p);
  const st = p.stats || {};
  const line = { QB: `${st.py || 0} PASS YDS · ${st.ptd || 0} TD · ${st.int || 0} INT`, RB: `${st.ry || 0} RUSH YDS · ${st.rtd || 0} TD`, WR: `${st.rec || 0} REC · ${st.cy || 0} YDS · ${st.ctd || 0} TD`,
    TE: `${st.rec || 0} REC · ${st.cy || 0} YDS · ${st.ctd || 0} TD`, K: `${st.fg || 0} FG` }[p.pos] || `${st.g || 0} GAMES`;
  modal(`<h3>${esc(slot)} · ${esc(d.name.toUpperCase())}</h3><h2>${esc(p.name)} <span class="dim">#${p.num}</span></h2>
    <div class="small">${starHtml(stars(p))} · AGE ${p.age} · $${p.sal}M × ${p.years}Y · MORALE ${p.morale}%</div>
    <div class="small dim" style="margin:6px 0 10px">THIS SEASON: ${line}</div>
    ${d.attrs.map(a => `<div class="row small" style="margin:8px 0"><div style="flex:0 0 110px">${esc(ATTR_NAMES[a].toUpperCase())}</div>
      <div style="flex:1"><div class="bar" style="height:12px"><i style="width:${p.a[a] * 10}%;background:var(--gold)"></i></div></div>
      <div style="flex:0 0 30px" class="num">${p.a[a]}</div>
      <button class="btn small" data-a="${a}" ${p.a[a] >= 10 ? 'disabled' : ''}>${p.pts ? 'FREE +1' : `+1 (${cost} CC)`}</button></div>`).join('')}
    <p class="small dim">${p.pts ? `${p.pts} level-up point${p.pts > 1 ? 's' : ''} to spend.` : `XP ${p.xp}/100 to the next level-up.`} You have ${c.cc} CC.</p>
    <button class="btn alt" id="m-close">CLOSE</button>`, b => {
    b.querySelector('#m-close').onclick = () => { closeModal(); openHub(); };
    b.querySelectorAll('[data-a]').forEach(x => x.onclick = () => {
      const r = trainPlayer(c, slot, x.dataset.a);
      if (!r.ok) return toast(r.error);
      sfx.click(); save(); openPlayer(slot);
    });
  });
}

function openFreeAgents() {
  const c = S.career;
  const list = freeAgents(c);
  modal(`<h3>FREE AGENTS</h3><p class="small dim">Signing costs coach credits and takes the place of your current player at that position. Cap room: $${capRoom(c).toFixed(1)}M · ${c.cc} CC</p>
    ${list.map((p, i) => `<div class="player" style="cursor:default"><div class="pos">${p.pos}</div><div class="nm">${esc(p.name)}<small>AGE ${p.age} · $${p.sal}M × ${p.years}Y</small></div>
      <div>${starHtml(stars(p))}</div><button class="btn small" data-i="${i}">${p.cost} CC</button></div>`).join('') || '<p class="dim small">Nobody available this week.</p>'}
    <button class="btn alt" id="m-close">CLOSE</button>`, b => {
    b.querySelector('#m-close').onclick = closeModal;
    b.querySelectorAll('[data-i]').forEach(x => x.onclick = () => {
      const fa = list[+x.dataset.i];
      const slots = SLOTS.filter(s => slotPos(s) === fa.pos);
      const doSign = slot => { const r = signFreeAgent(c, fa, slot); if (!r.ok) return toast(r.error); sfx.click(); save(); closeModal(); openHub(); toast(`Signed ${fa.name}!`); };
      if (slots.length === 1) doSign(slots[0]);
      else modal(`<h3>REPLACE WHO?</h3>${slots.map(s => `<button class="btn" data-s="${s}">${s}: ${esc(c.roster[s].name)} (${stars(c.roster[s])}★)</button>`).join('')}<button class="btn alt" id="m-x">CANCEL</button>`,
        bb => { bb.querySelector('#m-x').onclick = openFreeAgents; bb.querySelectorAll('[data-s]').forEach(y => y.onclick = () => doSign(y.dataset.s)); });
    });
  });
}

function openDraft() {
  const c = S.career, d = c.draft;
  if (!d) return;
  const left = d.picks - d.taken.length;
  modal(`<h3>THE DRAFT</h3><p class="small dim">${left} pick${left === 1 ? '' : 's'} left. Rookies are cheap, young and get better fast. Drafting replaces your current starter at that position.</p>
    ${d.pool.map((p, i) => `<div class="player" style="cursor:default"><div class="pos">${p.pos}</div><div class="nm">${esc(p.name)}<small>AGE ${p.age} · $${p.sal}M × 4Y · ${POS[p.pos].attrs.map(a => `${ATTR_NAMES[a].slice(0, 3).toUpperCase()} ${p.a[a]}`).join(' ')}</small></div>
      <div>${starHtml(stars(p))}</div><button class="btn small" data-i="${i}" ${left ? '' : 'disabled'}>PICK</button></div>`).join('')}
    <button class="btn alt" id="m-close">DONE</button>`, b => {
    b.querySelector('#m-close').onclick = () => { closeModal(); openHub(); };
    b.querySelectorAll('[data-i]').forEach(x => x.onclick = () => {
      const p = d.pool[+x.dataset.i];
      const slots = SLOTS.filter(s => slotPos(s) === p.pos);
      const pick = slot => { const r = draftPick(c, p.id, slot); if (!r.ok) return toast(r.error); sfx.click(); save(); openDraft(); };
      if (slots.length === 1) pick(slots[0]);
      else modal(`<h3>REPLACE WHO?</h3>${slots.map(s => `<button class="btn" data-s="${s}">${s}: ${esc(c.roster[s].name)} (${stars(c.roster[s])}★)</button>`).join('')}<button class="btn alt" id="m-x">CANCEL</button>`,
        bb => { bb.querySelector('#m-x').onclick = openDraft; bb.querySelectorAll('[data-s]').forEach(y => y.onclick = () => pick(y.dataset.s)); });
    });
  });
}

function openContracts() {
  const c = S.career;
  const ex = c.expiring || [];
  modal(`<h3>EXPIRING CONTRACTS</h3><p class="small dim">Cap room: $${capRoom(c).toFixed(1)}M. Players you don't re-sign leave when the new season starts.</p>
    ${ex.map(e => { const p = c.roster[e.slot]; return `<div class="player" style="cursor:default"><div class="pos">${e.slot}</div><div class="nm">${esc(p.name)}<small>AGE ${p.age} · NOW $${p.sal}M · ASKS $${e.ask}M</small></div>
      <div>${starHtml(stars(p))}</div><button class="btn small" data-s="${e.slot}">RE-SIGN</button></div>`; }).join('') || '<p class="small">Everyone is under contract.</p>'}
    <button class="btn alt" id="m-close">DONE</button>`, b => {
    b.querySelector('#m-close').onclick = () => { closeModal(); openHub(); };
    b.querySelectorAll('[data-s]').forEach(x => x.onclick = () => { const r = resign(c, x.dataset.s); if (!r.ok) return toast(r.error); sfx.click(); save(); openContracts(); });
  });
}

function applySettings() { if (S.career) setSound(S.career.settings.sound); }

// ---------------------------------------------------------------- the match
const cv = $('#cv');
const R = new Renderer(cv);
let M = null, matchMeta = null, raf = 0, last = 0, paused = false;
const ui = { hints: true, touch, kickAim: null };

// The canvas fills the screen (16:9) and its backing store is the real device pixels, so nothing gets
// stretched by the browser: the renderer scales the pixel art itself and draws text at full resolution.
function layout() {
  const vw = window.innerWidth, vh = window.innerHeight, dpr = Math.min(window.devicePixelRatio || 1, 3);
  R.setAspect(vw / vh);
  const s = Math.min(vw / W, vh / H);
  const pw = Math.round(W * s * dpr), ph = Math.round(H * s * dpr);
  cv.style.width = `${pw / dpr}px`; cv.style.height = `${ph / dpr}px`;
  cv.style.left = `${(vw - W * s) / 2}px`; cv.style.top = `${(vh - H * s) / 2}px`;
  R.resize(pw, ph);
  if (M) R.draw(M, 0, ui);
  const g = $('#gbtns');
  g.style.right = `${Math.max(6, (vw - W * s) / 2 + 6)}px`; g.style.bottom = `${Math.max(6, (vh - H * s) / 2 + 6)}px`;
}
window.addEventListener('resize', layout);

async function startMatch() {
  const c = S.career;
  const g = userGame(c);
  if (!g) return;
  await flushSave();
  let token = null;
  try { token = (await api('/api/match/start', {})).token; } catch (e) { toast(`Playing offline: ${e.message}`); }
  const roster = {};
  for (const s of SLOTS) roster[s] = active(c, s);
  const r = teamRatings(c);
  const opp = c.teams[g.opp];
  M = new Match({ us: teamById(c.teamId), them: teamById(g.opp), roster, oppRating: { off: opp.off, def: opp.def }, ourDef: r.def,
    quarter: c.settings.quarter || 4, playoff: g.kind !== 'season', facilities: c.facilities });
  M.aimAssist = c.settings.aimAssist;
  matchMeta = { token, kind: g.kind, game: g, started: Date.now(), plays: 0 };
  ui.hints = (c.playsRun || 0) < 25;
  M.coinToss();
  paused = false;
  $$('.choice').forEach(x => x.classList.remove('on'));
  show('game');
  layout();
  last = performance.now(); acc = 0;
  cancelAnimationFrame(raf);
  raf = requestAnimationFrame(frame);
}

// Locked to 60 steps a second like the original (a GameMaker room speed of 60): the game moves in fixed
// 1/60 s steps and a frame is drawn only after a step, so 120/144 Hz screens don't run it any faster or smoother.
const STEP = 1 / 60;
let acc = 0, lastStage = '';
function frame(now) {
  raf = requestAnimationFrame(frame);
  acc = Math.min(acc + (now - last) / 1000, 0.1);
  last = now;
  if (!M) return;
  let steps = 0;
  while (acc >= STEP - 0.0005) {
    acc -= STEP; steps++;
    if (!paused) { stepKeys(STEP); M.update(STEP); }
  }
  if (!steps) return;
  if (!paused) drainEvents();
  R.draw(M, paused ? 0 : STEP * steps, ui);
  if (M.stage !== lastStage) onStage(M.stage, lastStage);
  lastStage = M.stage;
}

function drainEvents() {
  const P = M.play;
  if (!P || !P.events.length) return;
  for (const e of P.events.splice(0)) {
    if (e.type === 'throw') sfx.throw();
    else if (e.type === 'catch') sfx.catch();
    else if (e.type === 'handoff') sfx.snap();
    else if (e.type === 'tackle' || e.type === 'sack') { sfx.tackle(); R.shake = 0.2; }
    else if (e.type === 'td') { sfx.cheer(); R.burst(); }
    else if (e.type === 'int' || e.type === 'fumble' || e.type === 'incomplete') sfx.bad();
    else if (e.type === 'break') { sfx.snap(); }
  }
}

function onStage(stage) {
  $('#ch-fourth').classList.toggle('on', stage === 'fourth');
  $('#ch-pat').classList.toggle('on', stage === 'pat');
  if (stage === 'fourth') {
    const fg = M.fgDistance();
    $('#fourth-info').textContent = `4th & ${M.fd >= 100 ? 'goal' : Math.max(1, Math.round(M.toGo))} on the ${M.los >= 50 ? 'opp ' + Math.round(100 - M.los) : 'own ' + Math.round(M.los)}. Field goal would be ${fg} yards (your kicker's max is about ${Math.round(46 + M.roster.K.a.pow * 2.6)}).`;
    $('#btn-fg').disabled = !M.canKickFG();
  }
  if (stage === 'kick') sfx.whistle();
  if (stage === 'final') endMatch();
}

$$('#ch-fourth [data-c]').forEach(b => b.onclick = () => { $('#ch-fourth').classList.remove('on'); M.fourthChoice(b.dataset.c); });
$$('#ch-pat [data-c]').forEach(b => b.onclick = () => { $('#ch-pat').classList.remove('on'); M.patChoice(b.dataset.c); });
$('#btn-to').onclick = e => { e.stopPropagation(); if (M && M.timeout()) toast('Timeout called. Clock stopped.'); else toast('Timeouts stop a running clock before the snap.'); };
$('#btn-pause').onclick = e => { e.stopPropagation(); pause(true); };
$('#btn-resume').onclick = () => pause(false);
$('#btn-sound').onclick = () => { const c = S.career; c.settings.sound = !c.settings.sound; applySettings(); $('#btn-sound').textContent = `SOUND: ${c.settings.sound ? 'ON' : 'OFF'}`; save(); };
$('#btn-quit').onclick = () => {
  // a forfeit counts as a loss so the board can't be gamed by quitting losing games
  M.score.us = Math.min(M.score.us, M.score.them > 0 ? M.score.them - 1 : 0);
  if (M.score.them <= M.score.us) M.score.them = M.score.us + 1;
  M.forfeit = true;
  pause(false);
  M.stage = 'final';
};
function pause(on) {
  paused = on;
  $('#ch-pause').classList.toggle('on', on);
  $('#btn-sound').textContent = `SOUND: ${S.career.settings.sound ? 'ON' : 'OFF'}`;
}
document.addEventListener('visibilitychange', () => { if (document.hidden && M && M.stage !== 'final' && $('#game').classList.contains('on')) pause(true); });

async function endMatch() {
  cancelAnimationFrame(raf);
  const m = M, c = S.career;
  const us = m.score.us, them = m.score.them;
  c.playsRun = (c.playsRun || 0) + 1;
  const report = finishUserGame(c, us, them, m.stats);
  save();
  if (matchMeta.token) {
    api('/api/match/finish', { token: matchMeta.token, us, them, kind: matchMeta.kind })
      .then(r => { if (r && r.counted === false && r.reason) toast('This match was too quick to count on the leaderboard.'); })
      .catch(e => toast(`Leaderboard: ${e.message}`));
  }
  const won = us > them;
  if (won) { sfx.cheer(); R.burst(); } else sfx.bad();
  $('#final-title').textContent = m.forfeit ? 'FORFEIT' : won ? (matchMeta.kind === 'final' ? 'RETRO BOWL CHAMPIONS!' : 'VICTORY') : us === them ? 'TIE GAME' : 'DEFEAT';
  $('#final-score').innerHTML = `<span style="color:${m.us.c1 === '#1b1b1b' ? '#fff' : '#fff'}">${esc(m.us.id)} ${us}</span> <span class="dim">-</span> ${them} ${esc(m.them.id)}`;
  const top = Object.entries(m.stats).map(([id, s]) => {
    const p = Object.values(c.roster).find(x => String(x.id) === id);
    if (!p) return '';
    const bits = [];
    if (s.py) bits.push(`${s.cmp || 0}/${s.att || 0}, ${s.py} pass yds`);
    if (s.ptd) bits.push(`${s.ptd} TD`);
    if (s.int) bits.push(`${s.int} INT`);
    if (s.ry) bits.push(`${s.ry} rush yds`);
    if (s.rtd) bits.push(`${s.rtd} rush TD`);
    if (s.rec) bits.push(`${s.rec} rec, ${s.cy} yds`);
    if (s.ctd) bits.push(`${s.ctd} TD`);
    if (s.fg) bits.push(`${s.fg} FG`);
    return bits.length ? `<div>${esc(p.pos)} ${esc(p.name)}: ${bits.join(', ')}</div>` : '';
  }).join('');
  $('#final-body').innerHTML = `${top ? `<div class="dim" style="margin-bottom:8px">${top}</div>` : ''}
    ${report ? `<div class="gold">+${report.cc} COACH CREDITS</div>` : ''}
    ${report && report.levelUps.length ? `<div class="ok">LEVEL UP: ${esc([...new Set(report.levelUps)].join(', '))}</div>` : ''}
    ${report && report.injuries.length ? `<div style="color:var(--red)">INJURED: ${esc(report.injuries.join(', '))}</div>` : ''}`;
  $('#ch-final').classList.add('on');
  // keep drawing (confetti) under the panel
  let t0 = performance.now();
  const loop = now => {
    if (!$('#ch-final').classList.contains('on')) return;
    raf = requestAnimationFrame(loop);
    if (now - t0 < 1000 / 60 - 0.5) return;
    t0 = now; R.draw(M, 1 / 60, ui);
  };
  raf = requestAnimationFrame(loop);
}
$('#btn-final').onclick = async () => {
  $('#ch-final').classList.remove('on');
  cancelAnimationFrame(raf);
  M = null;
  await flushSave();
  openHub();
  const c = S.career;
  if (c.phase === 'offseason' && c.history[0]) {
    const h = c.history[0];
    modal(`<h3>SEASON ${h.year} IS OVER</h3><h2>${esc(h.finish.toUpperCase())}</h2><p class="small">${h.w}-${h.l}${h.t ? '-' + h.t : ''} · ${h.pf} points for, ${h.pa} against.</p>
      <p class="small dim">Time for the offseason: draft rookies, re-sign your stars, then kick off next season.</p><button class="btn" id="m-ok">OK</button>`,
    b => b.querySelector('#m-ok').onclick = closeModal);
  }
};

// ---------------------------------------------------------------- match input
function canvasPoint(e) {
  const r = cv.getBoundingClientRect();
  return { x: (e.clientX - r.left) / r.width * W, y: (e.clientY - r.top) / r.height * H };
}
// drag distances in the units the controls were tuned in (640 px wide)
function dragOf(pt, gesture) {
  return { dx: (pt.x - gesture.sx) / UI_SCALE, dy: (pt.y - gesture.sy) / UI_SCALE };
}
let gesture = null;
cv.addEventListener('pointerdown', e => {
  if (!M || paused) return;
  e.preventDefault();
  cv.setPointerCapture(e.pointerId);
  const pt = canvasPoint(e);
  const P = M.play;
  if (M.stage === 'presnap') { M.snap(); sfx.snap(); matchMeta.plays++; gesture = { mode: 'none' }; return; }
  if (M.stage === 'opp') { M.oppT = M.oppDone; return; }
  if (M.stage === 'opp-wait') { M.oppContinue(); return; }
  if (M.stage === 'banner' || M.stage === 'result') { M.bannerT = Math.min(M.bannerT, 0.12); return; }
  if (M.stage === 'kick' && M.kick && M.kick.phase === 'aim') {
    gesture = { mode: 'kick', sx: pt.x, sy: pt.y };
    ui.kickAim = { active: true, aim: 0, power: 0 };
    return;
  }
  if (M.stage !== 'live' || !P) return;
  if (P.carrier) {
    gesture = { mode: 'steer', sx: pt.x, sy: pt.y, t: performance.now(), moved: false };
    return;
  }
  // tap on the running back to hand off
  const f = R.toField(pt.x, pt.y);
  if (P.handoffOpen && Math.hypot((f.x - P.rb.x) * PX_PER_YARD.x, (f.y - P.rb.y) * PX_PER_YARD.y) < 26 && handoff(M)) { gesture = { mode: 'none' }; return; }
  gesture = { mode: null, sx: pt.x, sy: pt.y, qx: P.qb.x, qy: P.qb.y };
});
cv.addEventListener('pointermove', e => {
  if (!gesture || !M) return;
  const pt = canvasPoint(e);
  const P = M.play;
  const { dx, dy } = dragOf(pt, gesture);
  if (gesture.mode === 'kick') {
    const up = Math.max(0, -dy);
    ui.kickAim = { active: true, power: up / 190, aim: up > 4 ? dx / up * 0.3 : 0 };
    return;
  }
  if (!P || M.stage !== 'live') return;
  if (gesture.mode === 'steer') {
    if (Math.hypot(dx, dy) > 8) gesture.moved = true;
    if (gesture.moved && P.carrier) P.intent.ty = R.toField(pt.x, pt.y).y;
    return;
  }
  if (P.carrier || P.thrown) return;
  if (gesture.mode === null && Math.hypot(dx, dy) > 9) gesture.mode = dx > 0 && dx > Math.abs(dy) * 0.9 ? 'scramble' : 'aim';
  if (gesture.mode === 'aim') {
    // slingshot: pull back, the ball goes the other way
    const k = 2.3;
    setAim(M, P.qb.x - dx / PX_PER_YARD.x * k, P.qb.y - dy / (PX_PER_YARD.y / UI_SCALE) * k);
  } else if (gesture.mode === 'scramble') {
    P.scramble = true;
    P.intent.tx = P.qb.x + dx / PX_PER_YARD.x * 0.4 + 1;
    P.intent.ty = P.qb.y + dy / (PX_PER_YARD.y / UI_SCALE) * 0.6;
  }
});
function pointerEnd(e) {
  if (!gesture || !M) { gesture = null; return; }
  const P = M.play;
  if (gesture.mode === 'kick') {
    const a = ui.kickAim;
    if (a && a.power > 0.08) { M.kickRelease(a.aim, a.power); sfx.kick(); }
    ui.kickAim = null;
  } else if (gesture.mode === 'aim' && P && P.aim) {
    if (e.type === 'pointercancel') P.aim = null; else throwBall(M);
  } else if (gesture.mode === 'steer' && P) {
    if (!gesture.moved && performance.now() - gesture.t < 260) dive(M);
    P.intent.ty = null;
  } else if (gesture.mode === 'scramble' && P) {
    P.scramble = false; P.intent.tx = null;
    if (!P.carrier) P.intent.ty = null;
  }
  gesture = null;
}
cv.addEventListener('pointerup', pointerEnd);
cv.addEventListener('pointercancel', pointerEnd);
cv.addEventListener('contextmenu', e => e.preventDefault());

const keys = new Set();
let spaceHeld = 0;
window.addEventListener('keydown', e => {
  if (!M || !$('#game').classList.contains('on')) return;
  if (e.repeat && e.code !== 'Space') return;
  keys.add(e.code);
  const P = M.play;
  if (e.code === 'Escape' || e.code === 'KeyP') { pause(!paused); return; }
  if (paused) return;
  if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.code)) e.preventDefault();
  if (e.code === 'KeyT') { $('#btn-to').click(); return; }
  if (e.code === 'Space' || e.code === 'Enter') {
    if (e.repeat) return;
    if (M.stage === 'presnap') { M.snap(); sfx.snap(); return; }
    if (M.stage === 'opp') { M.oppT = M.oppDone; return; }
    if (M.stage === 'opp-wait') { M.oppContinue(); return; }
    if (M.stage === 'banner' || M.stage === 'result') { M.bannerT = Math.min(M.bannerT, 0.12); return; }
    if (M.stage === 'kick' && M.kick && M.kick.phase === 'aim') { spaceHeld = performance.now(); ui.kickAim = { active: true, aim: (ui.kickAim && ui.kickAim.aim) || 0, power: 0, key: true }; return; }
    if (M.stage === 'live' && P && P.carrier) dive(M);
    return;
  }
  if (M.stage === 'live' && P && !P.carrier && !P.thrown) {
    if (e.code === 'KeyH') handoff(M);
    const map = { Digit1: 'WR1', Digit2: 'WR2', Digit3: 'TE', Digit4: 'RB' };
    if (map[e.code]) throwTo(map[e.code]);
  }
});
window.addEventListener('keyup', e => {
  keys.delete(e.code);
  if (e.code === 'Space' && M && M.stage === 'kick' && ui.kickAim && ui.kickAim.key) {
    M.kickRelease(ui.kickAim.aim, ui.kickAim.power); sfx.kick(); ui.kickAim = null;
  }
});
function throwTo(slot) {
  const P = M.play;
  const role = { WR1: 0, WR2: 1, TE: 'TE', RB: 'RB' }[slot];
  const wrs = P.o.filter(o => o.role === 'WR');
  const r = role === 'TE' ? P.o.find(o => o.role === 'TE') : role === 'RB' ? P.rb : wrs[role];
  if (!r) return;
  const d = Math.hypot(r.x - P.qb.x, r.y - P.qb.y);
  const T = flightTime(P.qb.p, d);
  const lead = Math.min(1.2, T);
  setAim(M, r.x + r.vx * lead, r.y + r.vy * lead);
  throwBall(M);
}
function stepKeys(dt) {
  if (!M) return;
  const P = M.play;
  const up = keys.has('ArrowUp') || keys.has('KeyW'), dn = keys.has('ArrowDown') || keys.has('KeyS');
  const lf = keys.has('ArrowLeft') || keys.has('KeyA'), rt = keys.has('ArrowRight') || keys.has('KeyD');
  if (M.stage === 'kick' && ui.kickAim && ui.kickAim.key) {
    const t = (performance.now() - spaceHeld) / 1000;
    const ph = (t % 1.6) / 0.8;                       // the meter sweeps up and back down
    ui.kickAim.power = 1.05 * (ph <= 1 ? ph : 2 - ph);
    if (lf) ui.kickAim.aim -= dt * 0.12;
    if (rt) ui.kickAim.aim += dt * 0.12;
    return;
  }
  if (M.stage === 'kick' && M.kick && M.kick.phase === 'aim' && (lf || rt)) {
    ui.kickAim = ui.kickAim || { active: true, aim: 0, power: 0, key: true };
    ui.kickAim.aim += (rt ? 1 : -1) * dt * 0.12;
  }
  if (!P || M.stage !== 'live') return;
  if (P.carrier) {
    if (up || dn) P.intent.vy = up ? -1 : 1;
    else if (!gesture) P.intent.vy = 0;
    P.intent.slow = lf;
  } else if (!P.thrown) {
    P.intent.kx = rt ? 1 : lf ? -1 : 0;
    P.intent.ky = up ? -1 : dn ? 1 : 0;
  }
}

// ---------------------------------------------------------------- boot
(async function boot() {
  try {
    const r = await api('/api/session');
    S.accounts = r.accounts || [];
    renderRemembered();
    if (r.user) return signedIn(r.user);
  } catch (e) { toast(e.message); }
  authStep('auth-name');
  show('auth');
})();

// keep the career fresh if it's open in two tabs
window.addEventListener('focus', async () => {
  if (!S.user || !S.career || M) return;
  const r = await api('/api/save').catch(() => null);
  if (r && r.rev > S.rev && r.save) { S.career = r.save; S.rev = r.rev; openHub(); }
});
void fmtClock; void SEASON_WEEKS; void rating;
if (/[?&]debug\b/.test(location.search)) window.__rb = { get M() { return M; }, S, R };
