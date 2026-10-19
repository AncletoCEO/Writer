import test from 'node:test'
import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { DatabaseSync } from 'node:sqlite'
import { runBuild } from '../src/build/run.js'
import { loadConfig } from '../src/config/load.js'
import { checkPackage } from '../src/contract/check.js'

function tempDir(t) {
  const dir = mkdtempSync(join(tmpdir(), 'ancleto-writer-build-'))
  t.after(() => rmSync(dir, { recursive: true, force: true }))
  return dir
}

function write(dir, rel, content = '') {
  const abs = join(dir, rel)
  mkdirSync(dirname(abs), { recursive: true })
  writeFileSync(abs, content)
}

function hashFile(path) {
  return createHash('sha256').update(readFileSync(path)).digest('hex')
}

function createMemoryDb(dir) {
  mkdirSync(join(dir, '.ancleto'), { recursive: true })
  const path = join(dir, '.ancleto', 'memory.db')
  const db = new DatabaseSync(path)
  db.exec(`CREATE TABLE memory_nodes (
    id TEXT PRIMARY KEY,
    memory_key TEXT NOT NULL,
    type TEXT NOT NULL,
    scope TEXT NOT NULL,
    status TEXT NOT NULL,
    content TEXT NOT NULL,
    justification TEXT NOT NULL,
    superseded_by TEXT,
    source TEXT NOT NULL,
    confidence REAL NOT NULL,
    created_at TEXT NOT NULL
  )`)
  db.prepare(
    `INSERT INTO memory_nodes
     (id, memory_key, type, scope, status, content, justification, superseded_by, source, confidence, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).run(
    '1',
    'api-errors',
    'rule',
    'project',
    'active',
    'Usar JSON para errores.',
    '',
    null,
    'test',
    0.9,
    '2026-01-01T00:00:00Z'
  )
  db.exec('PRAGMA wal_checkpoint(TRUNCATE)')
  db.close()
  return path
}

test('build completo publica el contrato y queda fresco', (t) => {
  const dir = tempDir(t)
  write(dir, 'src/a.js', "import { helper } from './b.js'\nexport function run() { return helper() }\n")
  write(dir, 'src/b.js', 'export function helper() { return 1 }\n')
  const memoryPath = createMemoryDb(dir)
  const memoryHash = hashFile(memoryPath)

  const config = loadConfig({ cwd: dir })
  const result = runBuild({ rootAbs: dir, config })

  for (const rel of [
    'manifest.json',
    'graph.json',
    'symbols.json',
    'facts/cycles.json',
    'facts/bridges.json',
    'facts/communities.json',
    'facts/god-nodes.json',
    'facts/layers.json',
    'facts/hotspots.json',
    'facts/blast-radius.json',
    'facts/inventory.md',
    'facts/unresolved.json',
    'facts/externals.json',
    'facts/skipped.json',
    'agent/INDEX.md',
    'agent/SYMBOLS.md',
    'agent/GOTCHAS.md',
    'agent/ARCHITECTURE.md'
  ]) {
    assert.ok(existsSync(join(config.outputDirAbs, rel)), `falta ${rel}`)
  }

  assert.equal(checkPackage({ rootAbs: dir, config }).status, 'fresh')
  assert.equal(hashFile(memoryPath), memoryHash)
  assert.match(
    readFileSync(join(config.outputDirAbs, 'agent', 'GOTCHAS.md'), 'utf8'),
    /\[api-errors\] Usar JSON para errores\./
  )
  assert.equal(result.manifest.stats.files, 2)
})

test('build determinista salvo timestamps del manifest', (t) => {
  const dir = tempDir(t)
  write(dir, 'src/a.js', 'export const a = 1\n')
  write(dir, 'src/b.js', 'export const b = 2\n')

  const config = loadConfig({ cwd: dir })
  const first = runBuild({ rootAbs: dir, config })

  const snapshot = {}
  for (const rel of ['graph.json', 'symbols.json', 'facts/cycles.json', 'agent/INDEX.md']) {
    snapshot[rel] = readFileSync(join(config.outputDirAbs, rel), 'utf8')
  }

  const second = runBuild({ rootAbs: dir, config })

  for (const [rel, content] of Object.entries(snapshot)) {
    assert.equal(readFileSync(join(config.outputDirAbs, rel), 'utf8'), content, rel)
  }
  assert.equal(first.manifest.fingerprint, second.manifest.fingerprint)
})

test('build sin memoria no falla', (t) => {
  const dir = tempDir(t)
  write(dir, 'src/a.js', 'export const a = 1\n')

  const config = loadConfig({ cwd: dir })
  const result = runBuild({ rootAbs: dir, config })

  assert.equal(result.projectRules.available, false)
  assert.equal(result.projectRules.reason, 'missing')
  assert.match(
    readFileSync(join(config.outputDirAbs, 'agent', 'GOTCHAS.md'), 'utf8'),
    /memoria no disponible/
  )
})
