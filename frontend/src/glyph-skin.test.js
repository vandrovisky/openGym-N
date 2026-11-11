// The glyph skin's stylesheet (glyph.css) repeats lib/skin.js PALETTE as tokens; this keeps the
// two in step and checks that it loads after index.css.
import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { PALETTE } from './lib/skin.js'

const read = f => readFileSync(resolve(process.cwd(), 'src', f), 'utf8')
const css = read('glyph.css').replace(/\/\*[\s\S]*?\*\//g, '')
// The declarations of the top-level rule with exactly this selector (not one inside @media).
const topLevel = css.replace(/@media[^{]*\{(?:[^{}]*\{[^}]*\})*\s*\}/g, '')
const block = (sel, from = topLevel) => {
  const esc = sel.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  return from.match(new RegExp(`(?:^|[}\\s])${esc}\\s*\\{([^}]*)\\}`))?.[1] || ''
}
const SYSTEM = ['--blue', '--green', '--orange', '--yellow', '--teal', '--indigo', '--pink', '--purple', '--mint', '--brown']

describe('glyph.css', () => {
  it('defines the one red', () => {
    expect(css).toMatch(/--live:\s*#d71921/i)
  })
  it('has every dark palette colour in :root and every light one in the light theme', () => {
    const dark = block(':root').toLowerCase(), light = block(':root[data-theme="light"]').toLowerCase()
    for (const c of PALETTE.dark) expect(dark, c).toContain(c)
    for (const c of PALETTE.light) expect(light, c).toContain(c)
  })
  it('the light theme also greys the system colours and keeps the one red', () => {
    // index.css redefines them under :root[data-theme="light"], which outranks a plain :root.
    const light = block(':root[data-theme="light"]')
    for (const c of SYSTEM) expect(light, c).toContain(`${c}:var(--label-2)`)
    expect(light).toContain('--red:var(--live)')
    expect(light).toMatch(/--raised-line:\s*rgba\(11,11,11/)
  })
  it("counters index.css's Increase Contrast block, in both themes", () => {
    const media = css.match(/@media \(prefers-contrast: more\)\s*\{([\s\S]*)\}\s*$/)?.[1] || ''
    expect(media).not.toBe('')
    for (const sel of [':root', ':root[data-theme="light"]']) {
      const b = block(sel, media)
      for (const c of SYSTEM) expect(b, `${sel} ${c}`).toContain(`${c}:var(--label-2)`)
      expect(b, sel).toContain('--red:var(--live)')
      expect(b, sel).toContain('--label-2:#')
    }
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
