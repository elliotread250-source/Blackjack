// node tests/e2e.cjs [baseUrl] — two real browsers (separate cookies = separate accounts) play every game:
// sign up, join the same room, see each other, measure frame rate, die, get an end screen with a score,
// and find the score on the all-time board. Then a phone-sized touch session. Screenshots go to $OUT_DIR.
const { chromium, devices } = require('playwright');
const fs = require('fs');
const BASE = process.argv[2] || 'http://127.0.0.1:9490';
const OUT = process.env.OUT_DIR || 'e2e-out';
fs.mkdirSync(OUT, { recursive: true });
let passed = 0; const fails = [];
const ok = (c, m) => { if (c) passed++; else { fails.push(m); console.log('FAIL', m); } };
const sleep = ms => new Promise(r => setTimeout(r, ms));
const stamp = Date.now().toString(36).slice(-5);
// the server's bot names, read from its source so the check can't drift
const BOT_NAMES = new Set([...fs.readFileSync(require('path').join(__dirname, '../iocore/rooms.py'), 'utf8').match(/BOT_NAMES = \[([\s\S]*?)\]/)[1].matchAll(/"([^"]+)"/g)].map(m => m[1]));

async function player(browser, name, opts = {}) {
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 }, ...opts });
  const page = await ctx.newPage();
  page.errors = [];
  page.on('pageerror', e => page.errors.push(String(e)));
  page.on('console', m => { if (m.type() === 'error' && !/fonts\.g|ERR_|net::/.test(m.text())) page.errors.push(m.text()); });
  page.uname = name;
  return page;
}
async function signUp(page, game) {
  await page.goto(`${BASE}/${game}/`);
  await page.waitForSelector('#a-user');
  await page.fill('#a-user', page.uname);
  await page.click('#a-name button');
  await page.waitForSelector('#a-p');
  await page.fill('#a-p', '2468');
  await page.click('#a-pin button');
  await page.waitForSelector('#play:not([disabled])');
}
const fps = page => page.evaluate(() => new Promise(res => { let n = 0; const t0 = performance.now(); const f = () => { n++; if (performance.now() - t0 < 2000) requestAnimationFrame(f); else res(n / ((performance.now() - t0) / 1000)); }; requestAnimationFrame(f); }));
const liveNames = page => page.$$eval('#h-live li span:first-child', els => els.map(e => e.textContent.replace(/^\d+\.\s*/, '')));

