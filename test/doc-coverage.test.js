import test from 'node:test'
import assert from 'node:assert/strict'
import { buildDocCoverageFact } from '../src/facts/doc-coverage.js'

test('cobertura por archivo y total', () => {
  const graph = {
    nodes: [
      { kind: 'symbol', path: 'src/a.js', summary: 'A' },
      { kind: 'symbol', path: 'src/a.js' },
      { kind: 'symbol', path: 'src/b.js' }
    ]
  }
  const fact = buildDocCoverageFact(graph)

  assert.equal(fact.schemaVersion, 1)
  assert.deepEqual(fact.files, [
    { path: 'src/a.js', documented: 1, total: 2, ratio: 0.5 },
    { path: 'src/b.js', documented: 0, total: 1, ratio: 0 }
  ])
  assert.deepEqual(fact.totals, { documented: 1, total: 3, ratio: 0.3333 })
})

test('grafo sin símbolos', () => {
  assert.deepEqual(buildDocCoverageFact({ nodes: [] }).totals, {
    documented: 0,
    total: 0,
    ratio: 1
  })
})
