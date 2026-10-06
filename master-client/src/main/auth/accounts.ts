import { createHash, randomBytes, randomInt, timingSafeEqual } from 'node:crypto'
import { existsSync, mkdirSync, readFileSync, renameSync, writeFileSync } from 'node:fs'
import { dirname } from 'node:path'
import bcrypt from 'bcryptjs'
import initSqlJs, { type Database } from 'sql.js'
import type { AuthResult, AuthUser } from '@shared/ipc'

// Local launcher accounts. These gate Master Client only; they have nothing to
// do with the Microsoft account Minecraft signs in with, and nothing leaves this PC.

const BCRYPT_COST = 12
const RECOVERY_ALPHABET = 'ABCDEFGHJKMNPQRSTVWXYZ23456789' // no I, L, O, U, 0, 1
const MAX_FAILS_BEFORE_LOCK = 5

export interface SecretBox {
  available(): boolean
  encrypt(plain: string): Buffer
  decrypt(data: Buffer): string
}

interface UserRow {
  id: number
  username: string
  password_hash: string
  recovery_hash: string
  created_at: number
  failed_attempts: number
  locked_until: number | null
  remember_hash: string | null
}

export function normalizeRecoveryCode(code: string): string {
  return code.toUpperCase().replace(/[^A-Z0-9]/g, '')
}

export function generateRecoveryCode(): string {
  const chars = Array.from({ length: 20 }, () => RECOVERY_ALPHABET[randomInt(RECOVERY_ALPHABET.length)])
  return [0, 5, 10, 15].map((i) => chars.slice(i, i + 5).join('')).join('-')
}

export function validateUsername(u: string): string | null {
  if (u.length < 3 || u.length > 24) return 'Username must be 3 to 24 characters.'
  if (!/^[A-Za-z0-9_.-]+$/.test(u)) return 'Use letters, numbers, dots, dashes or underscores only.'
  return null
}

export function validatePassword(p: string): string | null {
  if (p.length < 8) return 'Password must be at least 8 characters.'
  // bcrypt only looks at the first 72 bytes, so anything past that would be silently ignored.
  if (Buffer.byteLength(p, 'utf8') > 72) return 'Password is too long (72 bytes max).'
  if (!/[A-Za-z]/.test(p) || !/[0-9]/.test(p)) return 'Use at least one letter and one number.'
  return null
}

const sha256 = (s: string): string => createHash('sha256').update(s).digest('hex')

export class AccountStore {
  private db!: Database
  // A real hash to compare against when the username doesn't exist, so a wrong
  // username takes as long as a wrong password.
  private dummyHash = bcrypt.hashSync('not-a-real-password', 10)

  private constructor(
    private readonly file: string,
    private readonly box: SecretBox,
    private readonly sessionFile: string
  ) {}

