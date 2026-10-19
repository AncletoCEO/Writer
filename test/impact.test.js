import test from 'node:test'
import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { join } from 'node:path'
import { runBuild } from '../src/build/run.js'
import { runImpact } from '../src/cli/commands/impact.js'
import { loadConfig } from '../src/config/load.js'
import { ROOT, tempDir, write } from './helpers/fixtures.js'

const BIN = join(ROOT, 'src', 'cli', 'index.js')

function chainFixture(t) {
  const dir = tempDir(t)
  write(dir, 'src/a.js', 'export const a = 1\n')
  write(dir, 'src/b.js', "import './a.js'\nexport const b = 2\n")
  write(dir, 'src/c.js', "import './b.js'\nexport const c = 3\n")
  const config = loadConfig({ cwd: dir })
  runBuild({ rootAbs: dir, config })
  return { dir, config }
}

function cli(args, cwd) {
  return spawnSync(process.execPath, [BIN, ...args], { cwd, encoding: 'utf8' })
}

test('dependientes directos y transitivos con profundidad', (t) => {
  const { dir, config } = chainFixture(t)

  const all = runImpact({ rootAbs: dir, config, files: ['src/a.js'] })
  assert.equal(all.exitCode, 0)
  assert.deepEqual(all.results[0].direct, ['src/b.js'])
  assert.deepEqual(all.results[0].transitive, ['src/c.js'])

  const shallow = runImpact({ rootAbs: dir, config, files: ['src/a.js'], depth: 1 })
  assert.deepEqual(shallow.results[0].direct, ['src/b.js'])
  assert.deepEqual(shallow.results[0].transitive, [])
})

test('archivo sin dependientes y archivo inexistente', (t) => {
  const { dir, config } = chainFixture(t)

  const leaf = runImpact({ rootAbs: dir, config, files: ['src/c.js'] })
  assert.equal(leaf.exitCode, 0)
  assert.deepEqual(leaf.results[0].direct, [])
  assert.deepEqual(leaf.results[0].transitive, [])

  const missing = runImpact({ rootAbs: dir, config, files: ['src/missing.js'] })
  assert.equal(missing.exitCode, 1)
  assert.equal(missing.status, 'not-found')
})

test('detecta stale y reconstruye con build', (t) => {
  const { dir, config } = chainFixture(t)
  write(dir, 'src/a.js', 'export const a = 2\n')

  const stale = runImpact({ rootAbs: dir, config, files: ['src/a.js'] })
  assert.equal(stale.exitCode, 3)
  assert.equal(stale.status, 'stale')

  const rebuilt = runImpact({ rootAbs: dir, config, files: ['src/a.js'], build: true })
  assert.equal(rebuilt.exitCode, 0)
})

test('incluye ciclos, capas y tests afectados', (t) => {
  const dir = tempDir(t)
  write(dir, 'src/a.js', "import './b.js'\nexport const a = 1\n")
  write(dir, 'src/b.js', "import './a.js'\nexport const b = 2\n")
  write(dir, 'test/a.test.js', "import '../src/a.js'\n")
  const config = loadConfig({ cwd: dir })
  runBuild({ rootAbs: dir, config })

  const result = runImpact({ rootAbs: dir, config, files: ['src/a.js'] })
  const entry = result.results[0]
  assert.ok(entry.cycles.length > 0)
  assert.ok(entry.tests.includes('test/a.test.js'))
  assert.equal(typeof entry.layers['src/a.js'], 'string')
})

test('CLI impact, --json, --depth, --build y errores', (t) => {
  const { dir } = chainFixture(t)

  const json = cli(['impact', 'src/a.js', '--json'], dir)
  assert.equal(json.status, 0)
  const parsed = JSON.parse(json.stdout)
  assert.equal(parsed.status, 'ok')
  assert.deepEqual(parsed.results[0].direct, ['src/b.js'])

  const human = cli(['impact', 'src/a.js', '--depth', '1'], dir)
  assert.equal(human.status, 0)
  assert.match(human.stdout, /directos \(1\)/)

  const missing = cli(['impact', 'src/missing.js'], dir)
  assert.equal(missing.status, 1)

  const noFiles = cli(['impact'], dir)
  assert.equal(noFiles.status, 1)

  const badDepth = cli(['impact', 'src/a.js', '--depth', '0'], dir)
  assert.equal(badDepth.status, 1)

  write(dir, 'src/a.js', 'export const a = 3\n')
  assert.equal(cli(['impact', 'src/a.js'], dir).status, 3)
  assert.equal(cli(['impact', 'src/a.js', '--build'], dir).status, 0)
})
