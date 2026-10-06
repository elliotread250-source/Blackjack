import { posix } from 'node:path'
import yauzl from 'yauzl'
import { LIMITS, type ZipEntry } from './scan'

function openBuffer(buf: Buffer): Promise<yauzl.ZipFile> {
  return new Promise((resolve, reject) =>
    yauzl.fromBuffer(buf, { lazyEntries: true, decodeStrings: true, validateEntrySizes: true, strictFileNames: false }, (err, zip) =>
      err || !zip ? reject(err ?? new Error('Not a zip file')) : resolve(zip)
    )
  )
}

/**
 * Reads every entry of a zip into memory with hard limits checked against the
 * declared sizes before inflating, and against the real bytes while inflating
 * (zip bombs). A nested .mcpack (as found in .mcaddon files) is unpacked one
 * level deep into a folder of the same name.
 */
export async function readZip(buf: Buffer, depth = 0): Promise<ZipEntry[]> {
  const zip = await openBuffer(buf)
  const out: ZipEntry[] = []
  let total = 0
  return new Promise((resolve, reject) => {
    const fail = (e: Error) => {
      zip.close()
      reject(e)
    }
    zip.on('error', fail)
    zip.on('end', () => resolve(out))
    zip.on('entry', (entry: yauzl.Entry) => {
      if (out.length >= LIMITS.maxEntries) return fail(new Error('Too many files in the archive.'))
      if (/\/$/.test(entry.fileName)) return zip.readEntry()
      // Symlinks (unix mode in the high bits) are never allowed.
      const mode = (entry.externalFileAttributes >>> 16) & 0o170000
      if (mode === 0o120000) return fail(new Error(`Symbolic link in archive: ${entry.fileName}`))
      if (entry.uncompressedSize > LIMITS.maxFileBytes) return fail(new Error(`File too large: ${entry.fileName}`))
      if (total + entry.uncompressedSize > LIMITS.maxTotalBytes) return fail(new Error('Archive is too large once unpacked.'))
      zip.openReadStream(entry, (err, stream) => {
        if (err || !stream) return fail(err ?? new Error('Could not read archive'))
        const chunks: Buffer[] = []
        let size = 0
        stream.on('data', (c: Buffer) => {
          size += c.length
          if (size > LIMITS.maxFileBytes || total + size > LIMITS.maxTotalBytes) {
            stream.destroy()
            fail(new Error('Archive is too large once unpacked.'))
            return
          }
          chunks.push(c)
        })
        stream.on('error', fail)
        stream.on('end', async () => {
          const data = Buffer.concat(chunks)
          total += data.length
          const lower = entry.fileName.toLowerCase()
          if ((lower.endsWith('.mcpack') || lower.endsWith('.zip')) && depth === 0) {
            try {
              const inner = await readZip(data, depth + 1)
              const prefix = entry.fileName.replace(/\.(mcpack|zip)$/i, '')
              for (const e of inner) out.push({ path: posix.join(prefix, e.path), data: e.data })
            } catch (e) {
              return fail(new Error(`Couldn't read ${entry.fileName}: ${(e as Error).message}`))
            }
          } else {
            out.push({ path: entry.fileName, data })
          }
          zip.readEntry()
        })
      })
    })
    zip.readEntry()
  })
}