  static async open(opts: { file: string; sessionFile: string; box: SecretBox; wasmBinary?: Uint8Array }): Promise<AccountStore> {
    const SQL = await initSqlJs(opts.wasmBinary ? { wasmBinary: opts.wasmBinary as unknown as ArrayBuffer } : undefined)
    const store = new AccountStore(opts.file, opts.box, opts.sessionFile)
    store.db = existsSync(opts.file) ? new SQL.Database(readFileSync(opts.file)) : new SQL.Database()
    store.db.run(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT NOT NULL UNIQUE COLLATE NOCASE,
        password_hash TEXT NOT NULL,
        recovery_hash TEXT NOT NULL,
        created_at INTEGER NOT NULL,
        last_login_at INTEGER,
        failed_attempts INTEGER NOT NULL DEFAULT 0,
        locked_until INTEGER,
        remember_hash TEXT
      );
      CREATE TABLE IF NOT EXISTS meta (key TEXT PRIMARY KEY, value TEXT);
      INSERT OR IGNORE INTO meta (key, value) VALUES ('schema', '1');
    `)
    store.persist()
    return store
  }

  private persist(): void {
    mkdirSync(dirname(this.file), { recursive: true })
    const tmp = `${this.file}.tmp`
    writeFileSync(tmp, Buffer.from(this.db.export()))
    renameSync(tmp, this.file)
  }

  private row(username: string): UserRow | null {
    const stmt = this.db.prepare('SELECT * FROM users WHERE username = ? COLLATE NOCASE')
    try {
      stmt.bind([username])
      return stmt.step() ? (stmt.getAsObject() as unknown as UserRow) : null
    } finally {
      stmt.free()
    }
  }

  private rowById(id: number): UserRow | null {
    const stmt = this.db.prepare('SELECT * FROM users WHERE id = ?')
    try {
      stmt.bind([id])
      return stmt.step() ? (stmt.getAsObject() as unknown as UserRow) : null
    } finally {
      stmt.free()
    }
  }

  private toUser(r: UserRow): AuthUser {
    return { id: r.id, username: r.username, createdAt: r.created_at }
  }

  userCount(): number {
    const res = this.db.exec('SELECT COUNT(*) FROM users')
    return Number(res[0]?.values[0]?.[0] ?? 0)
  }

  async signUp(username: string, password: string, remember: boolean): Promise<AuthResult> {
    username = username.trim()
    const bad = validateUsername(username) ?? validatePassword(password)
    if (bad) return { ok: false, error: bad }
    if (this.row(username)) return { ok: false, error: 'That username is taken on this PC.' }

    const recoveryCode = generateRecoveryCode()
    const [passwordHash, recoveryHash] = await Promise.all([
      bcrypt.hash(password, BCRYPT_COST),
      bcrypt.hash(normalizeRecoveryCode(recoveryCode), BCRYPT_COST)
    ])
    const now = Date.now()
    this.db.run('INSERT INTO users (username, password_hash, recovery_hash, created_at, last_login_at) VALUES (?, ?, ?, ?, ?)', [
      username,
      passwordHash,
      recoveryHash,
      now,
      now
    ])
    this.persist()
    const row = this.row(username)!
    if (remember) this.remember(row.id)
    else this.forgetDevice()
    return { ok: true, user: this.toUser(row), recoveryCode }
  }

  async logIn(username: string, password: string, remember: boolean): Promise<AuthResult> {
    const row = this.row(username.trim())
    if (!row) {
      await bcrypt.compare(password, this.dummyHash)
      return { ok: false, error: 'Wrong username or password.' }
    }
    const now = Date.now()
    if (row.locked_until && row.locked_until > now) {
      const secs = Math.ceil((row.locked_until - now) / 1000)
      return { ok: false, error: `Too many tries. Wait ${secs}s and try again.` }
    }
    const good = await bcrypt.compare(password, row.password_hash)
    if (!good) {
      const fails = row.failed_attempts + 1
      // 30s after five misses, doubling each time after that.
      const lock = fails >= MAX_FAILS_BEFORE_LOCK ? now + 30_000 * 2 ** (fails - MAX_FAILS_BEFORE_LOCK) : null
      this.db.run('UPDATE users SET failed_attempts = ?, locked_until = ? WHERE id = ?', [fails, lock, row.id])
      this.persist()
      return { ok: false, error: 'Wrong username or password.' }
    }
    this.db.run('UPDATE users SET failed_attempts = 0, locked_until = NULL, last_login_at = ? WHERE id = ?', [now, row.id])
    this.persist()
    if (remember) this.remember(row.id)
    else this.forgetDevice()
    return { ok: true, user: this.toUser(row) }
  }

  /** Resets the password with the recovery code and issues a fresh code (the old one is spent). */
  async resetPassword(username: string, recoveryCode: string, newPassword: string): Promise<AuthResult> {
    const bad = validatePassword(newPassword)
    if (bad) return { ok: false, error: bad }
    const row = this.row(username.trim())
    const code = normalizeRecoveryCode(recoveryCode)
    if (!row) {
      await bcrypt.compare(code, this.dummyHash)
      return { ok: false, error: 'That username and recovery code don\'t match.' }
    }
    const now = Date.now()
    if (row.locked_until && row.locked_until > now) {
      return { ok: false, error: `Too many tries. Wait ${Math.ceil((row.locked_until - now) / 1000)}s and try again.` }
    }
    if (!(await bcrypt.compare(code, row.recovery_hash))) {
      const fails = row.failed_attempts + 1
      const lock = fails >= MAX_FAILS_BEFORE_LOCK ? now + 30_000 * 2 ** (fails - MAX_FAILS_BEFORE_LOCK) : null
      this.db.run('UPDATE users SET failed_attempts = ?, locked_until = ? WHERE id = ?', [fails, lock, row.id])
      this.persist()
      return { ok: false, error: 'That username and recovery code don\'t match.' }
    }
    const nextCode = generateRecoveryCode()
    const [passwordHash, recoveryHash] = await Promise.all([
      bcrypt.hash(newPassword, BCRYPT_COST),
      bcrypt.hash(normalizeRecoveryCode(nextCode), BCRYPT_COST)
    ])
    this.db.run(
      'UPDATE users SET password_hash = ?, recovery_hash = ?, failed_attempts = 0, locked_until = NULL, remember_hash = NULL WHERE id = ?',
      [passwordHash, recoveryHash, row.id]
    )
    this.persist()
    this.forgetDevice()
    return { ok: true, user: this.toUser(row), recoveryCode: nextCode }
  }

  private remember(userId: number): void {
    if (!this.box.available()) return
    const token = randomBytes(32).toString('hex')
    this.db.run('UPDATE users SET remember_hash = ? WHERE id = ?', [sha256(token), userId])
    this.persist()
    mkdirSync(dirname(this.sessionFile), { recursive: true })
    writeFileSync(this.sessionFile, this.box.encrypt(JSON.stringify({ userId, token })))
  }

  /** Clears the remembered session on this device (does not touch the account). */
  forgetDevice(): void {
    if (existsSync(this.sessionFile)) writeFileSync(this.sessionFile, Buffer.alloc(0))
  }

  logOut(userId: number | null): void {
    if (userId != null) {
      this.db.run('UPDATE users SET remember_hash = NULL WHERE id = ?', [userId])
      this.persist()
    }
    this.forgetDevice()
  }

  /** Returns the remembered user if this device has a valid "remember me" token. */
  restoreSession(): AuthUser | null {
    try {
      if (!existsSync(this.sessionFile) || !this.box.available()) return null
      const raw = readFileSync(this.sessionFile)
      if (raw.length === 0) return null
      const { userId, token } = JSON.parse(this.box.decrypt(raw)) as { userId: number; token: string }
      const row = this.rowById(userId)
      if (!row?.remember_hash || typeof token !== 'string') return null
      const a = Buffer.from(row.remember_hash, 'hex')
      const b = Buffer.from(sha256(token), 'hex')
      if (a.length !== b.length || !timingSafeEqual(a, b)) return null
      return this.toUser(row)
    } catch {
      return null
    }
  }

  close(): void {
    this.db.close()
  }
}
