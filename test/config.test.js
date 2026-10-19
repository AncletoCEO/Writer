import test from 'node:test'
import assert from 'node:assert/strict'
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import {
  ConfigError,
  defaultConfig,
  loadConfig,
  writeConfigFile
} from '../src/config/load.js'

function tempDir(t) {
  const dir = mkdtempSync(join(tmpdir(), 'ancleto-writer-config-'))
  t.after(() => rmSync(dir, { recursive: true, force: true }))
  return dir
}

test('config por defecto', (t) => {
  const dir = tempDir(t)
  const config = loadConfig({ cwd: dir })

  assert.equal(config.schemaVersion, 1)
  assert.equal(config.outputDir, '.ancleto/writer')
  assert.equal(config.outputDirAbs, join(dir, '.ancleto', 'writer'))
  assert.ok(config.exclude.includes('node_modules'))
  assert.deepEqual(config.warnings, [])
})

test('excludes de .ancletorc', (t) => {
  const dir = tempDir(t)
  writeFileSync(
    join(dir, '.ancletorc'),
    JSON.stringify({ discovery: { exclude: ['docs', '*.log'] } })
  )

  const config = loadConfig({ cwd: dir })
  assert.ok(config.exclude.includes('docs'))
  assert.ok(config.exclude.includes('*.log'))
})

test('merge de archivo y override de CLI', (t) => {
  const dir = tempDir(t)
  writeFileSync(
    join(dir, '.ancleto-writer.json'),
    JSON.stringify({ outputDir: '.cache/writer', exclude: ['fixtures'], maxDepth: 5 })
  )

  const config = loadConfig({ cwd: dir, cli: { outputDir: '.out' } })
  assert.equal(config.outputDir, '.out')
  assert.equal(config.maxDepth, 5)
  assert.ok(config.exclude.includes('fixtures'))
  assert.ok(config.exclude.includes('node_modules'))
})

test('JSON inválido en el archivo de config', (t) => {
  const dir = tempDir(t)
  writeFileSync(join(dir, '.ancleto-writer.json'), '{ bad')

  assert.throws(() => loadConfig({ cwd: dir }), ConfigError)
})

test('.ancletorc inválido solo genera warning', (t) => {
  const dir = tempDir(t)
  writeFileSync(join(dir, '.ancletorc'), '{ bad')

  const config = loadConfig({ cwd: dir })
  assert.equal(config.warnings.length, 1)
})

test('followSymlinks true se rechaza', (t) => {
  const dir = tempDir(t)
  writeFileSync(
    join(dir, '.ancleto-writer.json'),
    JSON.stringify({ followSymlinks: true })
  )

  assert.throws(() => loadConfig({ cwd: dir }), /followSymlinks/)
})

test('outputDir fuera del root se rechaza', (t) => {
  const dir = tempDir(t)
  writeFileSync(
    join(dir, '.ancleto-writer.json'),
    JSON.stringify({ outputDir: '../fuera' })
  )

  assert.throws(() => loadConfig({ cwd: dir }), /dentro del root/)
})

test('schemaVersion incompatible se rechaza', (t) => {
  const dir = tempDir(t)
  writeFileSync(
    join(dir, '.ancleto-writer.json'),
    JSON.stringify({ schemaVersion: 2 })
  )

  assert.throws(() => loadConfig({ cwd: dir }), /schemaVersion/)
})

test('writeConfigFile escribe defaults', (t) => {
  const dir = tempDir(t)
  const path = writeConfigFile(dir, defaultConfig())
  const written = JSON.parse(readFileSync(path, 'utf8'))

  assert.equal(written.schemaVersion, 1)
  assert.equal(written.outputDir, '.ancleto/writer')
  assert.equal(written.dependencies, undefined)
})
