import { useEffect, useState } from 'react'
import { FileUp, FolderOpen, Puzzle, ShieldCheck, Trash2 } from 'lucide-react'
import type { AddonInfo, ImportResult } from '@shared/ipc'
import { useApp } from '../lib/store'
import { Banner, Button, Card, Toggle } from '../components/ui'

const KIND: Record<AddonInfo['kind'], string> = { resources: 'Resource pack', data: 'Behaviour pack', addon: 'Add-On (behaviour + resources)' }

export function Mods() {
  const bedrock = useApp((s) => s.bedrock)
  const [addons, setAddons] = useState<AddonInfo[]>([])
  const [busy, setBusy] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<ImportResult | null>(null)

  useEffect(() => {
    void window.mc.addons.list().then(setAddons)
  }, [])

  const toggle = async (a: AddonInfo, on: boolean) => {
    setBusy(a.id)
    setError(null)
    try {
      setAddons(await window.mc.addons.setEnabled(a.id, on))
    } catch (e) {
      setError((e as Error).message.replace(/^Error invoking remote method '[^']+': (Error: )?/, ''))
    } finally {
      setBusy(null)
    }
  }

  const importFile = async () => {
    setBusy('import')
    setResult(null)
    try {
      const r = await window.mc.addons.importFile()
      if (!r.cancelled) setResult(r)
      setAddons(await window.mc.addons.list())
    } catch (e) {
      setResult({ ok: false, error: (e as Error).message })
    } finally {
      setBusy(null)
    }
  }

  const remove = async (a: AddonInfo) => {
    setBusy(a.id)
    try {
      setAddons(await window.mc.addons.remove(a.id))
    } finally {
      setBusy(null)
    }
  }

  return (
    <div className="page-enter space-y-6">
      <div className="flex items-end justify-between gap-6">
        <div>
          <h1 className="font-pixel text-4xl">Mods</h1>
          <p className="mt-2 max-w-3xl text-sm text-muted">
            Official Bedrock Add-Ons. Resource packs go into Global Resources, so they apply everywhere. Behaviour packs are turned on per world: open a world's settings, then Behavior Packs, and activate it there.
          </p>
        </div>
        <div className="flex shrink-0 gap-2">
          <Button onClick={() => void window.mc.bedrock.openFolder('devBp')} disabled={!bedrock?.sharedRoot}>
            <FolderOpen size={15} /> Packs folder
          </Button>
          <Button variant="accent" onClick={() => void importFile()} disabled={busy === 'import'}>
            <FileUp size={15} /> Import .mcpack / .mcaddon
          </Button>
        </div>
      </div>

      <div className="flex items-start gap-2 text-xs text-muted">
        <ShieldCheck size={14} className="mt-0.5 shrink-0 text-good" />
        Imports are checked before anything is installed: the manifest must be valid, and only JSON, images, sounds, translations, command files and Script API JavaScript are allowed. Executables are rejected.
      </div>

      {error && (
        <Banner tone="bad" onClose={() => setError(null)}>
          {error}
        </Banner>
      )}
      {result && (
        <Banner tone={result.ok ? 'good' : 'bad'} onClose={() => setResult(null)}>
          <div className="font-semibold">{result.ok ? `Imported ${result.packs?.map((p) => p.name).join(', ')}` : result.error}</div>
          {result.problems && (
            <ul className="mt-2 list-disc space-y-0.5 pl-4 text-xs text-muted">
              {result.problems.map((p) => (
                <li key={p}>{p}</li>
              ))}
            </ul>
          )}
        </Banner>
      )}

      <div className="grid grid-cols-2 gap-4">
        {addons.map((a) => (
          <Card key={a.id} className="flex gap-4 p-5">
            {a.icon ? (
              <img src={a.icon} alt="" className="h-16 w-16 shrink-0 rounded-xl" style={{ imageRendering: 'pixelated' }} />
            ) : (
              <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-xl bg-white/5 text-muted">
                <Puzzle />
              </div>
            )}
            <div className="min-w-0 flex-1">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="font-semibold">{a.name}</div>
                  <div className="mt-0.5 text-[11px] tracking-wide text-muted uppercase">
                    {KIND[a.kind]} · v{a.version} {a.builtin ? '· Starter' : '· Imported'}
                  </div>
                </div>
                <Toggle on={a.enabled} disabled={busy === a.id || !bedrock?.sharedRoot} onChange={(v) => void toggle(a, v)} label={a.name} />
              </div>
              <p className="mt-2 text-sm text-muted">{a.description}</p>
              {a.details.length > 0 && (
                <ul className="mt-2 space-y-0.5 text-xs text-muted">
                  {a.details.map((d) => (
                    <li key={d}>· {d}</li>
                  ))}
                </ul>
              )}
              {a.perWorld && <div className="mt-2 rounded-md bg-emerald-500/10 px-2 py-1 text-xs text-emerald-300">Behaviour pack: turn it on per world in that world's Behavior Packs.</div>}
              {!a.builtin && (
                <button onClick={() => void remove(a)} className="mt-3 flex items-center gap-1 text-xs text-bad hover:underline">
                  <Trash2 size={12} /> Remove
                </button>
              )}
            </div>
          </Card>
        ))}
      </div>
      {!bedrock?.sharedRoot && <p className="text-xs text-muted">Minecraft's data folder wasn't found, so add-ons can't be installed yet. {bedrock?.error}</p>}
    </div>
  )
}
