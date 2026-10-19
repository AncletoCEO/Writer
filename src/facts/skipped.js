// SPDX-License-Identifier: AGPL-3.0-only

import { mkdirSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'

export function buildSkippedFact(skipped = []) {
  const entries = skipped
    .map((entry) => ({ path: entry.path, reason: entry.reason }))
    .sort((a, b) => a.path.localeCompare(b.path) || a.reason.localeCompare(b.reason))

  return {
    schemaVersion: 1,
    skipped: entries
  }
}

export function writeSkippedFact(outputDirAbs, skipped = []) {
  const path = join(outputDirAbs, 'facts', 'skipped.json')
  mkdirSync(dirname(path), { recursive: true })
  writeFileSync(path, `${JSON.stringify(buildSkippedFact(skipped), null, 2)}\n`)
  return path
}
