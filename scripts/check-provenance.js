#!/usr/bin/env node

// Audit de procedencia de @ancleto/writer.
// Falla si un archivo derivado de ReadMenator no declara la cabecera SPDX completa,
// si aparece una superficie excluida, o si un archivo menciona una derivación
// sin estar registrado en DERIVED_FILES.

import { existsSync, readFileSync, readdirSync } from 'node:fs'
import { dirname, join, relative, sep } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = join(__dirname, '..')
const UPSTREAM = 'ReadMenator'
const UPSTREAM_COMMIT = 'dac48f868722620f0d01dac0d33102c5a514c03c'

// Completar a medida que se portan archivos (Fase 3+).
const DERIVED_FILES = [
  'src/config/glob.js',
  'src/config/load.js',
  'src/scan/scanner.js',
  'src/scan/git.js',
  'src/parsers/lexer.js',
  'src/parsers/javascript.js',
  'src/resolve/imports.js',
  'src/graph/build.js',
  'src/metrics/cycles.js',
  'src/metrics/communities.js',
  'src/metrics/bridges.js',
  'src/metrics/pagerank.js',
  'src/metrics/layers.js',
  'src/metrics/hotspots.js',
  'src/metrics/blast-radius.js',
  'src/render/mermaid.js',
  'src/render/markdown.js',
  'src/facts/build.js',
  'src/facts/god-nodes.js',
  'src/facts/symbols.js'
]

// Superficies del upstream que no deben portarse.
const FORBIDDEN_DIRS = [
  'src/video',
  'src/graphrag',
  'src/wiki',
  'src/apidocs',
  'src/mcp',
  'src/explorer',
  'src/diagrams',
  'src/vendor',
  'src/render/html'
]

const REQUIRED_HEADER = [
  'SPDX-License-Identifier: AGPL-3.0-only',
  `Derived from ${UPSTREAM}`,
  UPSTREAM_COMMIT
]

function toPosix(p) {
  return p.split(sep).join('/')
}

function walk(dir, out = []) {
  let entries
  try {
    entries = readdirSync(dir, { withFileTypes: true })
  } catch {
    return out
  }
  for (const entry of entries) {
    const abs = join(dir, entry.name)
    if (entry.isDirectory()) {
      walk(abs, out)
    } else if (entry.isFile()) {
      out.push(abs)
    }
  }
  return out
}

function headOf(content, lines = 8) {
  return content.split('\n').slice(0, lines).join('\n')
}

function hasHeader(content) {
  const head = headOf(content)
  return REQUIRED_HEADER.every((needle) => head.includes(needle))
}

const errors = []

for (const rel of DERIVED_FILES) {
  const abs = join(ROOT, rel)
  if (!existsSync(abs)) {
    errors.push(`archivo derivado declarado pero ausente: ${rel}`)
    continue
  }
  const content = readFileSync(abs, 'utf8')
  if (!hasHeader(content)) {
    errors.push(`cabecera de procedencia incompleta: ${rel}`)
  }
}

for (const dir of FORBIDDEN_DIRS) {
  const abs = join(ROOT, dir)
  if (!existsSync(abs)) continue
  const found = walk(abs).filter((p) => /\.(js|mjs|cjs|ts|tsx|jsx|html|css)$/.test(p))
  for (const file of found) {
    errors.push(`superficie excluida presente: ${toPosix(relative(ROOT, file))}`)
  }
}

const srcDir = join(ROOT, 'src')
if (existsSync(srcDir)) {
  for (const abs of walk(srcDir)) {
    if (!/\.(js|mjs|cjs|ts|tsx|jsx)$/.test(abs)) continue
    const rel = toPosix(relative(ROOT, abs))
    if (DERIVED_FILES.includes(rel)) continue
    let content
    try {
      content = readFileSync(abs, 'utf8')
    } catch {
      continue
    }
    if (content.includes(`Derived from ${UPSTREAM}`)) {
      errors.push(`derivación no registrada en DERIVED_FILES: ${rel}`)
    }
  }
}

if (errors.length > 0) {
  console.error('provenance: se encontraron problemas:')
  for (const error of errors) console.error(`  - ${error}`)
  process.exit(1)
}

console.log(
  `provenance: OK (${DERIVED_FILES.length} archivo(s) derivado(s), ` +
    `commit upstream ${UPSTREAM_COMMIT.slice(0, 7)})`
)
