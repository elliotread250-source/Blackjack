import { useEffect, useState } from 'react'
import { Download, FolderOpen, LogOut, RefreshCw, Upload } from 'lucide-react'
import type { DisplayInfo, UpdateStatus } from '@shared/ipc'
import { useApp } from '../lib/store'
import { AccentPicker, Banner, Button, KeyCapture, Row, Section, Select, TextInput, Toggle } from '../components/ui'

const FPS_TEXT: Record<string, string> = {
  ok: 'Reading frame times',
  starting: 'Starting',
  'waiting-for-game': 'Waiting for Minecraft',
  'no-permission': 'Windows is blocking frame timing',
  missing: 'PresentMon.exe is missing',
  off: 'Off (turn on FPS or Debug menu)',
  unsupported: 'Windows only',
  error: 'Error'
}

export function SettingsPage({ onLogout }: { onLogout: () => void }) {
  const settings = useApp((s) => s.settings)!
  const user = useApp((s) => s.user)
  const bedrock = useApp((s) => s.bedrock)
  const metrics = useApp((s) => s.metrics)
  const patch = useApp((s) => s.patch)
  const refreshBedrock = useApp((s) => s.refreshBedrock)
  const [displays, setDisplays] = useState<DisplayInfo[]>([])
  const [version, setVersion] = useState('')
  const [update, setUpdate] = useState<UpdateStatus | null>(null)
  const [note, setNote] = useState<{ tone: 'good' | 'bad'; text: string } | null>(null)

  useEffect(() => {
    void window.mc.overlay.displays().then(setDisplays)
    void window.mc.app.version().then(setVersion)
    void window.mc.app.updateStatus().then(setUpdate)
    void refreshBedrock(true)
    return window.mc.app.onUpdate(setUpdate)
  }, [refreshBedrock])

  const chooseFolder = async () => {
    const p = await window.mc.bedrock.chooseFolder()
    if (p) {
      patch({ game: { folderOverride: p } })
      setTimeout(() => void refreshBedrock(true), 300)
    }
  }

  const grant = async () => {
    const r = await window.mc.overlay.grantFrameAccess()
    setNote(r.ok ? { tone: 'good', text: 'Done. Sign out of Windows and back in, then FPS will work.' } : { tone: 'bad', text: r.error ?? 'That didn\'t work.' })
  }

  return (
    <div className="page-enter mx-auto max-w-4xl space-y-5">
      <h1 className="font-pixel text-4xl">Settings</h1>
      {note && (
        <Banner tone={note.tone} onClose={() => setNote(null)}>
          {note.text}
        </Banner>
      )}

      <Section title="Account" hint="Your Master Client account lives only on this PC. It's separate from the Microsoft account Minecraft uses.">
        <Row label={user?.username} hint={`Created ${user ? new Date(user.createdAt).toLocaleDateString() : ''}`}>
          <Button variant="danger" onClick={onLogout}>
            <LogOut size={14} /> Log out
          </Button>
        </Row>
      </Section>

      <Section title="Appearance">
        <Row label="Accent colour">
          <AccentPicker value={settings.appearance.accent} onChange={(v) => patch({ appearance: { accent: v } })} />
        </Row>
        <Row label="Theme">
          <Select
            value={settings.appearance.theme}
            onChange={(v) => patch({ appearance: { theme: v } })}
            options={[
              { value: 'dark', label: 'Dark' },
              { value: 'midnight', label: 'Midnight' },
              { value: 'oled', label: 'OLED black' }
            ]}
          />
        </Row>
        <Row label="Reduce motion" hint="Stops the animated background and most transitions.">
          <Toggle on={settings.appearance.reduceMotion} onChange={(v) => patch({ appearance: { reduceMotion: v } })} />
        </Row>
      </Section>

      <Section title="Hotkeys" hint="Single keys like Right Shift are read by the input hook and still reach the game. Combos with Ctrl or Alt are registered with Windows and don't.">
        <Row label="Overlay menu">
          <KeyCapture value={settings.hotkeys.menu} allowCombos allowMouse={false} onChange={(k) => patch({ hotkeys: { menu: k } })} />
          <Button variant="ghost" onClick={() => patch({ hotkeys: { menu: 'ShiftRight' } })}>
            Reset
          </Button>
        </Row>
        <Row label="Zoom key" hint="Set in Visuals > Zoom.">
          <KeyCapture value={String(settings.modules.zoom.options.key ?? 'C')} onChange={(k) => patch({ modules: { zoom: { options: { key: k } } } })} />
        </Row>
      </Section>

      <Section title="Launcher">
        <Row label="Start with Windows" hint="Starts in the tray so the overlay is ready when you play.">
          <Toggle on={settings.launcher.startWithWindows} onChange={(v) => patch({ launcher: { startWithWindows: v } })} />
        </Row>
        <Row label="Minimise to tray on launch" hint="Hides this window when you press PLAY.">
          <Toggle on={settings.launcher.minimizeToTrayOnLaunch} onChange={(v) => patch({ launcher: { minimizeToTrayOnLaunch: v } })} />
        </Row>
        <Row label="Close to tray" hint="Keeps the overlay running after you close this window.">
          <Toggle on={settings.launcher.closeToTray} onChange={(v) => patch({ launcher: { closeToTray: v } })} />
        </Row>
      </Section>

      <Section title="Minecraft">
        <Row label="Edition">
          <Select
            value={settings.game.edition}
            onChange={(v) => {
              patch({ game: { edition: v } })
              setTimeout(() => void refreshBedrock(true), 300)
            }}
            options={[
              { value: 'release', label: 'Minecraft for Windows' },
              { value: 'preview', label: 'Minecraft Preview' }
            ]}
          />
        </Row>
        <div className="rounded-lg border border-line bg-black/20 p-3 text-xs">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-muted">
              Detected: <span className="text-ink">{bedrock?.installed ? 'installed' : 'not installed'}</span> · layout{' '}
              <span className="text-ink">{bedrock?.layout ?? 'none'}</span>
            </span>
            <button onClick={() => void refreshBedrock(true)} className="flex items-center gap-1 text-accent hover:underline">
              <RefreshCw size={12} /> Re-check
            </button>
          </div>
          {bedrock?.candidates.map((c) => (
            <div key={c.path} className="flex items-center gap-2 font-mono text-[11px]">
              <span className={c.exists ? 'text-good' : 'text-muted'}>{c.exists ? '●' : '○'}</span>
              <span className="text-muted">{c.layout.toUpperCase()}</span>
              <span className="truncate select-text">{c.path}</span>
            </div>
          ))}
          {bedrock?.sharedRoot && (
            <div className="mt-2 font-mono text-[11px] text-muted">
              Using: <span className="text-ink select-text">{bedrock.sharedRoot}</span>
            </div>
          )}
          {bedrock?.error && <div className="mt-2 text-warn">{bedrock.error}</div>}
        </div>
        <Row label="Game folder override" hint="Point at a com.mojang folder if detection picks the wrong one.">
          {settings.game.folderOverride && (
            <Button variant="ghost" onClick={() => patch({ game: { folderOverride: null } })}>
              Clear
            </Button>
          )}
          <Button onClick={() => void chooseFolder()}>
            <FolderOpen size={14} /> {settings.game.folderOverride ? 'Change' : 'Choose'}
          </Button>
        </Row>
      </Section>

      <Section title="Overlay" hint="A transparent, click-through window above the game. It only shows data from Windows and your own input. Run Minecraft borderless or windowed, since exclusive fullscreen hides it.">
        <Row label="Overlay">
          <Toggle on={settings.overlay.enabled} onChange={(v) => patch({ overlay: { enabled: v } })} />
        </Row>
        <Row label="Display">
          <Select
            value={String(settings.overlay.displayId ?? '')}
            onChange={(v) => patch({ overlay: { displayId: v ? Number(v) : null } })}
            options={[{ value: '', label: 'Primary display' }, ...displays.map((d) => ({ value: String(d.id), label: d.label }))]}
          />
        </Row>
        <Row label="Show when Minecraft isn't running" hint="Handy for testing the layout on the desktop.">
          <Toggle on={settings.overlay.showWhenGameNotRunning} onChange={(v) => patch({ overlay: { showWhenGameNotRunning: v } })} />
        </Row>
        <Row label="FPS reading" hint={`${FPS_TEXT[metrics?.fpsStatus ?? 'off']}${metrics?.fpsMessage ? `. ${metrics.fpsMessage}` : ''}`}>
          <Button onClick={() => void grant()} disabled={window.mc.platform !== 'win32'}>
            Allow FPS reading
          </Button>
        </Row>
        <p className="text-xs text-muted">
          FPS comes from PresentMon reading Windows frame events. Windows only allows that for admins or the Performance Log Users group. "Allow FPS reading" adds your account to that group once (you'll see a Windows permission prompt), then you sign out and back in.
        </p>
      </Section>

      <Section title="Server" hint="Used by the Ping module. This is an external ping from your PC, not your in-game latency.">
        <Row label="Server address">
          <TextInput value={settings.server.address} onChange={(v) => patch({ server: { address: v } })} placeholder="play.example.net" className="w-64" />
          <TextInput value={String(settings.server.port)} onChange={(v) => patch({ server: { port: Number(v.replace(/\D/g, '')) || 19132 } })} className="w-24" />
        </Row>
      </Section>

      <Section title="Backup" hint="Everything: settings, modules, every HUD layout. Imported add-on files stay on this PC.">
        <div className="flex gap-2">
          <Button onClick={() => void window.mc.settings.exportFile().then((r) => r.ok && setNote({ tone: 'good', text: `Saved to ${r.path}` }))}>
            <Download size={14} /> Export settings
          </Button>
          <Button
            onClick={() =>
              void window.mc.settings.importFile().then((r) => {
                if (r.settings) useApp.getState().setSettings(r.settings)
                if (r.ok) setNote({ tone: 'good', text: 'Settings imported.' })
                else if (r.error) setNote({ tone: 'bad', text: r.error })
              })
            }
          >
            <Upload size={14} /> Import settings
          </Button>
        </div>
      </Section>

      <Section title="Updates">
        <Row label={`Master Client ${version}`} hint={updateText(update)}>
          {update?.state === 'downloaded' ? (
            <Button variant="accent" onClick={() => void window.mc.app.installUpdate()}>
              Restart to update
            </Button>
          ) : (
            <Button onClick={() => void window.mc.app.checkForUpdates().then(setUpdate)} disabled={update?.state === 'dev'}>
              <RefreshCw size={14} /> Check now
            </Button>
          )}
        </Row>
      </Section>

      <p className="pb-6 text-center text-[11px] text-muted">
        Master Client is not an official Minecraft product and is not approved by or associated with Mojang or Microsoft.
      </p>
    </div>
  )
}

function updateText(u: UpdateStatus | null): string {
  switch (u?.state) {
    case 'dev':
      return 'Development build: updates are checked in installed builds only.'
    case 'checking':
      return 'Checking GitHub Releases…'
    case 'available':
    case 'downloading':
      return `Downloading ${u.version ?? 'update'}${u.progress != null ? ` (${u.progress}%)` : ''}`
    case 'downloaded':
      return `Version ${u.version} is ready.`
    case 'none':
      return 'You have the latest version.'
    case 'error':
      return `Couldn't check: ${u.error}`
    default:
      return 'Updates install from GitHub Releases.'
  }
}
