// The one game registry (registry.json, also read by the server for its status allowlist).
export const CATEGORIES = [
  ['all', 'All'], ['arcade', 'Arcade'], ['action', 'Action'], ['racing', 'Racing'], ['puzzle', 'Puzzle'], ['strategy', 'Strategy'],
  ['platformer', 'Platformers'], ['multiplayer', 'Multiplayer'], ['classic', 'Classics'], ['casual', 'Casual'], ['board', 'Cards & board'],
  ['3d', '3D worlds'], ['tool', 'Tools'], ['favourites', 'Favourites'],
];
export const FEATURE_LABELS = {
  online: 'Online multiplayer', local2p: 'Same-screen 2P', coop: 'Same-screen co-op', bots: 'Bots', touch: 'Touch-friendly',
  daily: 'Daily', saves: 'Saves progress', leaderboard: 'Leaderboard',
};
let V = '';
export const logo = id => `assets/game-logos/${id}.svg${V}`;
export const thumb = id => `assets/game-thumbnails/${id}.svg${V}`;

export let GAMES = [];
export const byId = new Map();
export async function loadRegistry() {
  const r = await fetch('registry.json', { cache: 'no-cache' });
  if (!r.ok) throw new Error('registry ' + r.status);
  const reg = await r.json();
  GAMES = reg.games; V = reg.artVersion ? `?v=${reg.artVersion}` : '';
  for (const g of GAMES) byId.set(g.id, g);
  return GAMES;
}
export const live = () => GAMES.filter(g => !g.pending);
