import test from 'node:test'
import assert from 'node:assert/strict'
import { mkdirSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { performance } from 'node:perf_hooks'
import { runBuild } from '../src/build/run.js'
import { loadConfig } from '../src/config/load.js'
import { tempDir } from './helpers/fixtures.js'

test('smoke: 2.000 archivos en menos de 5 s', { timeout: 60000 }, (t) => {
  const dir = tempDir(t, 'ancleto-writer-perf-')
  const src = join(dir, 'src')
  mkdirSync(src, { recursive: true })

  for (let index = 0; index < 2000; index += 1) {
    const next = (index + 1) % 2000
    writeFileSync(
      join(src, `f${index}.js`),
      `import './f${next}.js'\nexport function f${index}() { return ${index} }\n`
    )
  }

  const config = loadConfig({ cwd: dir })
  const startedAt = performance.now()
  const result = runBuild({ rootAbs: dir, config })
  const duration = performance.now() - startedAt

  console.log(`perf: 2.000 archivos generados en ${duration.toFixed(0)} ms`)
  assert.equal(result.manifest.stats.files, 2000)
  assert.ok(duration < 5000, `build tardó ${duration.toFixed(0)} ms`)
})
