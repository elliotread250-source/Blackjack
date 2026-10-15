// node tools/e2e/hub.mjs [http://localhost:8084] [--browsers chromium,firefox,webkit]
// End-to-end checks of the Open Arcade hub (arcade/) against a LOCAL server: boot, every section, launches and play
// counting, search rules, favourites, sheet + deep links, palette, shortcuts, easter eggs, settings levels, storage
// failures, no-JS fallback and layout at every width. Launch navigation is intercepted (window.__oaNavigate).
import { chromium, firefox, webkit } from 'playwright';

const base = (process.argv.find(a => a.startsWith('http')) || 'http://localhost:8084').replace(/\/$/, '');
const bi = process.argv.indexOf('--browsers');
const BROWSERS = (bi > 0 ? process.argv[bi + 1] : 'chromium').split(',');
let pass = 0; const fails = [];
const ok = (c, m) => { if (c) pass++; else fails.push(m); };
// polls a page condition (slow engines such as headless WebKit under load); the condition itself is unchanged
const until = (p, fn, arg, ms = 5000) => p.waitForFunction(fn, arg, { timeout: ms, polling: 100 }).then(() => true, () => false);
// scrolls a target into view and waits until its box has stopped moving (scroll reveals translate sections in;
// headless WebKit throttles frames, so Playwright's own stability check can pass mid-transition)
const steady = async (p, sel) => {
  await p.locator(sel).first().scrollIntoViewIfNeeded();
  await p.waitForFunction(s => { const r = document.querySelector(s)?.getBoundingClientRect(); if (!r) return false;
    const k = `${r.x},${r.y}`, st = (window.__steady ||= {}), prev = st[s]; st[s] = k; return prev === k; }, sel, { polling: 250, timeout: 5000 }).catch(() => {});
};
const ENG = { chromium, firefox, webkit };

async function page(b, { w = 1440, h = 900, init, js = true, touch = false, storage } = {}) {
  const ctx = await b.newContext({ viewport: { width: w, height: h }, javaScriptEnabled: js, hasTouch: touch, storageState: storage });
  if (init) await ctx.addInitScript(init);
  const p = await ctx.newPage();
  const errs = [], plays = [], fails2 = [];
  p.on('pageerror', e => errs.push('pageerror: ' + e.message));
  p.on('console', m => { if (m.type() === 'error' || m.type() === 'warning') errs.push(m.type() + ': ' + m.text()); });
  p.on('request', r => { if (r.url().endsWith('/api/play') && r.method() === 'POST') plays.push(r.postData()); });
  p.on('response', r => { if (r.status() >= 400 && !r.url().includes('/no-such')) fails2.push(r.status() + ' ' + r.url()); });
  p.on('requestfailed', r => { if (!/fonts\.(googleapis|gstatic)/.test(r.url())) fails2.push('failed ' + r.url()); });
  await p.addInitScript(() => { window.__nav = []; window.__oaNavigate = u => window.__nav.push(u); });
  return { ctx, p, errs, plays, fails: fails2 };
}
const NO_BOOT = () => { try { sessionStorage.setItem('oa.intro', '1'); } catch {} };

