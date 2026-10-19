// SPDX-License-Identifier: AGPL-3.0-only

import { accessSync, constants, existsSync } from 'node:fs'
import { dirname } from 'node:path'
import { readManifest } from '../../contract/manifest.js'
import { readProjectRules } from '../../memory/read-only.js'
import { readGitInfo } from '../../scan/git.js'

function nearestExisting(path) {
  let current = path
  while (!existsSync(current)) {
    const parent = dirname(current)
    if (parent === current) break
    current = parent
  }
  return current
}

export function checkWritable(outputDirAbs) {
  const target = nearestExisting(dirname(outputDirAbs))
  try {
    accessSync(target, constants.W_OK)
    return { writable: true, path: target }
  } catch {
    return { writable: false, path: target }
  }
}

function effectiveConfig(config) {
  return {
    schemaVersion: config.schemaVersion,
    include: config.include,
    exclude: config.exclude,
    languages: config.languages,
    maxFileSizeBytes: config.maxFileSizeBytes,
    maxDepth: config.maxDepth,
    followSymlinks: config.followSymlinks,
    resolve: config.resolve,
    layers: config.layers,
    impactSeeds: config.impactSeeds,
    memory: config.memory,
    agentDocs: config.agentDocs
  }
}

export function runDoctor({ rootAbs, config }) {
  const git = readGitInfo(rootAbs)
  const memory = readProjectRules(rootAbs, config.memory)
  const writable = checkWritable(config.outputDirAbs)

  let manifest = null
  let manifestError = null
  try {
    manifest = readManifest(config.outputDirAbs)
  } catch (error) {
    manifestError = error.message
  }

  return {
    node: process.versions.node,
    minNode: '24.0.0',
    root: rootAbs,
    outputDir: config.outputDir,
    writable,
    git,
    memory: {
      available: memory.available,
      reason: memory.reason,
      rules: memory.rules.length
    },
    manifest: manifest
      ? {
          schemaVersion: manifest.schemaVersion,
          generatedAt: manifest.generatedAt,
          gitCommit: manifest.gitCommit,
          stats: manifest.stats
        }
      : null,
    manifestError,
    config: effectiveConfig(config)
  }
}
