import { describe, expect, it } from 'vitest'
import { litRows, litRow, ringDots } from './dot-matrix.js'

describe('litRows', () => {
  it('lights dots per column on the scale of the biggest value', () => {
    expect(litRows([0, 5, 10], 10)).toEqual([0, 5, 10])
    expect(litRows([0.1, 10], 10)).toEqual([1, 10])       // a positive value never disappears
    expect(litRows([], 10)).toEqual([])
    expect(litRows([0, 0, 0], 10)).toEqual([0, 0, 0])     // no division by zero
  })
  it('takes an explicit max and clamps to the rows', () => {
    expect(litRows([5, 20], 10, 10)).toEqual([5, 10])
  })
  it('treats missing or odd values as unlit', () => {
    expect(litRows([null, undefined, NaN, -3, 4], 4)).toEqual([0, 0, 0, 0, 4])
  })
})

describe('litRow', () => {
  it('gives the lit row of each column, 0 at the bottom', () => {
    expect(litRow([50, 75, 100], 5)).toEqual([0, 2, 4])
    expect(litRow([80], 5)).toEqual([2])                  // a lone point sits in the middle
    expect(litRow([80, null, 90], 5)).toEqual([0, null, 4])
    expect(litRow([70, 70], 5)).toEqual([2, 2])           // a flat series sits in the middle
  })
  it('follows an explicit range and clamps outside it', () => {
    expect(litRow([0, 50, 200], 5, 0, 100)).toEqual([0, 2, 4])
  })
  it('has nothing to light for an empty or all-missing series', () => {
    expect(litRow([], 5)).toEqual([])
    expect(litRow([null, NaN], 5)).toEqual([null, null])
  })
})

describe('ringDots', () => {
  it('lights a fraction of the dots clockwise from the top', () => {
    expect(ringDots(24, 0.5).filter(Boolean).length).toBe(12)
    expect(ringDots(4, 0.5)).toEqual([true, true, false, false])
    expect(ringDots(24, 0)).toEqual(Array(24).fill(false))
    expect(ringDots(24, 1.7).every(Boolean)).toBe(true)   // the fraction is held to 0..1
    expect(ringDots(24, NaN)).toEqual(Array(24).fill(false))
  })
})
