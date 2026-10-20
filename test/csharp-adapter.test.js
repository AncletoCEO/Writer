import test from 'node:test'
import assert from 'node:assert/strict'
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { runBuild } from '../src/build/run.js'
import { loadConfig } from '../src/config/load.js'
import { adapters } from '../packages/writer-languages/src/index.js'

const csharp = adapters.find((adapter) => adapter.id === 'csharp')

function tempDir(t, prefix = 'ancleto-writer-csharp-') {
  const dir = mkdtempSync(join(tmpdir(), prefix))
  t.after(() => rmSync(dir, { recursive: true, force: true }))
  return dir
}

function write(dir, rel, content = '') {
  const abs = join(dir, rel)
  mkdirSync(dirname(abs), { recursive: true })
  writeFileSync(abs, content)
}

test('parsea using, namespaces, tipos, herencia, llamadas y docs XML', () => {
  const source = [
    'using System;',
    'using System.Collections.Generic;',
    'using static System.Math;',
    'using Alias = MyApp.Core.Store;',
    'global using MyApp.Services;',
    '',
    'namespace MyApp.Core {',
    '    /// <summary>',
    '    /// Base class.',
    '    /// </summary>',
    '    public class Base { public void Ping() {} }',
    '',
    '    public interface IRunner { void Run(int x); }',
    '    public struct Point { public int X; }',
    '    public record Person(string Name);',
    '    public enum Kind { A, B }',
    '    public delegate void Handler(int x);',
    '',
    '    public class App : Base, IRunner {',
    '        /// <summary>Runs the app.</summary>',
    '        public void Run(int x) { Helper(x); }',
    '        public App() {}',
    '        private void Helper(int x) {}',
    '    }',
    '}'
  ].join('\n')

  const result = csharp.parse({ path: 'src/App.cs', lang: 'csharp', source })

  assert.deepEqual(
    result.imports.map((entry) => entry.specifier),
    [
      'System',
      'System.Collections.Generic',
      'System.Math',
      'MyApp.Core.Store',
      'MyApp.Services'
    ]
  )
  assert.deepEqual(result.importedNames, ['Alias', 'Generic', 'Math', 'Services', 'System'])
  assert.deepEqual(result.namespaces, ['MyApp.Core'])

  const base = result.symbols.find((symbol) => symbol.name === 'Base')
  assert.equal(base.kind, 'class')
  assert.equal(base.summary, 'Base class.')

  const runner = result.symbols.find((symbol) => symbol.name === 'IRunner')
  assert.equal(runner.kind, 'interface')

  const interfaceRun = result.symbols.find(
    (symbol) => symbol.name === 'Run' && symbol.owner === 'IRunner'
  )
  assert.equal(interfaceRun.kind, 'method')
  assert.equal(interfaceRun.exported, true)

  const point = result.symbols.find((symbol) => symbol.name === 'Point')
  assert.equal(point.signature, 'struct Point')

  const person = result.symbols.find((symbol) => symbol.name === 'Person')
  assert.equal(person.signature, 'record Person')

  const kind = result.symbols.find((symbol) => symbol.name === 'Kind')
  assert.equal(kind.kind, 'enum')

  const handler = result.symbols.find((symbol) => symbol.name === 'Handler')
  assert.equal(handler.kind, 'type')
  assert.equal(handler.signature, 'delegate Handler(int x)')

  const app = result.symbols.find((symbol) => symbol.name === 'App')
  assert.equal(app.kind, 'class')

  const method = result.symbols.find(
    (symbol) => symbol.name === 'Run' && symbol.owner === 'App'
  )
  assert.equal(method.kind, 'method')
  assert.equal(method.summary, 'Runs the app.')
  assert.equal(method.signature, 'Run(int x)')

  const constructor = result.symbols.find(
    (symbol) => symbol.name === 'App' && symbol.kind === 'method'
  )
  assert.equal(constructor.owner, 'App')
  assert.equal(constructor.signature, 'App()')

  const helper = result.symbols.find(
    (symbol) => symbol.name === 'Helper' && symbol.owner === 'App'
  )
  assert.equal(helper.exported, false)

  assert.deepEqual(
    result.inheritance.map((entry) => `${entry.child}->${entry.parent}`),
    ['App->Base', 'App->IRunner']
  )
  assert.deepEqual(
    result.calls.map((call) => `${call.caller}->${call.callee}`),
    ['Run->Helper']
  )
})

