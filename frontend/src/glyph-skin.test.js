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

  describe('fonts', () => {
    const flat = css.replace(/\s+/g, ' ')
    it('declares the three families from ./fonts/, nothing from the network', () => {
      const faces = [...flat.matchAll(/@font-face\s*\{([^}]*)\}/g)].map(m => m[1])
      for (const fam of ['Doto', 'Space Grotesk', 'Space Mono']) {
        const mine = faces.filter(f => f.includes(`font-family:'${fam}'`) || f.includes(`font-family: '${fam}'`))
        expect(mine.length, fam).toBeGreaterThan(0)
        for (const f of mine) {
          expect(f, fam).toContain('url(./fonts/')
          expect(f, fam).toContain('font-display:swap')
        }
      }
      expect(faces.join(' ')).not.toMatch(/https?:/)
    })
    it('the UI and mono stacks end in a system fallback, and body uses the UI face', () => {
      const root = block(':root').replace(/\s+/g, '')
      expect(root).toMatch(/--font-ui:[^;]*system-ui,sans-serif;/)
      expect(root).toMatch(/--font-mono:[^;]*ui-monospace,monospace;/)
      expect(root).toMatch(/--font-dot:[^;]*monospace;/)
      expect(block('body')).toContain('font-family:var(--font-ui)')
    })
    it('Doto only appears with a size of at least 26px in the same rule', () => {
      // A rule's size is a px value (26px or more) or clamp(<px floor>, ...), floor at least 26px.
      const rules = [...css.matchAll(/([^{}]+)\{([^{}]*)\}/g)].filter(m => !/^\s*@font-face/.test(m[1]))
      const dot = rules.filter(m => /font-family:\s*var\(--font-dot\)/.test(m[2]))
      expect(dot.length).toBeGreaterThan(5)
      for (const [, sel, body] of dot) {
        const size = body.match(/(?:^|;)\s*font-size:\s*([^;]+)/)?.[1].replace(/\s+/g, '')
        const px = size?.match(/^(\d+(?:\.\d+)?)px$/)?.[1] || size?.match(/^clamp\((\d+(?:\.\d+)?)px,/)?.[1]
        expect(px, sel.trim()).toBeTruthy()
        expect(Number(px), sel.trim()).toBeGreaterThanOrEqual(26)
      }
    })
    it('has the .dot-num utility with the Doto axes and line height', () => {
      const b = block('.dot-num').replace(/\s+/g, '')
      expect(b).toContain('font-family:var(--font-dot)')
      expect(b).toContain('font-variation-settings:"ROND"100,"wght"900')
      expect(b).toContain('line-height:.85')
    })
    it('lays out numbers in Doto and labels in Space Mono', () => {
      for (const sel of ['#timer .t', '.streak-num', '.dw-read', '.recap-v'])
        expect(css, sel).toMatch(new RegExp(sel.replace(/[.#]/g, '\\$&') + '[^{]*\\{[^}]*--font-dot'))
      expect(css).toMatch(/letter-spacing:\s*\.14em/)
    })
  })
})
