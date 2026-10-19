import test from 'node:test'
import assert from 'node:assert/strict'
import { parseJsonc } from '../src/resolve/jsonc.js'

test('jsonc con comentarios y trailing commas', () => {
  const parsed = parseJsonc(`{
    // linea
    "compilerOptions": {
      /* bloque */
      "baseUrl": "src",
      "paths": { "@core/*": ["core/*"], },
    },
  }`)

  assert.equal(parsed.compilerOptions.baseUrl, 'src')
  assert.deepEqual(parsed.compilerOptions.paths['@core/*'], ['core/*'])
})

test('jsonc no rompe strings con //', () => {
  const parsed = parseJsonc('{"url":"https://example.com//x","n":1,}')
  assert.equal(parsed.url, 'https://example.com//x')
  assert.equal(parsed.n, 1)
})
