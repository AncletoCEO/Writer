// SPDX-License-Identifier: AGPL-3.0-only

import { createIgnoreMatcher, matchesGlob, toPosix } from '../config/glob.js'

const TEST_FILE = /\.(test|spec)\.[cm]?[jt]sx?$/
const CONFIG_FILE = /(^|\/)(eslint|vite|vitest|jest|rollup|webpack|babel|tsup|next|nuxt|svelte|astro)\.config\.[cm]?[jt]s$/
const TSCONFIG = /(^|\/)(tsconfig|jsconfig)(\.[^/]+)?\.json$/

function stripDot(path) {
  return toPosix(path).replace(/^\.\//, '')
}

function collectExportPaths(value, out) {
  if (typeof value === 'string') {
    out.add(stripDot(value))
    return
  }
  if (Array.isArray(value)) {
    for (const item of value) collectExportPaths(item, out)
    return
  }
  if (value && typeof value === 'object') {
    for (const item of Object.values(value)) collectExportPaths(item, out)
  }
}

export function collectEntrypoints(packageJson) {
  const entrypoints = new Set()
  if (!packageJson || typeof packageJson !== 'object') return entrypoints

  for (const key of ['main', 'module', 'browser']) {
    if (typeof packageJson[key] === 'string') entrypoints.add(stripDot(packageJson[key]))
  }

  if (typeof packageJson.bin === 'string') {
    entrypoints.add(stripDot(packageJson.bin))
  } else if (packageJson.bin && typeof packageJson.bin === 'object') {
    for (const value of Object.values(packageJson.bin)) {
      if (typeof value === 'string') entrypoints.add(stripDot(value))
    }
  }

  if (packageJson.exports !== undefined) collectExportPaths(packageJson.exports, entrypoints)

  return entrypoints
}

function excludedReason(path, entrypoints, isIgnored) {
  if (entrypoints.has(path)) return 'entrypoint'
  if (isIgnored(path)) return 'config'
  if (/^(test|tests)\//.test(path) || TEST_FILE.test(path)) return 'test'
  if (/^(scripts|migrations)\//.test(path)) return 'script'
  if (CONFIG_FILE.test(path) || TSCONFIG.test(path)) return 'config'
  return null
}

export function detectOrphanFiles({
  fileNodes,
  packageJson = null,
  config = {},
  hasDynamicImports = false,
  hasUnresolved = false
}) {
  const settings = config.orphans ?? {}
  if (settings.enabled === false) {
    return { orphanFiles: [], excluded: [], dynamicImports: hasDynamicImports }
  }

  const entrypoints = collectEntrypoints(packageJson)
  for (const entrypoint of settings.entrypoints ?? []) {
    if (typeof entrypoint === 'string') entrypoints.add(stripDot(entrypoint))
  }

  const userExcludes = (settings.exclude ?? []).filter((pattern) => typeof pattern === 'string')
  const isUserExcluded = createIgnoreMatcher(userExcludes)
  const isIgnored = (path) =>
    isUserExcluded(path) ||
    (settings.entrypoints ?? []).some((pattern) => typeof pattern === 'string' && matchesGlob(path, pattern))

  const confidence = hasDynamicImports || hasUnresolved ? 'low' : 'medium'
  const orphanFiles = []
  const excluded = []

  for (const node of fileNodes) {
    if (node.fanIn !== 0) continue
    const reason = excludedReason(node.path, entrypoints, isIgnored)
    if (reason) {
      excluded.push({ path: node.path, reason })
      continue
    }
    orphanFiles.push({
      path: node.path,
      reason: 'no-inbound-imports',
      confidence
    })
  }

  orphanFiles.sort((a, b) => a.path.localeCompare(b.path))
  excluded.sort((a, b) => a.path.localeCompare(b.path) || a.reason.localeCompare(b.reason))

  return {
    orphanFiles,
    excluded,
    dynamicImports: hasDynamicImports
  }
}
