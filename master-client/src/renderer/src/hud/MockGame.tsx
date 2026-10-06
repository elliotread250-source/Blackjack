// A stand-in for Minecraft's own HUD (hotbar, hearts, hunger, XP, crosshair) so
// the editor shows where your modules sit relative to the game. Drawn with CSS.

export function MockGame({ scale }: { scale: number }) {
  const slot = 40
  return (
    <div className="pointer-events-none absolute inset-0">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" style={{ width: 18 * scale, height: 18 * scale }}>
        <div className="absolute top-1/2 left-0 h-[2px] w-full -translate-y-1/2 bg-white/90 mix-blend-difference" />
        <div className="absolute top-0 left-1/2 h-full w-[2px] -translate-x-1/2 bg-white/90 mix-blend-difference" />
      </div>
      <div className="absolute bottom-0 left-1/2 origin-bottom" style={{ transform: `translateX(-50%) scale(${scale})`, width: slot * 9 + 8 }}>
        <div className="mb-1 flex justify-between px-1">
          <div className="flex gap-[2px]">
            {Array.from({ length: 10 }, (_, i) => (
              <div key={i} className="h-[14px] w-[14px] rotate-45 rounded-[3px] border border-black/60 bg-red-500" style={{ transform: 'rotate(45deg) scale(0.75)' }} />
            ))}
          </div>
          <div className="flex gap-[2px]">
            {Array.from({ length: 10 }, (_, i) => (
              <div key={i} className="h-[13px] w-[13px] rounded-full border border-black/60 bg-amber-600" style={{ transform: 'scale(0.8)' }} />
            ))}
          </div>
        </div>
        <div className="relative mx-1 mb-1 h-[8px] bg-black/60">
          <div className="h-full w-[62%] bg-lime-400/90" />
          <span className="absolute -top-[18px] left-1/2 -translate-x-1/2 font-pixel text-[15px] text-lime-300" style={{ textShadow: '2px 2px 0 #000' }}>
            30
          </span>
        </div>
        <div className="flex border-2 border-black/70 bg-black/40">
          {Array.from({ length: 9 }, (_, i) => (
            <div key={i} className="relative border border-white/15" style={{ width: slot, height: slot }}>
              {i === 0 && <div className="absolute -inset-[3px] border-[3px] border-white" />}
              {i < 5 && <div className="absolute inset-[9px] rounded-sm" style={{ background: ['#8b8b8b', '#5fb3ff', '#c27b3a', '#e2c75f', '#7ad15a'][i] }} />}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
