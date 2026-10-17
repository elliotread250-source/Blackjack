// Hash state: #game/{id} opens the detail sheet; #library?cat=…&q=…&sort=…&view=… restores the library.
// Plain section anchors (#popular, #lobby …) are left to the browser.
const handlers = { game: null, library: null, close: null };
export const onRoute = (kind, fn) => { handlers[kind] = fn; };
export function parse(h = location.hash) {
  const m = /^#game\/([a-z0-9-]{1,48})$/.exec(h);
  if (m) return { kind: 'game', id: m[1] };
  const l = /^#library\?(.*)$/.exec(h);
  if (l) return { kind: 'library', params: Object.fromEntries(new URLSearchParams(l[1])) };
  return { kind: 'none' };
}
let lastKind = 'none';
function run() {
  const r = parse();
  if (r.kind !== 'game' && lastKind === 'game' && handlers.close) handlers.close();
  lastKind = r.kind;
  if (r.kind === 'game' && handlers.game) handlers.game(r.id);
  if (r.kind === 'library' && handlers.library) handlers.library(r.params);
}
export function initRouter() { addEventListener('hashchange', run); run(); }
export function setLibraryHash(params, push) {
  const q = new URLSearchParams(Object.entries(params).filter(([, v]) => v && v !== 'all')).toString();
  const h = '#library' + (q ? '?' + q : '');
  if (location.hash === h) return;
  history[push ? 'pushState' : 'replaceState'](null, '', h);
  lastKind = 'library';
}
export function openGameHash(id) { if (location.hash !== '#game/' + id) { history.pushState({ oaSheet: 1 }, '', '#game/' + id); lastKind = 'game'; } }
export function closeGameHash() {
  if (parse().kind !== 'game') return;
  if (history.state && history.state.oaSheet) history.back();
  else history.replaceState(null, '', location.pathname + location.search);
  lastKind = 'none';
}
