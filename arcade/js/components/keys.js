// Keyboard play: / or Ctrl/Cmd+K search (palette.js) · R random game (slot machine) · F favourite the focused card ·
// I details for the focused card · G then L library (chord) · arrows between cards (library.js) · Enter plays (native
// link) · ? the control-panel overlay, whose keys light up as you press them. Never fires while typing in a field.
import { openSlot } from './slot.js';
import { eggTyping } from '../sections/eggs.js';

const SHORTCUTS = [['/', 'Search'], ['Ctrl K', 'Command palette'], ['R', 'Random game'], ['F', 'Favourite the focused game'], ['I', 'Details for the focused game'],
  ['G L', 'Go to the library'], ['G F', 'Go to favourites'], ['← → ↑ ↓', 'Move between games'], ['Enter', 'Play'], ['Esc', 'Close anything'], ['?', 'This panel']];
const typing = t => t && (t.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName));
const keyId = k => ({ ' ': 'Space', '/': '/', '?': '?' }[k] || k.toUpperCase());

export function initKeys() {
  const dlg = document.getElementById('keys-dlg'), panel = document.getElementById('keys-panel');
  const mac = /Mac|iPhone|iPad/.test(navigator.platform || navigator.userAgent);
  panel.innerHTML = SHORTCUTS.map(([k, label]) => `<div class="kp">${k.split(' ').map(x => `<kbd data-k="${x === 'Ctrl' && mac ? '⌘' : x}">${x === 'Ctrl' && mac ? '⌘' : x}</kbd>`).join('')}<span>${label}</span></div>`).join('');
  const openKeys = () => { if (!dlg.open) dlg.showModal(); };
  document.querySelectorAll('[data-open-keys]').forEach(b => b.addEventListener('click', openKeys));
  document.getElementById('keys-close').addEventListener('click', () => dlg.close());
  dlg.addEventListener('click', e => { if (e.target === dlg) dlg.close(); });
  let chord = 0;
  addEventListener('keydown', e => {
    // light up keys on the overlay
    if (dlg.open) { panel.querySelectorAll('kbd').forEach(k => { const id = k.dataset.k; if (id.toUpperCase() === keyId(e.key) || (id === '⌘' && e.metaKey) || (id === 'Ctrl' && e.ctrlKey) || ({ '←': 'ARROWLEFT', '→': 'ARROWRIGHT', '↑': 'ARROWUP', '↓': 'ARROWDOWN', Esc: 'ESCAPE', Enter: 'ENTER' }[id] === keyId(e.key))) { k.classList.add('lit'); setTimeout(() => k.classList.remove('lit'), 220); } }); }
    if (e.metaKey || e.ctrlKey || e.altKey || typing(e.target) || e.defaultPrevented) return;
    if (document.querySelector('dialog[open]:not(#keys-dlg)')) return;
    if (eggTyping()) return;
    const k = e.key;
    if (k === '?') { e.preventDefault(); dlg.open ? dlg.close() : openKeys(); return; }
    if (dlg.open) return;
    if (chord && performance.now() - chord < 900) {
      chord = 0;
      if (k === 'l' || k === 'L') { e.preventDefault(); document.getElementById('library').scrollIntoView({ behavior: 'smooth' }); setTimeout(() => document.getElementById('lib-search').focus({ preventScroll: true }), 500); return; }
      if (k === 'f' || k === 'F') { e.preventDefault(); document.getElementById('favourites').scrollIntoView({ behavior: 'smooth' }); return; }
    }
    if (k === 'g' || k === 'G') { chord = performance.now(); return; }
    const cardEl = document.activeElement && document.activeElement.closest && document.activeElement.closest('.gcard');
    if (k === 'r' || k === 'R') { e.preventDefault(); openSlot(); return; }
    if ((k === 'f' || k === 'F') && cardEl) { e.preventDefault(); cardEl.querySelector('.fav')?.click(); return; }
    if ((k === 'i' || k === 'I') && cardEl) { e.preventDefault(); cardEl.querySelector('.gc-info')?.click(); return; }
  });
}
