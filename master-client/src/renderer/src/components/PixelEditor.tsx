import { useRef } from 'react'
import { Button } from './ui'

// 15x15 crosshair texture editor. Click or drag to paint, right-click to erase.

const PRESETS: Record<string, string[]> = {
  Plus: [
    '...............', '...............', '...............', '.......#.......', '.......#.......', '.......#.......', '.......#.......',
    '...####.####...', '.......#.......', '.......#.......', '.......#.......', '.......#.......', '...............', '...............', '...............'
  ],
  Dot: [
    '...............', '...............', '...............', '...............', '...............', '...............', '......###......',
    '......###......', '......###......', '...............', '...............', '...............', '...............', '...............', '...............'
  ],
  Gap: [
    '...............', '.......#.......', '.......#.......', '.......#.......', '.......#.......', '...............', '...............',
    '.####.....####.', '...............', '...............', '.......#.......', '.......#.......', '.......#.......', '.......#.......', '...............'
  ],
  Circle: [
    '...............', '...............', '.....#####.....', '....#.....#....', '...#.......#...', '...#.......#...', '...#.......#...',
    '...#...#...#...', '...#.......#...', '...#.......#...', '...#.......#...', '....#.....#....', '.....#####.....', '...............', '...............'
  ],
  X: [
    '...............', '...............', '..#.........#..', '...#.......#...', '....#.....#....', '.....#...#.....', '...............',
    '.......#.......', '...............', '.....#...#.....', '....#.....#....', '...#.......#...', '..#.........#..', '...............', '...............'
  ],
  T: [
    '...............', '...............', '...............', '...............', '...............', '...............', '...............',
    '...####.####...', '.......#.......', '.......#.......', '.......#.......', '.......#.......', '...............', '...............', '...............'
  ]
}

export function PixelEditor({ value, color, onChange }: { value: string[]; color: string; onChange: (rows: string[]) => void }) {
  const painting = useRef<'#' | '.' | null>(null)
  const rows = value.length === 15 ? value : PRESETS.Plus
  const setPixel = (x: number, y: number, ch: '#' | '.') => {
    if (rows[y][x] === ch) return
    const next = rows.map((r, i) => (i === y ? r.slice(0, x) + ch + r.slice(x + 1) : r))
    onChange(next)
  }
  return (
    <div className="space-y-3">
      <div className="flex gap-4">
        <div
          className="checker grid touch-none rounded-lg border border-line p-1"
          style={{ gridTemplateColumns: 'repeat(15, 16px)' }}
          onPointerUp={() => (painting.current = null)}
          onPointerLeave={() => (painting.current = null)}
          onContextMenu={(e) => e.preventDefault()}
        >
          {rows.flatMap((r, y) =>
            [...r].map((ch, x) => (
              <div
                key={`${x}-${y}`}
                onPointerDown={(e) => {
                  painting.current = e.button === 2 ? '.' : ch === '#' ? '.' : '#'
                  setPixel(x, y, painting.current)
                }}
                onPointerEnter={() => painting.current && setPixel(x, y, painting.current)}
                className="h-4 w-4 border border-white/5"
                style={{ background: ch === '#' ? color : x === 7 && y === 7 ? 'rgba(255,255,255,0.06)' : 'transparent' }}
              />
            ))
          )}
        </div>
        <div className="flex h-[132px] flex-col items-center justify-center gap-2 self-start rounded-lg border border-line bg-[#6aa0d8] p-4">
          <div className="grid" style={{ gridTemplateColumns: 'repeat(15, 3px)' }}>
            {rows.flatMap((r, y) => [...r].map((ch, x) => <div key={`p${x}-${y}`} style={{ width: 3, height: 3, background: ch === '#' ? color : 'transparent' }} />))}
          </div>
          <span className="text-[10px] text-black/60">In game</span>
        </div>
      </div>
      <div className="flex flex-wrap gap-2">
        {Object.entries(PRESETS).map(([name, p]) => (
          <Button key={name} onClick={() => onChange([...p])}>
            {name}
          </Button>
        ))}
        <Button variant="ghost" onClick={() => onChange(Array(15).fill('.'.repeat(15)))}>
          Clear
        </Button>
      </div>
      <p className="text-xs text-muted">Bedrock draws its crosshair with blending that can invert colours on bright backgrounds, so the colour can look different in game.</p>
    </div>
  )
}
