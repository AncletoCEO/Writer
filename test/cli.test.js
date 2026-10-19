import test from 'node:test'
import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import {
  chmodSync,
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync
} from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
const BIN = join(ROOT, 'src', 'cli', 'index.js')
const CONFIG_FILE = '.ancleto-writer.json'

function tempDir(t) {
  const dir = mkdtempSync(join(tmpdir(), 'ancleto-writer-cli-'))
  t.after(() => rmSync(dir, { recursive: true, force: true }))
  return dir
}

function write(dir, rel, content = '') {
  const abs = join(dir, rel)
  mkdirSync(dirname(abs), { recursive: true })
  writeFileSync(abs, content)
}

function run(args, cwd) {
  return spawnSync(process.execPath, [BIN, ...args], { cwd, encoding: 'utf8' })
}

function buildFixture(t) {
  const dir = tempDir(t)
  write(dir, 'src/a.js', "import { helper } from './b.js'\nexport function run() { return helper() }\n")
  write(dir, 'src/b.js', 'export function helper() { return 1 }\n')
  return dir
}

test('--version y --help', () => {
  const version = run(['--version'], ROOT)
  assert.equal(version.status, 0)
  assert.match(version.stdout, /ancleto-writer \d+\.\d+\.\d+/)
  assert.match(version.stdout, /AGPL-3\.0-only/)

  const help = run(['--help'], ROOT)
  assert.equal(help.status, 0)
  assert.match(help.stdout, /init/)
  assert.match(help.stdout, /build/)
  assert.match(help.stdout, /doctor/)
})

test('comando y flags inválidos', () => {
  assert.equal(run(['nope'], ROOT).status, 1)
  assert.equal(run(['build', '--nope'], ROOT).status, 1)
  assert.equal(run(['build', '--root'], ROOT).status, 1)
  assert.equal(run([], ROOT).status, 1)
})

test('init y --force', (t) => {
  const dir = tempDir(t)

  const first = run(['init'], dir)
  assert.equal(first.status, 0)
  assert.ok(existsSync(join(dir, CONFIG_FILE)))

  const second = run(['init'], dir)
  assert.equal(second.status, 0)
  assert.match(second.stdout, /ya existe/)

  const forced = run(['init', '--force'], dir)
  assert.equal(forced.status, 0)
  assert.equal(JSON.parse(readFileSync(join(dir, CONFIG_FILE), 'utf8')).schemaVersion, 1)
})

test('build, --json, --quiet y --out', (t) => {
  const dir = buildFixture(t)

  const build = run(['build'], dir)
  assert.equal(build.status, 0)
  assert.ok(existsSync(join(dir, '.ancleto', 'writer', 'manifest.json')))

  const json = run(['build', '--json'], dir)
  assert.equal(json.status, 0)
  const parsed = JSON.parse(json.stdout)
  assert.equal(parsed.status, 'built')
  assert.ok(parsed.stats.files >= 2)

  const quiet = run(['build', '--quiet'], dir)
  assert.equal(quiet.status, 0)
  assert.equal(quiet.stdout, '')

  const out = run(['build', '--out', '.cache/writer', '--json'], dir)
  assert.equal(out.status, 0)
  assert.equal(JSON.parse(out.stdout).outputDir, '.cache/writer')
  assert.ok(existsSync(join(dir, '.cache', 'writer', 'manifest.json')))
})

test('build con --root desde otro cwd', (t) => {
  const dir = buildFixture(t)
  const result = run(['build', '--root', dir, '--json'], ROOT)

  assert.equal(result.status, 0)
  assert.ok(existsSync(join(dir, '.ancleto', 'writer', 'manifest.json')))
})

test('check: fresh, stale e incompatible', (t) => {
  const dir = buildFixture(t)

  assert.equal(run(['build'], dir).status, 0)
  assert.equal(run(['check'], dir).status, 0)

  write(dir, 'src/c.js', 'export const c = 3\n')
  const stale = run(['check', '--json'], dir)
  assert.equal(stale.status, 3)
  assert.equal(JSON.parse(stale.stdout).status, 'stale')

  const manifestPath = join(dir, '.ancleto', 'writer', 'manifest.json')
  const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'))
  manifest.schemaVersion = 2
  writeFileSync(manifestPath, JSON.stringify(manifest))

  assert.equal(run(['check'], dir).status, 4)
})

test('check sin paquete devuelve 3', (t) => {
  const dir = tempDir(t)
  const result = run(['check', '--json'], dir)

  assert.equal(result.status, 3)
  assert.equal(JSON.parse(result.stdout).status, 'missing')
})

test('doctor normal y --json', (t) => {
  const dir = buildFixture(t)
  run(['build'], dir)

  const json = run(['doctor', '--json'], dir)
  assert.equal(json.status, 0)
  const report = JSON.parse(json.stdout)
  assert.match(report.node, /^\d+\./)
  assert.equal(report.root, dir)
  assert.equal(report.config.schemaVersion, 1)
  assert.equal(typeof report.writable.writable, 'boolean')
  assert.equal(report.manifest.schemaVersion, 1)

  const human = run(['doctor'], dir)
  assert.equal(human.status, 0)
  assert.match(human.stdout, /Node:/)
  assert.match(human.stdout, /Manifest:/)
})

test('error de publicación devuelve 2', (t) => {
  if (typeof process.getuid === 'function' && process.getuid() === 0) {
    t.skip('ejecutando como root: permisos no aplican')
    return
  }

  const dir = buildFixture(t)
  const ancletoDir = join(dir, '.ancleto')
  mkdirSync(ancletoDir, { recursive: true })
  chmodSync(ancletoDir, 0o500)

  try {
    const result = run(['build'], dir)
    assert.equal(result.status, 2)
  } finally {
    chmodSync(ancletoDir, 0o700)
  }
})
