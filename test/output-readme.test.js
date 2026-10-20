import test from 'node:test'
import assert from 'node:assert/strict'
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { runBuild } from '../src/build/run.js'
import { loadConfig } from '../src/config/load.js'
import { renderOutputReadme } from '../src/render/output-readme.js'

function tempDir(t) {
  const dir = mkdtempSync(join(tmpdir(), 'ancleto-writer-output-'))
  t.after(() => rmSync(dir, { recursive: true, force: true }))
  return dir
}

function write(dir, rel, content = '') {
  const abs = join(dir, rel)
  mkdirSync(dirname(abs), { recursive: true })
  writeFileSync(abs, content)
}

test('genera un README con los artefactos presentes', () => {
  const text = renderOutputReadme({
    paths: ['manifest.json', 'graph.json', 'agent/INDEX.md']
  })

  assert.match(text, /# @ancleto\/writer context/)
  assert.match(text, /manifest\.json/)
  assert.match(text, /graph\.json/)
  assert.match(text, /agent\/INDEX\.md/)
  assert.match(text, /ancleto-writer build/)
  assert.match(text, /AGPL-3\.0-only/)
})

test('build crea el README dentro de outputDir y no toca el del usuario', (t) => {
  const dir = tempDir(t)
  write(dir, 'README.md', '# User README\n\nDo not touch.\n')
  write(dir, 'src/a.js', 'export const a = 1\n')
  const config = loadConfig({ cwd: dir })
  runBuild({ rootAbs: dir, config })

  const generated = readFileSync(join(config.outputDirAbs, 'README.md'), 'utf8')
  assert.match(generated, /manifest\.json/)
  assert.match(generated, /graph\.json/)
  assert.equal(
    readFileSync(join(dir, 'README.md'), 'utf8'),
    '# User README\n\nDo not touch.\n'
  )
})

test('outputReadme.enabled=false no publica README', (t) => {
  const dir = tempDir(t)
  write(dir, 'src/a.js', 'export const a = 1\n')
  const config = loadConfig({ cwd: dir })
  config.outputReadme.enabled = false
  runBuild({ rootAbs: dir, config })

  assert.equal(existsSync(join(config.outputDirAbs, 'README.md')), false)
})
