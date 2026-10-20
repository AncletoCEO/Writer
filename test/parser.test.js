import test from 'node:test'
import assert from 'node:assert/strict'
import { parseJavaScript } from '../src/parsers/javascript.js'

test('imports estáticos, dinámicos, require y re-export', () => {
  const source = `
import fs from 'node:fs'
import './side-effect.js'
import { a, b as c } from './named.js'
import * as ns from './ns.js'
export { x } from './reexport.js'
export * from './star.js'
const lazy = import('./dynamic.js')
const lazy2 = import(\`./template.js\`)
const lazy3 = import(path)
const req = require('./require.cjs')
const req2 = require(path)
`

  const result = parseJavaScript({ path: 'src/a.js', lang: 'js', source })

  assert.deepEqual(
    result.imports.map((entry) => entry.specifier),
    [
      'node:fs',
      './side-effect.js',
      './named.js',
      './ns.js',
      './reexport.js',
      './star.js',
      './dynamic.js',
      './template.js',
      './require.cjs'
    ]
  )
  assert.deepEqual(
    result.imports.map((entry) => entry.kind),
    [
      'static',
      'side-effect',
      'static',
      'static',
      're-export',
      're-export',
      'dynamic',
      'dynamic',
      'require'
    ]
  )
  assert.deepEqual(
    result.unresolved.map((entry) => entry.kind).sort(),
    ['dynamic', 'require']
  )
  assert.deepEqual(result.importedNames, ['a', 'c', 'fs', 'ns'])
})

test('símbolos y exportaciones', () => {
  const source = `
export function run(input) { return helper(input) }
function helper(x) { return x }
const arrow = async (x) => { return x }
export const single = x => x
class Base {}
export class App extends Base {
  constructor(name) { this.name = name }
  async load(id) { return helper(id) }
  static create() { return new App('x') }
}
export interface User { id: string }
type Id = string
export enum Color { Red, Blue }
export const map = <T,>(x: T) => x
`

  const result = parseJavaScript({ path: 'src/app.ts', lang: 'ts', source })
  const byName = Object.fromEntries(result.symbols.map((symbol) => [symbol.name, symbol]))

  assert.equal(byName.run.kind, 'function')
  assert.equal(byName.run.exported, true)
  assert.equal(byName.run.signature, 'run(input)')
  assert.equal(byName.helper.exported, false)
  assert.equal(byName.arrow.signature, 'async arrow(x) =>')
  assert.equal(byName.single.exported, true)
  assert.equal(byName.Base.kind, 'class')
  assert.equal(byName.App.kind, 'class')
  assert.equal(byName.App.exported, true)
  assert.equal(byName.App.signature, 'class App extends Base')
  assert.equal(byName.constructor.kind, 'method')
  assert.equal(byName.constructor.owner, 'App')
  assert.equal(byName.load.kind, 'method')
  assert.equal(byName.load.owner, 'App')
  assert.equal(byName.create.kind, 'method')
  assert.equal(byName.create.owner, 'App')
  assert.equal(byName.User.kind, 'interface')
  assert.equal(byName.User.exported, true)
  assert.equal(byName.Id.kind, 'type')
  assert.equal(byName.Color.kind, 'enum')
  assert.equal(byName.Color.exported, true)
  assert.equal(byName.map.kind, 'function')
  assert.equal(byName.map.exported, true)
})

test('llamadas intra-archivo', () => {
  const source = `
function helper(x) { return x }
export function run(input) { return helper(input) }
class App {
  load(id) { return helper(id) }
  create() { return new App() }
}
`

  const result = parseJavaScript({ path: 'src/calls.js', lang: 'js', source })
  const calls = result.calls.map((call) => `${call.caller ?? '-'}->${call.callee}`)

  assert.ok(calls.includes('run->helper'))
  assert.ok(calls.includes('load->helper'))
  assert.ok(calls.includes('create->App'))
  assert.ok(!calls.some((call) => call.endsWith('->run')))
})

test('herencia local e importada', () => {
  const source = `
import { Remote } from './remote.js'
class Base {}
class Local extends Base {}
class Imported extends Remote {}
class Mixed extends Base implements Remote {}
interface User { id: string }
interface Admin extends User, Remote {}
`

  const result = parseJavaScript({ path: 'src/inherit.ts', lang: 'ts', source })
  const byParent = Object.fromEntries(result.inheritance.map((entry) => [entry.parent, entry]))

  assert.equal(byParent.Base.confidence, 'extracted')
  assert.equal(byParent.Remote.confidence, 'inferred')
  assert.equal(byParent.User.confidence, 'extracted')
  assert.equal(result.inheritance.filter((entry) => entry.implements).length, 1)
  assert.equal(
    result.inheritance.filter((entry) => entry.child === 'Admin').length,
    2
  )
})

test('JSX no rompe el parser', () => {
  const source = `
import React from 'react'
export function App() {
  return <div className="x">{value}</div>
}
`

  const result = parseJavaScript({ path: 'src/App.jsx', lang: 'jsx', source })

  assert.deepEqual(result.imports.map((entry) => entry.specifier), ['react'])
  assert.deepEqual(result.symbols.map((symbol) => symbol.name), ['App'])
  assert.equal(result.symbols[0].exported, true)
  assert.deepEqual(result.calls, [])
})

test('métodos genéricos', () => {
  const source = `
class Box<T> {
  get(): T { return this.value }
  map<U>(fn: (x: T) => U): Box<U> { return this }
}
`

  const result = parseJavaScript({ path: 'src/box.ts', lang: 'ts', source })
  const methods = result.symbols.filter((symbol) => symbol.kind === 'method')

  assert.deepEqual(methods.map((method) => method.name), ['get', 'map'])
})

test('import no literal se reporta como unresolved', () => {
  const source = `
const path = './x.js'
const mod = import(path)
const req = require(path)
`

  const result = parseJavaScript({ path: 'src/dynamic.js', lang: 'js', source })

  assert.deepEqual(result.imports, [])
  assert.deepEqual(
    result.unresolved.map((entry) => `${entry.kind}:${entry.reason}`).sort(),
    ['dynamic:non-literal', 'require:non-literal']
  )
})

test('summaries desde comentarios', () => {
  const source = `
/**
 * Runs the app.
 * @param x input
 */
export function run(x) { return x }

// Loads data.
export const load = () => 1

/**
 * Separated.
 */

export function separated() { return 1 }

export function undocumented() { return 1 }

class App {
  /** Does work. */
  work() { return 1 }
}
`

  const result = parseJavaScript({ path: 'src/a.js', lang: 'js', source })
  const byName = Object.fromEntries(result.symbols.map((symbol) => [symbol.name, symbol]))

  assert.equal(byName.run.summary, 'Runs the app.')
  assert.equal(byName.load.summary, 'Loads data.')
  assert.equal(byName.separated.summary, undefined)
  assert.equal(byName.undocumented.summary, undefined)
  assert.equal(byName.work.summary, 'Does work.')
})
