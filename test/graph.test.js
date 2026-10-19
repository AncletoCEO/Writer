import test from 'node:test'
import assert from 'node:assert/strict'
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { loadConfig } from '../src/config/load.js'
import { buildGraph } from '../src/graph/build.js'
import { loadTsconfig } from '../src/resolve/tsconfig.js'
import { scanRepository } from '../src/scan/scanner.js'

function tempDir(t) {
  const dir = mkdtempSync(join(tmpdir(), 'ancleto-writer-graph-'))
  t.after(() => rmSync(dir, { recursive: true, force: true }))
  return dir
}

function write(dir, rel, content = '') {
  const abs = join(dir, rel)
  mkdirSync(dirname(abs), { recursive: true })
  writeFileSync(abs, content)
}

function analyze(dir) {
  const config = loadConfig({ cwd: dir })
  const scanResult = scanRepository({ rootAbs: dir, config })
  const tsconfig = loadTsconfig(dir, config.resolve.tsconfig)
  return buildGraph({ rootAbs: dir, config, tsconfig, scanResult })
}

test('grafo de archivos, símbolos y aristas', (t) => {
  const dir = tempDir(t)
  write(
    dir,
    'src/a.js',
    "import { helper } from './b.js'\nexport function run() { return helper() }\n"
  )
  write(
    dir,
    'src/b.js',
    'export function helper() { return 1 }\nexport function runLocal() { return helper() }\nexport class Base {}\n'
  )
  write(
    dir,
    'src/c.js',
    "import { Base } from './b.js'\nimport './a.js'\nimport './a.js'\nexport class App extends Base {}\n"
  )

  const { graph, externals, unresolved } = analyze(dir)

  assert.equal(graph.stats.files, 3)
  assert.equal(graph.stats.symbols, 5)
  assert.equal(graph.stats.externalImports, 0)
  assert.deepEqual(externals, [])
  assert.deepEqual(unresolved, [])

  const importEdges = graph.edges.filter((edge) => edge.kind === 'import')
  assert.deepEqual(
    importEdges.map((edge) => `${edge.from}->${edge.to}`),
    ['file:src/a.js->file:src/b.js', 'file:src/c.js->file:src/a.js', 'file:src/c.js->file:src/b.js']
  )

  const callEdges = graph.edges.filter((edge) => edge.kind === 'call')
  assert.deepEqual(
    callEdges.map((edge) => `${edge.from}->${edge.to}`),
    ['sym:src/b.js#runLocal@2->sym:src/b.js#helper@1']
  )

  const inheritEdges = graph.edges.filter((edge) => edge.kind === 'inherits')
  assert.deepEqual(
    inheritEdges.map((edge) => `${edge.from}->${edge.to}`),
    ['sym:src/c.js#App@4->sym:src/b.js#Base@3']
  )
  assert.equal(inheritEdges[0].confidence, 'inferred')
})
