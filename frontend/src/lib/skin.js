// The glyph skin (docs/superpowers/specs/2026-11-11-glyph-skin-design.md): black, a grey ramp and
// one red. The palette is the single source of the colours; glyph.css repeats it as tokens
// (glyph-skin.test.js keeps the two in step).
export const GLYPH = true

// bg, s1, s2, s3, mute, grey, fg
export const PALETTE = {
  dark: ['#000000', '#0e0e0e', '#1a1a1a', '#2a2a2a', '#4a4a4a', '#8c8c8c', '#f2f2f2'],
  light: ['#e9e9e9', '#ffffff', '#f1f1f1', '#d9d9d9', '#b8b8b8', '#696969', '#0b0b0b'],
}

// The one red: live things only (a running timer, a record), never the app's accent.
export const LIVE = '#d71921'

/** The app's accent in the skin is the theme's text colour; the red is the --live token. */
export const skinAccent = theme => PALETTE[theme === 'light' ? 'light' : 'dark'][6]
