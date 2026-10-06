// The 9-slot hotbar shared by the HUD, the inventory screen and block interaction.
import { ID } from '../blocks/registry';

export const DEFAULT_HOTBAR = [
  'grass_block', 'stone', 'oak_planks', 'oak_log', 'cobblestone', 'glass', 'torch', 'oak_stairs', 'bricks',
].map((n) => ID[n] ?? 0);

export class Hotbar {
  slots: number[] = DEFAULT_HOTBAR.slice();
  selected = 0;
  /** Called after any change (slot contents or selection). */
  listeners: Array<() => void> = [];

  onChange(fn: () => void) { this.listeners.push(fn); }
  private emit() { for (const f of this.listeners) f(); }

  current(): number { return this.slots[this.selected] ?? 0; }

  select(i: number) {
    const n = ((i % 9) + 9) % 9;
    if (n !== this.selected) { this.selected = n; this.emit(); }
  }

  scroll(steps: number) { if (steps) this.select(this.selected + steps); }

  set(i: number, id: number) {
    if (i < 0 || i > 8) return;
    this.slots[i] = id;
    this.emit();
  }

  /** First empty slot, or -1. */
  firstFree(): number { return this.slots.indexOf(0); }

  /**
   * Creative pick-block: select the slot that already holds `id`; otherwise put it
   * in the first empty slot (and select it); otherwise replace the selected slot.
   */
  pick(id: number) {
    if (!id) return;
    const have = this.slots.indexOf(id);
    if (have >= 0) { this.select(have); return; }
    const free = this.firstFree();
    if (free >= 0) { this.slots[free] = id; this.selected = free; this.emit(); return; }
    this.set(this.selected, id);
  }

  load(slots: number[], selected: number) {
    for (let i = 0; i < 9; i++) this.slots[i] = slots[i] ?? 0;
    this.selected = Math.max(0, Math.min(8, selected | 0));
    this.emit();
  }
}
