import test from 'node:test'
import assert from 'node:assert/strict'
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { runBuild } from '../src/build/run.js'
import { loadConfig } from '../src/config/load.js'
import { adapters } from '../packages/writer-languages/src/index.js'

const swift = adapters.find((adapter) => adapter.id === 'swift')

function tempDir(t, prefix = 'ancleto-writer-swift-') {
  const dir = mkdtempSync(join(tmpdir(), prefix))
  t.after(() => rmSync(dir, { recursive: true, force: true }))
  return dir
}

function write(dir, rel, content = '') {
  const abs = join(dir, rel)
  mkdirSync(dirname(abs), { recursive: true })
  writeFileSync(abs, content)
}

test('parsea imports, protocolos, clases, structs, enums, extensiones y métodos', () => {
  const source = [
    'import Foundation',
    'import UIKit',
    '',
    '/// Base protocol.',
    'public protocol Runner {',
    '    func run(_ x: Int) throws -> String',
    '}',
    '',
    '/// Base class.',
    'open class Base {',
    '    /// Ping.',
    '    public func ping() {}',
    '    init() {}',
    '    deinit {}',
    '}',
    '',
    '/// App class.',
    'public final class App: Base, Runner {',
    '    public func run(_ x: Int) throws -> String {',
    '        helper(x)',
    '        return "ok"',
    '    }',
    '    private func hidden() {}',
    '}',
    '',
    'public struct Point { public var x: Int }',
    'public enum Kind { case a }',
    '',
    'extension App: CustomStringConvertible {',
    '    public func extra() {}',
    '}',
    '',
    'public typealias Handler = (Int) -> Void',
    'public func helper(_ x: Int) -> Int { x + 1 }'
  ].join('\n')

  const result = swift.parse({ path: 'src/App.swift', lang: 'swift', source })

  assert.deepEqual(
    result.imports.map((entry) => entry.specifier),
    ['Foundation', 'UIKit']
  )

  const runner = result.symbols.find((symbol) => symbol.name === 'Runner')
  assert.equal(runner.kind, 'interface')
  assert.equal(runner.summary, 'Base protocol.')

  const protocolRun = result.symbols.find(
    (symbol) => symbol.name === 'run' && symbol.owner === 'Runner'
  )
  assert.equal(protocolRun.kind, 'method')
  assert.equal(protocolRun.exported, true)

  const base = result.symbols.find((symbol) => symbol.name === 'Base')
  assert.equal(base.kind, 'class')
  assert.equal(base.summary, 'Base class.')

  const ping = result.symbols.find(
    (symbol) => symbol.name === 'ping' && symbol.owner === 'Base'
  )
  assert.equal(ping.summary, 'Ping.')
  assert.equal(ping.exported, true)

  const deinit = result.symbols.find(
    (symbol) => symbol.name === 'deinit' && symbol.owner === 'Base'
  )
  assert.equal(deinit.exported, false)

  const app = result.symbols.find((symbol) => symbol.name === 'App' && symbol.kind === 'class')
  assert.equal(app.kind, 'class')
  assert.equal(app.summary, 'App class.')

  const run = result.symbols.find(
    (symbol) => symbol.name === 'run' && symbol.owner === 'App'
  )
  assert.equal(run.kind, 'method')
  assert.equal(run.signature, 'run(_ x: Int)')

  const hidden = result.symbols.find(
    (symbol) => symbol.name === 'hidden' && symbol.owner === 'App'
  )
  assert.equal(hidden.exported, false)

  const point = result.symbols.find((symbol) => symbol.name === 'Point')
  assert.equal(point.kind, 'class')
  assert.equal(point.signature, 'struct Point')

  const kind = result.symbols.find((symbol) => symbol.name === 'Kind')
  assert.equal(kind.kind, 'enum')
  assert.equal(kind.signature, 'enum Kind')

  const extra = result.symbols.find(
    (symbol) => symbol.name === 'extra' && symbol.owner === 'App'
  )
  assert.equal(extra.kind, 'method')
  assert.equal(extra.exported, true)

  const handler = result.symbols.find((symbol) => symbol.name === 'Handler')
  assert.equal(handler.kind, 'type')

  const helper = result.symbols.find((symbol) => symbol.name === 'helper')
  assert.equal(helper.kind, 'function')
  assert.equal(helper.exported, true)

  assert.deepEqual(
    result.inheritance.map((entry) => `${entry.child}->${entry.parent}`),
    ['App->Base', 'App->Runner', 'App->CustomStringConvertible']
  )
  assert.deepEqual(
    result.calls.map((call) => `${call.caller}->${call.callee}`),
    ['run->helper']
  )
})

test('los imports de Swift quedan externos', () => {
  assert.deepEqual(
    swift.resolveImport({ specifier: 'Foundation', fromFileAbs: '/repo/App.swift', rootAbs: '/repo' }),
    { type: 'external' }
  )
})

test('build integra Swift: protocolos, herencia, conformancia, API y UML', (t) => {
  const dir = tempDir(t)
  write(
    dir,
    'src/Base.swift',
    'import Foundation\npublic protocol Runner { func run(_ x: Int) throws -> String }\nopen class Base { public func ping() {} }\n'
  )
  write(
    dir,
    'src/App.swift',
    [
      'import Foundation',
      'public final class App: Base, Runner {',
      '    public func run(_ x: Int) throws -> String { helper(x); return "ok" }',
      '    private func hidden() {}',
      '}',
      'public func helper(_ x: Int) -> Int { x + 1 }'
    ].join('\n')
  )

  const config = loadConfig({ cwd: dir })
  const result = runBuild({ rootAbs: dir, config })

  const swiftFiles = result.graph.nodes
    .filter((node) => node.kind === 'file' && node.lang === 'swift')
    .map((node) => node.path)
  assert.deepEqual(swiftFiles, ['src/App.swift', 'src/Base.swift'])

  const inherits = result.graph.edges.filter((edge) => edge.kind === 'inherits')
  assert.deepEqual(
    inherits.map((edge) => `${edge.to}:${edge.inheritsKind}`),
    [
      'sym:src/Base.swift#Base@3:extends',
      'sym:src/Base.swift#Runner@2:implements'
    ]
  )

  const callEdge = result.graph.edges.find((edge) => edge.kind === 'call')
  assert.equal(callEdge.from, 'sym:src/App.swift#run@3')
  assert.equal(callEdge.to, 'sym:src/App.swift#helper@6')

  assert.equal(result.graph.stats.externalImports, 2)

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

test('sin pack, .swift sigue siendo unsupported', (t) => {
  const dir = tempDir(t)
  write(dir, 'src/App.swift', 'public class App {}\n')
  const config = loadConfig({ cwd: dir })
  config.languagePack.enabled = false
  const result = runBuild({ rootAbs: dir, config })

  assert.equal(result.graph.nodes.length, 0)
  const unsupported = JSON.parse(
    readFileSync(join(config.outputDirAbs, 'facts', 'unsupported.json'), 'utf8')
  )
  assert.equal(unsupported.totals.files, 1)
  assert.equal(unsupported.unsupported[0].language, 'swift')
})
