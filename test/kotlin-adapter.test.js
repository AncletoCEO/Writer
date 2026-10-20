import test from 'node:test'
import assert from 'node:assert/strict'
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { runBuild } from '../src/build/run.js'
import { loadConfig } from '../src/config/load.js'
import { adapters } from '../packages/writer-languages/src/index.js'

const kotlin = adapters.find((adapter) => adapter.id === 'kotlin')

function tempDir(t, prefix = 'ancleto-writer-kotlin-') {
  const dir = mkdtempSync(join(tmpdir(), prefix))
  t.after(() => rmSync(dir, { recursive: true, force: true }))
  return dir
}

function write(dir, rel, content = '') {
  const abs = join(dir, rel)
  mkdirSync(dirname(abs), { recursive: true })
  writeFileSync(abs, content)
}

test('parsea package, imports, clases, objects, enums, herencia y métodos', () => {
  const source = [
    'package com.example.app',
    '',
    'import com.example.services.Service',
    'import com.example.contracts.Runner as RunnerContract',
    'import com.example.db.*',
    '',
    '/** Base class. */',
    'open class Base {',
    '    /** Ping. */',
    '    open fun ping() {}',
    '    constructor() {}',
    '}',
    '',
    'interface IRunner {',
    '    fun run(x: Int): String',
    '}',
    '',
    'object Singleton {',
    '    fun get(): Singleton = this',
    '}',
    '',
    'data class Point(val x: Int)',
    'enum class Kind { A, B }',
    'sealed class Result',
    '',
    '/** App class. */',
    'class App : Base(), IRunner {',
    '    /** Runs. */',
    '    override fun run(x: Int): String {',
    '        helper(x)',
    '        return "ok"',
    '    }',
    '    private fun hidden() {}',
    '    companion object {',
    '        fun create(): App = App()',
    '    }',
    '}',
    '',
    'fun helper(x: Int): Int = x + 1',
    'private fun privateTop() {}',
    'typealias Handler = (Int) -> Unit'
  ].join('\n')

  const result = kotlin.parse({ path: 'src/App.kt', lang: 'kotlin', source })

  assert.deepEqual(result.namespaces, ['com.example.app'])
  assert.deepEqual(
    result.imports.map((entry) => `${entry.specifier}:${entry.wildcard}`),
    [
      'com.example.services.Service:false',
      'com.example.contracts.Runner:false',
      'com.example.db:true'
    ]
  )
  assert.deepEqual(result.importedNames, ['RunnerContract', 'Service'])

  const base = result.symbols.find((symbol) => symbol.name === 'Base')
  assert.equal(base.kind, 'class')
  assert.equal(base.summary, 'Base class.')

  const ping = result.symbols.find(
    (symbol) => symbol.name === 'ping' && symbol.owner === 'Base'
  )
  assert.equal(ping.summary, 'Ping.')
  assert.equal(ping.exported, true)

  const constructor = result.symbols.find(
    (symbol) => symbol.name === 'constructor' && symbol.owner === 'Base'
  )
  assert.equal(constructor.kind, 'method')

  const runner = result.symbols.find((symbol) => symbol.name === 'IRunner')
  assert.equal(runner.kind, 'interface')

  const singleton = result.symbols.find((symbol) => symbol.name === 'Singleton')
  assert.equal(singleton.kind, 'class')
  assert.equal(singleton.signature, 'object Singleton')

  const point = result.symbols.find((symbol) => symbol.name === 'Point')
  assert.equal(point.kind, 'class')

  const kind = result.symbols.find((symbol) => symbol.name === 'Kind')
  assert.equal(kind.kind, 'enum')
  assert.equal(kind.signature, 'enum Kind')

  const resultClass = result.symbols.find((symbol) => symbol.name === 'Result')
  assert.equal(resultClass.kind, 'class')

  const app = result.symbols.find((symbol) => symbol.name === 'App')
  assert.equal(app.kind, 'class')
  assert.equal(app.summary, 'App class.')

  const run = result.symbols.find(
    (symbol) => symbol.name === 'run' && symbol.owner === 'App'
  )
  assert.equal(run.summary, 'Runs.')
  assert.equal(run.signature, 'run(x: Int)')

  const hidden = result.symbols.find(
    (symbol) => symbol.name === 'hidden' && symbol.owner === 'App'
  )
  assert.equal(hidden.exported, false)

  const create = result.symbols.find(
    (symbol) => symbol.name === 'create' && symbol.owner === 'App'
  )
  assert.equal(create.exported, true)

  const helper = result.symbols.find((symbol) => symbol.name === 'helper')
  assert.equal(helper.kind, 'function')
  assert.equal(helper.exported, true)

  const privateTop = result.symbols.find((symbol) => symbol.name === 'privateTop')
  assert.equal(privateTop.exported, false)

  const handler = result.symbols.find((symbol) => symbol.name === 'Handler')
  assert.equal(handler.kind, 'type')

  assert.deepEqual(
    result.inheritance.map((entry) => `${entry.child}->${entry.parent}`),
    ['App->Base', 'App->IRunner']
  )
  assert.deepEqual(
    result.calls.map((call) => `${call.caller}->${call.callee}`),
    ['run->helper']
  )
})

