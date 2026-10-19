import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync, readdirSync } from 'node:fs'
import { join, relative } from 'node:path'
import { runBuild } from '../src/build/run.js'
import { loadConfig } from '../src/config/load.js'
import { copyFixture } from './helpers/fixtures.js'

function listFiles(root) {
  const out = []

  function walk(dir) {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      const abs = join(dir, entry.name)
      if (entry.isDirectory()) walk(abs)
      else if (entry.isFile()) out.push(relative(root, abs).replace(/\\/g, '/'))
    }
  }

  walk(root)
  return out.sort()
}

test('dos builds son byte-idénticos salvo generatedAt y durationMs', (t) => {
  const dir = copyFixture(t, 'mixed')
  const config = loadConfig({ cwd: dir })

  runBuild({ rootAbs: dir, config })
  const firstFiles = listFiles(config.outputDirAbs)
  const firstContents = new Map(
    firstFiles.map((path) => [path, readFileSync(join(config.outputDirAbs, path), 'utf8')])
  )
  const firstManifest = JSON.parse(firstContents.get('manifest.json'))

  runBuild({ rootAbs: dir, config })
  const secondFiles = listFiles(config.outputDirAbs)
  const secondContents = new Map(
    secondFiles.map((path) => [path, readFileSync(join(config.outputDirAbs, path), 'utf8')])
  )
  const secondManifest = JSON.parse(secondContents.get('manifest.json'))

  assert.deepEqual(secondFiles, firstFiles)

  for (const path of firstFiles) {
    if (path === 'manifest.json') continue
    assert.equal(secondContents.get(path), firstContents.get(path), path)
  }

  delete firstManifest.generatedAt
  delete firstManifest.durationMs
  delete secondManifest.generatedAt
  delete secondManifest.durationMs
  assert.deepEqual(secondManifest, firstManifest)
})
