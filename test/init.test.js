import test from 'node:test'
import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { runInit } from '../src/cli/commands/init.js'
import { CONFIG_FILE } from '../src/config/load.js'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
const BIN = join(ROOT, 'src', 'cli', 'index.js')

function tempDir(t) {
  const dir = mkdtempSync(join(tmpdir(), 'ancleto-writer-init-'))
  t.after(() => rmSync(dir, { recursive: true, force: true }))
  return dir
}

test('init crea el archivo de configuración', (t) => {
  const dir = tempDir(t)
  const result = runInit({ cwd: dir })
  const path = join(dir, CONFIG_FILE)

  assert.equal(result.created, true)
  assert.ok(existsSync(path))
  const config = JSON.parse(readFileSync(path, 'utf8'))
  assert.equal(config.schemaVersion, 1)
})

test('init no sobrescribe sin --force', (t) => {
  const dir = tempDir(t)
  const path = join(dir, CONFIG_FILE)
  writeFileSync(path, '{"custom":true}\n')

  const result = runInit({ cwd: dir })
  assert.equal(result.created, false)
  assert.equal(readFileSync(path, 'utf8'), '{"custom":true}\n')
})

test('init --force sobrescribe', (t) => {
  const dir = tempDir(t)
  const path = join(dir, CONFIG_FILE)
  writeFileSync(path, '{"custom":true}\n')

  const result = runInit({ cwd: dir, force: true })
  assert.equal(result.created, true)
  const config = JSON.parse(readFileSync(path, 'utf8'))
  assert.equal(config.schemaVersion, 1)
  assert.equal(config.custom, undefined)
})

test('CLI init', (t) => {
  const dir = tempDir(t)
  const output = execFileSync(process.execPath, [BIN, 'init'], {
    cwd: dir,
    encoding: 'utf8'
  })

  assert.match(output, /creado/)
  assert.ok(existsSync(join(dir, CONFIG_FILE)))
})
