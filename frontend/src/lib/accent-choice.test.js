import { afterEach, describe, expect, it, vi } from 'vitest'
import { effectiveAccent } from './accent-choice.js'
import { seasonAccent } from './seasonal.js'
import { skinAccent } from './skin.js'

// The skin is on in the app; a mock turns it off to keep the original choice covered.
const skin = vi.hoisted(() => ({ glyph: true }))
vi.mock('./skin.js', async orig => ({ ...(await orig()), get GLYPH() { return skin.glyph } }))
afterEach(() => { skin.glyph = true })

const S = { accent: 'custom', accentCustom: '#00ff00', seasonal: { halloween: 'on', halloweenColors: true } }

describe('effectiveAccent', () => {
  it('is the skin accent whatever the saved or seasonal accent says', () => {
    expect(effectiveAccent(S, 'dark')).toBe(skinAccent('dark'))
    expect(effectiveAccent(S, 'light')).toBe(skinAccent('light'))
  })
  it('without the skin, a chosen seasonal colour wins over the saved accent', () => {
    skin.glyph = false
    expect(seasonAccent(S)).toBeTruthy()
    expect(effectiveAccent(S, 'dark')).toBe(seasonAccent(S))
    expect(effectiveAccent(S, 'dark')).not.toBe('#00ff00')
  })
  it('without the skin, the saved accent is used when no seasonal theme shows', () => {
    skin.glyph = false
    expect(effectiveAccent({ accent: 'custom', accentCustom: '#00ff00' }, 'dark')).toBe('#00ff00')
  })
})
