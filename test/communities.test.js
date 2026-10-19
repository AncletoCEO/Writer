import test from 'node:test'
import assert from 'node:assert/strict'
import { detectCommunities } from '../src/metrics/communities.js'

function node(path) {
  return { id: `file:${path}`, kind: 'file', path }
}

function edge(from, to) {
  return { from: `file:${from}`, to: `file:${to}`, kind: 'import' }
}

function fixture() {
  const nodes = ['a', 'b', 'c', 'd', 'e', 'f'].map(node)
  const edges = [
    edge('a', 'b'),
    edge('a', 'c'),
    edge('b', 'c'),
    edge('d', 'e'),
    edge('d', 'f'),
    edge('e', 'f'),
    edge('c', 'd')
  ]
  return { nodes, edges }
}

test('detecta dos clusters unidos por un puente', () => {
  const { nodes, edges } = fixture()
  const result = detectCommunities(nodes, edges)

  assert.equal(result.communities.length, 2)
  assert.deepEqual(
    result.communities.map((community) => community.files),
    [
      ['a', 'b', 'c'],
      ['d', 'e', 'f']
    ]
  )
  assert.equal(result.assignments.a, result.assignments.b)
  assert.equal(result.assignments.a, result.assignments.c)
  assert.equal(result.assignments.d, result.assignments.e)
  assert.notEqual(result.assignments.a, result.assignments.d)
  assert.equal(result.communities[0].cohesion, 0.75)
  assert.equal(result.communities[0].size, 3)
})

test('nodos aislados quedan en comunidades propias', () => {
  const nodes = [node('a'), node('b'), node('g')]
  const edges = [edge('a', 'b')]
  const result = detectCommunities(nodes, edges)

  assert.equal(result.communities.length, 2)
  assert.equal(result.communities[0].size, 2)
  assert.equal(result.communities[1].size, 1)
  assert.equal(result.assignments.g, 'c2')
})

test('grafo vacío y configuración deshabilitada', () => {
  assert.deepEqual(detectCommunities([], []), { communities: [], assignments: {} })
  assert.deepEqual(detectCommunities([node('a')], [], { enabled: false }), {
    communities: [],
    assignments: {}
  })
})

test('determinismo independiente del orden de entrada', () => {
  const { nodes, edges } = fixture()
  const first = detectCommunities(nodes, edges)
  const second = detectCommunities([...nodes].reverse(), [...edges].reverse())

  assert.deepEqual(second, first)
})
