import test from 'node:test'
import assert from 'node:assert/strict'
import {
  createIgnoreMatcher,
  globToRegExp,
  matchesAny,
  matchesGlob
} from '../src/config/glob.js'

test('glob matcher básico', () => {
  assert.ok(globToRegExp('*.js') instanceof RegExp)
  assert.ok(matchesGlob('a.js', '*.js'))
  assert.ok(matchesGlob('src/a.js', '*.js'))
  assert.ok(!matchesGlob('a.txt', '*.js'))
  assert.ok(matchesGlob('src/a.js', 'src/*.js'))
  assert.ok(!matchesGlob('src/deep/a.js', 'src/*.js'))
  assert.ok(matchesGlob('src/deep/a.js', 'src/**'))
  assert.ok(matchesGlob('src/a.test.js', '**/*.test.js'))
  assert.ok(matchesGlob('a.test.js', '**/*.test.js'))
  assert.ok(matchesGlob('src/a.js', 'src/?.js'))
  assert.ok(matchesGlob('src/a.js', 'src/[ab].js'))
  assert.ok(!matchesGlob('src/c.js', 'src/[ab].js'))
})

test('matchesAny', () => {
  assert.ok(matchesAny('src/a.js', ['docs/**', 'src/**']))
  assert.ok(!matchesAny('test/a.js', ['docs/**', 'src/**']))
})

test('ignore matcher', () => {
  const ignored = createIgnoreMatcher(['node_modules', '*.log', 'docs/**'])

  assert.ok(ignored('node_modules'))
  assert.ok(ignored('src/node_modules', { isDirectory: true }))
  assert.ok(ignored('a.log'))
  assert.ok(ignored('src/a.log'))
  assert.ok(ignored('docs/readme.md'))
  assert.ok(ignored('docs', { isDirectory: true }))
  assert.ok(!ignored('src/a.js'))
})
