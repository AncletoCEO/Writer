import test from 'node:test'
import assert from 'node:assert/strict'
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { runBuild } from '../src/build/run.js'
import { loadConfig } from '../src/config/load.js'
import { buildUnsupportedFact } from '../src/facts/unsupported.js'
import { scanRepository } from '../src/scan/scanner.js'

function tempDir(t) {
  const dir = mkdtempSync(join(tmpdir(), 'ancleto-writer-unsupported-'))
  t.after(() => rmSync(dir, { recursive: true, force: true }))
  return dir
}

function write(dir, rel, content = '') {
  const abs = join(dir, rel)
  mkdirSync(dirname(abs), { recursive: true })
  writeFileSync(abs, content)
}

test('agrega por lenguaje, conserva count y corta files', () => {
  const fact = buildUnsupportedFact(
    [
      { path: 'src/a.py', extension: '.py', language: 'python' },
      { path: 'src/b.py', extension: '.py', language: 'python' },
      { path: 'main.go', extension: '.go', language: 'go' }
    ],
    { maxFilesPerLanguage: 1 }
  )

  assert.equal(fact.schemaVersion, 1)
  assert.equal(fact.totals.files, 3)
  assert.equal(fact.totals.languages, 2)
  const python = fact.unsupported.find((entry) => entry.language === 'python')
  assert.equal(python.count, 2)
  assert.deepEqual(python.files, ['src/a.py'])
})

test('el scanner reporta lenguajes no soportados sin leerlos', (t) => {
  const dir = tempDir(t)
  write(dir, 'src/a.ts', 'export const a = 1\n')
  write(dir, 'src/app.py', 'print(1)\n')
  write(dir, 'src/db.py', 'print(2)\n')
  write(dir, 'README.md', '# readme\n')
  write(dir, 'assets/logo.png', 'not really a png')
  write(dir, 'node_modules/x.py', 'ignored')
  write(dir, '.ancleto/writer/old.py', 'ignored')

  const config = loadConfig({ cwd: dir })
  const result = scanRepository({ rootAbs: dir, config })

  assert.deepEqual(result.files.map((file) => file.path), ['src/a.ts'])
  assert.deepEqual(
    result.unsupported.map((entry) => entry.path),
    ['src/app.py', 'src/db.py']
  )
  assert.ok(result.unsupported.every((entry) => entry.language === 'python'))
  assert.ok(!result.unsupported.some((entry) => entry.path.includes('node_modules')))
})

test('unsupported.enabled=false desactiva el reporte', (t) => {
  const dir = tempDir(t)
  write(dir, 'src/a.ts', 'export const a = 1\n')
  write(dir, 'src/app.py', 'print(1)\n')

  const config = loadConfig({ cwd: dir })
  config.unsupported.enabled = false
  const result = scanRepository({ rootAbs: dir, config })

  assert.deepEqual(result.unsupported, [])
})

test('build publica el fact y el resumen en docs', (t) => {
  const dir = tempDir(t)
  write(dir, 'src/a.ts', 'export const a = 1\n')
  write(dir, 'src/main.go', 'package main\n')
  const config = loadConfig({ cwd: dir })
  config.languagePack.enabled = false
  runBuild({ rootAbs: dir, config })

  const unsupported = JSON.parse(
    readFileSync(join(config.outputDirAbs, 'facts', 'unsupported.json'), 'utf8')
  )
  assert.equal(unsupported.totals.files, 1)
  assert.equal(unsupported.unsupported[0].language, 'go')
  assert.match(
    readFileSync(join(config.outputDirAbs, 'agent', 'GOTCHAS.md'), 'utf8'),
    /Lenguajes no soportados/
  )
  assert.match(
    readFileSync(join(config.outputDirAbs, 'facts', 'inventory.md'), 'utf8'),
    /go/
  )
})

test('con el language pack desactivado, .py sigue siendo unsupported', (t) => {
  const dir = tempDir(t)
  write(dir, 'src/a.ts', 'export const a = 1\n')
  write(dir, 'src/app.py', 'print(1)\n')
  const config = loadConfig({ cwd: dir })
  config.languagePack.enabled = false
  const result = runBuild({ rootAbs: dir, config })

  assert.equal(result.manifest.stats.files, 1)
  const unsupported = JSON.parse(
    readFileSync(join(config.outputDirAbs, 'facts', 'unsupported.json'), 'utf8')
  )
  assert.equal(unsupported.totals.files, 1)
  assert.equal(unsupported.unsupported[0].language, 'python')
})
