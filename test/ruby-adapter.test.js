import test from 'node:test'
import assert from 'node:assert/strict'
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { runBuild } from '../src/build/run.js'
import { loadConfig } from '../src/config/load.js'
import { adapters } from '../packages/writer-languages/src/index.js'

const ruby = adapters.find((adapter) => adapter.id === 'ruby')

function tempDir(t, prefix = 'ancleto-writer-ruby-') {
  const dir = mkdtempSync(join(tmpdir(), prefix))
  t.after(() => rmSync(dir, { recursive: true, force: true }))
  return dir
}

function write(dir, rel, content = '') {
  const abs = join(dir, rel)
  mkdirSync(dirname(abs), { recursive: true })
  writeFileSync(abs, content)
}

test('parsea require, clases, módulos, mixins, métodos y visibilidad', () => {
  const source = [
    "require 'json'",
    "require_relative 'lib/base'",
    "require_relative 'lib/mixin'",
    '',
    '# Base class.',
    'class Base',
    '  def ping',
    '  end',
    'end',
    '',
    'module M',
    '  def mixin',
    '  end',
    'end',
    '',
    '# App class.',
    'class App < Base',
    '  include M',
    '  extend M',
    '',
    '  def initialize(name)',
    '    @name = name',
    '  end',
    '',
    '  # Runs.',
    '  def run(x)',
    '    helper(x)',
    '    puts x',
    '  end',
    '',
    '  private',
    '',
    '  def hidden',
    '  end',
    'end',
    '',
    'def helper(x)',
    '  x + 1',
    'end',
    '',
    'def self.top',
    'end'
  ].join('\n')

  const result = ruby.parse({ path: 'src/app.rb', lang: 'ruby', source })

  assert.deepEqual(
    result.imports.map((entry) => `${entry.specifier}:${entry.relative}`),
    ['json:false', 'lib/base:true', 'lib/mixin:true']
  )

  const base = result.symbols.find((symbol) => symbol.name === 'Base')
  assert.equal(base.kind, 'class')
  assert.equal(base.summary, 'Base class.')

  const ping = result.symbols.find(
    (symbol) => symbol.name === 'ping' && symbol.owner === 'Base'
  )
  assert.equal(ping.kind, 'method')
  assert.equal(ping.signature, 'ping()')

  const mixinModule = result.symbols.find((symbol) => symbol.name === 'M')
  assert.equal(mixinModule.kind, 'class')
  assert.equal(mixinModule.signature, 'module M')

  const mixinMethod = result.symbols.find(
    (symbol) => symbol.name === 'mixin' && symbol.owner === 'M'
  )
  assert.equal(mixinMethod.kind, 'method')

  const app = result.symbols.find((symbol) => symbol.name === 'App')
  assert.equal(app.kind, 'class')
  assert.equal(app.summary, 'App class.')

  const initialize = result.symbols.find(
    (symbol) => symbol.name === 'initialize' && symbol.owner === 'App'
  )
  assert.equal(initialize.signature, 'initialize(name)')

  const run = result.symbols.find(
    (symbol) => symbol.name === 'run' && symbol.owner === 'App'
  )
  assert.equal(run.summary, 'Runs.')
  assert.equal(run.signature, 'run(x)')

  const hidden = result.symbols.find(
    (symbol) => symbol.name === 'hidden' && symbol.owner === 'App'
  )
  assert.equal(hidden.exported, false)

  const helper = result.symbols.find(
    (symbol) => symbol.name === 'helper' && symbol.kind === 'function'
  )
  assert.equal(helper.exported, true)
  assert.equal(helper.signature, 'helper(x)')

  const top = result.symbols.find(
    (symbol) => symbol.name === 'top' && symbol.kind === 'function'
  )
  assert.equal(top.signature, 'top()')

  assert.ok(
    result.inheritance.some(
      (entry) => entry.child === 'App' && entry.parent === 'Base' && entry.implements === false
    )
  )
  assert.ok(
    result.inheritance.some(
      (entry) => entry.child === 'App' && entry.parent === 'M' && entry.implements === true
    )
  )
  assert.deepEqual(
    result.calls.map((call) => `${call.caller}->${call.callee}`),
    ['run->helper']
  )
})

