// SPDX-License-Identifier: AGPL-3.0-only
// Derived from ReadMenator readmenator/_resolver.py (commit dac48f868722620f0d01dac0d33102c5a514c03c),
// modified 2026-10-19 by AncletoCEO.

import { statSync } from 'node:fs'
import { dirname, isAbsolute, join, relative, resolve } from 'node:path'
import { toPosix } from '../config/glob.js'

const EXTERNAL_PREFIX = /^(node:|bun:|deno:|https?:|#)/

function isRelative(specifier) {
  return (
    specifier === '.' ||
    specifier === '..' ||
    specifier.startsWith('./') ||
    specifier.startsWith('../')
  )
}

function isFile(path) {
  try {
    return statSync(path).isFile()
  } catch {
    return false
  }
}

function isDirectory(path) {
  try {
    return statSync(path).isDirectory()
  } catch {
    return false
  }
}

function stripQuery(specifier) {
  return specifier.split(/[?#]/)[0]
}

const TS_EQUIVALENTS = {
  '.js': ['.ts', '.tsx'],
  '.jsx': ['.tsx'],
  '.mjs': ['.mts'],
  '.cjs': ['.cts']
}

function candidatesFor(baseAbs, extensions) {
  const candidates = []

  if (isFile(baseAbs)) {
    candidates.push(baseAbs)
    return candidates
  }

  const explicitExtension = baseAbs.slice(baseAbs.lastIndexOf('.'))
  if (TS_EQUIVALENTS[explicitExtension]) {
    const stem = baseAbs.slice(0, -explicitExtension.length)
    for (const alternative of TS_EQUIVALENTS[explicitExtension]) {
      const candidate = `${stem}${alternative}`
      if (isFile(candidate)) candidates.push(candidate)
    }
  }

  for (const extension of extensions) {
    const candidate = `${baseAbs}${extension}`
    if (isFile(candidate)) candidates.push(candidate)
  }

  if (isDirectory(baseAbs)) {
    for (const extension of extensions) {
      const candidate = join(baseAbs, `index${extension}`)
      if (isFile(candidate)) candidates.push(candidate)
    }
  }

  return [...new Set(candidates)]
}

function matchPattern(pattern, specifier) {
  const star = pattern.indexOf('*')
  if (star === -1) return pattern === specifier ? '' : null

  const prefix = pattern.slice(0, star)
  const suffix = pattern.slice(star + 1)
  if (!specifier.startsWith(prefix) || !specifier.endsWith(suffix)) return null
  if (specifier.length < prefix.length + suffix.length) return null
  return specifier.slice(prefix.length, specifier.length - suffix.length)
}

function expandTarget(target, captured) {
  return target.includes('*') ? target.replace('*', captured) : target + captured
}

export function resolveSpecifier(specifier, fromFileAbs, { rootAbs, extensions, tsconfig }) {
  if (typeof specifier !== 'string' || specifier.trim() === '') {
    return { type: 'unresolved', reason: 'not-found' }
  }
  if (EXTERNAL_PREFIX.test(specifier)) {
    return { type: 'external' }
  }

  const clean = stripQuery(specifier)
  const candidates = []

  if (isRelative(clean)) {
    candidates.push(...candidatesFor(resolve(dirname(fromFileAbs), clean), extensions))
  } else {
    if (tsconfig?.paths?.length) {
      for (const entry of tsconfig.paths) {
        const captured = matchPattern(entry.pattern, clean)
        if (captured === null) continue
        for (const target of entry.targets) {
          candidates.push(...candidatesFor(expandTarget(target, captured), extensions))
        }
      }
    }

    if (candidates.length === 0 && tsconfig?.baseUrlSet) {
      candidates.push(...candidatesFor(resolve(tsconfig.baseUrlAbs, clean), extensions))
    }

    if (candidates.length === 0) return { type: 'external' }
  }

  const unique = [...new Set(candidates)]
  if (unique.length === 0) return { type: 'unresolved', reason: 'not-found' }
  if (unique.length > 1) {
    return {
      type: 'unresolved',
      reason: 'ambiguous',
      candidates: unique.map((candidate) => toPosix(relative(rootAbs, candidate)))
    }
  }

  const target = unique[0]
  const rel = relative(rootAbs, target)
  if (rel.startsWith('..') || isAbsolute(rel)) {
    return { type: 'unresolved', reason: 'outside-root' }
  }

  return { type: 'resolved', target: toPosix(rel), absolute: target }
}

export function createResolver({ rootAbs, config, tsconfig = null }) {
  const extensions = config.resolve?.extensions ?? ['.js', '.ts']
  const context = { rootAbs, extensions, tsconfig }
  return (specifier, fromFileAbs) => resolveSpecifier(specifier, fromFileAbs, context)
}

export function resolveImports({ file, parseResult, resolve }) {
  const resolved = []
  const external = []
  const unresolved = []

  for (const entry of parseResult.imports) {
    const result = resolve(entry.specifier, file.absPath, entry)
    if (result.type === 'resolved') {
      const targets = Array.isArray(result.targets) ? result.targets : [result.target]
      const unique = [...new Set(targets)].sort()
      if (unique.length === 0) {
        unresolved.push({
          path: file.path,
          specifier: entry.specifier,
          kind: entry.kind,
          line: entry.line,
          reason: 'not-found'
        })
      }
      for (const target of unique) resolved.push({ ...entry, target })
    } else if (result.type === 'external') {
      external.push({ ...entry, path: file.path })
    } else {
      unresolved.push({
        path: file.path,
        specifier: entry.specifier,
        kind: entry.kind,
        line: entry.line,
        reason: result.reason,
        candidates: result.candidates
      })
    }
  }

  for (const entry of parseResult.unresolved) {
    unresolved.push({
      path: file.path,
      specifier: null,
      kind: entry.kind,
      line: entry.line,
      reason: entry.reason
    })
  }

  return { resolved, external, unresolved }
}
