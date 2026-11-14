const test = require('node:test')
const assert = require('node:assert/strict')
const { INK, inkPixels } = require('../page/ink.js')

// a size×size RGBA picture, painted by fn(x, y) → [r, g, b, a] or null (clear)
function picture(size, fn) {
  const p = new Uint8ClampedArray(size * size * 4)
  for (let y = 0; y < size; y += 1) {
    for (let x = 0; x < size; x += 1) {
      const c = fn(x, y)
      if (c) p.set(c, (y * size + x) * 4)
    }
  }
  return p
}
const at = (p, size, x, y) => Array.from(p.slice((y * size + x) * 4, (y * size + x) * 4 + 4))

test('a light coloured mark on a clear ground prints in solid ink, like a mono one', () => {
  // a pale gradient triangle, Antigravity-like: well under half its box is painted
  const size = 10
  const p = picture(size, (x, y) => (x <= y && x + y >= 9 ? [200, 120 + x * 10, 240, 255] : null))
  assert.equal(inkPixels(p, size, size, false), 'mark')
  assert.deepEqual(at(p, size, 5, 9), [...INK, 255])
  assert.deepEqual(at(p, size, 0, 0), [0, 0, 0, 0]) // the clear ground stays clear
})

test('a mono logo is a mark even when it fills its box', () => {
  const size = 4
  const p = picture(size, () => [90, 90, 90, 255])
  assert.equal(inkPixels(p, size, size, true), 'mark')
  assert.deepEqual(at(p, size, 1, 1), [...INK, 255])
})

test('a tile stretches its tones: darkest to ink, lightest to white', () => {
  // a blue tile with a light symbol in the middle, Codex-like
  const size = 10
  const p = picture(size, (x, y) => (x >= 4 && x <= 5 && y >= 4 && y <= 5 ? [230, 235, 255, 255] : [40, 90, 200, 255]))
  assert.equal(inkPixels(p, size, size, false), 'tile')
  assert.deepEqual(at(p, size, 0, 0), [...INK, 255])
  assert.deepEqual(at(p, size, 4, 4), [255, 255, 255, 255])
})

test('a tile on a light ground drops the ground and inks what is drawn on it', () => {
  // a white tile with a mid-tone mark, Codex-like: stretching would leave the mark grey
  const size = 10
  const p = picture(size, (x, y) => (x >= 2 && x <= 7 && y >= 3 && y <= 6 ? [110, 140, 230, 255] : [255, 255, 255, 255]))
  assert.equal(inkPixels(p, size, size, false), 'ground')
  assert.deepEqual(at(p, size, 4, 4), [...INK, 255])
  assert.equal(at(p, size, 0, 0)[3], 0) // the white ground lets the paper through
})

test('a tile of one tone prints as ink, not white', () => {
  const size = 6
  const p = picture(size, () => [250, 120, 40, 255])
  assert.equal(inkPixels(p, size, size, false), 'tile')
  assert.deepEqual(at(p, size, 2, 2), [...INK, 255])
})

test('an empty picture is left alone', () => {
  const p = picture(4, () => null)
  assert.equal(inkPixels(p, 4, 4, false), 'empty')
})
