import test from 'node:test'
import assert from 'node:assert/strict'
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { runBuild } from '../src/build/run.js'
import { runLint } from '../src/cli/commands/lint.js'
import { loadConfig } from '../src/config/load.js'
import { collectEntrypoints, detectOrphanFiles } from '../src/metrics/orphans.js'

function tempDir(t) {
  const dir = mkdtempSync(join(tmpdir(), 'ancleto-writer-orphans-'))
  t.after(() => rmSync(dir, { recursive: true, force: true }))
  return dir
}

function write(dir, rel, content = '') {
  const abs = join(dir, rel)
  mkdirSync(dirname(abs), { recursive: true })
  writeFileSync(abs, content)
}

function node(path, fanIn = 0) {
  return { id: `file:${path}`, kind: 'file', path, fanIn, layer: 'unknown' }
}

test('entrypoints desde package.json', () => {
  const entrypoints = collectEntrypoints({
    main: './src/main.js',
    bin: { cli: 'src/cli.js' },
    exports: {
      '.': { import: './src/index.js', require: './src/index.cjs' },
      './sub': './src/sub.js'
    }
  })

  assert.ok(entrypoints.has('src/main.js'))
  assert.ok(entrypoints.has('src/cli.js'))
  assert.ok(entrypoints.has('src/index.js'))
  assert.ok(entrypoints.has('src/index.cjs'))
  assert.ok(entrypoints.has('src/sub.js'))
})

test('detecta huérfanos y excluye entrypoints, tests, config y scripts', () => {
  const result = detectOrphanFiles({
    fileNodes: [
      node('src/orphan.js'),
      node('src/used.js', 2),
      node('src/cli.js'),
      node('test/a.test.js'),
      node('scripts/build.js'),
      node('eslint.config.js'),
      node('src/ignored.js'),
      node('src/low.js')
    ],
    packageJson: { bin: { cli: 'src/cli.js' } },
    config: { orphans: { enabled: true, entrypoints: [], exclude: ['src/ignored.js'] } },
    hasUnresolved: true
  })

  assert.deepEqual(
    result.orphanFiles.map((entry) => entry.path),
    ['src/low.js', 'src/orphan.js']
  )
  assert.ok(result.orphanFiles.every((entry) => entry.confidence === 'low'))
  assert.ok(result.excluded.some((entry) => entry.path === 'src/cli.js' && entry.reason === 'entrypoint'))
  assert.ok(result.excluded.some((entry) => entry.path === 'test/a.test.js' && entry.reason === 'test'))
  assert.ok(result.excluded.some((entry) => entry.path === 'scripts/build.js' && entry.reason === 'script'))
  assert.ok(result.excluded.some((entry) => entry.path === 'eslint.config.js' && entry.reason === 'config'))
})

test('orphans.enabled=false desactiva la detección', () => {
  const result = detectOrphanFiles({
    fileNodes: [node('src/orphan.js')],
    config: { orphans: { enabled: false } }
  })

  assert.deepEqual(result.orphanFiles, [])
  assert.deepEqual(result.excluded, [])
})

test('lint.orphanFiles es opt-in', (t) => {
  const dir = tempDir(t)
  write(dir, 'src/a.js', 'export const a = 1\n')
  const config = loadConfig({ cwd: dir })

  assert.equal(runLint({ rootAbs: dir, config }).exitCode, 0)
  config.lint.orphanFiles = true
  const result = runLint({ rootAbs: dir, config })
  assert.equal(result.exitCode, 5)
  assert.ok(result.findings.some((finding) => finding.rule === 'orphan-files'))
})

test('build publica dead-code.json y la sección en GOTCHAS', (t) => {
  const dir = tempDir(t)
  write(dir, 'package.json', JSON.stringify({ main: 'src/app.js' }))
  write(dir, 'src/app.js', 'export const app = 1\n')
  write(dir, 'src/orphan.js', 'export const orphan = 1\n')
  const config = loadConfig({ cwd: dir })
  runBuild({ rootAbs: dir, config })

  const fact = JSON.parse(
    readFileSync(join(config.outputDirAbs, 'facts', 'dead-code.json'), 'utf8')
  )
  assert.equal(fact.schemaVersion, 1)
  assert.deepEqual(fact.orphanFiles.map((entry) => entry.path), ['src/orphan.js'])
  assert.ok(fact.excluded.some((entry) => entry.path === 'src/app.js'))
  assert.match(
    readFileSync(join(config.outputDirAbs, 'agent', 'GOTCHAS.md'), 'utf8'),
    /Archivos huérfanos/
  )
})
