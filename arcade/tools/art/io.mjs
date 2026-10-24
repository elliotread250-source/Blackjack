// Original artwork for the three IO games on the io-games service (Turf Wars, Wormhole Run, Sinkhole).
// Same recipe as the rest: one scene per game, reused for the 640x360 thumbnail, the 96x96 logo
// (scaled into a rounded tile) and the animated hover moment.
const BG = { 'turf-wars': '#121925', 'wormhole-run': '#05070d', sinkhole: '#3b414c' };
const scenes = {
  'turf-wars': `<path d="M120 70h170v120H120z" fill="#c45d17"/><path d="M120 182h170v8H120z" fill="#7c3a0d"/><path d="M360 160h150v130H360z" fill="#1f86b8"/><path d="M360 282h150v8H360z" fill="#11506f"/>` +
    `<g fill="#ff9b3d" opacity=".75"><rect x="296" y="96" width="18" height="18"/><rect x="320" y="96" width="18" height="18"/><rect x="344" y="96" width="18" height="18"/><rect x="368" y="96" width="18" height="18"/><rect x="368" y="120" width="18" height="18"/><rect x="368" y="144" width="18" height="18"/></g>` +
    `<g class="head"><rect x="364" y="166" width="26" height="26" fill="#ffc07a" stroke="#fff" stroke-width="3"/></g>`,
  'wormhole-run': `<g fill="#ffd23f"><circle cx="150" cy="90" r="7"/><circle cx="470" cy="250" r="8"/><circle cx="400" cy="70" r="5"/><circle cx="210" cy="270" r="6"/></g><g fill="#c77dff"><circle cx="520" cy="120" r="6"/><circle cx="110" cy="200" r="5"/></g>` +
    `<path class="body" d="M150 250C300 330 230 90 420 150S520 110 540 90" fill="none" stroke="#4ef0d6" stroke-opacity=".2" stroke-width="58" stroke-linecap="round"/>` +
    `<path class="body" d="M150 250C300 330 230 90 420 150S520 110 540 90" fill="none" stroke="#1fa893" stroke-width="40" stroke-linecap="round"/>` +
    `<path class="body" d="M150 250C300 330 230 90 420 150S520 110 540 90" fill="none" stroke="#7dfbe6" stroke-width="22" stroke-dasharray="18 22" stroke-linecap="round"/>` +
    `<circle cx="533" cy="84" r="7" fill="#fff"/><circle cx="546" cy="98" r="7" fill="#fff"/><circle cx="535" cy="83" r="3" fill="#05070d"/><circle cx="548" cy="97" r="3" fill="#05070d"/>`,
  sinkhole: `<path d="M0 150h640M320 0v360" stroke="#4a515e" stroke-width="70"/><path d="M0 150h640M320 0v360" stroke="#f2f5fa" stroke-opacity=".5" stroke-width="4" stroke-dasharray="22 18"/>` +
    `<rect x="380" y="200" width="150" height="120" fill="#3b5f86"/><rect x="380" y="200" width="150" height="70" fill="#6f9ccc"/><rect x="90" y="200" width="120" height="110" fill="#a86b4f"/><rect x="90" y="200" width="120" height="55" fill="#8e3b2e"/>` +
    `<rect x="420" y="40" width="70" height="36" rx="8" fill="#e63946"/><rect x="120" y="58" width="96" height="30" rx="6" fill="#f1b51c"/>` +
    `<g class="hole"><circle cx="300" cy="170" r="78" fill="#000"/><circle cx="300" cy="170" r="78" fill="none" stroke="#8f7bff" stroke-width="8"/></g>` +
    `<g class="fall"><rect x="282" y="140" width="40" height="22" rx="6" fill="#457b9d"/></g>`,
};
const anim = {
  'turf-wars': '.head{animation:go 2.6s steps(4) infinite}@keyframes go{0%{transform:translate(0,0)}25%{transform:translate(0,48px)}50%{transform:translate(-48px,48px)}75%{transform:translate(-48px,0)}100%{transform:translate(0,0)}}',
  'wormhole-run': '.body{animation:slither 1.2s linear infinite}@keyframes slither{to{stroke-dashoffset:-80}}',
  sinkhole: '.fall{transform-box:fill-box;transform-origin:center;animation:sink 1.8s ease-in infinite}@keyframes sink{0%{transform:translate(-60px,-50px) scale(1)}60%{transform:translate(0,0) scale(.6);opacity:1}100%{transform:translate(0,0) scale(0) rotate(90deg);opacity:0}}',
};
export const IO_LOGOS = {}, IO_THUMBS = {}, IO_MOMENTS = {};
for (const [id, scene] of Object.entries(scenes)) {
  IO_THUMBS[id] = () => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 360"><rect width="640" height="360" fill="${BG[id]}"/>${scene}</svg>`;
  IO_LOGOS[id] = () => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 96 96"><rect width="96" height="96" rx="20" fill="${BG[id]}"/><g transform="translate(-16 12) scale(.2)">${scene}</g></svg>`;
  IO_MOMENTS[id] = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 360"><style>${anim[id]}@media (prefers-reduced-motion:reduce){*{animation:none!important}}</style><rect width="640" height="360" fill="${BG[id]}"/>${scene}</svg>\n`;
}
