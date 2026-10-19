import test from 'node:test'
import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { existsSync } from 'node:fs'
import { join } from 'node:path'
import { runLint } from '../src/cli/commands/lint.js'
import { loadConfig } from '../src/config/load.js'
import { copyFixture, ROOT, tempDir, write } from './helpers/fixtures.js'

const BIN = join(ROOT, 'src', 'cli', 'index.js')

function run(args, cwd) {
  return spawnSync(process.execPath, [BIN, ...args], { cwd, encoding: 'utf8' })
}

test('repo limpio devuelve exit 0 y no escribe artefactos', (t) => {
  const dir = tempDir(t)
  write(dir, 'src/a.js', 'export const a = 1\n')
  const config = loadConfig({ cwd: dir })
  const result = runLint({ rootAbs: dir, config })

  assert.equal(result.exitCode, 0)
  assert.deepEqual(result.findings, [])
  assert.equal(existsSync(join(dir, '.ancleto', 'writer')), false)
})

test('ciclo devuelve exit 5 y puede desactivarse', (t) => {
  const dir = copyFixture(t, 'cycles')
  const config = loadConfig({ cwd: dir })

  const result = runLint({ rootAbs: dir, config })
  assert.equal(result.exitCode, 5)
  assert.ok(result.findings.some((finding) => finding.rule === 'cycles'))

  config.lint.cycles = false
  const disabled = runLint({ rootAbs: dir, config })
  assert.equal(disabled.exitCode, 0)
})

test('violación de capa devuelve exit 5', (t) => {
  const dir = tempDir(t)
  write(dir, 'src/utils/x.js', "import '../ui/button.js'\nexport const x = 1\n")
  write(dir, 'src/ui/button.js', 'export const button = 1\n')
  const config = loadConfig({ cwd: dir })
  const result = runLint({ rootAbs: dir, config })

  assert.equal(result.exitCode, 5)
  assert.ok(result.findings.some((finding) => finding.rule === 'layer-violations'))
})

test('import no resuelto devuelve exit 5', (t) => {
  const dir = tempDir(t)
  write(dir, 'src/a.js', "import './missing.js'\nexport const a = 1\n")
  const config = loadConfig({ cwd: dir })
  const result = runLint({ rootAbs: dir, config })

  assert.equal(result.exitCode, 5)
  assert.ok(result.findings.some((finding) => finding.rule === 'unresolved-imports'))
})

test('maxBlastRadius configurable', (t) => {
  const dir = tempDir(t)
  write(dir, 'src/a.js', 'export const a = 1\n')
  write(dir, 'src/b.js', "import './a.js'\nexport const b = 2\n")
  write(dir, 'src/c.js', "import './b.js'\nexport const c = 3\n")
  const config = loadConfig({ cwd: dir })
  config.lint.maxBlastRadius = 0
  const result = runLint({ rootAbs: dir, config })

  assert.equal(result.exitCode, 5)
  assert.ok(result.findings.some((finding) => finding.rule === 'max-blast-radius'))
})

test('CLI lint y --json', (t) => {
  const clean = tempDir(t)
  write(clean, 'src/a.js', 'export const a = 1\n')
  const cleanResult = run(['lint'], clean)
  assert.equal(cleanResult.status, 0)
  assert.match(cleanResult.stdout, /lint OK/)

  const dir = copyFixture(t, 'cycles')
  const json = run(['lint', '--json'], dir)
  assert.equal(json.status, 5)
  const parsed = JSON.parse(json.stdout)
  assert.equal(parsed.status, 'fail')
  assert.equal(parsed.exitCode, 5)
  assert.ok(parsed.findings.length > 0)

  const invalid = run(['lint', '--nope'], dir)
  assert.equal(invalid.status, 1)

  const rooted = run(['lint', '--root', dir], ROOT)
  assert.equal(rooted.status, 5)
})
