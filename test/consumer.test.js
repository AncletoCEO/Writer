import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync, rmSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { runBuild } from '../src/build/run.js'
import { loadConfig } from '../src/config/load.js'
import { consume } from './consumers/consume.js'
import { copyFixture, write } from './helpers/fixtures.js'

test('consumidor: fresco, stale, ausente e incompatible', (t) => {
  const dir = copyFixture(t, 'mixed')
  const config = loadConfig({ cwd: dir })

  assert.deepEqual(consume({ rootAbs: dir, config }), {
    mode: 'fallback',
    reason: 'missing'
  })

  runBuild({ rootAbs: dir, config })
  const fresh = consume({ rootAbs: dir, config })
  assert.equal(fresh.mode, 'writer')
  assert.ok(Array.isArray(fresh.graph.nodes))

  write(dir, 'src/extra.js', 'export const extra = 1\n')
  assert.deepEqual(consume({ rootAbs: dir, config }), {
    mode: 'fallback',
    reason: 'stale'
  })

  const manifestPath = join(config.outputDirAbs, 'manifest.json')
  const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'))
  manifest.schemaVersion = 2
  writeFileSync(manifestPath, JSON.stringify(manifest))
  assert.deepEqual(consume({ rootAbs: dir, config }), {
    mode: 'fallback',
    reason: 'incompatible'
  })

  rmSync(config.outputDirAbs, { recursive: true, force: true })
  assert.deepEqual(consume({ rootAbs: dir, config }), {
    mode: 'fallback',
    reason: 'missing'
  })
})
