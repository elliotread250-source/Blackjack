// Favourites: an ordered list of ids in this browser (drag/keyboard reorder in the favourites section).
import { get, set } from './store.js';
const KEY = 'oa.favourites';
let favs = (get(KEY, []) || []).filter((x, i, a) => typeof x === 'string' && a.indexOf(x) === i);
const listeners = new Set();
export const onFavs = fn => listeners.add(fn);
export const isFav = id => favs.includes(id);
export const favList = () => favs.slice();
const save = id => { set(KEY, favs); listeners.forEach(fn => fn(id)); };
export function toggleFav(id) {
  if (favs.includes(id)) favs = favs.filter(x => x !== id); else favs = [...favs, id];
  save(id);
  return favs.includes(id);
}
export function setFavOrder(ids) { favs = ids.filter(id => favs.includes(id)); save(null); }
