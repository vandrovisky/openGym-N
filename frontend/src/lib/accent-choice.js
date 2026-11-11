// The accent the app draws: one fixed colour in the glyph skin, otherwise the seasonal theme's
// (when chosen) or the user's own. A module of its own because seasonal.js already imports skin.js.
import { accentValue } from './accent.js'
import { seasonAccent } from './seasonal.js'
import { GLYPH, skinAccent } from './skin.js'

/** A preset key or '#rrggbb' for applyAccent, in `theme` ('dark' or 'light', already resolved). */
export const effectiveAccent = (S, theme) => GLYPH ? skinAccent(theme) : (seasonAccent(S) || accentValue(S))
