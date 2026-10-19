import test from 'node:test'
import assert from 'node:assert/strict'
import { assertNodeVersion } from '../src/cli/version-check.js'

test('exige Node >= 24', () => {
  assert.equal(assertNodeVersion('24.0.0'), 24)
  assert.equal(assertNodeVersion('26.1.0'), 26)
  assert.throws(() => assertNodeVersion('22.1.0'), /Node\.js >= 24/)
  assert.throws(() => assertNodeVersion('no-es-version'), /Node\.js >= 24/)
})
