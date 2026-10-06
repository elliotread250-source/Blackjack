import { type ChildProcess, spawn } from 'node:child_process'
import { cpus, freemem, totalmem } from 'node:os'
import { createInterface } from 'node:readline'

// PC-wide CPU, GPU and RAM use for the Debug menu. CPU and RAM come from Node;
// GPU is the Windows "GPU Engine" performance counter (the same numbers Task
// Manager shows), read with the built-in typeperf tool.

export class SystemStats {
  private last = cpuTimes()
  private gpuProc: ChildProcess | null = null
  private gpuRestart: NodeJS.Timeout | null = null
  private running = false
  cpu: number | null = null
  gpu: number | null = null

  start(): void {
    if (this.running) return
    this.running = true
    this.startGpu()
  }

  stop(): void {
    this.running = false
    if (this.gpuRestart) clearTimeout(this.gpuRestart)
    this.gpuRestart = null
    this.gpuProc?.kill()
    this.gpuProc = null
    this.gpu = null
  }

  sample(): { cpu: number | null; gpu: number | null; ram: { used: number; total: number } } {
    const now = cpuTimes()
    const idle = now.idle - this.last.idle
    const total = now.total - this.last.total
    if (total > 0) this.cpu = Math.round(Math.max(0, Math.min(100, (1 - idle / total) * 100)))
    this.last = now
    const t = totalmem()
    return { cpu: this.cpu, gpu: this.gpu, ram: { used: t - freemem(), total: t } }
  }

  private startGpu(): void {
    if (!this.running || process.platform !== 'win32') return
    // typeperf fixes its counter instances at start, so restart it every minute to
    // include engines from programs started since.
    const proc = spawn('typeperf', ['\\GPU Engine(*engtype_3D)\\Utilization Percentage', '-si', '1', '-sc', '60'], {
      windowsHide: true,
      stdio: ['ignore', 'pipe', 'ignore']
    })
    this.gpuProc = proc
    let header = true
    createInterface({ input: proc.stdout! }).on('line', (line) => {
      if (!line.startsWith('"')) return
      if (header) {
        header = false
        return
      }
      const values = line
        .split('","')
        .slice(1)
        .map((v) => Number(v.replace(/"/g, '')))
        .filter((v) => Number.isFinite(v))
      if (values.length > 0) this.gpu = Math.round(Math.min(100, values.reduce((a, b) => a + b, 0)))
    })
    proc.on('error', () => {
      this.gpu = null
    })
    proc.on('exit', () => {
      this.gpuProc = null
      if (this.running) this.gpuRestart = setTimeout(() => this.startGpu(), 1000)
    })
  }
}

function cpuTimes(): { idle: number; total: number } {
  let idle = 0
  let total = 0
  for (const c of cpus()) {
    idle += c.times.idle
    total += c.times.user + c.times.nice + c.times.sys + c.times.idle + c.times.irq
  }
  return { idle, total }
}
