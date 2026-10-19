// SPDX-License-Identifier: AGPL-3.0-only

import { mkdirSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'

export function buildExternalsFact(entries = []) {
  const map = new Map()

  for (const entry of entries) {
    if (!entry || typeof entry.specifier !== 'string' || entry.specifier === '') continue
    const current = map.get(entry.specifier) ?? {
      specifier: entry.specifier,
      count: 0,
      files: []
    }
    current.count += 1
    if (entry.path && !current.files.includes(entry.path)) current.files.push(entry.path)
    map.set(entry.specifier, current)
  }

  const externals = [...map.values()]
    .map((entry) => ({ ...entry, files: [...entry.files].sort() }))
    .sort((a, b) => b.count - a.count || a.specifier.localeCompare(b.specifier))

  return {
    schemaVersion: 1,
    externals
  }
}

export function writeExternalsFact(outputDirAbs, entries = []) {
  const path = join(outputDirAbs, 'facts', 'externals.json')
  mkdirSync(dirname(path), { recursive: true })
  writeFileSync(path, `${JSON.stringify(buildExternalsFact(entries), null, 2)}\n`)
  return path
}
