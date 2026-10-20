import test from 'node:test'
import assert from 'node:assert/strict'
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { runBuild } from '../src/build/run.js'
import { loadConfig } from '../src/config/load.js'
import { adapters } from '../packages/writer-languages/src/index.js'

const php = adapters.find((adapter) => adapter.id === 'php')

function tempDir(t, prefix = 'ancleto-writer-php-') {
  const dir = mkdtempSync(join(tmpdir(), prefix))
  t.after(() => rmSync(dir, { recursive: true, force: true }))
  return dir
}

function write(dir, rel, content = '') {
  const abs = join(dir, rel)
  mkdirSync(dirname(abs), { recursive: true })
  writeFileSync(abs, content)
}

test('parsea namespaces, use, tipos, métodos, herencia y traits', () => {
  const source = [
    '<?php',
    'namespace App\\Core;',
    '',
    'use App\\Services\\Service;',
    'use App\\Contracts\\Runner as RunnerContract;',
    'use function App\\Util\\helper;',
    'use const App\\Util\\VERSION;',
    'use App\\Services\\{Repo, Cache as C};',
    '',
    '/**',
    ' * Base class.',
    ' */',
    'class Base {',
    '    public function ping(): void {}',
    '}',
    '',
    'interface IRunner {',
    '    public function run(int $x): void;',
    '}',
    '',
    'trait Loggable {',
    '    public function log(string $message): void {}',
    '}',
    '',
    'final class App extends Base implements IRunner {',
    '    /**',
    '     * Runs.',
    '     */',
    '    public function run(int $x): void { localHelper($x); }',
    '    public function __construct() {}',
    '    private function hidden(): void {}',
    '    protected function prot(): void {}',
    '}',
    '',
    'enum Kind: string {',
    '    case A = \'a\';',
    '}',
    '',
    'function localHelper(int $x): int { return $x; }',
    'function free(int $x): int { return $x + 1; }'
  ].join('\n')

  const result = php.parse({ path: 'src/Core/App.php', lang: 'php', source })

  assert.deepEqual(result.namespaces, ['App\\Core'])
  assert.deepEqual(
    result.imports.map((entry) => entry.specifier),
    [
      'App\\Services\\Service',
      'App\\Contracts\\Runner',
      'App\\Util\\helper',
      'App\\Util\\VERSION',
      'App\\Services\\Repo',
      'App\\Services\\Cache'
    ]
  )
  assert.deepEqual(result.importedNames, [
    'C',
    'Repo',
    'RunnerContract',
    'Service',
    'VERSION',
    'helper'
  ])

  const base = result.symbols.find((symbol) => symbol.name === 'Base' && symbol.kind === 'class')
  assert.equal(base.summary, 'Base class.')

  const ping = result.symbols.find(
    (symbol) => symbol.name === 'ping' && symbol.owner === 'Base'
  )
  assert.equal(ping.kind, 'method')
  assert.equal(ping.exported, true)

  const runner = result.symbols.find((symbol) => symbol.name === 'IRunner')
  assert.equal(runner.kind, 'interface')

  const loggable = result.symbols.find((symbol) => symbol.name === 'Loggable')
  assert.equal(loggable.kind, 'class')
  assert.equal(loggable.signature, 'trait Loggable')

  const app = result.symbols.find((symbol) => symbol.name === 'App' && symbol.kind === 'class')
  assert.equal(app.kind, 'class')

  const run = result.symbols.find(
    (symbol) => symbol.name === 'run' && symbol.owner === 'App'
  )
  assert.equal(run.summary, 'Runs.')
  assert.equal(run.signature, 'run(int $x)')

  const constructor = result.symbols.find(
    (symbol) => symbol.name === '__construct' && symbol.owner === 'App'
  )
  assert.equal(constructor.kind, 'method')

  const hidden = result.symbols.find(
    (symbol) => symbol.name === 'hidden' && symbol.owner === 'App'
  )
  assert.equal(hidden.exported, false)

  const prot = result.symbols.find(
    (symbol) => symbol.name === 'prot' && symbol.owner === 'App'
  )
  assert.equal(prot.exported, false)

  const kind = result.symbols.find((symbol) => symbol.name === 'Kind')
  assert.equal(kind.kind, 'enum')

  assert.ok(result.symbols.some((symbol) => symbol.name === 'localHelper' && symbol.kind === 'function'))
  assert.ok(result.symbols.some((symbol) => symbol.name === 'free' && symbol.kind === 'function'))

  assert.deepEqual(
    result.inheritance.map((entry) => `${entry.child}->${entry.parent}:${entry.implements}`),
    ['App->Base:false', 'App->IRunner:true']
  )
  assert.deepEqual(
    result.calls.map((call) => `${call.caller}->${call.callee}`),
    ['run->localHelper']
  )
})

