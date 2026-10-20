import test from 'node:test'
import assert from 'node:assert/strict'
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { runBuild } from '../src/build/run.js'
import { loadConfig } from '../src/config/load.js'
import { adapters } from '../packages/writer-languages/src/index.js'

const c = adapters.find((adapter) => adapter.id === 'c')

function tempDir(t, prefix = 'ancleto-writer-c-') {
  const dir = mkdtempSync(join(tmpdir(), prefix))
  t.after(() => rmSync(dir, { recursive: true, force: true }))
  return dir
}

function write(dir, rel, content = '') {
  const abs = join(dir, rel)
  mkdirSync(dirname(abs), { recursive: true })
  writeFileSync(abs, content)
}

test('parsea includes, structs, typedefs, enums, prototipos y funciones', () => {
  const source = [
    '#include "base.h"',
    '#include <stdio.h>',
    '#include "sub/bar.h"',
    '',
    '/** Base struct. */',
    'struct Base { int id; };',
    'typedef struct { int x; } Point;',
    'typedef struct Foo { int y; } Foo;',
    'typedef unsigned long Size;',
    'enum Kind { A, B };',
    '',
    '/** Adds. */',
    'int add(int a, int b);',
    '',
    '/** Runs. */',
    'static void run(void) {',
    '    add(1, 2);',
    '    printf("hi");',
    '}'
  ].join('\n')

  const result = c.parse({ path: 'src/main.c', lang: 'c', source })

  assert.deepEqual(
    result.imports.map((entry) => `${entry.specifier}:${entry.quoted}`),
    ['base.h:true', 'stdio.h:false', 'sub/bar.h:true']
  )

  const base = result.symbols.find((symbol) => symbol.name === 'Base')
  assert.equal(base.kind, 'class')
  assert.equal(base.summary, 'Base struct.')
  assert.equal(base.signature, 'struct Base')

  const point = result.symbols.find((symbol) => symbol.name === 'Point')
  assert.equal(point.kind, 'class')
  assert.equal(point.signature, 'typedef struct Point')

  const foo = result.symbols.find((symbol) => symbol.name === 'Foo')
  assert.equal(foo.kind, 'class')
  assert.equal(foo.signature, 'struct Foo')

  const size = result.symbols.find((symbol) => symbol.name === 'Size')
  assert.equal(size.kind, 'type')

  const kind = result.symbols.find((symbol) => symbol.name === 'Kind')
  assert.equal(kind.kind, 'enum')

  const add = result.symbols.find((symbol) => symbol.name === 'add')
  assert.equal(add.kind, 'function')
  assert.equal(add.summary, 'Adds.')
  assert.equal(add.signature, 'add(int a, int b)')
  assert.equal(add.exported, true)

  const run = result.symbols.find((symbol) => symbol.name === 'run')
  assert.equal(run.kind, 'function')
  assert.equal(run.summary, 'Runs.')
  assert.equal(run.exported, false)

  assert.deepEqual(
    result.calls.map((call) => `${call.caller}->${call.callee}`),
    ['run->add']
  )
})

test('resuelve includes quoted y deja los system como externos', (t) => {
  const dir = tempDir(t)
  write(dir, 'src/base.h', '')
  write(dir, 'src/sub/bar.h', '')
  write(dir, 'root.h', '')
  write(dir, 'include/pkg/foo.h', '')

  const from = join(dir, 'src', 'main.c')
  const quoted = { quoted: true }

  assert.deepEqual(
    c.resolveImport({
      specifier: 'base.h',
      fromFileAbs: from,
      rootAbs: dir,
      importEntry: quoted
    }),
    { type: 'resolved', target: 'src/base.h' }
  )

  assert.deepEqual(
    c.resolveImport({
      specifier: 'sub/bar.h',
      fromFileAbs: from,
      rootAbs: dir,
      importEntry: quoted
    }),
    { type: 'resolved', target: 'src/sub/bar.h' }
  )

  assert.deepEqual(
    c.resolveImport({
      specifier: 'root.h',
      fromFileAbs: from,
      rootAbs: dir,
      importEntry: quoted
    }),
    { type: 'resolved', target: 'root.h' }
  )

  assert.deepEqual(
    c.resolveImport({
      specifier: 'pkg/foo.h',
      fromFileAbs: from,
      rootAbs: dir,
      importEntry: quoted
    }),
    { type: 'resolved', target: 'include/pkg/foo.h' }
  )

  assert.deepEqual(
    c.resolveImport({
      specifier: 'stdio.h',
      fromFileAbs: from,
      rootAbs: dir,
      importEntry: { quoted: false }
    }),
    { type: 'external' }
  )

  assert.equal(
    c.resolveImport({
      specifier: 'missing.h',
      fromFileAbs: from,
      rootAbs: dir,
      importEntry: quoted
    }).reason,
    'not-found'
  )
})

test('build integra C: headers, structs, prototipos y API', (t) => {
  const dir = tempDir(t)
  write(
    dir,
    'src/base.h',
    '#ifndef BASE_H\n#define BASE_H\nstruct Base { int id; };\nint add(int a, int b);\n#endif\n'
  )
  write(dir, 'src/base.c', '#include "base.h"\nint add(int a, int b) { return a + b; }\n')
  write(dir, 'src/sub/bar.h', '#define BAR 1\n')
  write(
    dir,
    'src/main.c',
    '#include "base.h"\n#include "sub/bar.h"\n#include <stdio.h>\nint main(void) { return add(1, 2); }\n'
  )

  const config = loadConfig({ cwd: dir })
  const result = runBuild({ rootAbs: dir, config })

  const cFiles = result.graph.nodes
    .filter((node) => node.kind === 'file' && node.lang === 'c')
    .map((node) => node.path)
  assert.deepEqual(cFiles, [
    'src/base.c',
    'src/base.h',
    'src/main.c',
    'src/sub/bar.h'
  ])

  const importEdges = result.graph.edges
    .filter((edge) => edge.kind === 'import')
    .map((edge) => `${edge.from}->${edge.to}`)
  assert.deepEqual(importEdges, [
    'file:src/base.c->file:src/base.h',
    'file:src/main.c->file:src/base.h',
    'file:src/main.c->file:src/sub/bar.h'
  ])

  assert.equal(result.graph.stats.externalImports, 1)

  const unsupported = JSON.parse(
    readFileSync(join(config.outputDirAbs, 'facts', 'unsupported.json'), 'utf8')
  )
  assert.equal(unsupported.totals.files, 0)

  const api = readFileSync(join(config.outputDirAbs, 'agent', 'API.md'), 'utf8')
  assert.match(api, /Base/)
  assert.match(api, /add/)

  const architecture = readFileSync(join(config.outputDirAbs, 'agent', 'ARCHITECTURE.md'), 'utf8')
  assert.match(architecture, /classDiagram/)
})

test('sin pack, .c y .h siguen siendo unsupported', (t) => {
  const dir = tempDir(t)
  write(dir, 'src/main.c', 'int main(void) { return 0; }\n')
  write(dir, 'src/base.h', 'struct Base { int id; };\n')
  const config = loadConfig({ cwd: dir })
  config.languagePack.enabled = false
  const result = runBuild({ rootAbs: dir, config })

  assert.equal(result.graph.nodes.length, 0)
  const unsupported = JSON.parse(
    readFileSync(join(config.outputDirAbs, 'facts', 'unsupported.json'), 'utf8')
  )
  assert.equal(unsupported.totals.files, 2)
  assert.ok(unsupported.unsupported.every((entry) => entry.language === 'c'))
})
