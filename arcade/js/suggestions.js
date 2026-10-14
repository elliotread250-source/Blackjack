// Suggestion box: same API as before (POST /api/suggestions; viewing needs the server-side code via
// POST /api/suggestions/view). No code is ever stored in this file.
const $ = id => document.getElementById(id);
const post = (url, data) => fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) })
  .then(async r => ({ status: r.status, data: await r.json().catch(() => ({})) }));
const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

export function initSuggestions() {
  try { $('sg-name').value = localStorage.getItem('oa.sg.name') || ''; } catch { /* storage blocked */ }
  $('sg-form').addEventListener('submit', async e => {
    e.preventDefault();
    const text = $('sg-text').value.trim(), name = $('sg-name').value.trim(), msg = $('sg-msg');
    if (text.length < 3) { msg.className = 'sg-msg err'; msg.textContent = 'Write a little more first.'; $('sg-text').focus(); return; }
    $('sg-send').disabled = true; msg.className = 'sg-msg'; msg.textContent = 'sending…';
    try {
      const r = await post('/api/suggestions', { text, name });
      if (r.status < 300) {
        msg.className = 'sg-msg ok'; msg.textContent = 'Thanks! Your idea has been saved.'; $('sg-text').value = '';
        try { localStorage.setItem('oa.sg.name', name); } catch { /* fine */ }
      } else { msg.className = 'sg-msg err'; msg.textContent = r.data.error || 'Could not send that. Your message is still here — try again.'; }
    } catch { msg.className = 'sg-msg err'; msg.textContent = 'Could not reach the server. Your message is still here — try again.'; }
    $('sg-send').disabled = false;
  });
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
