import { readFileSync, readdirSync, statSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { MODULES } from '@shared/modules'

// The hard rules, enforced. If any of these fail, something crossed a line.

function files(dir: string): string[] {
  return readdirSync(dir).flatMap((n) => {
    const p = join(dir, n)
    return statSync(p).isDirectory() ? files(p) : /\.(ts|tsx|js|mjs)$/.test(n) ? [p] : []
  })
}

const source = files(join(__dirname, '..', 'src')).map((f) => ({ f, text: readFileSync(f, 'utf8') }))

describe('hard rules', () => {
  it('never simulates input', () => {
    for (const { f, text } of source) {
      // Only the explanatory comment in input.ts may mention them.
      const code = text.replace(/\/\/.*$/gm, '').replace(/\/\*[\s\S]*?\*\//g, '')
      expect(/\bkeyTap\b|\bkeyToggle\b|SendInput|keybd_event|mouse_event/.test(code), f).toBe(false)
    }
  })

  it('never touches another process\'s memory or injects code', () => {
    const banned = /ReadProcessMemory|WriteProcessMemory|VirtualAllocEx|CreateRemoteThread|LoadLibrary|SetWindowsHookEx|OpenProcess|NtReadVirtualMemory|ffi-napi|koffi|frida|dll-inject|memoryjs/i
    for (const { f, text } of source) expect(banned.test(text), f).toBe(false)
  })

  it('never intercepts game traffic', () => {
    const banned = /\b(libpcap|pcap_open|cap\.Cap|WinDivert|npcap)\b|SOCK_RAW|bedrock-protocol|raknet-native/i
    for (const { f, text } of source) expect(banned.test(text), f).toBe(false)
  })

  it('ships every unavailable module with a reason and no engine', () => {
    for (const m of MODULES.filter((x) => x.available === 'no')) {
      expect(m.reason, m.id).toBeTruthy()
      expect(m.engines, m.id).toEqual(['none'])
    }
    for (const m of MODULES.filter((x) => x.available === 'partial')) expect(m.reason, m.id).toBeTruthy()
  })

  it('has every HUD and Visuals module from the brief', () => {
    expect(MODULES.filter((m) => m.category === 'hud')).toHaveLength(17)
    expect(MODULES.filter((m) => m.category === 'visuals')).toHaveLength(27)
  })
})
