// Bedrock's JSON files allow // and /* */ comments and trailing commas. This strips
// them (outside of strings) so the result goes through JSON.parse.
export function stripJsonComments(text: string): string {
  let out = ''
  let i = 0
  let inString = false
  while (i < text.length) {
    const c = text[i]
    const n = text[i + 1]
    if (inString) {
      out += c
      if (c === '\\') {
        out += n ?? ''
        i += 2
        continue
      }
      if (c === '"') inString = false
      i++
      continue
    }
    if (c === '"') {
      inString = true
      out += c
      i++
    } else if (c === '/' && n === '/') {
      while (i < text.length && text[i] !== '\n') i++
    } else if (c === '/' && n === '*') {
      i += 2
      while (i < text.length && !(text[i] === '*' && text[i + 1] === '/')) i++
      i += 2
    } else {
      out += c
      i++
    }
  }
  // Trailing commas before } or ]
  return out.replace(/,(\s*[}\]])/g, '$1')
}

export function parseJsonc<T = unknown>(text: string): T {
  return JSON.parse(stripJsonComments(text.replace(/^﻿/, ''))) as T
}