test('resuelve using contra el índice de namespaces', (t) => {
  const dir = tempDir(t)
  const namespaces = new Map([
    ['MyApp.Core', ['src/Base.cs', 'src/IRunner.cs']],
    ['MyApp.Services', ['src/Service.cs']]
  ])

  assert.deepEqual(
    csharp.resolveImport({
      specifier: 'MyApp.Services',
      fromFileAbs: join(dir, 'src', 'App.cs'),
      rootAbs: dir,
      namespaces
    }),
    { type: 'resolved', targets: ['src/Service.cs'] }
  )

  assert.deepEqual(
    csharp.resolveImport({
      specifier: 'MyApp.Core',
      fromFileAbs: join(dir, 'src', 'Base.cs'),
      rootAbs: dir,
      namespaces
    }),
    { type: 'resolved', targets: ['src/IRunner.cs'] }
  )

  assert.deepEqual(
    csharp.resolveImport({
      specifier: 'System',
      fromFileAbs: join(dir, 'src', 'App.cs'),
      rootAbs: dir,
      namespaces
    }),
    { type: 'external' }
  )

  assert.deepEqual(
    csharp.resolveImport({
      specifier: 'Singleton',
      fromFileAbs: join(dir, 'src', 'Only.cs'),
      rootAbs: dir,
      namespaces: new Map([['Singleton', ['src/Only.cs']]])
    }),
    { type: 'external' }
  )
})

test('build integra C#: grafo, namespaces, herencia, API y UML', (t) => {
  const dir = tempDir(t)
  write(dir, 'src/Base.cs', 'namespace MyApp.Core;\npublic class Base { public void Ping() {} }\n')
  write(
    dir,
    'src/IRunner.cs',
    'namespace MyApp.Core;\npublic interface IRunner { void Run(int x); }\n'
  )
  write(
    dir,
    'src/Service.cs',
    'namespace MyApp.Services;\npublic class Service { public void Do() {} }\n'
  )
  write(
    dir,
    'src/App.cs',
    [
      'using MyApp.Services;',
      'namespace MyApp.Core;',
      'public class App : Base, IRunner {',
      '    /// <summary>Runs the app.</summary>',
      '    public void Run(int x) { Helper(x); }',
      '    private void Helper(int x) {}',
      '}'
    ].join('\n')
  )

  const config = loadConfig({ cwd: dir })
  const result = runBuild({ rootAbs: dir, config })

  const csharpFiles = result.graph.nodes
    .filter((node) => node.kind === 'file' && node.lang === 'csharp')
    .map((node) => node.path)
  assert.deepEqual(csharpFiles, [
    'src/App.cs',
    'src/Base.cs',
    'src/IRunner.cs',
    'src/Service.cs'
  ])

  const importEdge = result.graph.edges.find((edge) => edge.kind === 'import')
  assert.deepEqual({ from: importEdge.from, to: importEdge.to }, {
    from: 'file:src/App.cs',
    to: 'file:src/Service.cs'
  })

  const inherits = result.graph.edges.filter((edge) => edge.kind === 'inherits')
  assert.deepEqual(
    inherits.map((edge) => `${edge.to}:${edge.inheritsKind}`),
    ['sym:src/Base.cs#Base@2:extends', 'sym:src/IRunner.cs#IRunner@2:implements']
  )

  const callEdge = result.graph.edges.find((edge) => edge.kind === 'call')
  assert.equal(callEdge.from, 'sym:src/App.cs#Run@5')
  assert.equal(callEdge.to, 'sym:src/App.cs#Helper@6')

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

test('sin pack, .cs sigue siendo unsupported', (t) => {
  const dir = tempDir(t)
  write(dir, 'src/App.cs', 'public class App {}\n')
  const config = loadConfig({ cwd: dir })
  config.languagePack.enabled = false
  const result = runBuild({ rootAbs: dir, config })

  assert.equal(result.graph.nodes.length, 0)
  const unsupported = JSON.parse(
    readFileSync(join(config.outputDirAbs, 'facts', 'unsupported.json'), 'utf8')
  )
  assert.equal(unsupported.totals.files, 1)
  assert.equal(unsupported.unsupported[0].language, 'csharp')
})
