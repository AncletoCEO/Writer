import test from 'node:test'
import assert from 'node:assert/strict'
import { existsSync, readFileSync, symlinkSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { runBuild } from '../src/build/run.js'
import { loadConfig } from '../src/config/load.js'
import { validateGraph, validateManifest, validateOutputs } from '../src/contract/validate.js'
import { copyFixture, ROOT, tempDir } from './helpers/fixtures.js'

function readJson(path) {
  return JSON.parse(readFileSync(path, 'utf8'))
}

function build(t, name) {
  const dir = copyFixture(t, name)
  const config = loadConfig({ cwd: dir })
  const result = runBuild({ rootAbs: dir, config })
  return { dir, config, result }
}

function assertContract(config, result) {
  assert.equal(validateManifest(result.manifest), true)
  assert.deepEqual(validateOutputs(config.outputDirAbs, result.manifest), {
    ok: true,
    problems: []
  })

  const graph = readJson(join(config.outputDirAbs, 'graph.json'))
  assert.equal(validateGraph(graph), true)

  const symbols = readJson(join(config.outputDirAbs, 'symbols.json'))
  assert.equal(symbols.schemaVersion, 1)
  assert.ok(Array.isArray(symbols.files))

  for (const name of ['cycles', 'communities', 'layers', 'hotspots', 'blast-radius', 'unresolved', 'externals', 'skipped']) {
    const fact = readJson(join(config.outputDirAbs, 'facts', `${name}.json`))
    assert.equal(fact.schemaVersion, 1, name)
  }
  assert.ok(existsSync(join(config.outputDirAbs, 'facts', 'inventory.md')))
}

test('fixture vacío', (t) => {
  const { config, result } = build(t, 'empty')

  assert.equal(result.manifest.stats.files, 0)
  assert.equal(result.graph.nodes.length, 0)
  assert.equal(result.graph.edges.length, 0)
  assertContract(config, result)
})

test('fixture mixto JS/TS/JSX/TSX', (t) => {
  const { config, result } = build(t, 'mixed')

  assert.equal(result.manifest.stats.files, 6)
  assert.ok(result.manifest.stats.symbols >= 9)
  assert.ok(result.graph.edges.some((edge) => edge.kind === 'import'))
  assert.ok(result.graph.edges.some((edge) => edge.kind === 'inherits'))
  assertContract(config, result)
})

test('fixture monorepo con paths', (t) => {
  const { config, result } = build(t, 'monorepo')
  const edge = result.graph.edges.find(
    (item) =>
      item.from === 'file:packages/app/src/main.ts' &&
      item.to === 'file:packages/core/src/db.ts'
  )

  assert.ok(edge)
  assertContract(config, result)
})

test('fixture con ciclos', (t) => {
  const { config, result } = build(t, 'cycles')
  const cycles = readJson(join(config.outputDirAbs, 'facts', 'cycles.json'))

  assert.ok(cycles.cycles.some((cycle) => cycle.size === 3))
  assert.ok(cycles.selfLoops.includes('file:src/self.js'))
  assertContract(config, result)
})

test('fixture con archivos omitidos', (t) => {
  const dir = copyFixture(t, 'skipped')
  const outside = tempDir(t)
  const target = join(outside, 'outside.js')
  writeFileSync(target, 'export const x = 1\n')
  symlinkSync(target, join(dir, 'link.js'))
  writeFileSync(join(dir, 'src', 'huge.js'), `export const big = '${'x'.repeat(1024 * 1024 + 10)}'\n`)

  const config = loadConfig({ cwd: dir })
  const result = runBuild({ rootAbs: dir, config })
  const skipped = readJson(join(config.outputDirAbs, 'facts', 'skipped.json'))

  assert.ok(skipped.skipped.some((entry) => entry.reason === 'symlink'))
  assert.ok(skipped.skipped.some((entry) => entry.reason === 'too-large'))
  assertContract(config, result)
})

test('existe el documento de contrato', () => {
  const content = readFileSync(join(ROOT, 'docs', 'contracts', 'writer-artifacts-v1.md'), 'utf8')

  assert.match(content, /schemaVersion/)
  assert.match(content, /Fallback/)
  assert.match(content, /manifest\.json/)
})
