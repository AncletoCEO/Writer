import test from 'node:test'
import assert from 'node:assert/strict'
import { tokenize } from '../src/parsers/lexer.js'

test('comentarios, strings y posiciones', () => {
  const tokens = tokenize('// comentario\nconst x = "a\\n" /* bloque */\n  y')
  const kinds = tokens.map((token) => token.type)

  assert.deepEqual(kinds, [
    'identifier',
    'identifier',
    'punctuator',
    'string',
    'identifier',
    'eof'
  ])

  const string = tokens.find((token) => token.type === 'string')
  assert.equal(string.value, 'a\n')
  assert.equal(string.line, 2)

  const y = tokens.find((token) => token.value === 'y')
  assert.equal(y.line, 3)
  assert.equal(y.column, 3)
})

test('regex vs división', () => {
  const tokens = tokenize(
    'const re = /a\\/b/gi\nconst half = total / 2\nreturn /x/.test(value)'
  )
  const regexes = tokens.filter((token) => token.type === 'regex')
  const divisions = tokens.filter(
    (token) => token.type === 'punctuator' && token.value === '/'
  )

  assert.equal(regexes.length, 2)
  assert.equal(regexes[0].raw, '/a\\/b/gi')
  assert.equal(regexes[1].raw, '/x/')
  assert.equal(divisions.length, 1)
})

test('templates con y sin expresiones', () => {
  const tokens = tokenize(
    'const a = `hello ${name}`; const b = `plain`; const c = `a ${`b ${x}`} c`'
  )
  const templates = tokens.filter((token) => token.type === 'template')

  assert.equal(templates.length, 3)
  assert.equal(templates[0].hasExpressions, true)
  assert.equal(templates[0].value, null)
  assert.equal(templates[1].hasExpressions, false)
  assert.equal(templates[1].value, 'plain')
  assert.equal(templates[2].hasExpressions, true)
})

test('JSX se consume como un solo token', () => {
  const source =
    'const el = <div className="x">// texto /* no comentario */ {value}</div>; const n = 1'
  const tokens = tokenize(source, { jsx: true })
  const jsx = tokens.filter((token) => token.type === 'jsx')

  assert.equal(jsx.length, 1)
  assert.match(jsx[0].raw, /^<div/)
  assert.ok(tokens.some((token) => token.type === 'identifier' && token.value === 'n'))
})

test('JSX self-closing y fragmentos', () => {
  const tokens = tokenize('const a = <Foo />; const b = <>x</>', { jsx: true })
  const jsx = tokens.filter((token) => token.type === 'jsx')

  assert.equal(jsx.length, 2)
  assert.match(jsx[0].raw, /^<Foo \/>$/)
  assert.match(jsx[1].raw, /^<>x<\/>$/)
})

test('un generic arrow no se confunde con JSX', () => {
  const tokens = tokenize('const f = <T>(x: T) => x', { jsx: true })
  const jsx = tokens.filter((token) => token.type === 'jsx')

  assert.equal(jsx.length, 0)
  assert.ok(tokens.some((token) => token.type === 'punctuator' && token.value === '=>'))
})
