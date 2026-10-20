import test from 'node:test'
import assert from 'node:assert/strict'
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { runBuild } from '../src/build/run.js'
import { loadConfig } from '../src/config/load.js'
import { loadLanguagePack } from '../src/languages/registry.js'
import { adapters } from '../packages/writer-languages/src/index.js'

const python = adapters.find((adapter) => adapter.id === 'python')

function tempDir(t, prefix = 'ancleto-writer-python-') {
  const dir = mkdtempSync(join(tmpdir(), prefix))
  t.after(() => rmSync(dir, { recursive: true, force: true }))
  return dir
}

function write(dir, rel, content = '') {
  const abs = join(dir, rel)
  mkdirSync(dirname(abs), { recursive: true })
  writeFileSync(abs, content)
}

test('el pack es opcional y se degrada sin él', () => {
  const disabled = loadLanguagePack({ enabled: false, module: '@ancleto/writer-languages' })
  assert.deepEqual(disabled, { adapters: [], extensions: {} })

  const missing = loadLanguagePack({ enabled: true, module: '@ancleto/no-existe-writer-pack' })
  assert.deepEqual(missing, { adapters: [], extensions: {} })

  const loaded = loadLanguagePack({ enabled: true, module: '@ancleto/writer-languages' })
  assert.deepEqual(Object.keys(loaded.extensions).sort(), [
    '.c',
    '.cc',
    '.cpp',
    '.cs',
    '.cxx',
    '.go',
    '.h',
    '.hh',
    '.hpp',
    '.hxx',
    '.java',
    '.kt',
    '.kts',
    '.php',
    '.py',
    '.pyi',
    '.rb',
    '.rs',
    '.swift'
  ])
  assert.deepEqual(loaded.adapters.map((adapter) => adapter.id), [
    'python',
    'go',
    'rust',
    'csharp',
    'java',
    'c',
    'cpp',
    'php',
    'ruby',
    'swift',
    'kotlin'
  ])
})

test('parsea imports, símbolos, métodos, herencia y llamadas', () => {
  const source = [
    'import os',
    'from .base import Base as Root',
    '',
    'def helper(x):',
    '    """Helps."""',
    '    return x',
    '',
    'class App(Root):',
    '    """Application."""',
    '    def run(self, value):',
    '        return helper(value)'
  ].join('\n')

  const result = python.parse({ path: 'src/app.py', lang: 'python', source })

  assert.equal(result.lang, 'python')
  assert.deepEqual(
    result.imports.map((entry) => entry.specifier),
    ['os', '.base']
  )
  assert.deepEqual(result.importedNames, ['Root', 'os'])

  const app = result.symbols.find((symbol) => symbol.name === 'App')
  assert.equal(app.kind, 'class')
  assert.equal(app.summary, 'Application.')
  assert.equal(app.signature, 'class App(Root)')

  const run = result.symbols.find((symbol) => symbol.name === 'run')
  assert.equal(run.kind, 'method')
  assert.equal(run.owner, 'App')

  const helper = result.symbols.find((symbol) => symbol.name === 'helper')
  assert.equal(helper.kind, 'function')
  assert.equal(helper.summary, 'Helps.')
  assert.equal(helper.exported, true)

  assert.deepEqual(
    result.inheritance.map((entry) => `${entry.child}->${entry.parent}`),
    ['App->Root']
  )
  assert.deepEqual(
    result.calls.map((call) => `${call.caller}->${call.callee}`),
    ['run->helper']
  )
})

test('resuelve imports relativos y absolutos del proyecto', (t) => {
  const dir = tempDir(t)
  write(dir, 'pkg/__init__.py', '')
  write(dir, 'pkg/mod.py', '')
  write(dir, 'pkg/sub/base.py', '')

  const fromFile = join(dir, 'pkg', 'sub', 'app.py')
  write(dir, 'pkg/sub/app.py', '')

  const relative = python.resolveImport({
    specifier: '.base',
    fromFileAbs: fromFile,
    rootAbs: dir
  })
  assert.deepEqual(relative, { type: 'resolved', target: 'pkg/sub/base.py' })

  const absolute = python.resolveImport({
    specifier: 'pkg.mod',
    fromFileAbs: fromFile,
    rootAbs: dir
  })
  assert.deepEqual(absolute, { type: 'resolved', target: 'pkg/mod.py' })

  const external = python.resolveImport({
    specifier: 'os',
    fromFileAbs: fromFile,
    rootAbs: dir
  })
  assert.deepEqual(external, { type: 'external' })

  const missing = python.resolveImport({
    specifier: '.missing',
    fromFileAbs: fromFile,
    rootAbs: dir
  })
  assert.equal(missing.type, 'unresolved')
})

test('build integra Python: grafo, API y unsupported', (t) => {
  const dir = tempDir(t)
  write(dir, 'src/base.py', 'class Base:\n    """Base."""\n    def ping(self):\n        return 1\n')
  write(
    dir,
    'src/app.py',
    [
      'from .base import Base',
      '',
      'def helper(x):',
      '    """Helps."""',
      '    return x',
      '',
      'class App(Base):',
      '    """App."""',
      '    def run(self):',
      '        return helper(1)'
    ].join('\n')
  )

  const config = loadConfig({ cwd: dir })
  const result = runBuild({ rootAbs: dir, config })

  const fileNodes = result.graph.nodes.filter((node) => node.kind === 'file')
  assert.deepEqual(
    fileNodes.map((node) => `${node.lang}:${node.path}`),
    ['python:src/app.py', 'python:src/base.py']
  )

  const importEdge = result.graph.edges.find((edge) => edge.kind === 'import')
  assert.deepEqual({ from: importEdge.from, to: importEdge.to }, {
    from: 'file:src/app.py',
    to: 'file:src/base.py'
  })

  const inheritEdge = result.graph.edges.find((edge) => edge.kind === 'inherits')
  assert.equal(inheritEdge.to, 'sym:src/base.py#Base@1')

  const callEdge = result.graph.edges.find((edge) => edge.kind === 'call')
  assert.equal(callEdge.to, 'sym:src/app.py#helper@3')

  const unsupported = JSON.parse(
    readFileSync(join(config.outputDirAbs, 'facts', 'unsupported.json'), 'utf8')
  )
  assert.equal(unsupported.totals.files, 0)

  const api = readFileSync(join(config.outputDirAbs, 'agent', 'API.md'), 'utf8')
  assert.match(api, /helper/)

  const architecture = readFileSync(join(config.outputDirAbs, 'agent', 'ARCHITECTURE.md'), 'utf8')
  assert.match(architecture, /classDiagram/)
})