test('resuelve imports contra el índice de packages', (t) => {
  const dir = tempDir(t)
  const namespaces = new Map([
    ['com.example.core', ['src/core/Base.kt', 'src/core/IRunner.kt']],
    ['com.example.services', ['src/services/Service.kt']]
  ])

  assert.deepEqual(
    kotlin.resolveImport({
      specifier: 'com.example.services.Service',
      fromFileAbs: join(dir, 'src', 'app', 'App.kt'),
      rootAbs: dir,
      namespaces
    }),
    { type: 'resolved', targets: ['src/services/Service.kt'] }
  )

  assert.deepEqual(
    kotlin.resolveImport({
      specifier: 'com.example.core.Base',
      fromFileAbs: join(dir, 'src', 'app', 'App.kt'),
      rootAbs: dir,
      namespaces
    }),
    { type: 'resolved', targets: ['src/core/Base.kt', 'src/core/IRunner.kt'] }
  )

  assert.deepEqual(
    kotlin.resolveImport({
      specifier: 'com.example.core',
      fromFileAbs: join(dir, 'src', 'core', 'Base.kt'),
      rootAbs: dir,
      namespaces
    }),
    { type: 'resolved', targets: ['src/core/IRunner.kt'] }
  )

  assert.deepEqual(
    kotlin.resolveImport({
      specifier: 'kotlin.collections.List',
      fromFileAbs: join(dir, 'src', 'app', 'App.kt'),
      rootAbs: dir,
      namespaces
    }),
    { type: 'external' }
  )
})

test('build integra Kotlin: packages, herencia, API y UML', (t) => {
  const dir = tempDir(t)
  write(
    dir,
    'src/core/Base.kt',
    'package com.example.core\nopen class Base { open fun ping() {} }\n'
  )
  write(
    dir,
    'src/core/IRunner.kt',
    'package com.example.core\ninterface IRunner { fun run(x: Int): String }\n'
  )
  write(
    dir,
    'src/services/Service.kt',
    'package com.example.services\nclass Service { fun doIt() {} }\n'
  )
  write(
    dir,
    'src/app/App.kt',
    [
      'package com.example.app',
      'import com.example.services.Service',
      'import com.example.core.Base',
      'import com.example.core.IRunner',
      'class App : Base(), IRunner {',
      '    override fun run(x: Int): String { helper(x); return "ok" }',
      '    private fun hidden() {}',
      '}',
      'fun helper(x: Int): Int = x + 1'
    ].join('\n')
  )

  const config = loadConfig({ cwd: dir })
  const result = runBuild({ rootAbs: dir, config })

  const kotlinFiles = result.graph.nodes
    .filter((node) => node.kind === 'file' && node.lang === 'kotlin')
    .map((node) => node.path)
  assert.deepEqual(kotlinFiles, [
    'src/app/App.kt',
    'src/core/Base.kt',
    'src/core/IRunner.kt',
    'src/services/Service.kt'
  ])

  const importEdges = result.graph.edges
    .filter((edge) => edge.kind === 'import')
    .map((edge) => `${edge.from}->${edge.to}`)
  assert.deepEqual(importEdges, [
    'file:src/app/App.kt->file:src/core/Base.kt',
    'file:src/app/App.kt->file:src/core/IRunner.kt',
    'file:src/app/App.kt->file:src/services/Service.kt'
  ])

  const inherits = result.graph.edges.filter((edge) => edge.kind === 'inherits')
  assert.deepEqual(
    inherits.map((edge) => `${edge.to}:${edge.inheritsKind}`),
    [
      'sym:src/core/Base.kt#Base@2:extends',
      'sym:src/core/IRunner.kt#IRunner@2:implements'
    ]
  )

  const callEdge = result.graph.edges.find((edge) => edge.kind === 'call')
  assert.equal(callEdge.from, 'sym:src/app/App.kt#run@6')
  assert.equal(callEdge.to, 'sym:src/app/App.kt#helper@9')

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

test('sin pack, .kt y .kts siguen siendo unsupported', (t) => {
  const dir = tempDir(t)
  write(dir, 'src/App.kt', 'class App\n')
  write(dir, 'build.gradle.kts', 'plugins {}\n')
  const config = loadConfig({ cwd: dir })
  config.languagePack.enabled = false
  const result = runBuild({ rootAbs: dir, config })

  assert.equal(result.graph.nodes.length, 0)
  const unsupported = JSON.parse(
    readFileSync(join(config.outputDirAbs, 'facts', 'unsupported.json'), 'utf8')
  )
  assert.equal(unsupported.totals.files, 2)
  assert.ok(unsupported.unsupported.every((entry) => entry.language === 'kotlin'))
})
