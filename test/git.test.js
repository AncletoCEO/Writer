import test from 'node:test'
import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { readGitInfo } from '../src/scan/git.js'

function tempDir(t) {
  const dir = mkdtempSync(join(tmpdir(), 'ancleto-writer-git-'))
  t.after(() => rmSync(dir, { recursive: true, force: true }))
  return dir
}

function gitAvailable() {
  try {
    execFileSync('git', ['--version'], { stdio: 'ignore' })
    return true
  } catch {
    return false
  }
}

test('sin git devuelve available false', (t) => {
  const dir = tempDir(t)
  const info = readGitInfo(dir)

  assert.equal(info.available, false)
  assert.equal(info.commit, null)
  assert.deepEqual(info.changedFiles, [])
  assert.ok(['not-a-git-repository', 'git-not-found'].includes(info.reason))
})

test('repo git con cambios', (t) => {
  if (!gitAvailable()) {
    t.skip('git no disponible')
    return
  }

  const dir = tempDir(t)
  const run = (args) => execFileSync('git', args, { cwd: dir, stdio: 'ignore' })

  run(['init', '-b', 'main'])
  writeFileSync(join(dir, 'a.js'), 'export const a = 1\n')
  run(['add', '.'])
  run(['-c', 'user.name=Test', '-c', 'user.email=test@example.com', 'commit', '-m', 'init'])
  writeFileSync(join(dir, 'a.js'), 'export const a = 2\n')

  const info = readGitInfo(dir)
  assert.equal(info.available, true)
  assert.match(info.commit, /^[0-9a-f]{40}$/)
  assert.equal(info.dirty, true)
  assert.ok(info.changedFiles.includes('a.js'))
})
