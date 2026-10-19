// SPDX-License-Identifier: AGPL-3.0-only
// Derived from ReadMenator readmenator/_scanner.py (commit dac48f868722620f0d01dac0d33102c5a514c03c),
// modified 2026-10-19 by AncletoCEO.

import { lstatSync, readdirSync, readFileSync, realpathSync } from 'node:fs'
import { extname, isAbsolute, join, relative } from 'node:path'
import { createIgnoreMatcher, matchesAny, toPosix } from '../config/glob.js'
import { sha256 } from '../util/hash.js'

const LANGUAGE_BY_EXT = {
  '.js': 'js',
  '.mjs': 'js',
  '.cjs': 'js',
  '.jsx': 'jsx',
  '.ts': 'ts',
  '.tsx': 'tsx'
}

export class ScanError extends Error {
  constructor(message) {
    super(message)
    this.name = 'ScanError'
  }
}

function isInside(rootAbs, targetAbs) {
  const rel = relative(rootAbs, targetAbs)
  return rel === '' || (!rel.startsWith('..') && !isAbsolute(rel))
}

function countLines(content) {
  if (content.length === 0) return 0
  let lines = 1
  for (const byte of content) {
    if (byte === 10) lines += 1
  }
  if (content[content.length - 1] === 10) lines -= 1
  return lines
}

export function scanRepository({ rootAbs, config }) {
  let rootReal
  try {
    rootReal = realpathSync(rootAbs)
  } catch (error) {
    throw new ScanError(`no se pudo resolver el root: ${error.message}`)
  }

  const outputRel = config.outputDirAbs
    ? toPosix(relative(rootAbs, config.outputDirAbs))
    : ''
  const ignorePatterns = [...config.exclude]
  if (outputRel && outputRel !== '' && !outputRel.startsWith('..')) {
    ignorePatterns.push(outputRel)
  }

  const isIgnored = createIgnoreMatcher(ignorePatterns)
  const includeAll =
    config.include.length === 0 ||
    config.include.some((pattern) => pattern === '**/*' || pattern === '**')

  const files = []
  const skipped = []

  function skip(rel, reason) {
    skipped.push({ path: rel, reason })
  }

  function walk(dirAbs, depth) {
    let entries
    try {
      entries = readdirSync(dirAbs, { withFileTypes: true })
    } catch (error) {
      if (dirAbs === rootAbs) {
        throw new ScanError(`no se pudo leer el root: ${error.message}`)
      }
      skip(toPosix(relative(rootAbs, dirAbs)), 'unreadable')
      return
    }

    entries.sort((a, b) => a.name.localeCompare(b.name))

    for (const entry of entries) {
      const abs = join(dirAbs, entry.name)
      const rel = toPosix(relative(rootAbs, abs))

      if (isIgnored(rel, { isDirectory: entry.isDirectory() })) continue
      if (entry.isSymbolicLink()) {
        skip(rel, 'symlink')
        continue
      }

      if (entry.isDirectory()) {
        if (depth + 1 > config.maxDepth) {
          skip(rel, 'too-deep')
          continue
        }
        walk(abs, depth + 1)
        continue
      }

      if (!entry.isFile()) {
        skip(rel, 'unreadable')
        continue
      }

      const lang = LANGUAGE_BY_EXT[extname(entry.name).toLowerCase()]
      if (!lang || !config.languages.includes(lang)) continue
      if (!includeAll && !matchesAny(rel, config.include)) continue
      if (depth > config.maxDepth) {
        skip(rel, 'too-deep')
        continue
      }

      let stat
      try {
        stat = lstatSync(abs)
      } catch {
        skip(rel, 'unreadable')
        continue
      }
      if (!stat.isFile()) {
        skip(rel, 'unreadable')
        continue
      }
      if (stat.size > config.maxFileSizeBytes) {
        skip(rel, 'too-large')
        continue
      }

      let real
      try {
        real = realpathSync(abs)
      } catch {
        skip(rel, 'unreadable')
        continue
      }
      if (!isInside(rootReal, real)) {
        skip(rel, 'outside-root')
        continue
      }

      let content
      try {
        content = readFileSync(abs)
      } catch {
        skip(rel, 'unreadable')
        continue
      }

      files.push({
        path: rel,
        absPath: abs,
        lang,
        size: stat.size,
        lines: countLines(content),
        hash: sha256(content),
        content: content.toString('utf8')
      })
    }
  }

  walk(rootAbs, 0)

  files.sort((a, b) => a.path.localeCompare(b.path))
  skipped.sort((a, b) => a.path.localeCompare(b.path) || a.reason.localeCompare(b.reason))

  return {
    files,
    skipped,
    stats: {
      files: files.length,
      bytes: files.reduce((total, file) => total + file.size, 0),
      skipped: skipped.length
    }
  }
}
