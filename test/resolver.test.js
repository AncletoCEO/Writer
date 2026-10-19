import test from 'node:test'
import assert from 'node:assert/strict'
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { loadConfig } from '../src/config/load.js'
import { buildExternalsFact } from '../src/facts/externals.js'
import { buildUnresolvedFact } from '../src/facts/unresolved.js'
import { createResolver } from '../src/resolve/imports.js'
import { loadTsconfig } from '../src/resolve/tsconfig.js'

function tempDir(t) {
  const dir = mkdtempSync(join(tmpdir(), 'ancleto-writer-resolve-'))
  t.after(() => rmSync(dir, { recursive: true, force: true }))
  return dir
}

function write(dir, rel, content = '') {
  const abs = join(dir, rel)
  mkdirSync(dirname(abs), { recursive: true })
  writeFileSync(abs, content)
}

function resolverFor(dir) {
  const config = loadConfig({ cwd: dir })
  const tsconfig = loadTsconfig(dir, config.resolve.tsconfig)
  return { resolve: createResolver({ rootAbs: dir, config, tsconfig }), tsconfig }
}

const FROM = 'src/a.js'

test('resuelve relativos con y sin extensión, e index', (t) => {
  const dir = tempDir(t)
  write(dir, 'src/a.js', '')
  write(dir, 'src/b.ts', '')
  write(dir, 'src/dir/index.ts', '')
  const { resolve } = resolverFor(dir)

  assert.deepEqual(resolve('./b', join(dir, FROM)), {
    type: 'resolved',
    target: 'src/b.ts',
    absolute: join(dir, 'src/b.ts')
  })
  assert.equal(resolve('./dir', join(dir, FROM)).target, 'src/dir/index.ts')
  assert.equal(resolve('./b.ts', join(dir, FROM)).target, 'src/b.ts')
})

test('paths y baseUrl de tsconfig', (t) => {
  const dir = tempDir(t)
  write(dir, 'src/a.js', '')
  write(dir, 'src/core/db.ts', '')
  write(dir, 'src/utils/helper.ts', '')
  write(
    dir,
    'tsconfig.json',
    JSON.stringify({
      compilerOptions: {
        baseUrl: 'src',
        paths: { '@core/*': ['core/*'] }
      }
    })
  )
  const { resolve, tsconfig } = resolverFor(dir)

  assert.equal(tsconfig.baseUrlSet, true)
  assert.equal(resolve('@core/db', join(dir, FROM)).target, 'src/core/db.ts')
  assert.equal(resolve('utils/helper', join(dir, FROM)).target, 'src/utils/helper.ts')
})

test('externos', (t) => {
  const dir = tempDir(t)
  write(dir, 'src/a.js', '')
  const { resolve } = resolverFor(dir)

  for (const specifier of ['node:fs', 'lodash', '@scope/pkg', '#internal', 'https://x/y']) {
    assert.deepEqual(resolve(specifier, join(dir, FROM)), { type: 'external' })
  }
})

test('no resueltos y fuera del root', (t) => {
  const dir = tempDir(t)
  write(dir, 'src/a.js', '')
  writeFileSync(join(dirname(dir), 'ancleto-outside.js'), '')
  const { resolve } = resolverFor(dir)

  assert.equal(resolve('./missing', join(dir, FROM)).reason, 'not-found')
  assert.equal(resolve('../../ancleto-outside.js', join(dir, FROM)).reason, 'outside-root')
  assert.equal(resolve('some/pkg', join(dir, FROM)).type, 'external')
})

test('ambiguo cuando hay múltiples extensiones', (t) => {
  const dir = tempDir(t)
  write(dir, 'src/a.js', '')
  write(dir, 'src/b.js', '')
  write(dir, 'src/b.ts', '')
  const { resolve } = resolverFor(dir)
  const result = resolve('./b', join(dir, FROM))

  assert.equal(result.type, 'unresolved')
  assert.equal(result.reason, 'ambiguous')
  assert.deepEqual(result.candidates.sort(), ['src/b.js', 'src/b.ts'])
})

test('facts de externos y no resueltos', () => {
  const externals = buildExternalsFact([
    { specifier: 'lodash', path: 'src/a.js' },
    { specifier: 'lodash', path: 'src/b.js' },
    { specifier: 'node:fs', path: 'src/a.js' }
  ])
  assert.deepEqual(externals.externals[0], {
    specifier: 'lodash',
    count: 2,
    files: ['src/a.js', 'src/b.js']
  })

  const unresolved = buildUnresolvedFact([
    { path: 'src/b.js', specifier: './x', kind: 'static', line: 4, reason: 'not-found' },
    { path: 'src/a.js', specifier: null, kind: 'dynamic', line: 2, reason: 'non-literal' }
  ])
  assert.deepEqual(
    unresolved.unresolved.map((entry) => entry.path),
    ['src/a.js', 'src/b.js']
  )
})
