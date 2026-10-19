import test from 'node:test'
import assert from 'node:assert/strict'
import { renderDocuments } from '../src/render/markdown.js'

function fileNode(path) {
  return {
    id: `file:${path}`,
    kind: 'file',
    path,
    layer: 'domain',
    symbolCount: 600,
    fanIn: 0,
    fanOut: 0,
    lines: 10,
    pageRank: 0
  }
}

function symbolNodes(path, count) {
  return Array.from({ length: count }, (_, index) => ({
    id: `sym:${path}#fn${index}@${index + 1}`,
    kind: 'symbol',
    path,
    name: `fn${index}`,
    symbolKind: 'function',
    exported: index % 2 === 0,
    line: index + 1,
    endLine: index + 1,
    signature: `fn${index}(x)`
  }))
}

function metrics() {
  return {
    cycles: { cycles: [], selfLoops: [] },
    layers: { layers: { 'src/a.js': 'domain' }, violations: [] },
    communities: [],
    hotspots: [],
    blastRadius: []
  }
}

test('documentos con paginación y reglas del proyecto', () => {
  const path = 'src/a.js'
  const graph = {
    stats: { files: 1, symbols: 600, edges: 0 },
    nodes: [fileNode(path), ...symbolNodes(path, 600)],
    edges: []
  }
  const documents = renderDocuments({
    graph,
    metrics: metrics(),
    projectRules: {
      available: true,
      rules: [{ memory_key: 'api-errors', content: 'Usar JSON para errores.' }]
    },
    unresolved: []
  })

  assert.ok(documents['agent/INDEX.md'])
  assert.ok(documents['agent/SYMBOLS.md'])
  assert.ok(documents['agent/SYMBOLS_p2.md'])
  assert.ok(documents['agent/GOTCHAS.md'])
  assert.ok(documents['agent/ARCHITECTURE.md'])

  for (const content of Object.values(documents)) {
    assert.ok(content.split('\n').length <= 500)
  }
  assert.match(documents['agent/SYMBOLS.md'], /Página siguiente/)
  assert.match(documents['agent/SYMBOLS_p2.md'], /Página anterior/)
  assert.match(documents['agent/GOTCHAS.md'], /\[api-errors\] Usar JSON para errores\./)
  assert.match(documents['agent/ARCHITECTURE.md'], /```mermaid/)
  assert.match(documents['agent/ARCHITECTURE.md'], /flowchart/)
})

test('documentos pequeños no paginan', () => {
  const path = 'src/small.js'
  const graph = {
    stats: { files: 1, symbols: 1, edges: 0 },
    nodes: [fileNode(path), ...symbolNodes(path, 1)],
    edges: []
  }
  const documents = renderDocuments({
    graph,
    metrics: metrics(),
    projectRules: { available: false, rules: [], reason: 'missing' },
    unresolved: []
  })

  assert.ok(documents['agent/SYMBOLS.md'])
  assert.equal(documents['agent/SYMBOLS_p2.md'], undefined)
  assert.match(documents['agent/GOTCHAS.md'], /memoria no disponible/)
})

test('arquitectura y gotchas incluyen comunidades', () => {
  const first = 'src/a.js'
  const second = 'src/b.js'
  const graph = {
    stats: { files: 2, symbols: 0, edges: 1 },
    nodes: [fileNode(first), fileNode(second)],
    edges: [{ from: `file:${first}`, to: `file:${second}`, kind: 'import', line: 1 }]
  }
  const documentMetrics = {
    ...metrics(),
    communities: [{ id: 'c1', size: 2, cohesion: 0.5, files: [first, second] }]
  }
  const documents = renderDocuments({
    graph,
    metrics: documentMetrics,
    projectRules: { available: false, rules: [] },
    unresolved: []
  })

  assert.match(documents['agent/ARCHITECTURE.md'], /## Comunidades/)
  assert.match(documents['agent/ARCHITECTURE.md'], /subgraph c1/)
  assert.match(documents['agent/GOTCHAS.md'], /## Comunidades/)
})
