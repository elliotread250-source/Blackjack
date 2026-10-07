import { GRAPHICS, INPUT, type QualityLevel } from '../config';
import { formatTime, type Bests } from '../save';

export interface UICallbacks {
  newClimb(): void;
  continueClimb(): void;
  resume(): void;
  restart(): void;
  quitToTitle(): void;
  stayAtSummit(): void;
  setSensitivity(v: number): void;
  setVolume(v: number): void;
  setQuality(q: QualityLevel | 'auto'): void;
  setShowCursor(b: boolean): void;
}

export interface SettingsView {
  sensitivity: number;
  volume: number;
  quality: QualityLevel;
  qualityChosen: boolean;
  detected: QualityLevel;
  gpu: string;
  showCursor: boolean;
}

export interface EndingStats {
  time: number;
  falls: number;
  bigFall: number;
  bestTime: number;
  newBest: boolean;
  summits: number;
}

const h = (html: string): HTMLElement => {
  const t = document.createElement('template');
  t.innerHTML = html.trim();
  return t.content.firstElementChild as HTMLElement;
};

export class UI {
  private root: HTMLElement;
  private hud: HTMLElement;
  private heightEl: HTMLElement;
  private bestEl: HTMLElement;
  private sectionEl: HTMLElement;
  private timerEl: HTMLElement;
  private railFill: HTMLElement;
  private railBest: HTMLElement;
  private menu: HTMLElement | null = null;
  private toastEl: HTMLElement;
  private toastTimer = 0;
  private lastSection = '';
  private cb: UICallbacks;
  private settings: () => SettingsView;

  constructor(cb: UICallbacks, settings: () => SettingsView) {
    this.cb = cb;
    this.settings = settings;
    this.root = document.getElementById('ui')!;
    this.hud = h(`
      <div class="hud hidden">
        <div class="hud-left">
          <div class="hud-height"><span class="v">0.0</span><span class="u">m</span></div>
          <div class="hud-best">best <span>0.0</span> m</div>
          <div class="hud-section"></div>
        </div>
        <div class="hud-right"><div class="hud-timer">0:00.0</div></div>
        <div class="hud-rail"><div class="fill"></div><div class="best"></div></div>
      </div>`);
    this.root.appendChild(this.hud);
    this.heightEl = this.hud.querySelector('.hud-height .v')!;
    this.bestEl = this.hud.querySelector('.hud-best span')!;
    this.sectionEl = this.hud.querySelector('.hud-section')!;
    this.timerEl = this.hud.querySelector('.hud-timer')!;
    this.railFill = this.hud.querySelector('.hud-rail .fill')!;
    this.railBest = this.hud.querySelector('.hud-rail .best')!;
    this.toastEl = h(`<div class="toast"></div>`);
    this.root.appendChild(this.toastEl);
  }

  setHUDVisible(v: boolean): void {
    this.hud.classList.toggle('hidden', !v);
  }

  updateHUD(height: number, best: number, time: number, section: string, progress: number, bestProgress: number): void {
    this.heightEl.textContent = Math.max(0, height).toFixed(1);
    this.bestEl.textContent = Math.max(0, best).toFixed(1);
    this.timerEl.textContent = formatTime(time);
    this.railFill.style.height = `${Math.max(0, Math.min(1, progress)) * 100}%`;
    this.railBest.style.bottom = `${Math.max(0, Math.min(1, bestProgress)) * 100}%`;
    if (section !== this.lastSection) {
      this.lastSection = section;
      this.sectionEl.textContent = section;
      this.sectionEl.classList.remove('flash');
      void this.sectionEl.offsetWidth;
      this.sectionEl.classList.add('flash');
    }
  }

  toast(text: string, ms = 2600): void {
    this.toastEl.textContent = text;
    this.toastEl.classList.add('show');
    clearTimeout(this.toastTimer);
    this.toastTimer = window.setTimeout(() => this.toastEl.classList.remove('show'), ms);
  }

  hideMenus(): void {
    this.menu?.remove();
    this.menu = null;
  }

  private open(el: HTMLElement): void {
    this.hideMenus();
    this.menu = el;
    this.root.appendChild(el);
  }

  /**
   * Asks inside the menu instead of with confirm(), which embedded frames
   * (and some browsers) silently block.
   */
  private confirmIn(menu: HTMLElement, text: string, yes: string, onYes: () => void): void {
    const buttons = menu.querySelector('.buttons') as HTMLElement;
    menu.querySelector('.confirm')?.remove();
    const el = h(`
      <div class="confirm">
        <p>${text}</p>
        <div class="buttons">
          <button class="primary yes">${yes}</button>
          <button class="no">Cancel</button>
        </div>
      </div>`);
    buttons.hidden = true;
    buttons.after(el);
    el.querySelector('.yes')!.addEventListener('click', onYes);
    el.querySelector('.no')!.addEventListener('click', () => {
      el.remove();
      buttons.hidden = false;
    });
  }

