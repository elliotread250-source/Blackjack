import { mkdtempSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { AccountStore, generateRecoveryCode, normalizeRecoveryCode, validatePassword, type SecretBox } from '../src/main/auth/accounts'

// Stand-in for Electron's safeStorage: reversible, but good enough to test the flow.
const box: SecretBox = {
  available: () => true,
  encrypt: (s) => Buffer.from(s, 'utf8').reverse(),
  decrypt: (b) => Buffer.from(b).reverse().toString('utf8')
}

async function open(dir = mkdtempSync(join(tmpdir(), 'mc-auth-'))) {
  const store = await AccountStore.open({ file: join(dir, 'accounts.sqlite'), sessionFile: join(dir, 'session.bin'), box })
  return { store, dir }
}

describe('accounts', () => {
  it('signs up, logs in, and rejects a wrong password', async () => {
    const { store } = await open()
    const r = await store.signUp('Steve_1', 'diamonds99', false)
    expect(r.ok).toBe(true)
    if (!r.ok) return
    expect(r.recoveryCode).toMatch(/^[A-Z0-9]{5}(-[A-Z0-9]{5}){3}$/)
    expect((await store.logIn('steve_1', 'diamonds99', false)).ok).toBe(true)
    const bad = await store.logIn('Steve_1', 'wrongpass1', false)
    expect(bad).toEqual({ ok: false, error: 'Wrong username or password.' })
    expect((await store.signUp('STEVE_1', 'another123', false)).ok).toBe(false)
  })

  it('persists to the SQLite file and restores a remembered session', async () => {
    const { store, dir } = await open()
    await store.signUp('Alex', 'emeralds42', true)
    store.close()
    const { store: again } = await open(dir)
    expect(again.userCount()).toBe(1)
    expect(again.restoreSession()?.username).toBe('Alex')
    again.logOut(again.restoreSession()!.id)
    expect(again.restoreSession()).toBeNull()
  })

  it('resets the password with the recovery code and issues a new one', async () => {
    const { store } = await open()
    const r = await store.signUp('Herobrine', 'nether123', false)
    if (!r.ok) throw new Error('sign up failed')
    const reset = await store.resetPassword('Herobrine', r.recoveryCode!.toLowerCase().replace(/-/g, ' '), 'overworld456')
    expect(reset.ok).toBe(true)
    if (!reset.ok) return
    expect(reset.recoveryCode).not.toBe(r.recoveryCode)
    expect((await store.logIn('Herobrine', 'overworld456', false)).ok).toBe(true)
    // The old code is spent.
    expect((await store.resetPassword('Herobrine', r.recoveryCode!, 'another789')).ok).toBe(false)
  })

  it('locks out after repeated failures', async () => {
    const { store } = await open()
    await store.signUp('Notch', 'minecraft1', false)
    for (let i = 0; i < 5; i++) await store.logIn('Notch', 'nope-nope1', false)
    const locked = await store.logIn('Notch', 'minecraft1', false)
    expect(locked.ok).toBe(false)
    if (!locked.ok) expect(locked.error).toMatch(/Too many tries/)
  })

  it('validates passwords and normalises codes', () => {
    expect(validatePassword('short1')).not.toBeNull()
    expect(validatePassword('lettersonly')).not.toBeNull()
    expect(validatePassword('a'.repeat(73) + '1')).not.toBeNull()
    expect(validatePassword('fine-pass-1')).toBeNull()
    expect(normalizeRecoveryCode(' ab12c-d3fgh ')).toBe('AB12CD3FGH')
    expect(new Set(Array.from({ length: 50 }, generateRecoveryCode)).size).toBe(50)
  })
})
