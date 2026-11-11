// The numbers behind the glyph skin's dot-matrix charts (components/StatBars, LineChart, RestTimer,
// Streak): which dots are lit. Pure, so the drawing stays a loop over the result.

const num = v => (typeof v === 'number' && isFinite(v) ? v : null)

/**
 * Lit dots per column of a bar chart, 0..rows. `max` is the value that fills a column (default the
 * biggest value). A positive value always lights at least one dot; missing or negative ones none.
 */
export function litRows(values, rows, max) {
  const vs = values.map(num)
  const top = num(max) ?? Math.max(0, ...vs.filter(v => v != null))
  return vs.map(v => {
    if (v == null || v <= 0 || !(top > 0)) return 0
    return Math.max(1, Math.min(rows, Math.round(v / top * rows)))
  })
}

/**
 * The lit row of each column of a line chart, 0 at the bottom, `null` for a missing value. The
 * range is `min`..`max` (default the series' own); a lone point or a flat series sits in the middle.
 */
export function litRow(values, rows, min, max) {
  const vs = values.map(num)
  const real = vs.filter(v => v != null)
  const lo = num(min) ?? Math.min(...real), hi = num(max) ?? Math.max(...real)
  const mid = Math.floor((rows - 1) / 2)
  return vs.map(v => {
    if (v == null) return null
    if (!(hi > lo)) return mid
    return Math.max(0, Math.min(rows - 1, Math.round((v - lo) / (hi - lo) * (rows - 1))))
  })
}

/** The dots of a ring, true where lit: `fraction` (held to 0..1) of them, clockwise from the top. */
export function ringDots(count, fraction) {
  const f = Math.max(0, Math.min(1, num(fraction) ?? 0))
  const n = Math.round(f * count)
  return Array.from({ length: count }, (_, i) => i < n)
}
