import test from 'node:test'
import assert from 'node:assert/strict'
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { checkPackage } from '../src/contract/check.js'
import { buildManifest, computeFingerprint, outputEntry } from '../src/contract/manifest.js'
import { publishPackage } from '../src/contract/writer.js'
import { validateManifest, validateOutputs } from '../src/contract/validate.js'
import { loadConfig } from '../src/config/load.js'
import { scanRepository } from '../src/scan/scanner.js'

function tempDir(t) {
  const dir = mkdtempSync(join(tmpdir(), 'ancleto-writer-contract-'))
  t.after(() => rmSync(dir, { recursive: true, force: true }))
  return dir
}

function write(dir, rel, content = '') {
  const abs = join(dir, rel)
  mkdirSync(dirname(abs), { recursive: true })
  writeFileSync(abs, content)
}

function buildFixture(dir) {
  const config = loadConfig({ cwd: dir })
  const scanResult = scanRepository({ rootAbs: dir, config })
  const fingerprint = computeFingerprint(scanResult.files)

  const outputs = {
    'graph.json': JSON.stringify({ schemaVersion: 1, stats: {}, nodes: [], edges: [] }),
    'agent/INDEX.md': '# index\n'
  }
  const manifest = buildManifest({
    writerVersion: '0.1.0',
    generatedAt: new Date().toISOString(),
    fingerprint,
    stats: { files: scanResult.files.length },
    outputs: Object.entries(outputs).map(([path, content]) => outputEntry(path, content))
  })

  return {
    config,
    manifest,
    outputs: { ...outputs, 'manifest.json': `${JSON.stringify(manifest, null, 2)}\n` }
  }
}

test('fingerprint determinista', () => {
  const files = [
    { path: 'b.js', size: 2, hash: 'sha256:x' },
    { path: 'a.js', size: 1, hash: 'sha256:y' }
  ]

  assert.equal(computeFingerprint(files), computeFingerprint([...files].reverse()))
  assert.notEqual(
    computeFingerprint(files),
    computeFingerprint([{ path: 'a.js', size: 1, hash: 'sha256:z' }])
  )
})

test('validación de manifest', (t) => {
  const dir = tempDir(t)
  const { manifest } = buildFixture(dir)

  assert.equal(validateManifest(manifest), true)
  assert.throws(() => validateManifest({ ...manifest, schemaVersion: 2 }), /schemaVersion/)
  assert.throws(() => validateManifest({ ...manifest, fingerprint: 'bad' }), /fingerprint/)
  assert.throws(() => validateManifest({ ...manifest, outputs: [{ path: 'x' }] }), /sha256/)
})

test('publicación atómica y validación de salidas', (t) => {
  const dir = tempDir(t)
  const { config, outputs } = buildFixture(dir)

  assert.throws(
    () => publishPackage({ outputDirAbs: config.outputDirAbs, outputs: { 'a.json': 'a' } }),
    /manifest/
  )

  publishPackage({ outputDirAbs: config.outputDirAbs, outputs })
  assert.ok(existsSync(join(config.outputDirAbs, 'manifest.json')))
  assert.ok(existsSync(join(config.outputDirAbs, 'graph.json')))

  const manifest = JSON.parse(readFileSync(join(config.outputDirAbs, 'manifest.json'), 'utf8'))
  assert.deepEqual(validateOutputs(config.outputDirAbs, manifest), { ok: true, problems: [] })
})

test('un fallo de publicación conserva el paquete anterior', (t) => {
  const dir = tempDir(t)
  const { config, outputs } = buildFixture(dir)
  publishPackage({ outputDirAbs: config.outputDirAbs, outputs })

  const before = readFileSync(join(config.outputDirAbs, 'graph.json'), 'utf8')

  assert.throws(() =>
    publishPackage({
      outputDirAbs: config.outputDirAbs,
      outputs: {
        'graph.json': 'nuevo',
        'bad.json': { not: 'contenido válido' },
        'manifest.json': '{}'
      }
    })
  )

  assert.equal(readFileSync(join(config.outputDirAbs, 'graph.json'), 'utf8'), before)
})

test('check: fresh, stale, incompatible y missing', (t) => {
  const dir = tempDir(t)
  write(dir, 'src/a.js', 'export const a = 1\n')
  const { config, outputs } = buildFixture(dir)

  assert.equal(checkPackage({ rootAbs: dir, config }).status, 'missing')

  publishPackage({ outputDirAbs: config.outputDirAbs, outputs })
  assert.equal(checkPackage({ rootAbs: dir, config }).status, 'fresh')

  write(dir, 'src/b.js', 'export const b = 2\n')
  assert.equal(checkPackage({ rootAbs: dir, config }).status, 'stale')

  const manifestPath = join(config.outputDirAbs, 'manifest.json')
  const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'))
  manifest.schemaVersion = 2
  writeFileSync(manifestPath, JSON.stringify(manifest))
  assert.equal(checkPackage({ rootAbs: dir, config }).status, 'incompatible')
})
