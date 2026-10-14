import { get, set } from './store.js';
const KEY = 'oa.favourites';
let favs = new Set((get(KEY, []) || []).filter(x => typeof x === 'string'));
const listeners = new Set();
export const onFavs = fn => listeners.add(fn);
export const isFav = id => favs.has(id);
export const favList = () => [...favs];
export function toggleFav(id) {
  if (favs.has(id)) favs.delete(id); else favs.add(id);
  set(KEY, [...favs]);
  listeners.forEach(fn => fn(id));
  return favs.has(id);
}
