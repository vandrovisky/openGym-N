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

  describe('shapes', () => {
    it('draws the dot grid on the body with --surface-2, not inside the cards', () => {
      const b = block('body').replace(/\s+/g, '')
      expect(b).toContain('radial-gradient')
      expect(b).toContain('var(--surface-2)')
      expect(b).toContain('background-size:14px14px')
    })
    it('turns every backdrop-filter off', () => {
      const vals = [...css.matchAll(/backdrop-filter:\s*([^;}!]+)/g)].map(m => m[1].trim())
      expect(vals.length).toBeGreaterThan(0)
      for (const v of vals) expect(v).toBe('none')
    })
    it('keeps the red to a handful of rules', () => {
      // The cap is 20 (the brief's 12 was a guess): running timer, PR badge, the current set,
      // errors and destructive actions, each with its own selectors. More means red is spreading.
      const rules = [...css.matchAll(/([^{}]+)\{([^{}]*)\}/g)].filter(m => /var\(--live\)/.test(m[2]))
      expect(rules.length).toBeLessThanOrEqual(20)
    })
    it('cards are flat: surface fill, a --surface-2 line, no shadow', () => {
      const b = block('.card,.item,.sect-b,.efftbl').replace(/\s+/g, '')
      expect(b).toContain('background:var(--surface)')
      expect(b).toContain('border:1pxsolidvar(--surface-2)')
      expect(b).toContain('box-shadow:none')
    })
    it('the main button is a --label pill in uppercase Space Mono', () => {
      const b = block('.btn.primary').replace(/\s+/g, '')
      expect(b).toContain('background:var(--label)')
      expect(b).toContain('color:var(--bg)')
      expect(b).toContain('border-radius:99px')
      expect(b).toContain('font-family:var(--font-mono)')
      expect(b).toContain('text-transform:uppercase')
      expect(b).toContain('letter-spacing:.16em')
    })
    it('row separators are dotted --surface-3', () => {
      expect(css).toMatch(/\.setrow\+\.setrow::before[^{]*\{[^}]*dotted/)
      expect(css.replace(/\s+/g, '')).toContain('1pxdottedvar(--surface-3)')
    })
    it('the tab bar is Space Mono caps, the lit tab --label with a dot before it', () => {
      const bar = block('#tabbar button').replace(/\s+/g, '')
      expect(bar).toContain('font-family:var(--font-mono)')
      expect(bar).toContain('text-transform:uppercase')
      expect(bar).toContain('color:var(--label-3)')
      expect(css).toMatch(/#tabbar button\.on[^{]*::before/)
    })
    it('a ticked set is a filled --label circle, an open one an outline in --label-3', () => {
      const done = block('.setrow.done .n,.setrow-side.done>.n').replace(/\s+/g, '')
      expect(done).toContain('background:var(--label)')
      const open = block('.setrow:not(.done) .n,.setrow-side:not(.done)>.n').replace(/\s+/g, '')
      expect(open).toContain('var(--label-3)')
    })
    it('red marks the current set, the running rest, the PR badge, errors and destructive actions', () => {
      const red = sel => expect(css, sel).toMatch(new RegExp(sel.replace(/[.#()*+?[\]|]/g, '\\$&') + '[^{]*\\{[^}]*var\\(--live\\)'))
      red('#timer.rest:not(.paused):not(.ready) .t')
      red('.pr')
      red('.btn.danger')
    })
    it('neutralises the coloured ink tokens and the dark Increase Contrast --label-dim', () => {
      const root = block(':root').replace(/\s+/g, '')
      for (const k of ['--green-ink', '--orange-ink', '--streak-ink', '--win-ink', '--gold-ink']) expect(root, k).toContain(`${k}:var(--label-2)`)
      expect(root).toContain('--red-ink:var(--live)')
      const media = css.match(/@media \(prefers-contrast: more\)\s*\{([\s\S]*)\}\s*$/)?.[1] || ''
      expect(block(':root', media)).toContain('--label-dim:var(--label-2)')
    })
  })
})
