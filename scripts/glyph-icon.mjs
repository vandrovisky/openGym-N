#!/usr/bin/env node
// Draws the openGym-N icon: a dumbbell made of dots on a 15 x 15 grid (lit dots #F2F2F2 on
// #000000), and writes every raster the Android app and the web app need. No dependencies: the
// dots are rasterised with 4 x 4 supersampling into an RGBA buffer and encoded by hand with
// node:zlib. Deterministic and re-runnable: `node scripts/glyph-icon.mjs`.
//
// Writes (all under frontend/):
//   android/app/src/main/res/mipmap-*/ic_launcher{,_round,_foreground,_background}.png
//   android/app/src/main/res/drawable*/splash.png   (sizes are read from the files already there)
//   public/icon-180.png, public/icon-512.png
// The adaptive icon's monochrome layer (Nothing OS themed icons) reuses the foreground: the
// launcher reads only its alpha. The alternative icons (public/app-icons) are not touched.
import { deflateSync } from 'node:zlib'
import { readFileSync, writeFileSync, readdirSync, existsSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..', 'frontend')
const RES = join(ROOT, 'android/app/src/main/res')

const GRID = 15
const DOT = 0.38            // dot radius, in grid pitches
const LIT = [0xf2, 0xf2, 0xf2]
const BLACK = [0, 0, 0]

// The dumbbell, one string per row; # is a lit dot. A bar, two plates each side.
export const SHAPE = [
  '...............',
  '...............',
  '...............',
  '...............',
  '##...........##',
  '##.#.......#.##',
  '##.#.......#.##',
  '###############',
  '##.#.......#.##',
  '##.#.......#.##',
  '##...........##',
  '...............',
  '...............',
  '...............',
  '...............',
]
export const DOTS = []
SHAPE.forEach((row, y) => [...row].forEach((ch, x) => { if (ch === '#') DOTS.push([x, y]) }))

/** A w x h RGBA buffer filled with `bg` (null = transparent). */
function canvas(w, h, bg) {
  const px = Buffer.alloc(w * h * 4)
  if (bg) for (let i = 0; i < w * h; i++) px.set([bg[0], bg[1], bg[2], 255], i * 4)
  return { w, h, px }
}

/** Coverage of the circle (cx, cy, r) in pixel (x, y), by 4 x 4 samples. */
function coverage(x, y, cx, cy, r) {
  let n = 0
  for (let j = 0; j < 4; j++) for (let i = 0; i < 4; i++) {
    const dx = x + (i + 0.5) / 4 - cx, dy = y + (j + 0.5) / 4 - cy
    if (dx * dx + dy * dy <= r * r) n++
  }
  return n / 16
}

/** Paint `color` over the circle with `cov` coverage (source-over onto what is there). */
function blend(c, x, y, color, cov) {
  if (cov <= 0 || x < 0 || y < 0 || x >= c.w || y >= c.h) return
  const o = (y * c.w + x) * 4, a = cov, da = c.px[o + 3] / 255
  const oa = a + da * (1 - a)
  for (let k = 0; k < 3; k++) c.px[o + k] = Math.round((color[k] * a + c.px[o + k] * da * (1 - a)) / oa)
  c.px[o + 3] = Math.round(oa * 255)
}

/** Draw the dumbbell centred in `c`, its 15 columns spanning `span` pixels. */
function dumbbell(c, span) {
  const pitch = span / GRID, r = pitch * DOT
  const x0 = (c.w - span) / 2, y0 = (c.h - span) / 2
  for (const [gx, gy] of DOTS) {
    const cx = x0 + (gx + 0.5) * pitch, cy = y0 + (gy + 0.5) * pitch
    for (let y = Math.floor(cy - r - 1); y <= Math.ceil(cy + r + 1); y++)
      for (let x = Math.floor(cx - r - 1); x <= Math.ceil(cx + r + 1); x++)
        blend(c, x, y, LIT, coverage(x, y, cx, cy, r))
  }
}

/** Clear everything outside the circle inscribed in `c` (the round legacy icon). */
function roundOff(c) {
  const r = c.w / 2
  for (let y = 0; y < c.h; y++) for (let x = 0; x < c.w; x++) {
    const cov = coverage(x, y, r, r, r)
    if (cov < 1) { const o = (y * c.w + x) * 4; c.px[o + 3] = Math.round(c.px[o + 3] * cov) }
  }
}

const crcTable = Array.from({ length: 256 }, (_, n) => {
  let c = n
  for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1
  return c >>> 0
})
function crc32(buf) {
  let c = 0xffffffff
  for (const b of buf) c = crcTable[(c ^ b) & 0xff] ^ (c >>> 8)
  return (c ^ 0xffffffff) >>> 0
}
function chunk(type, data) {
  const out = Buffer.alloc(12 + data.length)
  out.writeUInt32BE(data.length, 0)
  out.write(type, 4, 'latin1')
  data.copy(out, 8)
  out.writeUInt32BE(crc32(out.subarray(4, 8 + data.length)), 8 + data.length)
  return out
}
/** PNG bytes: RGBA (color type 6), or RGB (type 2) when `opaque`. */
export function encodePng({ w, h, px }, opaque = false) {
  const bpp = opaque ? 3 : 4
  const raw = Buffer.alloc((w * bpp + 1) * h)
  for (let y = 0; y < h; y++) {
    raw[y * (w * bpp + 1)] = 0
    for (let x = 0; x < w; x++) for (let k = 0; k < bpp; k++)
      raw[y * (w * bpp + 1) + 1 + x * bpp + k] = px[(y * w + x) * 4 + k]
  }
  const ihdr = Buffer.alloc(13)
  ihdr.writeUInt32BE(w, 0); ihdr.writeUInt32BE(h, 4)
  ihdr[8] = 8; ihdr[9] = opaque ? 2 : 6
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', ihdr), chunk('IDAT', deflateSync(raw, { level: 9 })), chunk('IEND', Buffer.alloc(0)),
  ])
}

