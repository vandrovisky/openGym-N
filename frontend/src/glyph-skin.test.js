// The glyph skin's stylesheet (glyph.css) repeats lib/skin.js PALETTE as tokens; this keeps the
// two in step and checks that it loads after index.css.
import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { PALETTE } from './lib/skin.js'

const read = f => readFileSync(resolve(process.cwd(), 'src', f), 'utf8')
const css = read('glyph.css').replace(/\/\*[\s\S]*?\*\//g, '')
const block = sel => {
  const esc = sel.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  return css.match(new RegExp(`(?:^|[}\\s])${esc}\\s*\\{([^}]*)\\}`))?.[1] || ''
}

describe('glyph.css', () => {
  it('defines the one red', () => {
    expect(css).toMatch(/--live:\s*#d71921/i)
  })
  it('has every dark palette colour in :root and every light one in the light theme', () => {
    const dark = block(':root').toLowerCase(), light = block(':root[data-theme="light"]').toLowerCase()
    for (const c of PALETTE.dark) expect(dark, c).toContain(c)
    for (const c of PALETTE.light) expect(light, c).toContain(c)
  })
  it('defines the three font tokens', () => {
    for (const f of ['--font-dot', '--font-ui', '--font-mono']) expect(block(':root')).toContain(f)
  })
  it('main.jsx imports it after index.css', () => {
    const lines = read('main.jsx').split('\n')
    const at = n => lines.findIndex(l => l.includes(`'${n}'`))
    expect(at('./index.css')).toBeGreaterThan(-1)
    expect(at('./glyph.css')).toBeGreaterThan(at('./index.css'))
  })
})
