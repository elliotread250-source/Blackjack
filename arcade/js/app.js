// Open Arcade hub bootstrap.
import { loadRegistry } from './registry.js';
import { loadPlays } from './plays.js';
import { loadStatus } from './status.js';
import { initSections } from './sections.js';
import { initLibrary } from './library.js';
import { initPalette } from './palette.js';
import { initSettings, onSettings } from './settings.js';
import { initNav } from './nav.js';
import { initEffects, updateEffects } from './effects.js';
import { initHero } from './hero.js';
import { initSuggestions } from './suggestions.js';

initNav(); initSettings(); initEffects(); initSuggestions();
onSettings(() => updateEffects());

loadRegistry().then(() => {
  initHero(); initSections(); initLibrary(); initPalette();
  loadPlays(); loadStatus();
}).catch(err => {
  console.error(err);
  const grid = document.getElementById('lib-grid');
  grid.innerHTML = '<div class="empty" style="grid-column:1/-1"><p class="empty-title">The game list did not load</p><p>Check your connection and try again.</p><button class="btn btn-ghost" type="button" onclick="location.reload()">Retry</button></div>';
});