function put(file, c, opaque) {
  writeFileSync(file, encodePng(c, opaque))
  console.log(file.replace(ROOT + '/', ''), c.w + 'x' + c.h)
}

// Launcher icons: [legacy size, adaptive layer size] per density.
const DENSITY = { ldpi: [36, 81], mdpi: [48, 108], hdpi: [72, 162], xhdpi: [96, 216], xxhdpi: [144, 324], xxxhdpi: [192, 432] }
// The adaptive layers are inset 16.7% by the XML, so the dumbbell may use most of the layer.
const LAYER_SPAN = 0.9, LEGACY_SPAN = 0.78

export function main() {
  for (const [d, [legacy, layer]] of Object.entries(DENSITY)) {
    const dir = join(RES, 'mipmap-' + d)
    if (!existsSync(dir)) continue
    const sq = canvas(legacy, legacy, BLACK); dumbbell(sq, legacy * LEGACY_SPAN)
    put(join(dir, 'ic_launcher.png'), sq)
    const rd = canvas(legacy, legacy, null)
    for (let i = 0; i < legacy * legacy; i++) rd.px.set([0, 0, 0, 255], i * 4)
    dumbbell(rd, legacy * LEGACY_SPAN); roundOff(rd)
    put(join(dir, 'ic_launcher_round.png'), rd)
    const fg = canvas(layer, layer, null); dumbbell(fg, layer * LAYER_SPAN)
    put(join(dir, 'ic_launcher_foreground.png'), fg)
    put(join(dir, 'ic_launcher_background.png'), canvas(layer, layer, BLACK))
  }
  for (const size of [180, 512]) {
    const c = canvas(size, size, BLACK); dumbbell(c, size * LEGACY_SPAN)
    put(join(ROOT, 'public', `icon-${size}.png`), c, true)
  }
  // Splash: black, the dumbbell in the middle at 40% of the short side. Sizes as they are today.
  for (const name of readdirSync(RES).filter(n => /^drawable(-(land|port))?(-night)?(-[lmxh]*dpi)?$/.test(n)).sort()) {
    const f = join(RES, name, 'splash.png')
    if (!existsSync(f)) continue
    const b = readFileSync(f), w = b.readUInt32BE(16), h = b.readUInt32BE(20)
    const c = canvas(w, h, BLACK); dumbbell(c, Math.min(w, h) * 0.4)
    put(f, c)
  }
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) main()
