#!/usr/bin/env node
// SPDX-License-Identifier: AGPL-3.0-only

// Validación de sintaxis sin dependencias: recorre los archivos JavaScript del
// repositorio y ejecuta `node --check` sobre cada uno.

import { execFileSync } from 'node:child_process'
import { readdirSync } from 'node:fs'
import { dirname, join, relative } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = join(__dirname, '..')
const IGNORED = new Set(['node_modules', '.git', '.ancleto', 'dist', 'coverage', 'docs', 'aspec', '.github'])
const SOURCE = /\.(js|mjs|cjs)$/

function walk(dir, out = []) {
  let entries
  try {
    entries = readdirSync(dir, { withFileTypes: true })
  } catch {
    return out
  }
  for (const entry of entries) {
    if (entry.isDirectory()) {
      if (IGNORED.has(entry.name)) continue
      walk(join(dir, entry.name), out)
    } else if (entry.isFile() && SOURCE.test(entry.name)) {
      out.push(join(dir, entry.name))
    }
  }
  return out
}

const files = walk(ROOT).sort()
let failed = 0

for (const file of files) {
  try {
    execFileSync(process.execPath, ['--check', file], { stdio: 'pipe' })
  } catch (error) {
    failed += 1
    console.error(`check-syntax: ${relative(ROOT, file)}`)
    const detail = error.stderr?.toString() || error.message
    console.error(detail.trim())
  }
}

if (failed > 0) {
  console.error(`check-syntax: ${failed} archivo(s) con errores de sintaxis`)
  process.exit(1)
}

console.log(`check-syntax: OK (${files.length} archivo(s))`)
