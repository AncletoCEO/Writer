import test from 'node:test'
import assert from 'node:assert/strict'
import { computeBridges } from '../src/metrics/bridges.js'

function node(path, values = {}) {
  return {
    id: `file:${path}`,
    kind: 'file',
    path,
    pageRank: values.pageRank ?? 0,
    fanIn: values.fanIn ?? 0,
    layer: values.layer ?? 'unknown'
  }
}

function edge(from, to, line = 1) {
  return { from: `file:${from}`, to: `file:${to}`, kind: 'import', line }
}

function fixture() {
  const nodes = [
    node('a', { pageRank: 0.9, fanIn: 0, layer: 'domain' }),
    node('b', { pageRank: 0.2, fanIn: 0, layer: 'domain' }),
    node('c', { pageRank: 0.1, fanIn: 2, layer: 'presentation' }),
    node('d', { pageRank: 0.1, fanIn: 0, layer: 'presentation' })
  ]
  const edges = [
    edge('a', 'c', 5),
    edge('b', 'c', 3),
    edge('a', 'c', 2),
    edge('a', 'b', 1),
    edge('c', 'd', 1)
  ]
  const communities = [
    { id: 'c1', size: 2, cohesion: 0.5, files: ['a', 'b'] },
    { id: 'c2', size: 2, cohesion: 0.5, files: ['c', 'd'] }
  ]
  const layers = { a: 'domain', b: 'domain', c: 'presentation', d: 'presentation' }
  return { nodes, edges, communities, layers }
}

test('ordena puentes entre comunidades y deduplica por par', () => {
  const { nodes, edges, communities, layers } = fixture()
  const bridges = computeBridges(nodes, edges, communities, layers)

  assert.equal(bridges.length, 2)
  assert.equal(bridges[0].from, 'a')
  assert.equal(bridges[0].to, 'c')
  assert.equal(bridges[0].fromCommunity, 'c1')
  assert.equal(bridges[0].toCommunity, 'c2')
  assert.equal(bridges[0].line, 2)
  assert.equal(bridges[1].from, 'b')
  assert.ok(bridges[0].score > bridges[1].score)
})

test('respeta el límite', () => {
  const { nodes, edges, communities, layers } = fixture()
  assert.equal(computeBridges(nodes, edges, communities, layers, { limit: 1 }).length, 1)
})

test('sin comunidades o sin aristas devuelve vacío', () => {
  const { nodes, edges, layers } = fixture()
  assert.deepEqual(computeBridges(nodes, edges, [], layers), [])
  assert.deepEqual(computeBridges(nodes, [], [], layers), [])
})

test('determinismo con orden invertido', () => {
  const { nodes, edges, communities, layers } = fixture()
  const first = computeBridges(nodes, edges, communities, layers)
  const second = computeBridges(
    [...nodes].reverse(),
    [...edges].reverse(),
    [...communities].reverse(),
    layers
  )

  assert.deepEqual(second, first)
})