test('resuelve use contra el índice de namespaces', (t) => {
  const dir = tempDir(t)
  const namespaces = new Map([
    ['App\\Services', ['src/Services/Repo.php', 'src/Services/Service.php']],
    ['App\\Util', ['src/Util/helper.php']]
  ])

  assert.deepEqual(
    php.resolveImport({
      specifier: 'App\\Services\\Service',
      fromFileAbs: join(dir, 'src', 'Core', 'App.php'),
      rootAbs: dir,
      namespaces
    }),
    {
      type: 'resolved',
      targets: ['src/Services/Repo.php', 'src/Services/Service.php']
    }
  )

  assert.deepEqual(
    php.resolveImport({
      specifier: 'App\\Util\\helper',
      fromFileAbs: join(dir, 'src', 'Core', 'App.php'),
      rootAbs: dir,
      namespaces
    }),
    { type: 'resolved', targets: ['src/Util/helper.php'] }
  )

  assert.deepEqual(
    php.resolveImport({
      specifier: 'App\\Services',
      fromFileAbs: join(dir, 'src', 'Services', 'Service.php'),
      rootAbs: dir,
      namespaces
    }),
    { type: 'resolved', targets: ['src/Services/Repo.php'] }
  )

  assert.deepEqual(
    php.resolveImport({
      specifier: 'DateTime',
      fromFileAbs: join(dir, 'src', 'Core', 'App.php'),
      rootAbs: dir,
      namespaces
    }),
    { type: 'external' }
  )
})

test('build integra PHP: namespaces, use, herencia, API y UML', (t) => {
  const dir = tempDir(t)
  write(dir, 'src/Core/Base.php', '<?php\nnamespace App\\Core;\nclass Base { public function ping(): void {} }\n')
  write(
    dir,
    'src/Core/IRunner.php',
    '<?php\nnamespace App\\Core;\ninterface IRunner { public function run(int $x): void; }\n'
  )
  write(dir, 'src/Services/Service.php', '<?php\nnamespace App\\Services;\nclass Service {}\n')
  write(dir, 'src/Services/Repo.php', '<?php\nnamespace App\\Services;\nclass Repo {}\n')
  write(
    dir,
    'src/Core/App.php',
    [
      '<?php',
      'namespace App\\Core;',
      'use App\\Services\\Service;',
      'use App\\Services\\Repo;',
      'class App extends Base implements IRunner {',
      '    public function run(int $x): void { helper($x); }',
      '}',
      'function helper(int $x): int { return $x; }'
    ].join('\n')
  )

  const config = loadConfig({ cwd: dir })
  const result = runBuild({ rootAbs: dir, config })

  const phpFiles = result.graph.nodes
    .filter((node) => node.kind === 'file' && node.lang === 'php')
    .map((node) => node.path)
  assert.deepEqual(phpFiles, [
    'src/Core/App.php',
    'src/Core/Base.php',
    'src/Core/IRunner.php',
    'src/Services/Repo.php',
    'src/Services/Service.php'
  ])

  const importEdges = result.graph.edges
    .filter((edge) => edge.kind === 'import')
    .map((edge) => `${edge.from}->${edge.to}`)
  assert.deepEqual(importEdges, [
    'file:src/Core/App.php->file:src/Services/Repo.php',
    'file:src/Core/App.php->file:src/Services/Service.php'
  ])

  const inherits = result.graph.edges.filter((edge) => edge.kind === 'inherits')
  assert.deepEqual(
    inherits.map((edge) => `${edge.to}:${edge.inheritsKind}`),
    [
      'sym:src/Core/Base.php#Base@3:extends',
      'sym:src/Core/IRunner.php#IRunner@3:implements'
    ]
  )

  const callEdge = result.graph.edges.find((edge) => edge.kind === 'call')
  assert.equal(callEdge.from, 'sym:src/Core/App.php#run@6')
  assert.equal(callEdge.to, 'sym:src/Core/App.php#helper@8')

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

test('sin pack, .php sigue siendo unsupported', (t) => {
  const dir = tempDir(t)
  write(dir, 'src/App.php', '<?php class App {}')
  const config = loadConfig({ cwd: dir })
  config.languagePack.enabled = false
  const result = runBuild({ rootAbs: dir, config })

  assert.equal(result.graph.nodes.length, 0)
  const unsupported = JSON.parse(
    readFileSync(join(config.outputDirAbs, 'facts', 'unsupported.json'), 'utf8')
  )
  assert.equal(unsupported.totals.files, 1)
  assert.equal(unsupported.unsupported[0].language, 'php')
})
