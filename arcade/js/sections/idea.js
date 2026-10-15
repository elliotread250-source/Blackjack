// Have an idea?: the suggestion box as a transmit terminal. Same API (POST /api/suggestions; viewing needs the
// server-side code via POST /api/suggestions/view). No code is ever stored in this file.
import { typewriter } from '../motion/text.js';
import { isFull, whenVisible, addTask } from '../motion/engine.js';
import { shake } from '../motion/fx.js';
import { play } from '../motion/sound.js';
import { esc } from '../registry.js';

const $ = id => document.getElementById(id);
const post = (url, data) => fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) })
  .then(async r => ({ status: r.status, data: await r.json().catch(() => ({})) }));
const log = (html, cls = '') => { const p = document.createElement('p'); p.className = cls; $('sg-log').append(p); return typewriter(p, html, { cps: 60 }); };

function upload(text) {
  // characters stream up out of the textarea into the top of the terminal, then a paper plane flies off
  if (!isFull()) return;
  const ta = $('sg-text'), r = ta.getBoundingClientRect(), box = $('sg-form'), br = box.getBoundingClientRect();
  [...text.slice(0, 40)].forEach((ch, i) => {
    const s = document.createElement('span'); s.className = 'upload-char'; s.textContent = ch;
    s.style.left = (r.left - br.left + 14 + (i % 20) * 11) + 'px'; s.style.top = (r.top - br.top + 16 + Math.floor(i / 20) * 18) + 'px';
    s.style.animationDelay = (i * 14) + 'ms'; box.append(s); setTimeout(() => s.remove(), 900 + i * 14);
  });
  const btn = $('sg-send').getBoundingClientRect(), plane = document.createElement('div');
  plane.className = 'plane'; plane.innerHTML = '<svg aria-hidden="true"><use href="#i-send"/></svg>'; document.body.append(plane);
  let t = 0; const x0 = btn.left, y0 = btn.top;
  addTask(dt => { t += dt; const x = x0 + t * t * 900, y = y0 - t * 520 + Math.sin(t * 9) * 20; plane.style.transform = `translate(${x}px, ${y}px) rotate(${-20 + t * 30}deg)`; if (t > 1.3) { plane.remove(); return false; } });
}

export function initIdea() {
  const form = $('sg-form'), text = $('sg-text'), count = $('sg-count');
  try { $('sg-name').value = localStorage.getItem('oa.sg.name') || ''; } catch { /* storage blocked */ }
  text.addEventListener('input', () => { count.textContent = String(text.value.length).padStart(4, '0'); });
  whenVisible(form, () => { if (!form._typed) { form._typed = 1; typewriter($('tw-title'), 'transmit.sh — ready', { cps: 24 }); } });
  form.addEventListener('submit', async e => {
    e.preventDefault();
    const t = text.value.trim(), name = $('sg-name').value.trim(), msg = $('sg-msg');
    form.classList.remove('err');
    if (t.length < 3) { msg.className = 'sg-msg err'; msg.textContent = '[ERROR] write a little more first.'; shake(form); play('error'); text.focus(); return; }
    $('sg-send').disabled = true; msg.className = 'sg-msg'; msg.textContent = 'transmitting…';
    try {
      const r = await post('/api/suggestions', { text: t, name });
      if (r.status < 300) {
        upload(t); play('send');
        text.value = ''; count.textContent = '0000'; msg.className = 'sg-msg ok'; msg.textContent = '';
        await log('[SENT] thanks, every idea is read', 'ok');
        try { localStorage.setItem('oa.sg.name', name); } catch { /* fine */ }
      } else {
        form.classList.add('err'); play('error');
        msg.className = 'sg-msg err'; msg.textContent = `[ERROR] ${r.data.error || 'could not send that.'} Your message is still here — try again.`;
      }
    } catch {
      form.classList.add('err'); play('error');
      msg.className = 'sg-msg err'; msg.textContent = '[ERROR] could not reach the server. Your message is still here — try again.';
    }
    $('sg-send').disabled = false;
  });
  // viewer (code-protected, unchanged API)
  const dlg = $('sg-dialog');
  async function open(code) {
    const m = $('sg-code-msg');
    m.className = 'sg-msg'; m.textContent = 'checking…';
    try {
      const r = await post('/api/suggestions/view', { code });
      if (r.status !== 200) { m.className = 'sg-msg err'; m.textContent = r.data.error || 'Wrong code.'; try { sessionStorage.removeItem('oa.sg.code'); } catch { /* fine */ } return; }
      try { sessionStorage.setItem('oa.sg.code', code); } catch { /* fine */ }
      const list = r.data.suggestions || [];
      $('sg-code-form').hidden = true;
      m.className = 'sg-msg'; m.textContent = list.length ? `${list.length} suggestion${list.length === 1 ? '' : 's'}, newest first.` : 'No suggestions yet.';
      $('sg-list').innerHTML = list.map(s => `<li><div class="meta">${esc(s.name || 'Anonymous')} · ${new Date(s.time * 1000).toLocaleString()}</div><div class="txt">${esc(s.text)}</div></li>`).join('');
    } catch { m.className = 'sg-msg err'; m.textContent = 'Could not reach the server.'; }
  }
  $('sg-open').addEventListener('click', () => {
    $('sg-list').innerHTML = ''; $('sg-code-msg').textContent = ''; $('sg-code-form').hidden = false; $('sg-code').value = '';
    dlg.showModal();
    let saved = null; try { saved = sessionStorage.getItem('oa.sg.code'); } catch { /* fine */ }
    if (saved) open(saved); else $('sg-code').focus();
  });
  $('sg-code-form').addEventListener('submit', e => { e.preventDefault(); open($('sg-code').value); });
  $('sg-close').addEventListener('click', () => dlg.close());
  dlg.addEventListener('click', e => { if (e.target === dlg) dlg.close(); });
}
