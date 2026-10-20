import test from 'node:test'
import assert from 'node:assert/strict'
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { runBuild } from '../src/build/run.js'
import { loadConfig } from '../src/config/load.js'
import { adapters } from '../packages/writer-languages/src/index.js'

const cpp = adapters.find((adapter) => adapter.id === 'cpp')

function tempDir(t, prefix = 'ancleto-writer-cpp-') {
  const dir = mkdtempSync(join(tmpdir(), prefix))
  t.after(() => rmSync(dir, { recursive: true, force: true }))
  return dir
}

function write(dir, rel, content = '') {
  const abs = join(dir, rel)
  mkdirSync(dirname(abs), { recursive: true })
  writeFileSync(abs, content)
}

test('parsea includes, namespaces, clases, métodos, herencia y templates', () => {
  const source = [
    '#include "base.hpp"',
    '#include <iostream>',
    '',
    'namespace app {',
    '/** Base class. */',
    'class Base {',
    'public:',
    '    /** Ping. */',
    '    virtual void ping();',
    '    Base();',
    '    ~Base();',
    'private:',
    '    int id;',
    '};',
    '',
    'class App : public Base {',
    'public:',
    '    void run(int x);',
    '};',
    '',
    '/** Adds. */',
    'int add(int a, int b);',
    '',
    '/** Runs. */',
    'void App::run(int x) {',
    '    add(1, 2);',
    '}',
    '}',
    '',
    'template <typename T>',
    'class Box {',
    'public:',
    '    T get() { return value; }',
    'private:',
    '    T value;',
    '};',
    '',
    'enum class Kind { A, B };',
    'using Size = unsigned long;',
    'static void helper() {}'
  ].join('\n')

  const result = cpp.parse({ path: 'src/app.cpp', lang: 'cpp', source })

  assert.deepEqual(
    result.imports.map((entry) => `${entry.specifier}:${entry.quoted}`),
    ['base.hpp:true', 'iostream:false']
  )

  const base = result.symbols.find((symbol) => symbol.name === 'Base' && symbol.kind === 'class')
  assert.equal(base.kind, 'class')
  assert.equal(base.summary, 'Base class.')

  const ping = result.symbols.find(
    (symbol) => symbol.name === 'ping' && symbol.owner === 'Base'
  )
  assert.equal(ping.kind, 'method')
  assert.equal(ping.summary, 'Ping.')
  assert.equal(ping.exported, true)

  const destructor = result.symbols.find(
    (symbol) => symbol.name === '~Base' && symbol.owner === 'Base'
  )
  assert.equal(destructor.kind, 'method')

  const app = result.symbols.find((symbol) => symbol.name === 'App' && symbol.kind === 'class')
  assert.equal(app.kind, 'class')

  const runPrototype = result.symbols.find(
    (symbol) => symbol.name === 'run' && symbol.owner === 'App' && symbol.line < 25
  )
  assert.equal(runPrototype.kind, 'method')

  const runDefinition = result.symbols.find(
    (symbol) => symbol.name === 'run' && symbol.owner === 'App' && symbol.summary === 'Runs.'
  )
  assert.equal(runDefinition.kind, 'method')

  const add = result.symbols.find((symbol) => symbol.name === 'add')
  assert.equal(add.kind, 'function')
  assert.equal(add.summary, 'Adds.')
  assert.equal(add.exported, true)

  const box = result.symbols.find((symbol) => symbol.name === 'Box')
  assert.equal(box.kind, 'class')
  const get = result.symbols.find((symbol) => symbol.name === 'get' && symbol.owner === 'Box')
  assert.equal(get.kind, 'method')
  assert.equal(get.exported, true)

  const kind = result.symbols.find((symbol) => symbol.name === 'Kind')
  assert.equal(kind.kind, 'enum')

  const size = result.symbols.find((symbol) => symbol.name === 'Size')
  assert.equal(size.kind, 'type')

  const helper = result.symbols.find((symbol) => symbol.name === 'helper')
  assert.equal(helper.exported, false)

  assert.deepEqual(
    result.inheritance.map((entry) => `${entry.child}->${entry.parent}`),
    ['App->Base']
  )
  assert.deepEqual(
    result.calls.map((call) => `${call.caller}->${call.callee}`),
    ['run->add']
  )
})

