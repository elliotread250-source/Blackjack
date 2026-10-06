import { net } from 'electron'
import type { NewsItem } from '@shared/ipc'

// News: Master Client's own release notes from GitHub, plus a few built-in tips.
// No server of ours involved; GitHub's public API is read directly.

const RELEASES = 'https://api.github.com/repos/elliotread250-source/Blackjack/releases?per_page=10'

const BUILT_IN: NewsItem[] = [
  {
    id: 'tip-borderless',
    title: 'Overlay modules need borderless or windowed Minecraft',
    date: '2026-10-01',
    tag: 'tip',
    body: 'Keystrokes, CPS, FPS, ping, zoom and the overlay crosshair draw in a window above the game. Exclusive fullscreen hides them, so run Minecraft borderless or windowed.'
  },
  {
    id: 'tip-rejoin',
    title: 'Pack modules apply when you rejoin',
    date: '2026-10-01',
    tag: 'tip',
    body: 'HUD positions, fog, crosshair textures and the other pack modules are written into the Master Client resource pack. Leave and rejoin your world or server to see changes. Some servers force their own packs, which can override these.'
  },
  {
    id: 'notice-account',
    title: 'Your Master Client account is separate from Microsoft',
    date: '2026-10-01',
    tag: 'notice',
    body: 'The launcher account only unlocks Master Client on this PC. Minecraft still signs in with your Microsoft account, which Master Client never sees.'
  }
]

export async function fetchNews(version: string): Promise<NewsItem[]> {
  const items: NewsItem[] = []
  try {
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), 4000)
    const res = await net.fetch(RELEASES, {
      headers: { Accept: 'application/vnd.github+json', 'User-Agent': `MasterClient/${version}` },
      signal: controller.signal
    })
    clearTimeout(timer)
    if (res.ok) {
      const releases = (await res.json()) as { id: number; tag_name: string; name: string | null; body: string | null; published_at: string; html_url: string; draft: boolean }[]
      for (const r of releases) {
        if (r.draft || !r.tag_name.startsWith('master-client-v')) continue
        items.push({
          id: `release-${r.id}`,
          title: r.name || `Master Client ${r.tag_name.replace('master-client-v', '')}`,
          date: r.published_at.slice(0, 10),
          body: (r.body ?? '').slice(0, 1200) || 'Bug fixes and improvements.',
          url: r.html_url,
          tag: 'release'
        })
      }
    }
  } catch {
    // Offline or rate limited: the built-in items still show.
  }
  return [...items, ...BUILT_IN]
}
