// localStorage that never throws (private mode, blocked storage, full quota): falls back to memory.
const mem = new Map();
export function get(key, fallback) {
  try { const v = localStorage.getItem(key); return v == null ? (mem.has(key) ? mem.get(key) : fallback) : JSON.parse(v); }
  catch { return mem.has(key) ? mem.get(key) : fallback; }
}
export function set(key, value) {
  mem.set(key, value);
  try { localStorage.setItem(key, JSON.stringify(value)); } catch { /* memory only */ }
}
export function del(key) { mem.delete(key); try { localStorage.removeItem(key); } catch { /* fine */ } }
