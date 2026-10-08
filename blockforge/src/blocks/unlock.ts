// The owner's own texture pack ships only as a locked file (packs/real.bin, AES-GCM). Its key
// travels in a private link (https://.../#pack=<key>): the part after # never reaches the
// server, so the public site holds no usable copy. Opening the link once in a browser adds the
// pack to Resource Packs (it is not switched on); the key is remembered in that browser so the
// pack comes back by itself if the browser's storage is cleared.
import type { CustomPack } from './importer';

export const LOCKED_PACK_URL = 'packs/real.bin';
const KEY_STORE = 'blockforge.packkey';

function fromB64Url(s: string): Uint8Array {
  const b64 = s.replace(/-/g, '+').replace(/_/g, '/') + '==='.slice((s.length + 3) % 4);
  const bin = atob(b64);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

/** A key from the address bar (#pack=...), removed from it and remembered; null if none. */
export function keyFromLink(): string | null {
  try {
    const m = location.hash.match(/(?:^#|&)pack=([A-Za-z0-9_-]{40,64})/);
    if (!m) return null;
    history.replaceState(null, '', location.pathname + location.search);
    try { localStorage.setItem(KEY_STORE, m[1]); } catch { /* storage blocked */ }
    return m[1];
  } catch {
    return null;
  }
}

/** The key remembered from an earlier link in this browser. */
export function rememberedKey(): string | null {
  try { return localStorage.getItem(KEY_STORE); } catch { return null; }
}

/** Forget the key (the player removed the pack on purpose). */
export function forgetKey(): void {
  try { localStorage.removeItem(KEY_STORE); } catch { /* ignore */ }
}

/** Download and unlock the pack. Throws with a message fit for the player. */
export async function unlockPack(key: string): Promise<CustomPack> {
  const subtle = typeof crypto !== 'undefined' ? crypto.subtle : undefined;
  if (!subtle) throw new Error('Open the pack link on the website (https), not the offline file.');
  let raw: ArrayBuffer;
  try {
    const res = await fetch(LOCKED_PACK_URL, { cache: 'no-cache' });
    if (!res.ok) throw new Error(String(res.status));
    raw = await res.arrayBuffer();
  } catch {
    throw new Error('Could not download the texture pack. Check the connection and open the link again.');
  }
  if (raw.byteLength < 12 + 16 + 8) throw new Error('The texture pack file is damaged.');
  let plain: Uint8Array;
  try {
    const k = await subtle.importKey('raw', fromB64Url(key) as BufferSource, 'AES-GCM', false, ['decrypt']);
    plain = new Uint8Array(await subtle.decrypt({ name: 'AES-GCM', iv: new Uint8Array(raw, 0, 12) }, k, new Uint8Array(raw, 12)));
  } catch {
    throw new Error('That pack link does not fit this texture pack.');
  }
  const v = new DataView(plain.buffer, plain.byteOffset, plain.byteLength);
  if (plain.length < 8 || v.getUint32(0, false) !== 0x4246504b) throw new Error('The texture pack file is damaged.');   // "BFPK"
  const headLen = v.getUint32(4, true);
  const head = JSON.parse(new TextDecoder().decode(plain.subarray(8, 8 + headLen))) as { name: string; names: string[] };
  const base = 8 + headLen;
  if (!Array.isArray(head.names) || plain.length < base + head.names.length * 1024) throw new Error('The texture pack file is damaged.');
  const tiles = new Map<string, Uint8ClampedArray>();
  head.names.forEach((n, i) => tiles.set(n, new Uint8ClampedArray(plain.slice(base + i * 1024, base + (i + 1) * 1024))));
  return { name: String(head.name || 'Real Textures').slice(0, 32), tiles };
}
