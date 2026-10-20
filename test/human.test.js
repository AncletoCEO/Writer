import test from 'node:test'
import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { runBuild } from '../src/build/run.js'
import { loadConfig } from '../src/config/load.js'
import { runHuman } from '../src/human/report.js'
import { copyFixture, ROOT, tempDir } from './helpers/fixtures.js'

function build(dir) {
  const config = loadConfig({ cwd: dir })
  runBuild({ rootAbs: dir, config })
  return config
}

test('genera overview, architecture y data acotados', (t) => {
  const dir = copyFixture(t, 'mixed')
  const config = build(dir)
  const result = runHuman({
    outputDirAbs: config.outputDirAbs,
    top: 5,
    maxClasses: 5,
    maxNodes: 8,
    maxCommunities: 3
  })

  assert.deepEqual(result.files, ['ARCHITECTURE.md', 'OVERVIEW.md', 'data.json', 'index.html'])
  for (const file of result.files) {
    assert.ok(existsSync(join(config.outputDirAbs, 'human', file)), file)
  }

  const overview = readFileSync(join(config.outputDirAbs, 'human', 'OVERVIEW.md'), 'utf8')
  assert.match(overview, /^# Writer — Overview/m)
  assert.match(overview, /## Lenguajes/)
  assert.match(overview, /## Top god nodes/)
  assert.match(overview, /## Próximos pasos/)

  const architecture = readFileSync(
    join(config.outputDirAbs, 'human', 'ARCHITECTURE.md'),
    'utf8'
  )
  assert.match(architecture, /^# Writer — Architecture/m)
  assert.match(architecture, /## UML/)
  assert.match(architecture, /```mermaid/)
  assert.ok(architecture.includes('classDiagram') || architecture.includes('flowchart'))

  const html = readFileSync(join(config.outputDirAbs, 'human', 'index.html'), 'utf8')
  assert.match(html, /^<!doctype html>/i)
  assert.match(html, /<svg /)
  assert.ok(!html.includes('http://'))
  assert.ok(!html.includes('https://'))
  assert.ok(!html.includes(dir), 'index.html no debe incluir paths absolutos')
  assert.ok(!html.includes('<script'), 'index.html no debe incluir scripts')

  const data = JSON.parse(readFileSync(join(config.outputDirAbs, 'human', 'data.json'), 'utf8'))
  assert.equal(data.schemaVersion, 1)
  assert.ok(data.totals.files > 0)
  assert.ok(data.languages.length > 0)
  assert.deepEqual(data.limits, {
    top: 5,
    maxClasses: 5,
    maxNodes: 8,
    maxCommunities: 3
  })
  assert.ok(!JSON.stringify(data).includes(dir), 'data.json no debe incluir paths absolutos')
})

test('la salida humana es determinista', (t) => {
  const dir = copyFixture(t, 'mixed')
  const config = build(dir)

  runHuman({ outputDirAbs: config.outputDirAbs, top: 3 })
  const first = Object.fromEntries(
    ['OVERVIEW.md', 'ARCHITECTURE.md', 'data.json', 'index.html'].map((file) => [
      file,
      readFileSync(join(config.outputDirAbs, 'human', file), 'utf8')
    ])
  )

  runHuman({ outputDirAbs: config.outputDirAbs, top: 3 })
  for (const [file, content] of Object.entries(first)) {
    assert.equal(
      readFileSync(join(config.outputDirAbs, 'human', file), 'utf8'),
      content,
      file
    )
  }
})

test('aplica los límites a las listas', (t) => {
  const dir = copyFixture(t, 'mixed')
  const config = build(dir)
  const result = runHuman({
    outputDirAbs: config.outputDirAbs,
    top: 1,
    maxClasses: 1,
    maxNodes: 2,
    maxCommunities: 1
  })

  assert.ok(result.data.godNodes.length <= 1)
  assert.ok(result.data.hotspots.length <= 1)
  assert.ok(result.data.communities.length <= 1)
  assert.equal(result.data.limits.top, 1)
  assert.equal(result.data.limits.maxNodes, 2)
})

test('escapa texto del repo en el HTML', (t) => {
  const dir = copyFixture(t, 'mixed')
  const config = build(dir)
  writeFileSync(
    join(config.outputDirAbs, 'facts', 'god-nodes.json'),
    JSON.stringify({
      schemaVersion: 1,
      godNodes: [
        { path: '<script>alert(1)</script>', score: 1, fanIn: 1, symbols: 1 }
      ]
    })
  )

  runHuman({ outputDirAbs: config.outputDirAbs, top: 1 })
  const html = readFileSync(join(config.outputDirAbs, 'human', 'index.html'), 'utf8')
  assert.match(html, /&lt;script&gt;alert\(1\)&lt;\/script&gt;/)
  assert.ok(!html.includes('<script>alert(1)</script>'))
})

test('falla si el paquete no existe', (t) => {
  const dir = tempDir(t)
  assert.throws(
    () => runHuman({ outputDirAbs: join(dir, '.ancleto', 'writer') }),
    /build/
  )
})

test('el comando CLI human responde JSON', (t) => {
  const dir = copyFixture(t, 'mixed')
  build(dir)

  const output = execFileSync(
    process.execPath,
    [join(ROOT, 'src', 'cli', 'index.js'), 'human', '--root', dir, '--top', '2', '--json'],
    { encoding: 'utf8' }
  )
  const result = JSON.parse(output.trim())
  assert.equal(result.status, 'human')
  assert.equal(result.humanDir, '.ancleto/writer/human')
  assert.equal(result.limits.top, 2)
  assert.ok(result.totals.files > 0)
  assert.ok(result.files.includes('index.html'))
  assert.ok(existsSync(join(dir, '.ancleto', 'writer', 'human', 'OVERVIEW.md')))
  assert.ok(existsSync(join(dir, '.ancleto', 'writer', 'human', 'index.html')))
})
