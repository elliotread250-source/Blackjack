// Search shared by the library and the command palette. Matches name, genres, keywords, categories and
// feature labels; "multiplayer" only finds games whose multiplayer feature is real (registry features).
import { FEATURE_LABELS, CATEGORIES } from './registry.js';
const norm = s => String(s).toLowerCase().normalize('NFKD').replace(/[̀-ͯ]/g, '');
const CAT_LABEL = Object.fromEntries(CATEGORIES);
const ALIASES = { car: 'racing driving', cars: 'racing driving', race: 'racing', mp: 'multiplayer', online: 'online', friends: 'online multiplayer',
  '2 player': 'multiplayer', 'two player': 'multiplayer', word: 'word', words: 'word', cards: 'cards', board: 'board', shooter: 'shooter', retro: 'classic', classics: 'classic' };
export function haystack(g) {
  return norm([g.name, g.genres.join(' '), g.keywords, g.categories.map(c => c === 'board' ? 'board games' : c + ' ' + (CAT_LABEL[c] || '')).join(' '), g.features.map(f => FEATURE_LABELS[f] || '').join(' '), g.kind].join(' '));
}
export function score(g, q) {
  q = norm(q).trim(); if (!q) return 1;
  const terms = q.split(/\s+/), name = norm(g.name), hay = g._hay || (g._hay = haystack(g));
  let s = 0;
  for (const t of terms) {
    const alt = (ALIASES[t] || '').split(' ').filter(Boolean);
    const word = w => new RegExp('(^|[^a-z0-9])' + w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '([^a-z0-9]|$)').test(hay);
    let hit = 0;
    const pre = (str, w) => new RegExp('(^|[^a-z0-9])' + w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).test(str);   // starts a word
    if (name.startsWith(t)) hit = 6; else if (pre(name, t)) hit = 4;
    // words with a known meaning ("car", "online"…) match whole words or their synonyms, not substrings
    // (so "car" finds racing games, not "cards")
    else if (alt.length) hit = word(t) ? 2 : alt.some(a => word(a)) ? 1.5 : 0;
    else if (pre(hay, t)) hit = 2;
    if (!hit) return 0;
    s += hit;
  }
  return s;
}
export function highlighter(q) {
  const terms = norm(q).trim().split(/\s+/).filter(t => t.length > 1);
  const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  if (!terms.length) return null;
  const re = new RegExp('(' + terms.map(t => t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|') + ')', 'gi');
  return s => esc(s).replace(re, '<mark>$1</mark>');
}
