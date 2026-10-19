import test from 'node:test'
import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { existsSync, readFileSync, readdirSync } from 'node:fs'
import { join, relative } from 'node:path'
import { runBuild } from '../src/build/run.js'
import { loadConfig } from '../src/config/load.js'
import { copyFixture, ROOT, tempDir, write } from './helpers/fixtures.js'

function hashFile(path) {
  return createHash('sha256').update(readFileSync(path)).digest('hex')
}

function snapshot(root, ignored = '.ancleto') {
  const out = {}

  function walk(dir) {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      if (entry.isDirectory()) {
        if (entry.name === ignored) continue
        walk(join(dir, entry.name))
      } else if (entry.isFile()) {
        const abs = join(dir, entry.name)
        out[relative(root, abs).replace(/\\/g, '/')] = hashFile(abs)
      }
    }
  }

  walk(root)
  return out
}

test('el build no escribe fuera de outputDir', (t) => {
  const dir = copyFixture(t, 'mixed')
  const before = snapshot(dir)
  const config = loadConfig({ cwd: dir })

  runBuild({ rootAbs: dir, config })

  assert.deepEqual(snapshot(dir), before)
  assert.ok(existsSync(join(dir, '.ancleto', 'writer', 'manifest.json')))
})

test('el código de writer no importa módulos de red', () => {
  const forbidden = /(?:from|require\s*\()\s*['"]node:(?:http|https|net|tls|dgram|http2)\b/
  const sources = []

  function walk(dir) {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      const abs = join(dir, entry.name)
      if (entry.isDirectory()) walk(abs)
      else if (entry.isFile() && entry.name.endsWith('.js')) sources.push(abs)
    }
  }

  walk(join(ROOT, 'src'))

  for (const file of sources) {
    assert.doesNotMatch(readFileSync(file, 'utf8'), forbidden, file)
  }
})

test('el build no ejecuta código del repositorio analizado', (t) => {
  const dir = tempDir(t)
  write(
    dir,
    'src/evil.js',
    "import { writeFileSync } from 'node:fs'\nwriteFileSync('EXECUTED', 'yes')\nexport const evil = 1\n"
  )

  const config = loadConfig({ cwd: dir })
  runBuild({ rootAbs: dir, config })

  assert.equal(existsSync(join(dir, 'EXECUTED')), false)
})