  private settingsBlock(): HTMLElement {
    const s = this.settings();
    const opts = (['auto', 'low', 'medium', 'high', 'ultra'] as const)
      .map((q) => {
        const label = q === 'auto' ? `Auto (${GRAPHICS[s.detected].label})` : GRAPHICS[q].label;
        const sel = (q === 'auto' && !s.qualityChosen) || (q !== 'auto' && s.qualityChosen && q === s.quality);
        return `<option value="${q}" ${sel ? 'selected' : ''}>${label}</option>`;
      })
      .join('');
    const el = h(`
      <div class="settings">
        <label>Mouse sensitivity <span class="val sens">${s.sensitivity.toFixed(2)}</span>
          <input type="range" class="sens" min="${INPUT.minSensitivity}" max="${INPUT.maxSensitivity}" step="0.05" value="${s.sensitivity}">
        </label>
        <label>Volume <span class="val vol">${Math.round(s.volume * 100)}</span>
          <input type="range" class="vol" min="0" max="1" step="0.01" value="${s.volume}">
        </label>
        <label>Graphics
          <select class="quality">${opts}</select>
          <small class="gpu">Drawing on: ${s.gpu.replace(/</g, '&lt;')}</small>
        </label>
        <label class="check"><input type="checkbox" class="cursor" ${s.showCursor ? 'checked' : ''}> Show aim dot</label>
      </div>`);
    const sens = el.querySelector('input.sens') as HTMLInputElement;
    sens.addEventListener('input', () => {
      this.cb.setSensitivity(Number(sens.value));
      el.querySelector('.val.sens')!.textContent = Number(sens.value).toFixed(2);
    });
    const vol = el.querySelector('input.vol') as HTMLInputElement;
    vol.addEventListener('input', () => {
      this.cb.setVolume(Number(vol.value));
      el.querySelector('.val.vol')!.textContent = String(Math.round(Number(vol.value) * 100));
    });
    const q = el.querySelector('select.quality') as HTMLSelectElement;
    q.addEventListener('change', () => this.cb.setQuality(q.value as QualityLevel | 'auto'));
    const cur = el.querySelector('input.cursor') as HTMLInputElement;
    cur.addEventListener('change', () => this.cb.setShowCursor(cur.checked));
    for (const e of el.querySelectorAll('input,select')) e.addEventListener('mousedown', (ev) => ev.stopPropagation());
    return el;
  }

  showTitle(canContinue: boolean, bests: Bests): void {
    const best = bests.height > 0 ? `Highest: ${bests.height.toFixed(1)} m` : 'Never climbed';
    const time = bests.time > 0 ? ` · Fastest summit: ${formatTime(bests.time)}` : '';
    const el = h(`
      <div class="menu title-screen">
        <div class="panel">
          <h1>Over a Barrel</h1>
          <p class="tag">One frog. One barrel. One pickaxe. A very tall mountain.</p>
          <div class="buttons">
            ${canContinue ? '<button class="primary cont">Continue climb</button><button class="new">New climb</button>' : '<button class="primary new">Start climbing</button>'}
            <button class="opts">Settings</button>
          </div>
          <div class="settings-slot"></div>
          <p class="bests">${best}${time}</p>
          <p class="how">Mouse only. Move it to swing the pick: hook, push, pull, vault.<br>Esc pauses. Falling costs you everything. That's the point.</p>
        </div>
      </div>`);
    el.querySelector('.cont')?.addEventListener('click', () => this.cb.continueClimb());
    el.querySelector('.new')!.addEventListener('click', () => {
      if (!canContinue) return this.cb.newClimb();
      this.confirmIn(el, 'Start a new climb from the bottom? Your saved climb will be lost.', 'Yes, start over', () => this.cb.newClimb());
    });
    const slot = el.querySelector('.settings-slot')!;
    el.querySelector('.opts')!.addEventListener('click', () => {
      if (slot.childElementCount) slot.innerHTML = '';
      else slot.appendChild(this.settingsBlock());
    });
    this.open(el);
  }

  showPause(): void {
    const el = h(`
      <div class="menu pause-screen">
        <div class="panel">
          <h2>Paused</h2>
          <div class="buttons">
            <button class="primary resume">Resume</button>
            <button class="restart">Restart from the bottom</button>
            <button class="quit">Title screen</button>
          </div>
          <div class="settings-slot"></div>
        </div>
      </div>`);
    el.querySelector('.resume')!.addEventListener('click', () => this.cb.resume());
    el.querySelector('.restart')!.addEventListener('click', () => {
      this.confirmIn(el, 'Start over from the very bottom?', 'Yes, restart', () => this.cb.restart());
    });
    el.querySelector('.quit')!.addEventListener('click', () => this.cb.quitToTitle());
    el.querySelector('.settings-slot')!.appendChild(this.settingsBlock());
    this.open(el);
  }

  showEnding(s: EndingStats): void {
    const el = h(`
      <div class="menu ending-screen">
        <div class="panel">
          <h1>Summit</h1>
          <p class="tag">You hauled a barrel up a mountain with a pickaxe. Nobody can take that away.</p>
          <div class="stats">
            <div><span>Time</span><b>${formatTime(s.time)}</b></div>
            <div><span>Falls</span><b>${s.falls}</b></div>
            <div><span>Worst fall</span><b>${s.bigFall.toFixed(0)} m</b></div>
            <div><span>Best time</span><b>${formatTime(s.bestTime)}${s.newBest ? ' <em>new!</em>' : ''}</b></div>
          </div>
          <div class="buttons">
            <button class="primary again">Climb again</button>
            <button class="stay">Admire the view</button>
          </div>
        </div>
      </div>`);
    el.querySelector('.again')!.addEventListener('click', () => this.cb.newClimb());
    el.querySelector('.stay')!.addEventListener('click', () => this.cb.stayAtSummit());
    this.open(el);
  }
}
