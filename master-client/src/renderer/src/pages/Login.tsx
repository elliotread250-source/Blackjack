import { useState, type FormEvent } from 'react'
import { Check, Copy, KeyRound, ShieldCheck } from 'lucide-react'
import type { AuthResult, AuthUser } from '@shared/ipc'
import { Landscape } from '../components/Landscape'
import { Button, TextInput, cx } from '../components/ui'

type Mode = 'login' | 'signup' | 'forgot'

function RecoveryCode({ code, onDone, title }: { code: string; onDone: () => void; title: string }) {
  const [copied, setCopied] = useState(false)
  const [saved, setSaved] = useState(false)
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 text-lg font-semibold">
        <ShieldCheck className="text-accent" size={20} /> {title}
      </div>
      <p className="text-sm text-muted">
        This recovery code is the only way to reset your password if you forget it. It's shown once. Write it down or keep it in a password manager.
      </p>
      <div className="flex items-center justify-between rounded-xl border border-accent/40 bg-accent/10 px-4 py-3 font-mono text-lg tracking-widest select-text">
        {code}
        <button
          className="text-muted hover:text-ink"
          onClick={() => {
            void navigator.clipboard.writeText(code)
            setCopied(true)
          }}
          aria-label="Copy recovery code"
        >
          {copied ? <Check size={16} /> : <Copy size={16} />}
        </button>
      </div>
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" checked={saved} onChange={(e) => setSaved(e.target.checked)} className="accent-[var(--mc-accent)]" />
        I've saved my recovery code
      </label>
      <Button variant="accent" className="w-full" disabled={!saved} onClick={onDone}>
        Continue
      </Button>
    </div>
  )
}

export function Login({ onAuthed }: { onAuthed: (u: AuthUser) => void }) {
  const [mode, setMode] = useState<Mode>('login')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [code, setCode] = useState('')
  const [remember, setRemember] = useState(true)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [recovery, setRecovery] = useState<{ code: string; user: AuthUser; title: string } | null>(null)

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    setError(null)
    if ((mode === 'signup' || mode === 'forgot') && password !== confirm) return setError("Passwords don't match.")
    setBusy(true)
    let r: AuthResult
    try {
      r =
        mode === 'login'
          ? await window.mc.auth.logIn(username, password, remember)
          : mode === 'signup'
            ? await window.mc.auth.signUp(username, password, remember)
            : await window.mc.auth.reset(username, code, password)
    } finally {
      setBusy(false)
    }
    if (!r.ok) return setError(r.error)
    if (mode === 'login') return onAuthed(r.user)
    if (mode === 'signup') return setRecovery({ code: r.recoveryCode!, user: r.user, title: 'Account created' })
    // Password reset: show the new code, then sign in with the new password.
    setRecovery({ code: r.recoveryCode!, user: r.user, title: 'Password reset' })
  }

  const finishRecovery = async () => {
    if (!recovery) return
    if (mode === 'forgot') {
      const r = await window.mc.auth.logIn(username, password, remember)
      if (r.ok) onAuthed(r.user)
      else {
        setRecovery(null)
        setMode('login')
      }
      return
    }
    onAuthed(recovery.user)
  }

  return (
    <div className="relative flex h-full items-center justify-center overflow-hidden">
      <Landscape className="absolute inset-0 h-full w-full scale-110 blur-[3px]" dim={0.35} />
      <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-black/40 to-bg" />
      <div className="drag absolute inset-x-0 top-0 h-10" />
      <div className="no-drag page-enter relative w-[420px] rounded-2xl border border-white/10 bg-panel/85 p-8 shadow-2xl backdrop-blur-xl">
        <div className="mb-6 text-center">
          <div className="font-pixel text-3xl tracking-wide">
            Master <span className="text-accent">Client</span>
          </div>
          <div className="mt-1 text-xs text-muted">Companion launcher for Minecraft Bedrock</div>
        </div>
        {recovery ? (
          <RecoveryCode code={recovery.code} title={recovery.title} onDone={() => void finishRecovery()} />
        ) : (
          <>
            {mode !== 'forgot' && (
              <div className="mb-5 grid grid-cols-2 rounded-lg border border-line bg-black/20 p-1 text-sm">
                {(['login', 'signup'] as const).map((m) => (
                  <button
                    key={m}
                    onClick={() => {
                      setMode(m)
                      setError(null)
                    }}
                    className={cx('rounded-md py-1.5 transition-colors', mode === m ? 'bg-white/10 text-ink' : 'text-muted hover:text-ink')}
                  >
                    {m === 'login' ? 'Log in' : 'Sign up'}
                  </button>
                ))}
              </div>
            )}
            {mode === 'forgot' && (
              <div className="mb-5 flex items-center gap-2 font-semibold">
                <KeyRound size={18} className="text-accent" /> Reset your password
              </div>
            )}
            <form onSubmit={submit} className="space-y-3">
              <TextInput value={username} onChange={setUsername} placeholder="Username" className="w-full" autoFocus />
              {mode === 'forgot' && <TextInput value={code} onChange={setCode} placeholder="Recovery code (XXXXX-XXXXX-XXXXX-XXXXX)" className="w-full font-mono" />}
              <TextInput value={password} onChange={setPassword} placeholder={mode === 'forgot' ? 'New password' : 'Password'} type="password" className="w-full" />
              {mode !== 'login' && <TextInput value={confirm} onChange={setConfirm} placeholder="Confirm password" type="password" className="w-full" />}
              {mode !== 'forgot' && (
                <label className="flex items-center gap-2 text-sm text-muted">
                  <input type="checkbox" checked={remember} onChange={(e) => setRemember(e.target.checked)} className="accent-[var(--mc-accent)]" />
                  Remember me on this PC
                </label>
              )}
              {error && <div className="rounded-lg border border-bad/30 bg-bad/10 px-3 py-2 text-sm text-bad">{error}</div>}
              <Button type="submit" variant="accent" className="w-full py-2.5" disabled={busy || !username || !password}>
                {busy ? 'Working…' : mode === 'login' ? 'Log in' : mode === 'signup' ? 'Create account' : 'Reset password'}
              </Button>
            </form>
            <div className="mt-4 text-center text-xs">
              {mode === 'login' && (
                <button className="text-muted hover:text-ink" onClick={() => setMode('forgot')}>
                  Forgot password?
                </button>
              )}
              {mode === 'forgot' && (
                <button className="text-muted hover:text-ink" onClick={() => setMode('login')}>
                  Back to log in
                </button>
              )}
            </div>
            <p className="mt-6 border-t border-line pt-4 text-center text-[11px] leading-relaxed text-muted">
              This account only unlocks Master Client on this PC. It's separate from the Microsoft account Minecraft signs in with, which Master Client never sees.
            </p>
          </>
        )}
      </div>
    </div>
  )
}