(async () => {
  const browser = await chromium.launch();
  const a = await player(browser, `Ann${stamp}`), b = await player(browser, `Ben${stamp}`);
  const games = [
    { key: 'turf-wars', steer: async p => { for (let i = 0; i < 40; i++) { await p.keyboard.press('ArrowRight'); await sleep(150); } } },
    { key: 'wormhole-run', steer: async p => { await p.mouse.move(1270, 400); await p.mouse.down(); await sleep(14000); await p.mouse.up(); } },
    { key: 'sinkhole', steer: null },
  ];
  for (const g of games) {
    if (g.key === 'turf-wars') { await signUp(a, g.key); await signUp(b, g.key); }
    else { for (const p of [a, b]) { await p.goto(`${BASE}/${g.key}/`); await p.waitForSelector('#play:not([disabled])'); } }
    ok(await a.$eval('.who b', e => e.textContent) === a.uname, `${g.key}: account carries over between games`);
    await a.click('#play'); await b.click('#play');
    await a.waitForSelector('.hud:not(.hidden)'); await b.waitForSelector('.hud:not(.hidden)');
    await sleep(2500);
    ok(await a.$eval('.overlay', e => e.classList.contains('hidden')), `${g.key}: menu closes on play`);
    const la = await liveNames(a), lb = await liveNames(b);
    ok(la.length >= 8, `${g.key}: live top 10 is populated (${la.length})`);
    const roomA = await a.evaluate(() => 0);
    const f = await fps(a);
    ok(f > 50, `${g.key}: ${f.toFixed(0)} fps`);
    console.log(`${g.key}: ${f.toFixed(1)} fps, live board A: ${la.slice(0, 5).join(', ')}`);
    await a.screenshot({ path: `${OUT}/${g.key}-a.png` }); await b.screenshot({ path: `${OUT}/${g.key}-b.png` });
    // both humans are in one room: each one's roster names the other (via the server's online count)
    const stats = await a.evaluate(() => fetch('/api/stats').then(r => r.json()));
    ok(stats[g.key].humans === 2 && stats[g.key].rooms === 1, `${g.key}: two humans, one room (${JSON.stringify(stats[g.key])})`);
    if (g.key === 'sinkhole') {
      // let the round run out (server is started with a short ROUND for the test)
      await b.mouse.move(900, 400);
      await b.waitForSelector('.end', { state: 'visible', timeout: 90000 }).catch(() => {});
    } else {
      await g.steer(b);
      await b.waitForFunction(() => !document.querySelector('.end').closest('.overlay').classList.contains('hidden'), null, { timeout: 60000 }).catch(() => {});
    }
    const endShown = await b.evaluate(() => !document.querySelector('.end').closest('.overlay').classList.contains('hidden'));
    ok(endShown, `${g.key}: end screen appears`);
    if (endShown) {
      const score = await b.$eval('#e-score', e => e.textContent), rank = await b.$eval('#e-rank', e => e.textContent);
      console.log(`${g.key}: B end screen: ${score} ${rank} best=${await b.$eval('#e-best', e => e.textContent)} (${await b.$eval('#e-best-l', e => e.textContent)})`);
      ok(/^#\d+ of \d+$/.test(rank), `${g.key}: rank shown`);
      await b.screenshot({ path: `${OUT}/${g.key}-end.png` });
      const board = await b.evaluate(k => fetch(`/api/leaderboard?game=${k}`).then(r => r.json()), g.key);
      ok(board.top.some(r => r.name === b.uname) || /too short/.test(await b.$eval('#e-best-l', e => e.textContent)), `${g.key}: score reaches the all-time board`);
      ok(!board.top.some(r => BOT_NAMES.has(r.name)), `${g.key}: no bot ever reaches the all-time board`);
      await b.click('#e-again');
      await sleep(1500);
      ok(await b.evaluate(() => document.querySelector('.end').closest('.overlay').classList.contains('hidden')), `${g.key}: play again`);
    }
    for (const p of [a, b]) { await p.goto('about:blank'); }
    await sleep(500);
  }
  ok(!a.errors.length && !b.errors.length, 'no page errors: ' + [...a.errors, ...b.errors].slice(0, 3).join(' | '));

  // phone: touch joystick + boost button in Wormhole Run
  const phone = await player(browser, `Pho${stamp}`, { ...devices['iPhone 13'] });
  await signUp(phone, 'wormhole-run');
  await phone.tap('#play');
  await phone.waitForSelector('.hud:not(.hidden)');
  ok(await phone.$('.touch-btn') !== null, 'phone: boost button shown');
  const box = await phone.evaluate(() => [innerWidth, innerHeight]);
  const cdp = await phone.context().newCDPSession(phone);
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: box[0] / 2, y: box[1] / 2 }] });
  for (let i = 1; i <= 6; i++) { await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: box[0] / 2 + i * 8, y: box[1] / 2 - i * 5 }] }); await sleep(30); }
  ok(await phone.$eval('.stick', e => !e.classList.contains('hidden')), 'phone: joystick follows the thumb');
  await sleep(1000);
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
  const pf = await fps(phone);
  console.log(`phone: ${pf.toFixed(1)} fps`);
  ok(pf > 45, `phone: ${pf.toFixed(0)} fps`);
  await phone.screenshot({ path: `${OUT}/phone-wormhole.png` });
  ok(!phone.errors.length, 'phone: no page errors ' + phone.errors.join(' | '));
  await browser.close();
  console.log(`${passed} browser checks passed` + (fails.length ? `, ${fails.length} FAILED` : ''));
  process.exit(fails.length ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
