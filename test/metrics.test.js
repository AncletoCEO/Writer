import test from 'node:test'
import assert from 'node:assert/strict'
import { computeBlastRadius, defaultSeeds } from '../src/metrics/blast-radius.js'
import { findCycles } from '../src/metrics/cycles.js'
import { computeHotspots } from '../src/metrics/hotspots.js'
import { applyMetrics } from '../src/metrics/index.js'
import { classifyFile, classifyLayers } from '../src/metrics/layers.js'
import { computePageRank } from '../src/metrics/pagerank.js'

function node(path, extra = {}) {
  return { id: `file:${path}`, kind: 'file', path, symbolCount: 1, fanIn: 0, fanOut: 0, ...extra }
}

function edge(from, to, kind = 'import', line = 1) {
  return { from: `file:${from}`, to: `file:${to}`, kind, line }
}

test('ciclos y self-loops', () => {
  const nodes = [node('a'), node('b'), node('c'), node('d')]
  const edges = [edge('a', 'b'), edge('b', 'c'), edge('c', 'a'), edge('d', 'd')]
  const result = findCycles(nodes, edges)

  assert.deepEqual(result.cycles, [{ size: 3, files: ['file:a', 'file:b', 'file:c'] }])
  assert.deepEqual(result.selfLoops, ['file:d'])
})

test('PageRank suma 1 y premia los enlaces entrantes', () => {
  const nodes = [node('a'), node('b'), node('c')]
  const edges = [edge('a', 'b'), edge('c', 'b')]
  const ranks = computePageRank(nodes, edges)
  const total = [...ranks.values()].reduce((sum, value) => sum + value, 0)

  assert.ok(Math.abs(total - 1) < 1e-9)
  assert.ok(ranks.get('file:b') > ranks.get('file:a'))
})

test('capas y violaciones upward', () => {
  assert.equal(classifyFile('src/ui/button.js'), 'presentation')
  assert.equal(classifyFile('src/core/model.js'), 'domain')
  assert.equal(classifyFile('src/utils/x.js'), 'shared')
  assert.equal(classifyFile('src/unknown/x.js'), 'unknown')
  assert.equal(
    classifyFile('src/core/memory/database.js', {
      domain: ['src/core/memory/database.js']
    }),
    'domain'
  )

  const nodes = [node('src/ui/button.js'), node('src/core/model.js'), node('src/utils/x.js')]
  const edges = [
    edge('src/ui/button.js', 'src/core/model.js'),
    edge('src/utils/x.js', 'src/ui/button.js')
  ]
  const { violations } = classifyLayers(nodes, edges)

  assert.equal(violations.length, 1)
  assert.equal(violations[0].fromLayer, 'shared')
  assert.equal(violations[0].toLayer, 'presentation')
})

test('hotspots ordenados y deterministas', () => {
  const nodes = [
    node('a', { fanIn: 5, fanOut: 1, symbolCount: 2 }),
    node('b', { fanIn: 5, fanOut: 1, symbolCount: 2 }),
    node('c', { fanIn: 0, fanOut: 0, symbolCount: 0 })
  ]
  const hotspots = computeHotspots(nodes, new Set(['a']))

  assert.equal(hotspots[0].path, 'a')
  assert.equal(hotspots[1].path, 'b')
  assert.equal(hotspots[2].path, 'c')
  assert.equal(hotspots[0].cycle, true)
})

test('blast radius transitivo', () => {
  const nodes = [node('a'), node('b'), node('c'), node('d')]
  const edges = [edge('b', 'a'), edge('c', 'b'), edge('d', 'c')]
  const result = computeBlastRadius(nodes, edges, {
    seeds: [{ path: 'a', reason: 'fan-in' }]
  })

  assert.deepEqual(result[0], {
    path: 'a',
    reason: 'fan-in',
    direct: 1,
    transitive: 3,
    dependents: ['b', 'c', 'd']
  })
})

test('defaultSeeds prioriza changed y config', () => {
  const nodes = [node('a', { fanIn: 1 }), node('b', { fanIn: 1 })]
  const seeds = defaultSeeds(nodes, {
    changedFiles: ['a'],
    impactSeeds: ['b']
  })

  assert.deepEqual(seeds, [
    { path: 'a', reason: 'changed' },
    { path: 'b', reason: 'config' }
  ])
})

test('applyMetrics anota nodos y stats', () => {
  const graph = {
    schemaVersion: 1,
    stats: { files: 2, symbols: 0, edges: 1, externalImports: 0 },
    nodes: [node('src/a.js'), node('src/b.js')],
    edges: [edge('src/a.js', 'src/b.js')]
  }
  const metrics = applyMetrics(graph, { config: {}, gitInfo: null })

  assert.equal(graph.stats.cycles, 0)
  assert.equal(graph.stats.communities, 1)
  assert.equal(graph.nodes[0].fanOut, 1)
  assert.equal(graph.nodes[1].fanIn, 1)
  assert.equal(graph.nodes[0].community, graph.nodes[1].community)
  assert.ok(graph.nodes[0].pageRank > 0)
  assert.equal(typeof graph.nodes[0].layer, 'string')
  assert.equal(metrics.communities.length, 1)
  assert.equal(metrics.godNodes.length, 2)
  assert.equal(metrics.blastRadius.length, 2)
})
