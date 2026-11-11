// The one bar system of Stats (stats redesign). Stats had four bar styles, each with its own number
// format: thin bars with a %, range bars with a dark band, segmented strength bars and yellow RIR
// bars. Now every list of amounts is a BarRow and every share of a whole is one StackBar, both with
// the same track, the same 4px ends and one legend style (ChartLegend), so a reader learns the
// marks once.
//
//   BarRow    name | track (fill, optional target band, optional tick) | value
//   StackBar  one 100% bar split by 2px seams, its legend under it
//   ChartLegend  swatches that are the marks themselves, scaled down
//
// Pure presentation: the callers work the numbers out. Fractions are 0..1 of the row's scale.
import { tappable } from '../lib/use-sheet-keyboard.js'
import { litRows } from '../lib/dot-matrix.js'

// The glyph skin draws every bar as dots (lib/dot-matrix.js): lit ones in --label, unlit in
// --surface-2 (index.css/glyph.css .sbar-dots). A viewBox of 10 units a dot keeps them round at any width.
const DOTS = 12, STACK_DOTS = 24
const unit = f => Math.max(0, Math.min(1, Number(f) || 0))

function DotRow({ fraction, band, tick }) {
  const lit = litRows([unit(fraction)], DOTS, 1)[0]
  const [b0, b1] = band ? [unit(band[0]), unit(band[1])] : [1, 0]
  return <svg className="sbar-dots" viewBox={`0 0 ${DOTS * 10} 10`} data-lit={lit} focusable="false">
    {Array.from({ length: DOTS }, (_, i) => {
      const mid = (i + 0.5) / DOTS
      return <circle key={i} className={(i < lit ? 'on' : 'off') + (band && mid >= b0 && mid <= b1 ? ' band' : '')} cx={5 + i * 10} cy="5" r="3.6" />
    })}
    {tick != null && <rect className="sbar-tick" x={unit(tick) * DOTS * 10 - 1} y="0" width="2" height="10" rx="1" />}
  </svg>
}

/**
 * One amount on a shared scale. `tone` colours the fill: 'neutral' (grey, the default for lists
 * that support the screen), 'acc' (the accent, the card's main series), or a status of a target
 * range: 'below', 'in', 'above' (all --label dots in the glyph skin; the class stays for callers).
 * `band` rings the dots inside the target range, `tick` draws a 2px mark (a plan, a comparison). The value column
 * is right-aligned with tabular figures, so the numbers line up digit for digit.
 */
export function BarRow({ label, labelClass = '', value, fill = 0, band = null, tick = null, tone = 'neutral', onClick, ariaLabel, className = '', after = null, ...rest }) {
  const press = onClick ? tappable(onClick) : {}
  return <div className={'sbar-row ' + tone + (onClick ? ' tap' : '') + (className ? ' ' + className : '')}
    role={onClick ? 'button' : 'group'} aria-label={ariaLabel} {...press} {...rest}>
    <span className={'sbar-n' + (labelClass ? ' ' + labelClass : '')}>{label}</span>
    <span className="sbar-t" aria-hidden="true">
      <DotRow fraction={fill} band={band} tick={tick} />
    </span>
    <span className="sbar-v">{value}</span>
    {after}
  </div>
}

/**
 * A share of a whole as one bar: `parts` [{ key, label, n, share (0..1), color, opacity? }], in order
 * with a 2px surface seam between them; an empty part takes no room. The legend under it carries
 * each part's count and share, so nothing is read from colour alone or hidden in a tooltip.
 */
export function StackBar({ parts, ariaLabel, fmtValue = p => p.n }) {
  const shown = parts.filter(p => p.share > 0)
  // Each shown part takes the dots up to its running share (cumulative rounding: no dot is lost).
  let acc = 0, from = 0
  const groups = shown.map(p => {
    acc += unit(p.share)
    const to = Math.min(STACK_DOTS, Math.round(acc * STACK_DOTS))
    const g = { p, from, to: Math.max(from, to) }
    from = g.to
    return g
  })
  return <div className="sstack">
    <div className="sstack-bar" role="img" aria-label={ariaLabel + ': ' + parts.map(p => p.label + ' ' + fmtValue(p)).join(', ')}>
      <svg viewBox={`0 0 ${STACK_DOTS * 10} 10`} focusable="false" aria-hidden="true">
        {groups.map(({ p, from, to }) => <g key={p.key} className="sstack-part" data-dots={to - from} fill={p.color} opacity={p.opacity}>
          {Array.from({ length: to - from }, (_, i) => <circle key={i} cx={5 + (from + i) * 10} cy="5" r="3.6" />)}
        </g>)}
        {Array.from({ length: STACK_DOTS - from }, (_, i) => <circle key={'o' + i} className="off" cx={5 + (from + i) * 10} cy="5" r="3.6" />)}
      </svg>
    </div>
    <ChartLegend className="sstack-legend" items={parts.map(p => ({ key: p.key, mark: 'fill', color: p.color, opacity: p.opacity, label: p.label, value: fmtValue(p), muted: !(p.share > 0) }))} />
  </div>
}

/**
 * One legend style for every Stats chart: a swatch drawn as the mark it explains ('fill' a square
 * with the bar's ends, 'band' the pale target span, 'tick' the 2px plan mark, 'dot' a line chart's
 * point), its label, and optionally its value right after it.
 */
export function ChartLegend({ items, className = '' }) {
  return <ul className={'slegend' + (className ? ' ' + className : '')}>
    {items.map(it => <li key={it.key || it.label} className={it.muted ? 'muted' : undefined}>
      <span className={'slegend-m ' + (it.mark || 'fill')} style={it.color || it.opacity != null ? { '--m': it.color, opacity: it.opacity } : undefined} aria-hidden="true" />
      <span className="slegend-l">{it.label}</span>
      {it.value != null && <span className="slegend-v">{it.value}</span>}
    </li>)}
  </ul>
}
