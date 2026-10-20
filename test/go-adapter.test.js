import test from 'node:test'
import assert from 'node:assert/strict'
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { runBuild } from '../src/build/run.js'
import { loadConfig } from '../src/config/load.js'
import { adapters } from '../packages/writer-languages/src/index.js'

const go = adapters.find((adapter) => adapter.id === 'go')

function tempDir(t, prefix = 'ancleto-writer-go-') {
  const dir = mkdtempSync(join(tmpdir(), prefix))
  t.after(() => rmSync(dir, { recursive: true, force: true }))
  return dir
}

function write(dir, rel, content = '') {
  const abs = join(dir, rel)
  mkdirSync(dirname(abs), { recursive: true })
  writeFileSync(abs, content)
}

test('parsea imports, structs, interfaces, métodos, embebido y llamadas', () => {
  const source = [
    'package main',
    '',
    'import (',
    '    "fmt"',
    '    db "example.com/app/internal/db"',
    '    _ "embed"',
    ')',
    '',
    '// Base is embedded.',
    'type Base struct { ID int }',
    '',
    'type Runner interface {',
    '    Run(x int) error',
    '    io.Reader',
    '}',
    '',
    '// App is the app.',
    'type App struct {',
    '    Base',
    '    *db.Store',
    '    Name string',
    '}',
    '',
    '// Run does work.',
    'func (a *App) Run(x int) error {',
    '    helper(x)',
    '    fmt.Println(a.Name)',
    '    return nil',
    '}',
    '',
    'func helper(x int) int { return x + 1 }'
  ].join('\n')

  const result = go.parse({ path: 'main.go', lang: 'go', source })

  assert.deepEqual(
    result.imports.map((entry) => entry.specifier),
    ['fmt', 'example.com/app/internal/db', 'embed']
  )
  assert.deepEqual(result.importedNames, ['db', 'fmt'])

  const base = result.symbols.find((symbol) => symbol.name === 'Base')
  assert.equal(base.kind, 'class')
  assert.equal(base.summary, 'Base is embedded.')
  assert.equal(base.signature, 'type Base struct')

  const runner = result.symbols.find((symbol) => symbol.name === 'Runner')
  assert.equal(runner.kind, 'interface')

  const interfaceRun = result.symbols.find(
    (symbol) => symbol.name === 'Run' && symbol.owner === 'Runner'
  )
  assert.equal(interfaceRun.kind, 'method')

  const app = result.symbols.find((symbol) => symbol.name === 'App')
  assert.equal(app.kind, 'class')
  assert.equal(app.summary, 'App is the app.')

  const method = result.symbols.find(
    (symbol) => symbol.name === 'Run' && symbol.owner === 'App'
  )
  assert.equal(method.kind, 'method')
  assert.equal(method.summary, 'Run does work.')
  assert.equal(method.signature, 'Run(x int) error')

  assert.deepEqual(
    result.inheritance.map((entry) => `${entry.child}->${entry.parent}`).sort(),
    ['App->Base', 'App->db.Store', 'Runner->io.Reader']
  )

  assert.deepEqual(
    result.calls.map((call) => `${call.caller}->${call.callee}`),
    ['Run->helper']
  )
})

test('resuelve imports de paquete con go.mod a múltiples archivos', (t) => {
  const dir = tempDir(t)
  write(dir, 'go.mod', 'module example.com/app\n\ngo 1.22\n')
  write(dir, 'internal/db/db.go', 'package db\n\ntype Store struct{}\n')
  write(dir, 'internal/db/store.go', 'package db\n\nfunc Open() *Store { return &Store{} }\n')
  write(dir, 'internal/db/db_test.go', 'package db\n')
  write(dir, 'main.go', 'package main\n')

  const result = go.resolveImport({
    specifier: 'example.com/app/internal/db',
    fromFileAbs: join(dir, 'main.go'),
    rootAbs: dir
  })
  assert.deepEqual(result, {
    type: 'resolved',
    targets: ['internal/db/db.go', 'internal/db/store.go']
  })

  assert.deepEqual(
    go.resolveImport({
      specifier: 'example.com/app',
      fromFileAbs: join(dir, 'main.go'),
      rootAbs: dir
    }),
    { type: 'resolved', targets: ['main.go'] }
  )

  assert.deepEqual(
    go.resolveImport({
      specifier: 'fmt',
      fromFileAbs: join(dir, 'main.go'),
      rootAbs: dir
    }),
    { type: 'external' }
  )

  assert.equal(
    go.resolveImport({
      specifier: 'example.com/app/missing',
      fromFileAbs: join(dir, 'main.go'),
      rootAbs: dir
    }).reason,
    'not-found'
  )
})

test('build integra Go: grafo, paquete multi-archivo, API y UML', (t) => {
  const dir = tempDir(t)
  write(dir, 'go.mod', 'module example.com/app\n\ngo 1.22\n')
  write(dir, 'internal/db/db.go', 'package db\n\ntype Store struct{}\n')
  write(dir, 'internal/db/store.go', 'package db\n\nfunc Open() *Store { return &Store{} }\n')
  write(dir, 'internal/db/db_test.go', 'package db\n')
  write(
    dir,
    'main.go',
    [
      'package main',
      '',
      'import db "example.com/app/internal/db"',
      '',
      'type App struct {',
      '    *db.Store',
      '    Name string',
      '}',
      '',
      '// Run does work.',
      'func (a *App) Run() { helper() }',
      '',
      'func helper() {}'
    ].join('\n')
  )

  const config = loadConfig({ cwd: dir })
  const result = runBuild({ rootAbs: dir, config })

  const goFiles = result.graph.nodes
    .filter((node) => node.kind === 'file' && node.lang === 'go')
    .map((node) => node.path)
  assert.deepEqual(goFiles, [
    'internal/db/db_test.go',
    'internal/db/db.go',
    'internal/db/store.go',
    'main.go'
  ])

  const importEdges = result.graph.edges
    .filter((edge) => edge.kind === 'import')
    .map((edge) => `${edge.from}->${edge.to}`)
  assert.deepEqual(importEdges, [
    'file:main.go->file:internal/db/db.go',
    'file:main.go->file:internal/db/store.go'
  ])
  assert.ok(!importEdges.some((edge) => edge.includes('db_test.go')))

  const inheritEdge = result.graph.edges.find((edge) => edge.kind === 'inherits')
  assert.equal(inheritEdge.to, 'sym:internal/db/db.go#Store@3')

  const callEdge = result.graph.edges.find((edge) => edge.kind === 'call')
  assert.equal(callEdge.to, 'sym:main.go#helper@13')

  const unsupported = JSON.parse(
    readFileSync(join(config.outputDirAbs, 'facts', 'unsupported.json'), 'utf8')
  )
  assert.equal(unsupported.totals.files, 0)

  const api = readFileSync(join(config.outputDirAbs, 'agent', 'API.md'), 'utf8')
  assert.match(api, /Run/)

  const architecture = readFileSync(join(config.outputDirAbs, 'agent', 'ARCHITECTURE.md'), 'utf8')
  assert.match(architecture, /classDiagram/)
})
