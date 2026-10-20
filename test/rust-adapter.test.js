import test from 'node:test'
import assert from 'node:assert/strict'
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { runBuild } from '../src/build/run.js'
import { loadConfig } from '../src/config/load.js'
import { adapters } from '../packages/writer-languages/src/index.js'

const rust = adapters.find((adapter) => adapter.id === 'rust')

function tempDir(t, prefix = 'ancleto-writer-rust-') {
  const dir = mkdtempSync(join(tmpdir(), prefix))
  t.after(() => rmSync(dir, { recursive: true, force: true }))
  return dir
}

function write(dir, rel, content = '') {
  const abs = join(dir, rel)
  mkdirSync(dirname(abs), { recursive: true })
  writeFileSync(abs, content)
}

test('parsea use, módulos, tipos, traits, impls, llamadas y docs', () => {
  const source = [
    'use std::collections::HashMap;',
    'use crate::db::{Store, Connection as Conn, self};',
    '',
    'mod inner { pub struct Thing; }',
    '',
    '/// Base trait.',
    'pub trait Base {',
    '    /// Run it.',
    '    fn run(&self);',
    '}',
    '',
    'pub trait Child: Base + Other {',
    '    fn child(&self);',
    '}',
    '',
    '/// App struct.',
    '#[derive(Debug)]',
    'pub struct App { pub name: String }',
    '',
    'impl Base for App {',
    '    fn run(&self) { helper(); }',
    '}',
    '',
    'impl App {',
    '    /// New app.',
    '    pub fn new(name: String) -> Self { Self { name } }',
    '    fn private(&self) {}',
    '}',
    '',
    'pub enum Kind { A }',
    'pub type Alias = App;',
    'fn helper() {}'
  ].join('\n')

  const result = rust.parse({ path: 'src/lib.rs', lang: 'rust', source })

  assert.deepEqual(
    result.imports.map((entry) => entry.specifier),
    [
      'std::collections::HashMap',
      'crate::db::Store',
      'crate::db::Connection',
      'crate::db'
    ]
  )
  assert.deepEqual(result.importedNames, ['Conn', 'HashMap', 'Store', 'db'])

  const base = result.symbols.find((symbol) => symbol.name === 'Base')
  assert.equal(base.kind, 'interface')
  assert.equal(base.summary, 'Base trait.')

  const child = result.symbols.find((symbol) => symbol.name === 'Child')
  assert.equal(child.kind, 'interface')

  const app = result.symbols.find((symbol) => symbol.name === 'App')
  assert.equal(app.kind, 'class')
  assert.equal(app.summary, 'App struct.')

  const newMethod = result.symbols.find(
    (symbol) => symbol.name === 'new' && symbol.owner === 'App'
  )
  assert.equal(newMethod.kind, 'method')
  assert.equal(newMethod.summary, 'New app.')
  assert.equal(newMethod.signature, 'new(name: String) -> Self')

  const privateMethod = result.symbols.find(
    (symbol) => symbol.name === 'private' && symbol.owner === 'App'
  )
  assert.equal(privateMethod.exported, false)

  const thing = result.symbols.find((symbol) => symbol.name === 'Thing')
  assert.equal(thing.kind, 'class')

  const kind = result.symbols.find((symbol) => symbol.name === 'Kind')
  assert.equal(kind.kind, 'enum')

  const alias = result.symbols.find((symbol) => symbol.name === 'Alias')
  assert.equal(alias.kind, 'type')

  assert.deepEqual(
    result.inheritance.map((entry) => `${entry.child}->${entry.parent}:${entry.implements}`).sort(),
    ['App->Base:true', 'Child->Base:true', 'Child->Other:true']
  )

  assert.deepEqual(
    result.calls.map((call) => `${call.caller}->${call.callee}`),
    ['run->helper']
  )
})

test('parsea mod foo; como import de módulo', () => {
  const result = rust.parse({
    path: 'src/lib.rs',
    lang: 'rust',
    source: 'mod db;\nmod util;\n'
  })

  assert.deepEqual(
    result.imports.map((entry) => entry.specifier),
    ['self::db', 'self::util']
  )
})

