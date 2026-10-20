import test from 'node:test'
import assert from 'node:assert/strict'
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { runBuild } from '../src/build/run.js'
import { loadConfig } from '../src/config/load.js'
import { adapters } from '../packages/writer-languages/src/index.js'

const java = adapters.find((adapter) => adapter.id === 'java')

function tempDir(t, prefix = 'ancleto-writer-java-') {
  const dir = mkdtempSync(join(tmpdir(), prefix))
  t.after(() => rmSync(dir, { recursive: true, force: true }))
  return dir
}

function write(dir, rel, content = '') {
  const abs = join(dir, rel)
  mkdirSync(dirname(abs), { recursive: true })
  writeFileSync(abs, content)
}

test('parsea package, imports, tipos, herencia, llamadas y Javadoc', () => {
  const source = [
    'package com.example.app;',
    '',
    'import java.util.List;',
    'import static com.example.util.Utils.helper;',
    'import com.example.db.*;',
    '',
    '/** App class. */',
    'public class App extends Base implements IRunner {',
    '    /** Runs. */',
    '    public void run(int x) { helper(x); }',
    '    public App() {}',
    '    private void helper(int x) {}',
    '}',
    '',
    'class Base {}',
    'interface IRunner { void run(int x); }',
    'interface IChild extends IRunner {}',
    'enum Kind { A }',
    'record Person(String name) {}',
    '@interface Marker {}'
  ].join('\n')

  const result = java.parse({ path: 'src/App.java', lang: 'java', source })

  assert.deepEqual(result.namespaces, ['com.example.app'])
  assert.deepEqual(
    result.imports.map((entry) => entry.specifier),
    ['java.util.List', 'com.example.util.Utils.helper', 'com.example.db']
  )
  assert.deepEqual(result.importedNames, ['List', 'helper'])

  const app = result.symbols.find((symbol) => symbol.name === 'App' && symbol.kind === 'class')
  assert.equal(app.kind, 'class')
  assert.equal(app.summary, 'App class.')

  const run = result.symbols.find(
    (symbol) => symbol.name === 'run' && symbol.owner === 'App'
  )
  assert.equal(run.kind, 'method')
  assert.equal(run.summary, 'Runs.')
  assert.equal(run.signature, 'run(int x)')

  const constructor = result.symbols.find(
    (symbol) => symbol.name === 'App' && symbol.kind === 'method'
  )
  assert.equal(constructor.owner, 'App')
  assert.equal(constructor.signature, 'App()')

  const helper = result.symbols.find(
    (symbol) => symbol.name === 'helper' && symbol.owner === 'App'
  )
  assert.equal(helper.exported, false)

  const runner = result.symbols.find((symbol) => symbol.name === 'IRunner')
  assert.equal(runner.kind, 'interface')
  const interfaceRun = result.symbols.find(
    (symbol) => symbol.name === 'run' && symbol.owner === 'IRunner'
  )
  assert.equal(interfaceRun.exported, true)

  const child = result.symbols.find((symbol) => symbol.name === 'IChild')
  assert.equal(child.kind, 'interface')

  const kind = result.symbols.find((symbol) => symbol.name === 'Kind')
  assert.equal(kind.kind, 'enum')

  const person = result.symbols.find((symbol) => symbol.name === 'Person')
  assert.equal(person.kind, 'class')
  assert.equal(person.signature, 'record Person')

  const marker = result.symbols.find((symbol) => symbol.name === 'Marker')
  assert.equal(marker.kind, 'interface')
  assert.equal(marker.signature, '@interface Marker')

  assert.deepEqual(
    result.inheritance.map((entry) => `${entry.child}->${entry.parent}:${entry.implements}`).sort(),
    ['App->Base:false', 'App->IRunner:true', 'IChild->IRunner:true']
  )
  assert.deepEqual(
    result.calls.map((call) => `${call.caller}->${call.callee}`),
    ['run->helper']
  )
})

test('resuelve imports contra el índice de packages', (t) => {
  const dir = tempDir(t)
  const namespaces = new Map([
    ['com.example.db', ['src/com/example/db/Repo.java', 'src/com/example/db/Store.java']],
    ['com.example.util', ['src/com/example/util/Utils.java']]
  ])

  assert.deepEqual(
    java.resolveImport({
      specifier: 'com.example.db.Store',
      fromFileAbs: join(dir, 'src', 'com', 'example', 'app', 'App.java'),
      rootAbs: dir,
      namespaces
    }),
    {
      type: 'resolved',
      targets: ['src/com/example/db/Repo.java', 'src/com/example/db/Store.java']
    }
  )

  assert.deepEqual(
    java.resolveImport({
      specifier: 'com.example.util.Utils.helper',
      fromFileAbs: join(dir, 'src', 'com', 'example', 'app', 'App.java'),
      rootAbs: dir,
      namespaces
    }),
    { type: 'resolved', targets: ['src/com/example/util/Utils.java'] }
  )

  assert.deepEqual(
    java.resolveImport({
      specifier: 'com.example.db',
      fromFileAbs: join(dir, 'src', 'com', 'example', 'db', 'Store.java'),
      rootAbs: dir,
      namespaces
    }),
    { type: 'resolved', targets: ['src/com/example/db/Repo.java'] }
  )

  assert.deepEqual(
    java.resolveImport({
      specifier: 'java.util.List',
      fromFileAbs: join(dir, 'src', 'App.java'),
      rootAbs: dir,
      namespaces
    }),
    { type: 'external' }
  )
})

