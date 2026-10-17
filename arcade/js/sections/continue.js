// Continue playing: recent launches from this browser as mini cabinets (live relative times, resume, remove,
// clear with undo). Drag to scroll with momentum and snap on desktop; native swipe on touch.
import { byId, thumb, esc } from '../registry.js';
import { recentList, onRecent, ago, removeRecent, clearRecent, restoreRecent } from '../recent.js';
import { wireLaunch } from '../components/launch.js';
import { toast } from '../components/toast.js';
import { addTask, isFull } from '../motion/engine.js';

const $ = id => document.getElementById(id);
function render() {
  const sec = $('recent'), ol = $('recent-list');
  const list = recentList().filter(r => byId.has(r.id) && !byId.get(r.id).pending);
  sec.hidden = !list.length;
  ol.textContent = '';
  list.forEach((r, i) => {
    const g = byId.get(r.id), li = document.createElement('li');
    li.className = 'cont'; li.style.setProperty('--i', i);
    li.innerHTML = `<div class="cont-screen"><img src="${thumb(g.id)}" alt="" width="320" height="200" loading="lazy" decoding="async"></div>
      <div><h3>${esc(g.name)}</h3><p class="when" data-t="${r.t}">last played ${ago(r.t)}</p></div>
      <a class="btn btn-primary resume" href="${esc(g.url)}"><svg aria-hidden="true"><use href="#i-play"/></svg><span>Resume</span></a>
      <button class="x" type="button" aria-label="Remove ${esc(g.name)} from history"><svg aria-hidden="true"><use href="#i-close"/></svg></button>`;
    wireLaunch(li.querySelector('.resume'), g, () => li.querySelector('.cont-screen'));
    li.querySelector('.x').addEventListener('click', () => {
      li.classList.add('leaving');
      setTimeout(() => { removeRecent(g.id); toast(`Removed ${g.name} from history`, { icon: 'clock', action: 'Undo', onAction: () => restoreRecent(recentSnapshot) }); }, isFull() ? 260 : 0);
      recentSnapshot = recentList();
    });
    ol.append(li);
  });
}
let recentSnapshot = [];
function dragScroll(el) {
  let down = false, sx = 0, sl = 0, v = 0, lx = 0, moved = false;
  el.addEventListener('pointerdown', e => { if (e.pointerType !== 'mouse' || e.target.closest('a, button')) return; down = true; moved = false; sx = lx = e.clientX; sl = el.scrollLeft; v = 0; });
  addEventListener('pointermove', e => { if (!down) return; const dx = e.clientX - sx; if (Math.abs(dx) > 4) { moved = true; el.classList.add('drag'); } el.scrollLeft = sl - dx; v = e.clientX - lx; lx = e.clientX; });
  addEventListener('pointerup', () => {
    if (!down) return; down = false; el.classList.remove('drag');
    if (!moved || !isFull()) return;
    let vel = -v * 1.6;                                     // momentum, then snap takes over
    addTask(() => { el.scrollLeft += vel; vel *= .92; if (Math.abs(vel) < .5) return false; });
  });
}
export function initContinue() {
  render(); onRecent(render);
  dragScroll($('recent-list'));
  $('recent-clear').addEventListener('click', () => {
    const old = clearRecent();
    toast('History cleared', { icon: 'clock', action: 'Undo', onAction: () => restoreRecent(old) });
  });
  setInterval(() => document.querySelectorAll('#recent-list .when').forEach(p => { p.textContent = 'last played ' + ago(+p.dataset.t); }), 30000);
}