test('resuelve includes quoted de C++ y deja los system como externos', (t) => {
  const dir = tempDir(t)
  write(dir, 'src/base.hpp', '')
  write(dir, 'src/sub/bar.hpp', '')
  write(dir, 'root.hpp', '')
  write(dir, 'include/pkg/foo.hpp', '')

  const from = join(dir, 'src', 'app.cpp')
  const quoted = { quoted: true }

  assert.deepEqual(
    cpp.resolveImport({
      specifier: 'base.hpp',
      fromFileAbs: from,
      rootAbs: dir,
      importEntry: quoted
    }),
    { type: 'resolved', target: 'src/base.hpp' }
  )
  assert.deepEqual(
    cpp.resolveImport({
      specifier: 'sub/bar.hpp',
      fromFileAbs: from,
      rootAbs: dir,
      importEntry: quoted
    }),
    { type: 'resolved', target: 'src/sub/bar.hpp' }
  )
  assert.deepEqual(
    cpp.resolveImport({
      specifier: 'root.hpp',
      fromFileAbs: from,
      rootAbs: dir,
      importEntry: quoted
    }),
    { type: 'resolved', target: 'root.hpp' }
  )
  assert.deepEqual(
    cpp.resolveImport({
      specifier: 'pkg/foo.hpp',
      fromFileAbs: from,
      rootAbs: dir,
      importEntry: quoted
    }),
    { type: 'resolved', target: 'include/pkg/foo.hpp' }
  )
  assert.deepEqual(
    cpp.resolveImport({
      specifier: 'iostream',
      fromFileAbs: from,
      rootAbs: dir,
      importEntry: { quoted: false }
    }),
    { type: 'external' }
  )
  assert.equal(
    cpp.resolveImport({
      specifier: 'missing.hpp',
      fromFileAbs: from,
      rootAbs: dir,
      importEntry: quoted
    }).reason,
    'not-found'
  )
})

test('build integra C++: headers, clases, herencia, API y UML', (t) => {
  const dir = tempDir(t)
  write(dir, 'src/base.hpp', '#pragma once\nclass Base { public: virtual void ping(); };\n')
  write(
    dir,
    'src/app.hpp',
    '#pragma once\n#include "base.hpp"\nclass App : public Base { public: void run(int x); private: int cache; };\n'
  )
  write(dir, 'src/util.hpp', '#pragma once\nint add(int a, int b);\n')
  write(
    dir,
    'src/app.cpp',
    '#include "app.hpp"\n#include "util.hpp"\n#include <iostream>\nint add(int a, int b) { return a + b; }\nvoid App::run(int x) { add(1, 2); }\n'
  )

  const config = loadConfig({ cwd: dir })
  const result = runBuild({ rootAbs: dir, config })

  const cppFiles = result.graph.nodes
    .filter((node) => node.kind === 'file' && node.lang === 'cpp')
    .map((node) => node.path)
  assert.deepEqual(cppFiles, [
    'src/app.cpp',
    'src/app.hpp',
    'src/base.hpp',
    'src/util.hpp'
  ])

  const importEdges = result.graph.edges
    .filter((edge) => edge.kind === 'import')
    .map((edge) => `${edge.from}->${edge.to}`)
  assert.deepEqual(importEdges, [
    'file:src/app.cpp->file:src/app.hpp',
    'file:src/app.cpp->file:src/util.hpp',
    'file:src/app.hpp->file:src/base.hpp'
  ])

  assert.equal(result.graph.stats.externalImports, 1)

  const inheritEdge = result.graph.edges.find((edge) => edge.kind === 'inherits')
  assert.equal(inheritEdge.to, 'sym:src/base.hpp#Base@2')
  assert.equal(inheritEdge.inheritsKind, 'extends')

  const callEdge = result.graph.edges.find((edge) => edge.kind === 'call')
  assert.equal(callEdge.to, 'sym:src/app.cpp#add@4')

  const unsupported = JSON.parse(
    readFileSync(join(config.outputDirAbs, 'facts', 'unsupported.json'), 'utf8')
  )
  assert.equal(unsupported.totals.files, 0)

  const api = readFileSync(join(config.outputDirAbs, 'agent', 'API.md'), 'utf8')
  assert.match(api, /Base/)
  assert.match(api, /App/)

  const architecture = readFileSync(join(config.outputDirAbs, 'agent', 'ARCHITECTURE.md'), 'utf8')
  assert.match(architecture, /classDiagram/)
})

test('sin pack, .cpp y .hpp siguen siendo unsupported', (t) => {
  const dir = tempDir(t)
  write(dir, 'src/app.cpp', 'int main() { return 0; }\n')
  write(dir, 'src/app.hpp', 'class App {};\n')
  const config = loadConfig({ cwd: dir })
  config.languagePack.enabled = false
  const result = runBuild({ rootAbs: dir, config })

  assert.equal(result.graph.nodes.length, 0)
  const unsupported = JSON.parse(
    readFileSync(join(config.outputDirAbs, 'facts', 'unsupported.json'), 'utf8')
  )
  assert.equal(unsupported.totals.files, 2)
  assert.ok(unsupported.unsupported.every((entry) => entry.language === 'cpp'))
})
