import test from 'node:test'
import assert from 'node:assert/strict'
import { buildFacts, renderInventory } from '../src/facts/build.js'
import { buildSymbolsJson } from '../src/facts/symbols.js'

function graph() {
  return {
    stats: { files: 1, symbols: 1, edges: 0, externalImports: 1 },
    nodes: [
      {
        id: 'file:src/a.js',
        kind: 'file',
        path: 'src/a.js',
        lang: 'js',
        size: 10,
        lines: 2,
        symbolCount: 1,
        fanIn: 0,
        fanOut: 1,
        pageRank: 1,
        layer: 'domain',
        hotspot: 0
      },
      {
        id: 'sym:src/a.js#run@1',
        kind: 'symbol',
        path: 'src/a.js',
        name: 'run',
        symbolKind: 'function',
        exported: true,
        line: 1,
        endLine: 2,
        signature: 'run(x)'
      }
    ],
    edges: []
  }
}

function metrics() {
  return {
    cycles: { cycles: [], selfLoops: [] },
    layers: { layers: { 'src/a.js': 'domain' }, violations: [] },
    communities: [],
    godNodes: [],
    hotspots: [{ path: 'src/a.js', score: 0 }],
    blastRadius: [{ path: 'src/a.js', reason: 'fan-in', direct: 0, transitive: 0, dependents: [] }]
  }
}

test('symbols.json agrupa por archivo', () => {
  const parsed = JSON.parse(buildSymbolsJson(graph()))

  assert.equal(parsed.schemaVersion, 1)
  assert.deepEqual(parsed.files[0], {
    path: 'src/a.js',
    symbols: [
      {
        id: 'sym:src/a.js#run@1',
        name: 'run',
        kind: 'function',
        exported: true,
        line: 1,
        endLine: 2,
        signature: 'run(x)'
      }
    ]
  })
})

test('facts JSON e inventory', () => {
  const facts = buildFacts({
    graph: graph(),
    metrics: metrics(),
    scanResult: { skipped: [{ path: 'big.js', reason: 'too-large' }] },
    externals: [{ specifier: 'lodash', path: 'src/a.js' }],
    unresolved: [{ path: 'src/a.js', specifier: './x', kind: 'static', line: 1, reason: 'not-found' }]
  })

  assert.deepEqual(Object.keys(facts).sort(), [
    'facts/blast-radius.json',
    'facts/communities.json',
    'facts/cycles.json',
    'facts/externals.json',
    'facts/god-nodes.json',
    'facts/hotspots.json',
    'facts/inventory.md',
    'facts/layers.json',
    'facts/skipped.json',
    'facts/unresolved.json'
  ])

  assert.equal(JSON.parse(facts['facts/cycles.json']).schemaVersion, 1)
  assert.equal(JSON.parse(facts['facts/communities.json']).schemaVersion, 1)
  assert.equal(JSON.parse(facts['facts/god-nodes.json']).schemaVersion, 1)
  assert.equal(JSON.parse(facts['facts/externals.json']).externals[0].specifier, 'lodash')
  assert.equal(JSON.parse(facts['facts/skipped.json']).skipped[0].reason, 'too-large')
  assert.match(facts['facts/inventory.md'], /src\/a\.js/)
  assert.match(renderInventory(graph()), /Total: 1 archivos/)
})
