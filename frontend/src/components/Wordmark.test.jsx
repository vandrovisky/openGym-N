// @vitest-environment happy-dom
import React, { act } from 'react'
import { createRoot } from 'react-dom/client'
import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import Wordmark from './Wordmark.jsx'

globalThis.IS_REACT_ACT_ENVIRONMENT = true

function mount() {
  const host = document.createElement('div')
  document.body.appendChild(host)
  const root = createRoot(host)
  act(() => root.render(<Wordmark />))
  return host
}

describe('Wordmark', () => {
  it('reads openGym-N in three parts with an aria-label', () => {
    const host = mount()
    const el = host.firstElementChild
    expect(el.textContent).toBe('openGym-N')
    expect(el.getAttribute('aria-label')).toBe('openGym-N')
    expect([...el.querySelectorAll('span')].map(s => s.className)).toEqual(['wm-open', 'wm-gym', 'wm-n'])
    expect([...el.querySelectorAll('span')].map(s => s.textContent)).toEqual(['open', 'Gym', '-N'])
  })

  it('colours the parts from the tokens: label, live, label-2', () => {
    const css = readFileSync(resolve(process.cwd(), 'src/glyph.css'), 'utf8')
    expect(css).toMatch(/\.wm-open\s*\{[^}]*color:\s*var\(--label\)/)
    expect(css).toMatch(/\.wm-gym\s*\{[^}]*color:\s*var\(--live\)/)
    expect(css).toMatch(/\.wm-n\s*\{[^}]*color:\s*var\(--label-2\)/)
  })
})
