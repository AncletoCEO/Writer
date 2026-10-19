import test from 'node:test'
import assert from 'node:assert/strict'
import { buildGodNodes } from '../src/facts/god-nodes.js'

function node(path, values = {}) {
  return {
    id: `file:${path}`,
    kind: 'file',
    path,
    pageRank: values.pageRank ?? 0,
    fanIn: values.fanIn ?? 0,
    fanOut: values.fanOut ?? 0,
    symbolCount: values.symbolCount ?? 0,
    exportedSymbols: values.exportedSymbols ?? 0
  }
}

test('ordena por centralidad y exportaciones', () => {
  const nodes = [
    node('low.js', { pageRank: 0.1, fanIn: 1, exportedSymbols: 0, symbolCount: 1 }),
    node('high.js', { pageRank: 0.9, fanIn: 10, exportedSymbols: 5, symbolCount: 8 })
  ]
  const ranked = buildGodNodes(nodes)

  assert.equal(ranked[0].path, 'high.js')
  assert.equal(ranked[1].path, 'low.js')
  assert.equal(ranked[0].score > ranked[1].score, true)
  assert.equal(ranked[0].exportedSymbols, 5)
})

test('desempata por path y respeta el límite', () => {
  const nodes = [
    node('b.js', { pageRank: 1, fanIn: 1, exportedSymbols: 1 }),
    node('a.js', { pageRank: 1, fanIn: 1, exportedSymbols: 1 }),
    node('c.js', { pageRank: 0, fanIn: 0, exportedSymbols: 0 })
  ]

  assert.deepEqual(
    buildGodNodes(nodes).map((entry) => entry.path),
    ['a.js', 'b.js', 'c.js']
  )
  assert.deepEqual(
    buildGodNodes(nodes, { limit: 1 }).map((entry) => entry.path),
    ['a.js']
  )
})

test('grafo vacío y determinismo con orden invertido', () => {
  assert.deepEqual(buildGodNodes([]), [])

  const nodes = [
    node('a.js', { pageRank: 0.4, fanIn: 3, exportedSymbols: 2 }),
    node('b.js', { pageRank: 0.8, fanIn: 4, exportedSymbols: 1 }),
    node('c.js', { pageRank: 0.2, fanIn: 0, exportedSymbols: 0 })
  ]

  assert.deepEqual(buildGodNodes([...nodes].reverse()), buildGodNodes(nodes))
})
