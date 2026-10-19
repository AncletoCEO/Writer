import test from 'node:test'
import assert from 'node:assert/strict'
import {
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  symlinkSync,
  writeFileSync
} from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { loadConfig } from '../src/config/load.js'
import { writeSkippedFact } from '../src/facts/skipped.js'
import { scanRepository } from '../src/scan/scanner.js'
import { sha256 } from '../src/util/hash.js'

function tempDir(t) {
  const dir = mkdtempSync(join(tmpdir(), 'ancleto-writer-scan-'))
  t.after(() => rmSync(dir, { recursive: true, force: true }))
  return dir
}

function write(dir, rel, content) {
  const abs = join(dir, rel)
  mkdirSync(dirname(abs), { recursive: true })
  writeFileSync(abs, content)
}

function scan(dir, overrides = {}) {
  const config = { ...loadConfig({ cwd: dir }), ...overrides }
  return scanRepository({ rootAbs: dir, config })
}

test('excludes por defecto', (t) => {
  const dir = tempDir(t)
  write(dir, 'src/a.js', 'export const a = 1\n')
  write(dir, 'node_modules/x.js', 'x')
  write(dir, 'dist/y.js', 'y')
  write(dir, 'docs/z.md', 'z')
  write(dir, '.ancleto/writer/old.js', 'old')

  const result = scan(dir)
  assert.deepEqual(result.files.map((file) => file.path), ['src/a.js'])
})

test('orden estable y metadatos', (t) => {
  const dir = tempDir(t)
  const content = 'export const a = 1\n'
  write(dir, 'src/z.js', 'z')
  write(dir, 'src/a.js', content)
  write(dir, 'src/m.js', 'm')

  const result = scan(dir)
  assert.deepEqual(
    result.files.map((file) => file.path),
    ['src/a.js', 'src/m.js', 'src/z.js']
  )

  const file = result.files[0]
  assert.equal(file.lang, 'js')
  assert.equal(file.lines, 1)
  assert.equal(file.size, Buffer.byteLength(content))
  assert.equal(file.hash, sha256(Buffer.from(content)))
})

test('symlink se rechaza', (t) => {
  const dir = tempDir(t)
  const outside = tempDir(t)
  const target = join(outside, 'outside.js')
  writeFileSync(target, 'export const x = 1\n')
  symlinkSync(target, join(dir, 'link.js'))

  const result = scan(dir)
  assert.deepEqual(result.files, [])
  assert.deepEqual(result.skipped, [{ path: 'link.js', reason: 'symlink' }])
})

test('archivo por encima del límite', (t) => {
  const dir = tempDir(t)
  write(dir, 'src/big.js', 'x'.repeat(100))

  const result = scan(dir, { maxFileSizeBytes: 10 })
  assert.deepEqual(result.files, [])
  assert.deepEqual(result.skipped, [{ path: 'src/big.js', reason: 'too-large' }])
})

test('límite de profundidad', (t) => {
  const dir = tempDir(t)
  write(dir, 'root.js', 'root')
  write(dir, 'src/a.js', 'a')
  write(dir, 'src/deep/b.js', 'b')

  const result = scan(dir, { maxDepth: 1 })
  assert.deepEqual(result.files.map((file) => file.path), ['root.js', 'src/a.js'])
  assert.deepEqual(result.skipped, [{ path: 'src/deep', reason: 'too-deep' }])
})

test('include acota los archivos', (t) => {
  const dir = tempDir(t)
  write(dir, 'src/a.js', 'a')
  write(dir, 'other/b.js', 'b')

  const result = scan(dir, { include: ['src/**'] })
  assert.deepEqual(result.files.map((file) => file.path), ['src/a.js'])
})

test('skipped.json conserva path y reason', (t) => {
  const dir = tempDir(t)
  const skipped = [
    { path: 'z.js', reason: 'too-large' },
    { path: 'a.js', reason: 'symlink' }
  ]
  const outputDir = join(dir, '.ancleto', 'writer')
  const path = writeSkippedFact(outputDir, skipped)
  const fact = JSON.parse(readFileSync(path, 'utf8'))

  assert.equal(fact.schemaVersion, 1)
  assert.deepEqual(fact.skipped, [
    { path: 'a.js', reason: 'symlink' },
    { path: 'z.js', reason: 'too-large' }
  ])
})
