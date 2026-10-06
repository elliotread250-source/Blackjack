import { useEffect, useState } from 'react'
import { ExternalLink } from 'lucide-react'
import type { NewsItem } from '@shared/ipc'
import { Card, cx } from '../components/ui'

const TAG: Record<NewsItem['tag'], string> = {
  release: 'bg-accent/15 text-accent',
  tip: 'bg-sky-500/15 text-sky-300',
  notice: 'bg-white/10 text-ink/80'
}

export function News() {
  const [items, setItems] = useState<NewsItem[] | null>(null)
  useEffect(() => {
    void window.mc.app.news().then(setItems)
  }, [])
  return (
    <div className="page-enter mx-auto max-w-3xl space-y-5">
      <h1 className="font-pixel text-4xl">News</h1>
      {!items && <div className="text-sm text-muted">Loading…</div>}
      {items?.map((n) => (
        <Card key={n.id} className="p-5">
          <div className="flex items-center gap-2">
            <span className={cx('rounded-md px-1.5 py-0.5 text-[10px] font-semibold tracking-wide uppercase', TAG[n.tag])}>{n.tag}</span>
            <span className="text-xs text-muted">{n.date}</span>
          </div>
          <div className="mt-2 text-lg font-semibold">{n.title}</div>
          <p className="mt-1 text-sm whitespace-pre-line text-muted select-text">{n.body}</p>
          {n.url && (
            <button onClick={() => void window.mc.app.openExternal(n.url!)} className="mt-3 flex items-center gap-1 text-xs text-accent hover:underline">
              Read on GitHub <ExternalLink size={12} />
            </button>
          )}
        </Card>
      ))}
    </div>
  )
}