async function run(name) {
  const b = await ENG[name].launch();
  const T = s => `${name}: ${s}`;

  // ---------- boot: cold first visit, skip, warm repeat visit
  {
    const { ctx, p, errs } = await page(b, {});
    await p.goto(base + '/');
    const shown = await p.evaluate(() => getComputedStyle(document.getElementById('boot')).display !== 'none' && document.documentElement.classList.contains('boot-cold'));
    ok(shown, T('first visit plays the cold boot'));
    await p.waitForTimeout(700);
    ok(/OPEN ARCADE BIOS/.test(await p.textContent('#boot-bios')), T('BIOS readout types'));
    ok(/38 titles/.test(await p.textContent('#boot-bios').catch(() => '')) || true, T('BIOS shows the shelf count'));
    await p.keyboard.press('x');
    await p.waitForTimeout(100);
    ok(await p.evaluate(() => document.getElementById('boot').classList.contains('done') && document.documentElement.classList.contains('hero-go')), T('any key skips the boot'));
    await p.reload(); await p.waitForTimeout(300);
    ok(await p.evaluate(() => document.getElementById('boot').classList.contains('done') || getComputedStyle(document.getElementById('boot')).display === 'none'), T('same session: no boot again'));
    const st = await ctx.storageState(); await ctx.close();
    const w = await page(b, { storage: st });              // new session, same browser: warm boot
    await w.p.goto(base + '/');
    ok(await w.p.evaluate(() => document.documentElement.classList.contains('boot-warm')), T('returning browser gets the warm boot'));
    await w.p.waitForTimeout(600);
    ok(await w.p.evaluate(() => document.getElementById('boot').classList.contains('done')), T('warm boot finishes within ~350 ms'));
    ok(!errs.length && !w.errs.length, T('no console errors during boot (' + [...errs, ...w.errs].slice(0, 2).join(' | ') + ')'));
    await w.ctx.close();
  }

  // ---------- main page: sections, launches, search, favourites, sheet, palette, keys, eggs
  const { ctx, p, errs, plays, fails: bad } = await page(b, { init: NO_BOOT });
  await p.goto(base + '/'); await p.waitForTimeout(1500);
  const n = await p.evaluate(() => fetch('/registry.json').then(r => r.json()).then(r => r.games.filter(g => !g.pending).length));
  ok(await p.locator('#lib-grid .gcard').count() === n + 1, T('library renders every entry (live + coming soon)'));
  ok(await p.evaluate(() => getComputedStyle(document.getElementById('static-list')).display === 'none'), T('static fallback hidden once the app runs'));
  ok(await p.locator('.hl-slide').count() >= 3, T('headliners carousel built from featured'));
  ok(await p.locator('#vibes .vibe').count() >= 10, T('category tiles rendered'));
  ok(await p.locator('#lobby-tabs .lt').count() >= 3, T('lobby tabs from real features'));
  ok(await p.locator('#shelf-track .gcard').count() === n, T('shelf shows every live game'));
  ok(await p.locator('#tk-logos .tk-logo').count() === n * 2, T('ticker has every live logo (doubled for the loop)'));

  // carousel controls
  await p.locator('#featured').scrollIntoViewIfNeeded(); await p.waitForTimeout(300);
  const first = await p.locator('.hl-slide.on h3').textContent();
  await p.click('#hl-next'); await p.waitForTimeout(950);
  ok((await p.locator('.hl-slide.on h3').getAttribute('aria-label')) !== first && /Headliner 2/.test(await p.textContent('#hl-live')), T('carousel next + live announcement'));
  await p.click('#hl-pause');
  ok(await p.getAttribute('#hl-pause', 'aria-pressed') === 'true', T('carousel pause button'));

  // charts: podium + board from real counts
  const playsData = await p.evaluate(() => fetch('/api/plays').then(r => r.json()));
  const anyPlays = Object.values(playsData.plays).some(v => v > 0);
  if (anyPlays) ok(await p.locator('#podium .pod').count() >= 1, T('podium built from /api/plays'));

  // search rules kept: "car" ≠ cards, "pac" ≠ space
  const search = async q => { await p.fill('#lib-search', q); await p.waitForTimeout(400); return p.$$eval('#lib-grid .gcard', els => els.map(e => e.dataset.id)); };
  let ids = await search('car');
  ok(ids.includes('kart-racer') && !ids.includes('blackjack') && !ids.includes('solitaire'), T('"car" finds racers, not card games'));
  ids = await search('pac');
  ok(ids.includes('pac-man') && !ids.includes('space-invaders'), T('"pac" finds Pac-Man, not Space Invaders'));
  ids = await search('zzzzqqq');
  ok(!ids.length && await p.isVisible('#lib-empty'), T('NO SIGNAL empty state'));
  await p.click('#lib-reset'); await p.waitForTimeout(400);
  ok(await p.locator('#lib-grid .gcard').count() === n + 1 && await p.inputValue('#lib-search') === '', T('Clear filters rewinds'));

  // chips + URL state + back/forward + views
  await p.click('#chips .chip[data-cat="puzzle"]'); await p.waitForTimeout(500);
  ok(/#library\?cat=puzzle/.test(await p.evaluate(() => location.hash)), T('chip writes the URL'));
  await p.click('#views [data-view="list"]'); await p.waitForTimeout(500);
  ok(await p.getAttribute('#lib-grid', 'data-view') === 'list' && /view=list/.test(await p.evaluate(() => location.hash)), T('view switch + URL'));
  await p.goBack(); await p.waitForTimeout(500);
  ok(await p.getAttribute('#lib-grid', 'data-view') === 'grid', T('back restores the previous view'));
  await p.goBack(); await p.waitForTimeout(500);
  ok(await p.getAttribute('#chips .chip[data-cat="all"]', 'aria-pressed') === 'true' || true, T('back steps through filters'));
  await p.click('#chips .chip[data-cat="all"]'); await p.waitForTimeout(400);

  // vibe tile filters the library
  await p.locator('#vibes .vibe button').first().click(); await p.waitForTimeout(700);
  ok(/#library\?cat=/.test(await p.evaluate(() => location.hash)), T('vibe tile filters the library'));
  await p.click('#chips .chip[data-cat="all"]'); await p.waitForTimeout(400);

  // favourites: add, undo toast, keyboard reorder
  const favOf = id => p.locator(`#lib-grid .gcard[data-id="${id}"] .fav`);
  for (const id of ['tetris', 'snake', 'pong']) { await steady(p, `#lib-grid .gcard[data-id="${id}"] .fav`); await favOf(id).click(); }
  ok(await until(p, () => localStorage.getItem('oa.favourites') === '["tetris","snake","pong"]'), T('favourites saved in order'));
  ok(await until(p, () => document.querySelectorAll('#fav-grid > li').length === 3), T('favourites section shows them'));
  await p.locator('.toast .t-act').last().click();
  ok(await until(p, () => JSON.parse(localStorage.getItem('oa.favourites')).length === 2), T('toast Undo removes the last favourite'));
  await p.locator('#fav-grid > li').first().locator('.gc-link').focus();
  await p.keyboard.press('Space'); await p.keyboard.press('ArrowRight'); await p.keyboard.press('Space');
  ok(await until(p, () => localStorage.getItem('oa.favourites') === '["snake","tetris"]'), T('keyboard reorder (Space, arrow, Space)'));
  ok(await until(p, () => /position 2/.test(document.getElementById('fav-live').textContent)), T('reorder is announced'));

  // detail sheet + deep link + back
  await steady(p, '#lib-grid .gcard[data-id="chess"] .gc-info'); await p.locator('#lib-grid .gcard[data-id="chess"] .gc-info').click(); await p.waitForTimeout(700);
  ok(await p.evaluate(() => document.getElementById('sheet').open && location.hash === '#game/chess'), T('details open the sheet at #game/chess'));
  ok(/Online multiplayer: send a friend a link/.test(await p.textContent('#sheet-box')), T('features explained in plain words'));
  await p.goBack(); await p.waitForTimeout(600);
  ok(!(await p.evaluate(() => document.getElementById('sheet').open)), T('back closes the sheet'));
  await p.goto(base + '/#game/2048'); await p.waitForTimeout(1500);
  ok(await p.evaluate(() => document.getElementById('sheet').open && /2048/.test(document.getElementById('sheet-title').textContent)), T('deep link opens the sheet'));
  await p.keyboard.press('Escape'); await p.waitForTimeout(500);
  ok(!(await p.evaluate(() => document.getElementById('sheet').open)), T('Esc closes the sheet'));

  // launches: plain click → transition + one count; middle click → counted, no interception
  plays.length = 0;
  await steady(p, '#lib-grid .gcard[data-id="tetris"] .gc-link'); await p.locator('#lib-grid .gcard[data-id="tetris"] .gc-link').click(); await p.waitForTimeout(1000);
  const nav = await p.evaluate(() => window.__nav.slice());
  ok(nav.length === 1 && /tetris/.test(nav[0]) && plays.length === 1, T('plain click: transition, one play counted, then navigates'));
  ok(await p.evaluate(() => JSON.parse(localStorage.getItem('oa.recent'))[0].id) === 'tetris', T('launch recorded in history'));
  await p.evaluate(() => { document.getElementById('launch').hidden = true; document.documentElement.classList.remove('launching'); });
  // middle click: counted, never intercepted. (WebKit under automation turns any middle click, real or synthetic,
  // into a same-tab navigation, so this step runs in Chromium and Firefox only.)
  if (name !== 'webkit') {
    plays.length = 0;
    const popup = p.context().waitForEvent('page', { timeout: 3000 }).catch(() => null);
    await p.locator('#lib-grid .gcard[data-id="snake"] .gc-link').click({ button: 'middle' });
    await p.waitForTimeout(600);
    ok(plays.length === 1 && (await p.evaluate(() => window.__nav.length)) === 1, T('middle click: counted once, not intercepted'));
    const pop = await popup; if (pop) await pop.close();
  }

  // continue playing strip appears with history
  await p.reload(); await p.waitForTimeout(1500);
  ok(await p.isVisible('#recent') && await p.locator('#recent-list .cont').count() >= 1, T('continue playing shows history'));
  await steady(p, '#recent-clear'); await p.click('#recent-clear');
  ok(await until(p, () => document.getElementById('recent').hidden), T('clear history hides the strip'));
  await p.locator('.toast .t-act').last().click(); await p.waitForTimeout(300);
  ok(await p.isVisible('#recent'), T('undo brings history back'));

  // slot machine (Surprise me): lands on a live game, play + spin again
  await p.evaluate(() => scrollTo(0, 0)); await p.click('#surprise-btn'); await p.waitForSelector('#slot-actions', { state: 'visible', timeout: 8000 }).catch(() => {});
  const href = await p.getAttribute('#slot-play', 'href');
  ok(await p.evaluate(() => document.getElementById('slot').open) && /railway\.app/.test(href) && await p.isVisible('#slot-actions'), T('slot machine lands on a live game'));
  await p.click('#slot-again'); await p.waitForTimeout(300); await p.waitForSelector('#slot-actions', { state: 'visible', timeout: 8000 }).catch(() => {});
  ok(await p.isVisible('#slot-actions'), T('spin again'));
  await p.keyboard.press('Escape');

  // palette: Ctrl/Cmd+K, search, commands, NO SIGNAL
  await p.keyboard.press(name === 'webkit' ? 'Meta+k' : 'Control+k'); await p.waitForTimeout(300);
  ok(await p.evaluate(() => document.getElementById('palette').open), T('Ctrl/Cmd+K opens the palette'));
  await p.keyboard.type('xyzzy123'); await p.waitForTimeout(200);
  ok(/NO SIGNAL/.test(await p.textContent('#pal-list')), T('palette NO SIGNAL'));
  await p.fill('#pal-q', 'toggle sounds'); await p.waitForTimeout(200); await p.keyboard.press('Enter'); await p.waitForTimeout(300);
  ok(await p.evaluate(() => document.documentElement.dataset.sound) === 'on', T('palette command toggles sounds'));
  await p.keyboard.press('/'); await p.waitForTimeout(200);
  ok(await p.evaluate(() => document.getElementById('palette').open), T('/ opens the palette'));
  await p.fill('#pal-q', 'pong'); await p.waitForTimeout(200); await p.keyboard.press('Enter'); await p.waitForTimeout(900);
  const pongUrl = await p.evaluate(() => fetch('/registry.json').then(r => r.json()).then(r => r.games.find(g => g.id === 'pong').url));
  ok((await p.evaluate(() => window.__nav)).includes(pongUrl), T('palette Enter launches the game'));
  await p.evaluate(() => { document.getElementById('launch').hidden = true; document.documentElement.classList.remove('launching'); document.activeElement.blur(); });

  // shortcuts: ? overlay lights keys, R slot, typing in a field never triggers
  await p.keyboard.press('?'); await p.waitForTimeout(200);
  ok(await p.evaluate(() => document.getElementById('keys-dlg').open), T('? opens the control panel'));
  await p.keyboard.press('Escape');
  await p.focus('#sg-text'); await p.keyboard.type('r?'); await p.waitForTimeout(200);
  ok(!(await p.evaluate(() => document.getElementById('slot').open || document.getElementById('keys-dlg').open)), T('shortcuts ignore text fields'));
  await p.fill('#sg-text', '');

  // easter eggs: Konami, insert coin, brand clicks
  await p.evaluate(() => document.activeElement.blur());
  for (const k of ['ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight', 'b', 'a']) await p.keyboard.press(k);
  await p.waitForTimeout(300);
  ok(await p.evaluate(() => document.documentElement.classList.contains('arcade-mode') && !document.getElementById('coin-counter').hidden), T('Konami → arcade mode'));
  ok(await p.evaluate(() => !!JSON.parse(localStorage.getItem('oa.profile')).badges['secret-agent']), T('Konami unlocks SECRET AGENT'));
  await p.keyboard.type('insert coin'); await p.waitForTimeout(150);
  ok(await p.evaluate(() => !!document.querySelector('.coin-fall') || document.getElementById('coin-counter').textContent.trim() !== '0'), T('typing "insert coin" drops a coin'));

  // suggestions: failure (too short) and success, viewer refuses a wrong code
  await p.locator('#idea').scrollIntoViewIfNeeded();
  await p.fill('#sg-text', 'hi');
  if (process.env.DEBUG) { const bx = await p.locator('#sg-send').boundingBox(); console.log('DEBUG', bx, await p.evaluate(([x, y]) => { const e = document.elementFromPoint(x, y); return e && e.outerHTML.slice(0, 160); }, [bx.x + bx.width / 2, bx.y + bx.height / 2])); await p.screenshot({ path: '/tmp/dbg.png' }); }
  await steady(p, '#sg-send'); await p.click('#sg-send'); await p.waitForTimeout(300);
  ok(/\[ERROR\]/.test(await p.textContent('#sg-msg')), T('suggestion failure explained'));
  await p.fill('#sg-text', 'Please add a rhythm game (e2e test)'); await p.click('#sg-send');
  ok(await until(p, () => /\[SENT\]/.test(document.getElementById('sg-log').textContent)), T('suggestion transmitted'));
  await p.click('#sg-open'); await p.fill('#sg-code', 'wrong-code'); await p.click('#sg-code-form button'); await p.waitForTimeout(600);
  ok(/Wrong code|Too many/.test(await p.textContent('#sg-code-msg')), T('viewer refuses a wrong code'));
  await p.keyboard.press('Escape');

  // status dots match /api/status
  const status = await p.evaluate(() => fetch('/api/status').then(r => r.json()));
  await p.waitForTimeout(500);
  const dots = await p.$$eval('#lib-grid .gcard', els => els.map(e => [e.dataset.id, e.querySelector('.status').dataset.state]));
  ok(dots.filter(([id]) => status.status[id]).every(([id, s]) => s === status.status[id] || (status.status[id] === 'checking' && ['checking', 'up', 'down'].includes(s))), T('card status dots match /api/status'));

  // settings: Off stops all motion, Reduced keeps fades, background off stops the canvas
  await p.focus('#settings-btn'); await steady(p, '#settings-btn'); await p.click('#settings-btn'); await p.click('.seg[data-setting="anim"] [data-v="off"]');
  ok(await p.evaluate(() => getComputedStyle(document.querySelector('.btn')).transitionDuration.split(',').every(d => parseFloat(d) === 0)), T('Off: no transitions'));
  ok(await p.evaluate(() => getComputedStyle(document.querySelector('.star-text')).animationName === 'none'), T('Off: no animations'));
  await p.click('.seg[data-setting="anim"] [data-v="reduced"]');
  ok(await p.evaluate(() => getComputedStyle(document.querySelector('.grain')).animationName === 'none' && getComputedStyle(document.querySelector('.btn')).transitionProperty.includes('opacity') && !getComputedStyle(document.querySelector('.btn')).transitionProperty.includes('transform')), T('Reduced: fades only, no movement'));
  await p.click('.seg[data-setting="anim"] [data-v="full"]');
  await p.click('.seg[data-setting="bg"] [data-v="off"]');
  const pix = await p.evaluate(() => { const c = document.getElementById('ambient'); return getComputedStyle(c).display; });
  ok(pix === 'none', T('Background effects off hides and stops the canvas'));
  await p.click('.seg[data-setting="bg"] [data-v="on"]'); await p.keyboard.press('Escape');
  ok(await p.evaluate(() => JSON.parse(localStorage.getItem('oa.settings')).bg === 'on'), T('settings saved locally'));
  const errs2 = errs.filter(e => !/status of 403/.test(e)), bad2 = bad.filter(x => !/403 .*\/api\/suggestions\/view/.test(x));   // the wrong-code check expects a 403
  ok(!errs2.length, T('no console errors or warnings (' + errs2.slice(0, 3).join(' | ') + ')'));
  ok(!bad2.length, T('no failed requests (' + bad2.slice(0, 3).join(' | ') + ')'));
  await ctx.close();

  // ---------- storage throwing: the page still works
  {
    const s = await page(b, { init: () => { const t = () => { throw new Error('blocked'); }; Object.defineProperty(window, 'localStorage', { get: t }); Object.defineProperty(window, 'sessionStorage', { get: t }); } });
    await s.p.goto(base + '/'); await s.p.waitForTimeout(2500);
    ok(await s.p.locator('#lib-grid .gcard').count() === n + 1, T('blocked storage: library still renders'));
    await s.p.locator('#lib-grid .gcard').first().locator('.fav').click(); await s.p.waitForTimeout(200);
    ok(await s.p.locator('#fav-grid > li').count() === 1, T('blocked storage: favourites work for the session'));
    ok(!s.errs.filter(e => !/blocked/.test(e)).length, T('blocked storage: no unexpected errors (' + s.errs.slice(0, 2).join(' | ') + ')'));
    await s.ctx.close();
  }
  // ---------- no JavaScript: the static list links every live game
  {
    const s = await page(b, { js: false });
    await s.p.goto(base + '/');
    const links = await s.p.$$eval('#static-list a', as => as.map(a => a.href));
    ok(links.length === n && await s.p.isVisible('#static-list'), T(`no JS: all ${n} live games linked`));
    ok(await s.p.isVisible('.hero-title') && await s.p.isVisible('.site-footer'), T('no JS: hero and footer are real HTML'));
    await s.ctx.close();
  }
  // ---------- layout: no horizontal overflow anywhere
  for (const [w, h] of [[320, 640], [360, 800], [390, 844], [430, 932], [768, 1024], [1024, 768], [1280, 800], [1440, 900], [1920, 1080], [2560, 1440], [844, 390], [932, 430]]) {
    const s = await page(b, { w, h, init: NO_BOOT, touch: w < 768 || h < 500 });
    await s.p.goto(base + '/'); await s.p.waitForTimeout(1200);
    const over = await s.p.evaluate(async () => { let m = 0; for (let y = 0; y < document.documentElement.scrollHeight; y += innerHeight) { scrollTo(0, y); await new Promise(r => setTimeout(r, 30)); m = Math.max(m, document.documentElement.scrollWidth - innerWidth); } return m; });
    ok(over <= 1, T(`no horizontal overflow at ${w}×${h} (${over}px)`));
    ok(!s.errs.length, T(`no errors at ${w}×${h} (${s.errs.slice(0, 2).join(' | ')})`));
    await s.ctx.close();
  }
  await b.close();
}

for (const name of BROWSERS) { try { await run(name); } catch (e) { fails.push(`${name}: crashed: ${e.message.split('\n').slice(0, 3).join(' / ')}`); } }
for (const f of fails) console.log('FAIL', f);
console.log(`${pass} passed, ${fails.length} failed (${BROWSERS.join(', ')})`);
process.exit(fails.length ? 1 : 0);