test('resuelve require_relative y deja require como externo', (t) => {
  const dir = tempDir(t)
  write(dir, 'src/lib/base.rb', '')
  write(dir, 'src/lib/mixin.rb', '')
  write(dir, 'src/util.rb', '')
  write(dir, 'shared.rb', '')

  const from = join(dir, 'src', 'app.rb')
  const relative = { relative: true }

  assert.deepEqual(
    ruby.resolveImport({
      specifier: 'lib/base',
      fromFileAbs: from,
      rootAbs: dir,
      importEntry: relative
    }),
    { type: 'resolved', target: 'src/lib/base.rb' }
  )
  assert.deepEqual(
    ruby.resolveImport({
      specifier: 'util',
      fromFileAbs: from,
      rootAbs: dir,
      importEntry: relative
    }),
    { type: 'resolved', target: 'src/util.rb' }
  )
  assert.deepEqual(
    ruby.resolveImport({
      specifier: '../shared',
      fromFileAbs: from,
      rootAbs: dir,
      importEntry: relative
    }),
    { type: 'resolved', target: 'shared.rb' }
  )
  assert.deepEqual(
    ruby.resolveImport({
      specifier: 'json',
      fromFileAbs: from,
      rootAbs: dir,
      importEntry: { relative: false }
    }),
    { type: 'external' }
  )
  assert.equal(
    ruby.resolveImport({
      specifier: 'missing',
      fromFileAbs: from,
      rootAbs: dir,
      importEntry: relative
    }).reason,
    'not-found'
  )
})

test('build integra Ruby: requires, mixins, herencia, API y UML', (t) => {
  const dir = tempDir(t)
  write(dir, 'src/lib/base.rb', 'class Base\n  def ping; end\nend\n')
  write(dir, 'src/lib/mixin.rb', 'module M\n  def mixin; end\nend\n')
  write(
    dir,
    'src/app.rb',
    [
      "require 'json'",
      "require_relative 'lib/base'",
      "require_relative 'lib/mixin'",
      'class App < Base',
      '  include M',
      '  def run(x)',
      '    helper(x)',
      '  end',
      '  private',
      '  def hidden; end',
      'end',
      'def helper(x)',
      '  x + 1',
      'end'
    ].join('\n')
  )

  const config = loadConfig({ cwd: dir })
  const result = runBuild({ rootAbs: dir, config })

  const rubyFiles = result.graph.nodes
    .filter((node) => node.kind === 'file' && node.lang === 'ruby')
    .map((node) => node.path)
  assert.deepEqual(rubyFiles, ['src/app.rb', 'src/lib/base.rb', 'src/lib/mixin.rb'])

  const importEdges = result.graph.edges
    .filter((edge) => edge.kind === 'import')
    .map((edge) => `${edge.from}->${edge.to}`)
  assert.deepEqual(importEdges, [
    'file:src/app.rb->file:src/lib/base.rb',
    'file:src/app.rb->file:src/lib/mixin.rb'
  ])

  assert.equal(result.graph.stats.externalImports, 1)

  const inherits = result.graph.edges.filter((edge) => edge.kind === 'inherits')
  assert.deepEqual(
    inherits.map((edge) => `${edge.to}:${edge.inheritsKind}`),
    [
      'sym:src/lib/base.rb#Base@1:extends',
      'sym:src/lib/mixin.rb#M@1:implements'
    ]
  )

  const callEdge = result.graph.edges.find((edge) => edge.kind === 'call')
  assert.equal(callEdge.from, 'sym:src/app.rb#run@6')
  assert.equal(callEdge.to, 'sym:src/app.rb#helper@12')

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

test('sin pack, .rb sigue siendo unsupported', (t) => {
  const dir = tempDir(t)
  write(dir, 'src/app.rb', 'class App; end\n')
  const config = loadConfig({ cwd: dir })
  config.languagePack.enabled = false
  const result = runBuild({ rootAbs: dir, config })

  assert.equal(result.graph.nodes.length, 0)
  const unsupported = JSON.parse(
    readFileSync(join(config.outputDirAbs, 'facts', 'unsupported.json'), 'utf8')
  )
  assert.equal(unsupported.totals.files, 1)
  assert.equal(unsupported.unsupported[0].language, 'ruby')
})
