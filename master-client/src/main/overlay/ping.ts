import { randomBytes } from 'node:crypto'
import { createSocket } from 'node:dgram'
import { lookup } from 'node:dns/promises'
import type { PingStatus } from '@shared/ipc'
import { run } from '../bedrock'

// "Server ping (external)": Master Client's own round trip to the server you type
// in. It sends the same public RakNet status ping the server list uses, from its
// own socket, so it's nothing to do with the game's connection. If the server
// doesn't answer that, it falls back to an ICMP ping.

const MAGIC = Buffer.from('00ffff00fefefefefdfdfdfd12345678', 'hex')
const CLIENT_GUID = randomBytes(8)

export function unconnectedPing(nowMs: bigint): Buffer {
  const b = Buffer.alloc(1 + 8 + 16 + 8)
  b[0] = 0x01
  b.writeBigInt64BE(nowMs, 1)
  MAGIC.copy(b, 9)
  CLIENT_GUID.copy(b, 25)
  return b
}

export interface PongInfo {
  motd?: string
  players?: string
}

export function parsePong(msg: Buffer): PongInfo | null {
  if (msg.length < 35 || msg[0] !== 0x1c) return null
  if (!msg.subarray(17, 33).equals(MAGIC)) return null
  const len = msg.readUInt16BE(33)
  const text = msg.subarray(35, 35 + len).toString('utf8')
  const parts = text.split(';')
  return { motd: parts[1], players: parts[4] && parts[5] ? `${parts[4]}/${parts[5]}` : undefined }
}

export async function raknetPing(host: string, port: number, timeoutMs = 1500): Promise<{ ms: number; info: PongInfo }> {
  const { address, family } = await lookup(host)
  return new Promise((resolve, reject) => {
    const sock = createSocket(family === 6 ? 'udp6' : 'udp4')
    const start = process.hrtime.bigint()
    const timer = setTimeout(() => {
      sock.close()
      reject(new Error('timeout'))
    }, timeoutMs)
    sock.on('message', (msg) => {
      const info = parsePong(msg)
      if (!info) return
      clearTimeout(timer)
      const ms = Number(process.hrtime.bigint() - start) / 1e6
      sock.close()
      resolve({ ms, info })
    })
    sock.on('error', (e) => {
      clearTimeout(timer)
      sock.close()
      reject(e)
    })
    sock.send(unconnectedPing(BigInt(Date.now())), port, address)
  })
}

export async function icmpPing(host: string): Promise<number> {
  const win = process.platform === 'win32'
  const r = await run('ping', win ? ['-n', '1', '-w', '1500', host] : ['-c', '1', '-W', '2', host], 4000)
  const m = /time[=<]\s*([\d.]+)\s*ms/i.exec(r.stdout)
  if (!m) throw new Error('no reply')
  return Number(m[1])
}

export class PingService {
  private timer: NodeJS.Timeout | null = null
  private busy = false
  ping: number | null = null
  status: PingStatus = 'off'
  method: 'raknet' | 'icmp' | undefined
  motd: string | undefined
  private target = { host: '', port: 19132, intervalSec: 2 }

  configure(host: string, port: number, intervalSec: number, enabled: boolean): void {
    const changed = host !== this.target.host || port !== this.target.port || intervalSec !== this.target.intervalSec
    this.target = { host: host.trim(), port, intervalSec }
    if (!enabled) return this.stop()
    if (!this.target.host) {
      this.stop()
      this.status = 'no-address'
      return
    }
    if (changed || !this.timer) {
      this.stop()
      this.status = 'ok'
      void this.tick()
      this.timer = setInterval(() => void this.tick(), Math.max(1, intervalSec) * 1000)
    }
  }

  stop(): void {
    if (this.timer) clearInterval(this.timer)
    this.timer = null
    this.status = 'off'
    this.ping = null
  }

  private async tick(): Promise<void> {
    if (this.busy) return
    this.busy = true
    const { host, port } = this.target
    try {
      const r = await raknetPing(host, port)
      this.ping = Math.round(r.ms)
      this.method = 'raknet'
      this.motd = r.info.motd
      this.status = 'ok'
    } catch {
      try {
        this.ping = Math.round(await icmpPing(host))
        this.method = 'icmp'
        this.status = 'ok'
      } catch {
        this.ping = null
        this.status = 'timeout'
      }
    } finally {
      this.busy = false
    }
  }
}
