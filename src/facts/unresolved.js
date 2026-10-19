// SPDX-License-Identifier: AGPL-3.0-only

import { mkdirSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'

export function buildUnresolvedFact(entries = []) {
  const unresolved = entries
    .map((entry) => ({
      path: entry.path,
      specifier: entry.specifier ?? null,
      kind: entry.kind,
      line: entry.line,
      reason: entry.reason,
      ...(entry.candidates ? { candidates: entry.candidates } : {})
    }))
    .sort(
      (a, b) =>
        a.path.localeCompare(b.path) ||
        (a.line ?? 0) - (b.line ?? 0) ||
        String(a.specifier ?? '').localeCompare(String(b.specifier ?? ''))
    )

  return {
    schemaVersion: 1,
    unresolved
  }
}

export function writeUnresolvedFact(outputDirAbs, entries = []) {
  const path = join(outputDirAbs, 'facts', 'unresolved.json')
  mkdirSync(dirname(path), { recursive: true })
  writeFileSync(path, `${JSON.stringify(buildUnresolvedFact(entries), null, 2)}\n`)
  return path
}
