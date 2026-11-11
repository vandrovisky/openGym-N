// The glyph skin has no accent colour and no seasonal themes (lib/skin.js), so the settings search
// does not offer them (settings-pages.test.jsx runs with the skin off, for the rows themselves).
import { describe, expect, it } from 'vitest'
import { searchSettings } from './settings-pages.js'

const ctx = {
  user: null, mobile: false, android: false, demo: false, wakeOK: true, hasMedia: false, pwOn: false, webauthn: false,
  sound: true, playOnSilent: false, canVibrate: true, vibrate: true, profiles: true, nameLang: false,
  pushOK: false, reminderOn: false, nudge: false, autoBackup: false, synced: false, installTip: true, androidWeb: false, desktopWeb: true,
}
const tr = s => s

describe('settings search under the glyph skin', () => {
  it('does not offer the accent colour, seasonal themes or the Themes page', () => {
    for (const q of ['accent', 'seasonal', 'themes']) {
      const hits = searchSettings(q, ctx, tr)
      // (The Modules page keeps its own Seasonal themes switch; only the Look rows and the page go.)
      expect(hits.filter(h => h.page === 'look' && ['Accent color', 'Seasonal themes'].includes(h.title)), q).toEqual([])
      expect(hits.filter(h => h.page === 'themes'), q).toEqual([])
    }
  })
  it('still finds an ordinary row', () => {
    expect(searchSettings('language', ctx, tr).length).toBeGreaterThan(0)
  })
})
