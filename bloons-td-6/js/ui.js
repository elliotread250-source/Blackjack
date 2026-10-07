'use strict';
// Menus, input, HUD and the game loop.
(function () {
  const $ = (id) => document.getElementById(id);
  const R = BTD.R;
  const A = BTD.audio;

  // ---------- storage ----------
  const store = {
    get(k, d) { try { const v = localStorage.getItem('btd6r:' + k); return v == null ? d : JSON.parse(v); } catch (e) { return d; } },
    set(k, v) { try { localStorage.setItem('btd6r:' + k, JSON.stringify(v)); } catch (e) { /* storage off */ } },
    del(k) { try { localStorage.removeItem('btd6r:' + k); } catch (e) { /* storage off */ } },
  };
  const settings = Object.assign({ vol: 0.5, auto: false, hero: 'quincy' }, store.get('settings', {}));
  const saveSettings = () => store.set('settings', settings);
  A.setVolume(settings.vol);
  const medals = store.get('medals', {});
  const stats = Object.assign({ pops: 0, wins: 0, games: 0, best: {} }, store.get('stats', {}));
  const saveKey = (m, d, mo) => `save:${m}:${d}:${mo}`;

  // ---------- screens ----------
  function show(id) {
    document.querySelectorAll('.screen').forEach((s) => s.classList.toggle('on', s.id === id));
    $('game').classList.toggle('on', id === 'game');
    if (id !== 'game') { running = false; }
  }
  document.querySelectorAll('[data-back]').forEach((b) => b.addEventListener('click', () => { A.unlock(); show(b.dataset.back); if (b.dataset.back === 'maps') buildMaps(); }));
  document.addEventListener('pointerdown', () => A.unlock(), { once: false });

  // ---------- main menu bloons ----------
  const mb = $('menuBloons'), mbx = mb.getContext('2d');
  const floaters = [];
  const ftypes = ['red', 'blue', 'green', 'yellow', 'pink', 'black', 'white', 'purple', 'zebra', 'rainbow', 'lead', 'ceramic'];
  function menuAnim(dt) {
    const w = mb.clientWidth, h = mb.clientHeight, d = Math.min(2, devicePixelRatio || 1);
    if (mb.width !== w * d) { mb.width = w * d; mb.height = h * d; }
    mbx.setTransform(d, 0, 0, d, 0, 0);
    mbx.clearRect(0, 0, w, h);
    if (floaters.length < 26 && Math.random() < 0.05) floaters.push({ t: ftypes[(Math.random() * ftypes.length) | 0], x: Math.random() * w, y: h + 40, s: 1.4 + Math.random() * 1.6, v: 30 + Math.random() * 50, w: Math.random() * 6 });
    for (const f of floaters) {
      f.y -= f.v * dt; f.w += dt;
      const sp = R.bloonSprite(f.t, '', 0);
      const sw = (sp.width / sp.S) * f.s, sh = (sp.height / sp.S) * f.s;
      mbx.globalAlpha = 0.85;
      mbx.drawImage(sp, f.x + Math.sin(f.w) * 10 - sw / 2, f.y - sh / 2, sw, sh);
    }
    mbx.globalAlpha = 1;
    for (let i = floaters.length - 1; i >= 0; i--) if (floaters[i].y < -60) floaters.splice(i, 1);
  }

  $('playBtn').onclick = () => { A.unlock(); A.play('place'); buildMaps(); show('maps'); };
  $('heroesBtn').onclick = () => { buildHeroes(); show('heroes'); };
  $('statsBtn').onclick = () => { buildStats(); show('stats'); };
  $('setBtn').onclick = () => { $('vol2').value = settings.vol; show('settings'); };
  $('vol2').oninput = (e) => { settings.vol = +e.target.value; A.setVolume(settings.vol); saveSettings(); };
  $('wipeBtn').onclick = () => {
    if (!confirm('Delete all medals, stats and saved games?')) return;
    try { Object.keys(localStorage).filter((k) => k.startsWith('btd6r:')).forEach((k) => localStorage.removeItem(k)); } catch (e) { /* ignore */ }
    location.reload();
  };

  // ---------- map select ----------
  const DIFFS = ['Beginner', 'Intermediate', 'Advanced', 'Expert'];
  let mapTab = 'Beginner';
  const thumbs = {};
  const MEDALS = [['Easy:standard', '#cd7f32'], ['Medium:standard', '#c9ced6'], ['Hard:standard', '#ffd21f'], ['Hard:impoppable', '#ff5a3a'], ['Hard:chimps', '#1a1a1a']];
  function mapThumb(m) {
    if (thumbs[m.id]) return thumbs[m.id];
    const G = new BTD.Game({ map: m, diff: 'Easy', mode: BTD.MODES.Easy[0] });
    thumbs[m.id] = R.renderMap(G, 0.3);
    return thumbs[m.id];
  }
  function buildMaps() {
    const tabs = $('mapTabs');
    tabs.innerHTML = '';
    for (const d of DIFFS) {
      const b = document.createElement('button');
      b.className = 'tab stroke-s' + (d === mapTab ? ' on' : '');
      b.textContent = d;
      b.onclick = () => { mapTab = d; buildMaps(); };
      tabs.appendChild(b);
    }
    const grid = $('mapGrid');
    grid.innerHTML = '';
    for (const m of BTD.MAPS.filter((x) => x.diff === mapTab)) {
      const c = document.createElement('div');
      c.className = 'mapcard';
      const th = mapThumb(m);
      const cv = document.createElement('canvas');
      cv.width = th.width; cv.height = th.height;
      cv.getContext('2d').drawImage(th, 0, 0);
      c.appendChild(cv);
      const nm = document.createElement('div'); nm.className = 'nm stroke-s'; nm.textContent = m.name; c.appendChild(nm);
      const md = document.createElement('div'); md.className = 'medals';
      for (const [k, col] of MEDALS) {
        const s = document.createElement('span'); s.className = 'medal';
        if (medals[m.id] && medals[m.id][k]) { s.classList.add('got'); s.style.background = col; }
        s.title = k.replace(':', ' ');
        md.appendChild(s);
      }
      c.appendChild(md);
      c.onclick = () => { A.play('place'); buildDiff(m); show('diff'); };
      grid.appendChild(c);
    }
  }

  function buildDiff(m) {
    $('diffTitle').textContent = m.name;
    const box = $('diffBox');
    box.innerHTML = '';
    const cols = { Easy: '#5ad12a', Medium: '#ffd21f', Hard: '#e8402a' };
    for (const d of ['Easy', 'Medium', 'Hard']) {
      const col = document.createElement('div');
      col.className = 'dcol';
      col.innerHTML = `<h3 class="stroke" style="color:${cols[d]}">${d}</h3>`;
      for (const mo of BTD.MODES[d]) {
        const save = store.get(saveKey(m.id, d, mo.id), null);
        const b = document.createElement('button');
        b.className = 'btn' + (mo.id === 'standard' ? '' : ' blue');
        b.innerHTML = `${mo.name}<small>${mo.desc}</small>`;
        b.onclick = () => startGame(m, d, mo.id, null);
        col.appendChild(b);
        if (save) {
          const r = document.createElement('button');
          r.className = 'btn gold';
          r.innerHTML = `Resume<small>Round ${save.round}, $${save.cash}</small>`;
          r.onclick = () => startGame(m, d, mo.id, save);
          col.appendChild(r);
        }
      }
      box.appendChild(col);
    }
  }

  // ---------- heroes ----------
  function buildHeroes() {
    const g = $('heroGrid');
    g.innerHTML = '';
    for (const k of BTD.HERO_ORDER) {
      const h = BTD.HEROES[k];
      const c = document.createElement('div');
      c.className = 'herocard' + (settings.hero === k ? ' on' : '');
      const ic = R.icon(k, 90);
      ic.style.width = '90px'; ic.style.height = '90px';
      c.appendChild(ic);
      c.insertAdjacentHTML('beforeend', `<div class="nm stroke-s">${h.name}</div><div class="sub">${h.title} &middot; $${h.cost}</div>`);
      c.onclick = () => { settings.hero = k; saveSettings(); buildHeroes(); };
      g.appendChild(c);
    }
    const h = BTD.HEROES[settings.hero];
    $('heroInfo').textContent = `${h.name}: ${h.desc}`;
  }

  function buildStats() {
    const won = Object.values(medals).reduce((s, m) => s + Object.keys(m).length, 0);
    const best = BTD.MAPS.map((m) => `${m.name}: ${stats.best[m.id] || 0}`).join('<br>');
    $('statsBox').innerHTML = `<p style="font-size:17px">Bloons popped: <b>${stats.pops.toLocaleString()}</b></p>
      <p style="font-size:17px">Games played: <b>${stats.games}</b> &middot; Victories: <b>${stats.wins}</b></p>
      <p style="font-size:17px">Medals: <b>${won}</b> of ${BTD.MAPS.length * 5}</p>
      <p style="font-size:14px;line-height:1.6">Highest round<br>${best}</p>`;
  }

  // ---------- game ----------
  let G = null, running = false;
  const ui = { placing: null, ghost: null, selected: null, settingAim: null, dragFromShop: false };
  const cv = $('cv'), ctx = cv.getContext('2d');
  const view = { dpr: 1, scale: 1, ox: 0, oy: 0 };
  let gameParams = null;

  function startGame(m, diff, modeId, save) {
    A.unlock();
    const mode = BTD.MODES[diff].find((x) => x.id === modeId);
    gameParams = { m, diff, modeId };
    G = new BTD.Game({ map: m, diff, mode, hero: settings.hero, autoStart: settings.auto });
    if (save) G.load(save);
    else store.del(saveKey(m.id, diff, modeId));
    stats.games++; store.set('stats', stats);
    ui.placing = null; ui.selected = null; ui.settingAim = null;
    lastPops = G.popsTotal;
    show('game');
    $('roundMax').textContent = G.endRound;
    $('autoBox').checked = settings.auto;
    buildShop();
    closeUpg();
    $('endModal').classList.remove('on');
    $('pause').classList.remove('on');
    resize();
    running = true;
    toast(m.name, 1.4);
  }

  function resize() {
    const f = $('field');
    const w = f.clientWidth, h = f.clientHeight;
    const dpr = Math.min(2.5, window.devicePixelRatio || 1);
    cv.width = Math.round(w * dpr); cv.height = Math.round(h * dpr);
    view.dpr = dpr;
    view.scale = Math.min(w / BTD.W, h / BTD.H);
    view.ox = (w - BTD.W * view.scale) / 2;
    view.oy = (h - BTD.H * view.scale) / 2;
  }
  window.addEventListener('resize', () => { if (G) resize(); });

  // shop
  const shopBtns = {};
  function buildShop() {
    const grid = $('shopGrid');
    grid.innerHTML = '';
    for (const k of BTD.TOWER_ORDER) {
      const d = BTD.TOWERS[k];
      const b = document.createElement('div');
      b.className = 'tw stroke-s';
      const c1 = BTD.CATS[d.cat];
      b.style.background = `linear-gradient(${R.shade(c1, 0.25)}, ${c1} 60%, ${R.shade(c1, -0.35)})`;
      const ic = R.icon(k, 64);
      b.appendChild(ic);
      b.insertAdjacentHTML('beforeend', `<span class="hk">${d.key.toUpperCase()}</span><span class="pr">$0</span>`);
      const locked = (G.mode.only && d.cat !== G.mode.only) || (G.mode.chimps && k === 'farm');
      if (locked) b.classList.add('lock');
      b.addEventListener('pointerdown', (e) => { if (locked) return; e.preventDefault(); pickTower(k, e); });
      b.addEventListener('pointerenter', (e) => showTip(e, d.name, `$${G.towerCost(k)} · ${d.desc}${d.water ? ' (Water only)' : ''}`));
      b.addEventListener('pointerleave', hideTip);
      grid.appendChild(b);
      shopBtns[k] = { el: b, pr: b.querySelector('.pr'), locked };
    }
    const hs = $('heroSlot');
    hs.innerHTML = '';
    if (G.heroKey) {
      const h = BTD.HEROES[G.heroKey];
      const ic = R.icon(G.heroKey, 50);
      hs.appendChild(ic);
      hs.insertAdjacentHTML('beforeend', `<div>${h.name}<br><span id="heroPrice">$${G.towerCost('hero:' + G.heroKey)}</span></div>`);
      hs.onpointerdown = (e) => { if (G.heroPlaced) return; e.preventDefault(); pickTower('hero:' + G.heroKey, e); };
      hs.onpointerenter = (e) => showTip(e, h.name, h.desc);
      hs.onpointerleave = hideTip;
    }
    refreshShop();
  }
  function refreshShop() {
    for (const k in shopBtns) {
      const s = shopBtns[k];
      const c = G.towerCost(k);
      s.pr.textContent = '$' + c;
      s.el.classList.toggle('poor', G.cash < c);
      s.el.classList.toggle('sel', ui.placing === k);
    }
    $('heroSlot').classList.toggle('used', G.heroPlaced);
    const hp = $('heroPrice');
    if (hp) hp.textContent = G.heroPlaced ? 'Placed' : '$' + G.towerCost('hero:' + G.heroKey);
  }
  function pickTower(k, e) {
    A.unlock();
    closeUpg();
    ui.placing = ui.placing === k && e.pointerType === 'mouse' ? null : k;
    ui.dragFromShop = true;
    ui.ghost = null;
    hideTip();
    refreshShop();
  }

  // input on the field
  function toWorld(e) {
    const r = cv.getBoundingClientRect();
    return { x: (e.clientX - r.left - view.ox) / view.scale, y: (e.clientY - r.top - view.oy) / view.scale };
  }
  window.addEventListener('pointermove', (e) => {
    if (!G || !running) return;
    const p = toWorld(e);
    G.mouse = p;
    if (ui.placing) {
      const r = cv.getBoundingClientRect();
      const inside = e.clientX >= r.left && e.clientX <= r.right && e.clientY >= r.top && e.clientY <= r.bottom;
      ui.ghost = inside ? p : null;
    }
  });
  window.addEventListener('pointerup', (e) => {
    if (!G || !running || !ui.placing || !ui.dragFromShop) return;
    ui.dragFromShop = false;
    const r = cv.getBoundingClientRect();
    if (e.clientX >= r.left && e.clientX <= r.right && e.clientY >= r.top && e.clientY <= r.bottom && e.target === cv) tryPlace(toWorld(e), e);
  });
  cv.addEventListener('pointerdown', (e) => {
    if (!G) return;
    A.unlock();
    e.preventDefault();
    const p = toWorld(e);
    G.mouse = p;
    if (e.button === 2) { cancel(); return; }
    if (ui.settingAim) {
      ui.settingAim.aim = { x: p.x, y: p.y };
      ui.settingAim.targ = ui.settingAim.k === 'mortar' ? 2 : 1;
      ui.settingAim = null;
      renderUpg(true);
      return;
    }
    if (ui.placing) {
      ui.ghost = p;
      if (e.pointerType === 'mouse') tryPlace(p, e);
      else ui.dragFromShop = true;
      return;
    }
    // banana tap is handled by the engine via mouse position; tower select:
    let hit = null, hd = Infinity;
    for (const t of G.towers) {
      if (t.temp) continue;
      const d = Math.hypot(t.x - p.x, t.y - p.y);
      if (d < t.r + 8 && d < hd) { hd = d; hit = t; }
    }
    if (hit) openUpg(hit);
    else closeUpg();
  });
  cv.addEventListener('contextmenu', (e) => e.preventDefault());
  function tryPlace(p, e) {
    const k = ui.placing;
    if (!k) return;
    const t = G.place(k, p.x, p.y);
    if (t) {
      ui.placing = null; ui.ghost = null;
      refreshShop();
      if (t.k === 'mortar') { t.aim = nearestTrack(t); }
      if (t.k === 'dartling') { t.aim = nearestTrack(t); }
    } else if (e && e.pointerType !== 'mouse') {
      // on touch, a bad drop keeps the monkey in hand
      ui.ghost = p;
    }
  }
  function nearestTrack(t) {
    let best = G.trackPts[0], bd = Infinity;
    for (const p of G.trackPts) { const d = Math.hypot(p.x - t.x, p.y - t.y); if (d < bd) { bd = d; best = p; } }
    return { x: best.x, y: best.y };
  }
  function cancel() {
    ui.placing = null; ui.ghost = null; ui.settingAim = null;
    closeUpg();
    refreshShop();
  }

  // ---------- upgrade panel ----------
  const upg = $('upg');
  let upgSig = '';
  const iconCache = {};
  function upIcon(k, p, tier) {
    const key = k + p + tier;
    return iconCache[key] || (iconCache[key] = R.upgradeIcon(k, p, tier, 46));
  }
  function openUpg(t) {
    ui.selected = t;
    upg.classList.add('on');
    upgSig = '';
    renderUpg(true);
  }
  function closeUpg() { ui.selected = null; upg.classList.remove('on'); ui.settingAim = null; }
  $('upgX').onclick = closeUpg;
  $('tPrev').onclick = () => cycleTarg(-1);
  $('tNext').onclick = () => cycleTarg(1);
  function cycleTarg(d) {
    const t = ui.selected; if (!t) return;
    const n = t.def.targets.length; if (!n) return;
    t.targ = (t.targ + d + n) % n;
    if (t.k === 'mortar' && t.targ === 2 && !t.aim) t.aim = nearestTrack(t);
    renderUpg(true);
  }
  $('sellBtn').onclick = () => {
    const t = ui.selected; if (!t || G.mode.chimps) return;
    const doSell = () => { G.sell(t); closeUpg(); refreshShop(); };
    if (t.spent >= 2500) ask('Sell ' + t.def.name + '?', `You get $${G.sellValue(t)} back.`, doSell);
    else doSell();
  };
  $('aimBtn').onclick = () => { ui.settingAim = ui.selected; toast('Tap the map to aim', 1); };
  function renderUpg(force) {
    const t = ui.selected;
    if (!t || !G.towers.includes(t)) { closeUpg(); return; }
    upg.classList.toggle('left', t.x > BTD.W / 2);
    upg.classList.toggle('right', t.x <= BTD.W / 2);
    const sig = [t.id, t.up.join(), Math.floor(G.cash), t.targ, t.pops, t.hero ? t.hero.lvl + ':' + Math.floor(t.hero.xp) : ''].join('|');
    if (!force && sig === upgSig) return;
    upgSig = sig;
    const def = t.def;
    $('upgName').textContent = def.name;
    $('upgPops').textContent = `Pops: ${t.pops.toLocaleString()}`;
    const ic = $('upgIcon'), ix = ic.getContext('2d');
    ix.clearRect(0, 0, 96, 96);
    const src = t.hero ? R.icon(t.k, 48) : R.upgradeIcon(t.k, topPath(t.up), Math.max(...t.up), 48);
    ix.drawImage(src, 0, 0, 96, 96);
    const targs = def.targets || [];
    $('targ').style.display = targs.length ? 'flex' : 'none';
    $('targName').textContent = targs[t.targ] || '';
    $('aimBtn').style.display = t.k === 'mortar' || t.k === 'dartling' ? 'block' : 'none';
    const sv = G.sellValue(t);
    $('sellBtn').textContent = G.mode.chimps ? 'No selling' : `Sell $${sv}`;
    $('sellBtn').disabled = !!G.mode.chimps;
    const paths = $('paths');
    paths.innerHTML = '';
    if (t.hero) {
      $('heroLvl').style.display = 'block';
      const l = t.hero.lvl;
      $('heroLvlTxt').textContent = `Level ${l}${l >= 20 ? ' (max)' : ''}`;
      const a = BTD.heroLevelXp(l), b = BTD.heroLevelXp(l + 1);
      $('xpbar').firstElementChild.style.width = l >= 20 ? '100%' : `${Math.min(100, ((t.hero.xp - a) / (b - a)) * 100)}%`;
      $('upgDesc').textContent = def.desc + ' Levels up from XP each round. Abilities unlock at levels 3 and 10.';
      return;
    }
    $('heroLvl').style.display = 'none';
    for (let p = 0; p < 3; p++) {
      const row = document.createElement('div');
      row.className = 'path';
      const pips = document.createElement('div'); pips.className = 'pips';
      for (let i = 0; i < 5; i++) { const s = document.createElement('div'); s.className = 'pip' + (i < t.up[p] ? ' on' : ''); pips.appendChild(s); }
      row.appendChild(pips);
      const tier = t.up[p];
      const card = document.createElement('button');
      card.className = 'ucard stroke-s';
      if (tier >= 5) {
        const u = def.up[p][4];
        card.classList.add('max');
        card.appendChild(upIcon(t.k, p, 5));
        card.insertAdjacentHTML('beforeend', `<div><div class="un">${u.n}</div><div class="uc">Maxed</div></div>`);
        card.onpointerenter = () => { $('upgDesc').textContent = u.d; };
      } else {
        const u = def.up[p][tier];
        const can = G.canUpgradePath(t, p);
        const cost = G.upgradeCost(t, p);
        card.appendChild(upIcon(t.k, p, tier + 1));
        if (!can) {
          card.classList.add('locked');
          card.insertAdjacentHTML('beforeend', `<div><div class="un">Path closed</div><div class="uc" style="font-size:11px">${u.n}</div></div>`);
        } else {
          if (G.cash < cost) card.classList.add('poor');
          card.insertAdjacentHTML('beforeend', `<div><div class="un">${u.n}</div><div class="uc">$${cost.toLocaleString()}</div></div>`);
          card.onclick = () => {
            if (G.upgrade(t, p)) { $('upgDesc').textContent = `${u.n}: ${u.d}`; renderUpg(true); refreshShop(); }
            else $('upgDesc').textContent = `${u.n}: ${u.d} (need $${cost.toLocaleString()})`;
          };
        }
        card.onpointerenter = () => { $('upgDesc').textContent = `${u.n}: ${u.d}`; };
      }
      row.appendChild(card);
      paths.appendChild(row);
      if (tier > 0) {
        const o = document.createElement('div');
        o.className = 'owned';
        o.textContent = 'Owned: ' + def.up[p].slice(0, tier).map((x) => x.n).join(', ');
        paths.appendChild(o);
      }
    }
  }
  function topPath(up) { let b = 0; for (let i = 1; i < 3; i++) if (up[i] > up[b]) b = i; return b; }

  // ---------- abilities ----------
  let abilSig = '';
  function renderAbilities() {
    const groups = new Map();
    for (const t of G.towers) {
      const ab = t.stats && t.stats.ability;
      if (!ab || t.temp) continue;
      const g = groups.get(ab.name) || { name: ab.name, towers: [] };
      g.towers.push(t);
      groups.set(ab.name, g);
    }
    const list = [...groups.values()];
    const sig = list.map((g) => g.name + g.towers.length).join(',');
    const box = $('abil');
    if (sig !== abilSig) {
      abilSig = sig;
      box.innerHTML = '';
      list.forEach((g, i) => {
        const b = document.createElement('button');
        b.className = 'ab stroke-s';
        b.innerHTML = `<span>${g.name}</span><div class="cdw"></div><span class="kb">${i + 1}</span>`;
        b.onclick = () => fireAbility(i);
        box.appendChild(b);
      });
    }
    abilGroups = list;
    [...box.children].forEach((b, i) => {
      const g = list[i]; if (!g) return;
      let best = Infinity, cd = 1;
      for (const t of g.towers) if (t.abilityCd < best) { best = t.abilityCd; cd = t.stats.ability.cd; }
      const p = Math.max(0, best / cd);
      b.querySelector('.cdw').style.setProperty('--p', `${p * 360}deg`);
      b.classList.toggle('ready', best <= 0);
    });
  }
  let abilGroups = [];
  function fireAbility(i) {
    const g = abilGroups[i]; if (!g) return;
    const t = g.towers.filter((x) => x.abilityCd <= 0)[0];
    if (t) G.useAbility(t);
  }

  // ---------- HUD ----------
  const goBtn = $('goBtn');
  const PLAY = '<svg viewBox="0 0 24 24"><path d="M6 4l14 8-14 8z" fill="#fff" stroke="#000" stroke-width="1.6"/></svg>';
  const FF = '<svg viewBox="0 0 24 24"><path d="M2 5l10 7-10 7zM12 5l10 7-10 7z" fill="#fff" stroke="#000" stroke-width="1.4"/></svg>';
  let goState = '';
  goBtn.onclick = () => {
    if (!G || G.over) return;
    A.unlock();
    if (!G.roundActive && G.pendingStart == null) { G.startRound(); }
    else G.speed = G.speed === 1 ? 3 : 1;
    updateGo();
  };
  function updateGo() {
    const st = !G.roundActive && G.pendingStart == null ? 'play' : G.speed > 1 ? 'fast' : 'ff';
    if (st === goState) return;
    goState = st;
    goBtn.innerHTML = st === 'play' ? PLAY : FF;
    goBtn.classList.toggle('fast', st === 'fast');
  }
  $('autoBox').onchange = (e) => { settings.auto = e.target.checked; G.autoStart = settings.auto; saveSettings(); };
  $('autoBox2').onchange = (e) => { settings.auto = e.target.checked; if (G) G.autoStart = settings.auto; $('autoBox').checked = settings.auto; saveSettings(); };

  let toastT = 0;
  function toast(msg, dur) {
    const el = $('toast');
    el.textContent = msg; el.classList.add('on');
    toastT = dur || 1.4;
  }

  // pause
  $('gear').onclick = () => openPause();
  function openPause() {
    if (!G) return;
    G.paused = true;
    $('vol').value = settings.vol;
    $('autoBox2').checked = settings.auto;
    $('pause').classList.add('on');
  }
  $('vol').oninput = (e) => { settings.vol = +e.target.value; A.setVolume(settings.vol); saveSettings(); };
  $('resumeBtn').onclick = () => { $('pause').classList.remove('on'); G.paused = false; };
  $('restartBtn').onclick = () => ask('Restart?', 'Your progress on this game will be lost.', () => { const { m, diff, modeId } = gameParams; store.del(saveKey(m.id, diff, modeId)); startGame(m, diff, modeId, null); });
  $('homeBtn').onclick = () => { if (!G.over && G.round >= G.mode.start) saveGame(); goHome(); };
  function goHome() { $('pause').classList.remove('on'); $('endModal').classList.remove('on'); running = false; G = null; buildMaps(); show('menu'); }

  function ask(title, text, yes) {
    $('cfTitle').textContent = title; $('cfText').textContent = text;
    $('confirm').classList.add('on');
    $('cfYes').onclick = () => { $('confirm').classList.remove('on'); yes(); };
    $('cfNo').onclick = () => $('confirm').classList.remove('on');
  }

  function saveGame() {
    if (!G || !gameParams) return;
    if (G.roundActive) return;
    store.set(saveKey(gameParams.m.id, gameParams.diff, gameParams.modeId), G.serialize());
  }

  function endModal(win) {
    const box = $('endBtns');
    box.innerHTML = '';
    const { m, diff, modeId } = gameParams;
    const mo = BTD.MODES[diff].find((x) => x.id === modeId);
    if (win) {
      $('endTitle').textContent = 'Victory!';
      $('endTitle').style.color = '#ffd21f';
      $('endText').textContent = `You beat ${m.name} on ${diff}, ${mo.name}. Keep going in Freeplay or head home.`;
      const fp = document.createElement('button'); fp.className = 'btn'; fp.textContent = 'Freeplay';
      fp.onclick = () => { G.freeplay = true; $('endModal').classList.remove('on'); saveGame(); };
      const hm = document.createElement('button'); hm.className = 'btn red'; hm.textContent = 'Home';
      hm.onclick = () => { store.del(saveKey(m.id, diff, modeId)); goHome(); };
      box.append(fp, hm);
    } else {
      $('endTitle').textContent = 'Game Over';
      $('endTitle').style.color = '#ff6a4a';
      $('endText').textContent = `The bloons got through on round ${G.round}.`;
      if (!G.mode.chimps) {
        const ct = document.createElement('button'); ct.className = 'btn gold'; ct.textContent = 'Continue';
        ct.onclick = () => {
          G.lives = G.maxLives; G.over = false; G.bloons = []; G.projs = []; G.queue = []; G.qi = 0;
          G.roundActive = false; G.round = Math.max(G.mode.start - 1, G.round - 1); G.pendingStart = null; G.speed = 1;
          $('endModal').classList.remove('on');
        };
        box.append(ct);
      }
      const rs = document.createElement('button'); rs.className = 'btn blue'; rs.textContent = 'Restart';
      rs.onclick = () => { store.del(saveKey(m.id, diff, modeId)); startGame(m, diff, modeId, null); };
      const hm = document.createElement('button'); hm.className = 'btn red'; hm.textContent = 'Home';
      hm.onclick = () => { store.del(saveKey(m.id, diff, modeId)); goHome(); };
      box.append(rs, hm);
    }
    $('endModal').classList.add('on');
  }

  // tooltip
  const tip = $('tip');
  function showTip(e, title, text) {
    if (e.pointerType !== 'mouse') return;
    tip.innerHTML = `<b class="stroke-s">${title}</b>${text}`;
    tip.style.display = 'block';
    const r = e.currentTarget.getBoundingClientRect();
    tip.style.left = Math.max(8, r.left - 250) + 'px';
    tip.style.top = Math.min(innerHeight - 120, r.top) + 'px';
  }
  function hideTip() { tip.style.display = 'none'; }

  // keyboard
  const KEYMAP = {};
  for (const k of BTD.TOWER_ORDER) KEYMAP[BTD.TOWERS[k].key] = k;
  window.addEventListener('keydown', (e) => {
    if (!G || !running) return;
    if ($('pause').classList.contains('on') || $('endModal').classList.contains('on')) {
      if (e.key === 'Escape' && $('pause').classList.contains('on')) { $('pause').classList.remove('on'); G.paused = false; }
      return;
    }
    const k = e.key.toLowerCase();
    if (k === 'escape') { if (ui.placing || ui.selected) cancel(); else openPause(); return; }
    if (k === ' ') { e.preventDefault(); goBtn.click(); return; }
    if (k === 'tab') { e.preventDefault(); cycleTarg(e.shiftKey ? -1 : 1); return; }
    if (k === 'backspace' || k === 'delete') { if (ui.selected) $('sellBtn').click(); return; }
    if ((k === ',' || k === '.' || k === '/') && ui.selected && !ui.selected.hero) {
      const p = { ',': 0, '.': 1, '/': 2 }[k];
      if (G.upgrade(ui.selected, p)) { renderUpg(true); refreshShop(); }
      return;
    }
    if (/^[1-9]$/.test(k)) { fireAbility(+k - 1); return; }
    if (k === 'u' && G.heroKey && !G.heroPlaced) { ui.placing = 'hero:' + G.heroKey; ui.ghost = G.mouse; closeUpg(); refreshShop(); return; }
    if (KEYMAP[k] && !shopBtns[KEYMAP[k]].locked) { ui.placing = KEYMAP[k]; ui.ghost = G.mouse; closeUpg(); refreshShop(); }
  });

  // ---------- loop ----------
  let lastT = performance.now(), hudT = 0, lastPops = 0;
  const lastHud = {};
  function setText(id, v) { if (lastHud[id] !== v) { lastHud[id] = v; $(id).textContent = v; } }
  function loop(now) {
    const dt = Math.min(0.1, (now - lastT) / 1000);
    lastT = now;
    if ($('menu').classList.contains('on')) menuAnim(dt);
    if (running && G) {
      G.update(dt);
      R.frame(G, ctx, view, ui);
      // events
      for (const ev of G.events) {
        if (ev.type === 'roundEnd') {
          saveGame();
          stats.best[G.map.id] = Math.max(stats.best[G.map.id] || 0, ev.round);
          stats.pops += G.popsTotal - lastPops; lastPops = G.popsTotal;
          store.set('stats', stats);
          if (ev.round === 39 || ev.round === 59 || ev.round === 79 || ev.round === 89 || ev.round === 99) toast('Watch out!', 1.2);
        } else if (ev.type === 'win') {
          const key = gameParams.diff + ':' + gameParams.modeId;
          (medals[G.map.id] = medals[G.map.id] || {})[key] = true;
          store.set('medals', medals);
          stats.wins++; store.set('stats', stats);
          endModal(true);
        } else if (ev.type === 'lose') {
          stats.pops += G.popsTotal - lastPops; lastPops = G.popsTotal; store.set('stats', stats);
          store.del(saveKey(gameParams.m.id, gameParams.diff, gameParams.modeId));
          endModal(false);
        } else if (ev.type === 'herolvl') {
          toast(`${BTD.HEROES[G.heroKey].name} Level ${ev.lvl}!`, 1.2);
        } else if (ev.type === 'round' && [40, 60, 80, 100].includes(ev.round)) {
          toast(`Round ${ev.round}`, 1.2);
        }
      }
      G.events.length = 0;
      hudT -= dt;
      if (hudT <= 0) {
        hudT = 0.1;
        setText('lives', String(Math.max(0, G.lives)));
        setText('cash', String(Math.floor(G.cash)));
        setText('roundN', String(G.roundActive || (G.won && !G.freeplay) ? G.round : G.round + 1));
        $('roundMax').style.display = G.freeplay ? 'none' : '';
        refreshShop();
        if (ui.selected) renderUpg(false);
        renderAbilities();
        updateGo();
      }
    }
    if (toastT > 0) { toastT -= dt; if (toastT <= 0) $('toast').classList.remove('on'); }
    requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);

  // pause when the tab is hidden
  document.addEventListener('visibilitychange', () => { if (document.hidden && G && running && !G.over) openPause(); });

  // ?map=meadow&diff=Medium&mode=standard deep link for quick testing
  const q = new URLSearchParams(location.search);
  if (q.get('map')) {
    const m = BTD.MAPS.find((x) => x.id === q.get('map'));
    if (m) startGame(m, q.get('diff') || 'Medium', q.get('mode') || 'standard', null);
  }
  BTD.ui = { get G() { return G; }, ui, startGame };
})();
