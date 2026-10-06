import { useEffect, useRef } from 'react'
import type { ZoomState } from '@shared/ipc'
import type { Settings } from '@shared/types'

// Zoom: a magnifier fed by a capture of the screen the overlay sits on. While the
// capture runs, the overlay hides itself from capture (so it doesn't zoom into
// itself). The capture stops 30 seconds after the last zoom.

let stream: MediaStream | null = null
let stopTimer: ReturnType<typeof setTimeout> | null = null

// Electron's desktop capture by source id works from a hotkey. getDisplayMedia can
// insist on a click first, so it's only the fallback.
async function openCapture(): Promise<MediaStream> {
  const id = await window.mc.overlay.captureSourceId()
  if (id) {
    try {
      const constraints = {
        audio: false,
        video: { mandatory: { chromeMediaSource: 'desktop', chromeMediaSourceId: id, maxFrameRate: 60 } }
      } as unknown as MediaStreamConstraints
      return await navigator.mediaDevices.getUserMedia(constraints)
    } catch {
      // fall through
    }
  }
  return navigator.mediaDevices.getDisplayMedia({ video: { frameRate: 60 }, audio: false })
}

async function ensureStream(video: HTMLVideoElement): Promise<boolean> {
  if (stopTimer) clearTimeout(stopTimer)
  stopTimer = null
  if (stream && stream.active) {
    if (video.srcObject !== stream) video.srcObject = stream
    return true
  }
  try {
    window.mc.overlay.setCaptureActive(true)
    stream = await openCapture()
    video.srcObject = stream
    await video.play()
    return true
  } catch {
    window.mc.overlay.setCaptureActive(false)
    stream = null
    return false
  }
}

function scheduleStop(): void {
  if (stopTimer) clearTimeout(stopTimer)
  stopTimer = setTimeout(() => {
    stream?.getTracks().forEach((t) => t.stop())
    stream = null
    window.mc.overlay.setCaptureActive(false)
  }, 30_000)
}

export function Zoom({ zoom, settings }: { zoom: ZoomState; settings: Settings }) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const level = useRef(1)
  const target = useRef(zoom)
  target.current = zoom
  const o = settings.modules.zoom.options
  const smooth = o.smooth !== false
  const lens = o.shape === 'lens'
  const lensSize = Number(o.lensSize ?? 50) / 100

  useEffect(() => {
    const video = videoRef.current!
    const canvas = canvasRef.current!
    if (zoom.active) void ensureStream(video)
    else scheduleStop()
    let raf = 0
    const frame = () => {
      const want = target.current.active ? target.current.level : 1
      level.current = smooth ? level.current + (want - level.current) * 0.22 : want
      const dpr = window.devicePixelRatio || 1
      const w = Math.round(window.innerWidth * dpr)
      const h = Math.round(window.innerHeight * dpr)
      if (canvas.width !== w || canvas.height !== h) {
        canvas.width = w
        canvas.height = h
      }
      const g = canvas.getContext('2d')!
      g.clearRect(0, 0, w, h)
      const z = level.current
      const visible = z > 1.01 && video.readyState >= 2
      if (visible) {
        const vw = video.videoWidth
        const vh = video.videoHeight
        const sw = vw / z
        const sh = vh / z
        g.save()
        if (lens) {
          const r = (Math.min(w, h) * lensSize) / 2
          g.beginPath()
          g.arc(w / 2, h / 2, r, 0, Math.PI * 2)
          g.clip()
        }
        g.imageSmoothingEnabled = true
        g.drawImage(video, (vw - sw) / 2, (vh - sh) / 2, sw, sh, 0, 0, w, h)
        g.restore()
        if (lens) {
          g.beginPath()
          g.arc(w / 2, h / 2, (Math.min(w, h) * lensSize) / 2, 0, Math.PI * 2)
          g.lineWidth = 3 * dpr
          g.strokeStyle = 'rgba(255,255,255,0.7)'
          g.stroke()
        }
      }
      if (target.current.active || z > 1.01) raf = requestAnimationFrame(frame)
    }
    raf = requestAnimationFrame(frame)
    return () => cancelAnimationFrame(raf)
  }, [zoom.active, zoom.level, smooth, lens, lensSize])

  return (
    <>
      <video ref={videoRef} muted playsInline className="hidden" />
      <canvas ref={canvasRef} className="pointer-events-none fixed inset-0 h-full w-full" />
    </>
  )
}
