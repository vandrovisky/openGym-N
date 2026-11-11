// @vitest-environment happy-dom
import { describe, expect, it } from 'vitest'
import { contrast, applyAccent } from './accent.js'
import { GLYPH, PALETTE, LIVE, skinAccent } from './skin.js'

it('paleta do glyph-rice', () => {
  expect(PALETTE.dark).toEqual(['#000000','#0e0e0e','#1a1a1a','#2a2a2a','#4a4a4a','#8c8c8c','#f2f2f2'])
  expect(PALETTE.light).toEqual(['#e9e9e9','#ffffff','#f1f1f1','#d9d9d9','#b8b8b8','#696969','#0b0b0b'])
  expect(LIVE).toBe('#d71921'); expect(GLYPH).toBe(true)
})
it('destaque é a cor de texto do tema', () => {
  expect(skinAccent('dark')).toBe('#f2f2f2'); expect(skinAccent('light')).toBe('#0b0b0b')
})
it.each(['dark','light'])('contraste de texto e rótulo no tema %s', th => {
  const [bg, s1, , , , grey, fg] = PALETTE[th]
  for (const back of [bg, s1]) { expect(contrast(fg, back)).toBeGreaterThanOrEqual(4.5); expect(contrast(grey, back)).toBeGreaterThanOrEqual(4.5) }
})

describe('o destaque aplicado na raiz', () => {
  // App.jsx passes effectiveAccent (accent-choice.js, tested there) to applyAccent. applyAccent keeps a grey as it is when it already clears
  // the grey bar on the theme (4.5:1 on page and card, 2:1 from --label-2), which both do.
  it.each([['dark', '#f2f2f2', '#000000'], ['light', '#0b0b0b', '#ffffff']])('tema %s', (th, acc, ink) => {
    const el = document.createElement('div')
    applyAccent(el, skinAccent(th), th)
    expect(el.style.getPropertyValue('--acc')).toBe(acc)
    expect(el.style.getPropertyValue('--on-acc')).toBe(ink)
    expect(contrast(el.style.getPropertyValue('--on-acc'), acc)).toBeGreaterThanOrEqual(4.5)
  })
})
