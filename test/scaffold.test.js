import test from 'node:test'
import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import { existsSync, readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
const pkg = JSON.parse(readFileSync(join(ROOT, 'package.json'), 'utf8'))

test('metadata del paquete', () => {
  assert.equal(pkg.name, '@ancleto/writer')
  assert.match(pkg.version, /^\d+\.\d+\.\d+/)
  assert.equal(pkg.type, 'module')
  assert.equal(pkg.license, 'AGPL-3.0-only')
  assert.equal(pkg.engines.node, '>=24.0.0')
  assert.equal(pkg.publishConfig.access, 'public')
  assert.equal(pkg.bin['ancleto-writer'], 'src/cli/index.js')
  assert.ok(existsSync(join(ROOT, pkg.bin['ancleto-writer'])))
})

test('solo devDependencies de lint', () => {
  assert.equal(pkg.dependencies, undefined)
  assert.deepEqual(Object.keys(pkg.devDependencies).sort(), ['eslint', 'globals'])
})

test('archivos publicados y licencia', () => {
  for (const entry of ['src', 'docs', 'LICENSE', 'NOTICE', 'README.md']) {
    assert.ok(pkg.files.includes(entry), `falta ${entry} en files`)
  }
  assert.ok(existsSync(join(ROOT, 'LICENSE')))
  assert.ok(existsSync(join(ROOT, 'NOTICE')))
})

test('el binario reporta versión y licencia', () => {
  const out = execFileSync(
    process.execPath,
    [join(ROOT, pkg.bin['ancleto-writer']), '--version'],
    { encoding: 'utf8' }
  )
  assert.ok(out.includes(`ancleto-writer ${pkg.version}`))
  assert.match(out, /AGPL-3\.0-only/)
})
