import test from 'node:test'
import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { DatabaseSync } from 'node:sqlite'
import { readProjectRules } from '../src/memory/read-only.js'

function tempDir(t) {
  const dir = mkdtempSync(join(tmpdir(), 'ancleto-writer-memory-'))
  t.after(() => rmSync(dir, { recursive: true, force: true }))
  return dir
}

function hashFile(path) {
  return createHash('sha256').update(readFileSync(path)).digest('hex')
}

function createMemoryDb(dir) {
  const memoryDir = join(dir, '.ancleto')
  mkdirSync(memoryDir, { recursive: true })
  const path = join(memoryDir, 'memory.db')
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

  const insert = db.prepare(
    `INSERT INTO memory_nodes
     (id, memory_key, type, scope, status, content, justification, superseded_by, source, confidence, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  )
  insert.run('1', 'api-errors', 'rule', 'project', 'active', 'Usar JSON para errores.', '', null, 'test', 0.9, '2026-01-01T00:00:00Z')
  insert.run('2', 'feature-rule', 'rule', 'feature', 'active', 'Regla de feature.', '', null, 'test', 0.9, '2026-01-02T00:00:00Z')
  insert.run('3', 'decision', 'decision', 'project', 'active', 'Decisión.', '', null, 'test', 0.9, '2026-01-03T00:00:00Z')
  insert.run('4', 'old-rule', 'rule', 'project', 'superseded', 'Vieja.', '', null, 'test', 0.9, '2026-01-04T00:00:00Z')

  db.exec('PRAGMA wal_checkpoint(TRUNCATE)')
  db.close()
  return path
}

test('lee solo reglas activas de scope project y no modifica la DB', (t) => {
  const dir = tempDir(t)
  const path = createMemoryDb(dir)
  const before = hashFile(path)

  const result = readProjectRules(dir)

  assert.equal(result.available, true)
  assert.deepEqual(result.rules.map((rule) => rule.memory_key), ['api-errors'])
  assert.equal(hashFile(path), before)
})

test('memoria ausente no rompe la lectura', (t) => {
  const dir = tempDir(t)
  const result = readProjectRules(dir)

  assert.equal(result.available, false)
  assert.equal(result.reason, 'missing')
  assert.deepEqual(result.rules, [])
})

test('memoria deshabilitada', (t) => {
  const dir = tempDir(t)
  const result = readProjectRules(dir, { enabled: false })

  assert.equal(result.available, false)
  assert.equal(result.reason, 'disabled')
})

test('DB corrupta no rompe la lectura', (t) => {
  const dir = tempDir(t)
  mkdirSync(join(dir, '.ancleto'), { recursive: true })
  writeFileSync(join(dir, '.ancleto', 'memory.db'), 'no es sqlite')

  const result = readProjectRules(dir)

  assert.equal(result.available, false)
  assert.ok(result.reason)
})