test('resuelve crate, self, super, mod.rs y externos', (t) => {
  const dir = tempDir(t)
  write(dir, 'src/lib.rs', 'pub struct Root;\n')
  write(dir, 'src/db/mod.rs', 'pub struct Store;\n')
  write(dir, 'src/db/child.rs', 'pub struct Child;\n')
  write(dir, 'src/util.rs', 'pub fn helper() {}\n')
  write(dir, 'src/foo/bar.rs', 'pub struct Bar;\n')
  write(dir, 'src/foo/util.rs', 'pub fn util() {}\n')

  const fromMain = join(dir, 'src', 'main.rs')
  assert.deepEqual(
    rust.resolveImport({ specifier: 'crate::db::Store', fromFileAbs: fromMain, rootAbs: dir }),
    { type: 'resolved', target: 'src/db/mod.rs' }
  )
  assert.deepEqual(
    rust.resolveImport({ specifier: 'crate::util::helper', fromFileAbs: fromMain, rootAbs: dir }),
    { type: 'resolved', target: 'src/util.rs' }
  )
  assert.deepEqual(
    rust.resolveImport({ specifier: 'crate::Root', fromFileAbs: fromMain, rootAbs: dir }),
    { type: 'resolved', target: 'src/lib.rs' }
  )
  assert.deepEqual(
    rust.resolveImport({
      specifier: 'self::child',
      fromFileAbs: join(dir, 'src', 'db', 'mod.rs'),
      rootAbs: dir
    }),
    { type: 'resolved', target: 'src/db/child.rs' }
  )
  assert.deepEqual(
    rust.resolveImport({
      specifier: 'super::util',
      fromFileAbs: join(dir, 'src', 'foo', 'bar.rs'),
      rootAbs: dir
    }),
    { type: 'resolved', target: 'src/foo/util.rs' }
  )
  assert.deepEqual(
    rust.resolveImport({
      specifier: 'std::collections::HashMap',
      fromFileAbs: fromMain,
      rootAbs: dir
    }),
    { type: 'external' }
  )
  assert.equal(
    rust.resolveImport({
      specifier: 'crate::nope::Thing',
      fromFileAbs: fromMain,
      rootAbs: dir
    }).reason,
    'not-found'
  )
})

test('build integra Rust: grafo, módulos, traits, API y UML', (t) => {
  const dir = tempDir(t)
  write(
    dir,
    'src/lib.rs',
    [
      'mod db;',
      'mod util;',
      '',
      'pub trait Base { fn run(&self); }',
      'pub struct App;',
      'impl Base for App {',
      '    fn run(&self) { helper(); }',
      '}',
      'fn helper() {}'
    ].join('\n')
  )
  write(dir, 'src/db/mod.rs', 'pub struct Store;\n')
  write(dir, 'src/util.rs', 'pub fn noop() {}\n')
  write(
    dir,
    'src/app.rs',
    [
      'use crate::db::Store;',
      'use crate::util::*;',
      'use crate::Base;',
      '',
      'pub struct App2 { store: Store }'
    ].join('\n')
  )

  const config = loadConfig({ cwd: dir })
  const result = runBuild({ rootAbs: dir, config })

  const rustFiles = result.graph.nodes
    .filter((node) => node.kind === 'file' && node.lang === 'rust')
    .map((node) => node.path)
  assert.deepEqual(rustFiles, [
    'src/app.rs',
    'src/db/mod.rs',
    'src/lib.rs',
    'src/util.rs'
  ])

  const importEdges = result.graph.edges
    .filter((edge) => edge.kind === 'import')
    .map((edge) => `${edge.from}->${edge.to}`)
  assert.deepEqual(importEdges, [
    'file:src/app.rs->file:src/db/mod.rs',
    'file:src/app.rs->file:src/lib.rs',
    'file:src/app.rs->file:src/util.rs',
    'file:src/lib.rs->file:src/db/mod.rs',
    'file:src/lib.rs->file:src/util.rs'
  ])

  const inheritEdge = result.graph.edges.find((edge) => edge.kind === 'inherits')
  assert.equal(inheritEdge.inheritsKind, 'implements')
  assert.equal(inheritEdge.from, 'sym:src/lib.rs#App@5')
  assert.equal(inheritEdge.to, 'sym:src/lib.rs#Base@4')

  const callEdge = result.graph.edges.find((edge) => edge.kind === 'call')
  assert.equal(callEdge.from, 'sym:src/lib.rs#run@7')
  assert.equal(callEdge.to, 'sym:src/lib.rs#helper@9')

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
