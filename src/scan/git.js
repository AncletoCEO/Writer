// SPDX-License-Identifier: AGPL-3.0-only

import { execFileSync } from 'node:child_process'
import { toPosix } from '../config/glob.js'

function git(rootAbs, args) {
  return execFileSync('git', ['-c', 'core.fsmonitor=false', ...args], {
    cwd: rootAbs,
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'ignore']
  }).trim()
}

function lines(value) {
  return value
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => toPosix(line))
}

export function readGitInfo(rootAbs) {
  try {
    const commit = git(rootAbs, ['rev-parse', 'HEAD'])
    const status = git(rootAbs, ['status', '--porcelain'])
    const changed = new Set([
      ...lines(git(rootAbs, ['diff', '--name-only', '--no-ext-diff', 'HEAD'])),
      ...lines(git(rootAbs, ['ls-files', '--others', '--exclude-standard']))
    ])

    return {
      available: true,
      commit,
      dirty: status !== '',
      changedFiles: [...changed].sort(),
      reason: null
    }
  } catch (error) {
    const reason = error.code === 'ENOENT' ? 'git-not-found' : 'not-a-git-repository'
    return {
      available: false,
      commit: null,
      dirty: null,
      changedFiles: [],
      reason
    }
  }
}