test('build integra Java: grafo, packages, herencia, API y UML', (t) => {
  const dir = tempDir(t)
  write(dir, 'src/com/example/db/Store.java', 'package com.example.db;\npublic class Store {}\n')
  write(dir, 'src/com/example/db/Repo.java', 'package com.example.db;\npublic class Repo {}\n')
  write(
    dir,
    'src/com/example/util/Utils.java',
    'package com.example.util;\npublic class Utils { public static void helper(int x) {} }\n'
  )
  write(
    dir,
    'src/com/example/app/Base.java',
    'package com.example.app;\npublic class Base { public void ping() {} }\n'
  )
  write(
    dir,
    'src/com/example/app/IRunner.java',
    'package com.example.app;\npublic interface IRunner { void run(int x); }\n'
  )
  write(
    dir,
    'src/com/example/app/App.java',
    [
      'package com.example.app;',
      '',
      'import com.example.util.Utils.helper;',
      'import com.example.db.*;',
      '',
      'public class App extends Base implements IRunner {',
      '    /** Runs. */',
      '    public void run(int x) { helper(x); }',
      '    private void helper(int x) {}',
      '}'
    ].join('\n')
  )

  const config = loadConfig({ cwd: dir })
  const result = runBuild({ rootAbs: dir, config })

  const javaFiles = result.graph.nodes
    .filter((node) => node.kind === 'file' && node.lang === 'java')
    .map((node) => node.path)
  assert.deepEqual(javaFiles, [
    'src/com/example/app/App.java',
    'src/com/example/app/Base.java',
    'src/com/example/app/IRunner.java',
    'src/com/example/db/Repo.java',
    'src/com/example/db/Store.java',
    'src/com/example/util/Utils.java'
  ])

  const importEdges = result.graph.edges
    .filter((edge) => edge.kind === 'import')
    .map((edge) => `${edge.from}->${edge.to}`)
  assert.deepEqual(importEdges, [
    'file:src/com/example/app/App.java->file:src/com/example/db/Repo.java',
    'file:src/com/example/app/App.java->file:src/com/example/db/Store.java',
    'file:src/com/example/app/App.java->file:src/com/example/util/Utils.java'
  ])

  const inherits = result.graph.edges.filter((edge) => edge.kind === 'inherits')
  assert.deepEqual(
    inherits.map((edge) => `${edge.to}:${edge.inheritsKind}`),
    [
      'sym:src/com/example/app/Base.java#Base@2:extends',
      'sym:src/com/example/app/IRunner.java#IRunner@2:implements'
    ]
  )

  const callEdge = result.graph.edges.find((edge) => edge.kind === 'call')
  assert.equal(callEdge.from, 'sym:src/com/example/app/App.java#run@8')
  assert.equal(callEdge.to, 'sym:src/com/example/app/App.java#helper@9')

  const unsupported = JSON.parse(
    readFileSync(join(config.outputDirAbs, 'facts', 'unsupported.json'), 'utf8')
  )
  assert.equal(unsupported.totals.files, 0)

  const api = readFileSync(join(config.outputDirAbs, 'agent', 'API.md'), 'utf8')
  assert.match(api, /App/)
  assert.match(api, /Base/)

  const architecture = readFileSync(join(config.outputDirAbs, 'agent', 'ARCHITECTURE.md'), 'utf8')
  assert.match(architecture, /classDiagram/)
})

test('sin pack, .java sigue siendo unsupported', (t) => {
  const dir = tempDir(t)
  write(dir, 'src/App.java', 'public class App {}\n')
  const config = loadConfig({ cwd: dir })
  config.languagePack.enabled = false
  const result = runBuild({ rootAbs: dir, config })

  assert.equal(result.graph.nodes.length, 0)
  const unsupported = JSON.parse(
    readFileSync(join(config.outputDirAbs, 'facts', 'unsupported.json'), 'utf8')
  )
  assert.equal(unsupported.totals.files, 1)
  assert.equal(unsupported.unsupported[0].language, 'java')
})
