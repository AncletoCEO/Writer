// SPDX-License-Identifier: AGPL-3.0-only

import { readFileSync } from 'node:fs'
import { buildGraph } from '../graph/build.js'
import { applyMetrics } from '../metrics/index.js'
import { readProjectRules } from '../memory/read-only.js'
import { renderDocuments } from '../render/markdown.js'
import { loadTsconfig } from '../resolve/tsconfig.js'
import { readGitInfo } from '../scan/git.js'
import { scanRepository } from '../scan/scanner.js'
import { buildFacts } from '../facts/build.js'
import { buildSymbolsJson } from '../facts/symbols.js'
import { buildManifest, computeFingerprint, outputEntry } from '../contract/manifest.js'
import { publishPackage } from '../contract/writer.js'

const pkg = JSON.parse(readFileSync(new URL('../../package.json', import.meta.url), 'utf8'))

function json(value) {
  return `${JSON.stringify(value, null, 2)}\n`
}

export function runBuild({ rootAbs, config, now = () => new Date().toISOString() }) {
  const startedAt = Date.now()

  const scanResult = scanRepository({ rootAbs, config })
  const gitInfo = readGitInfo(rootAbs)
  const tsconfig = loadTsconfig(rootAbs, config.resolve?.tsconfig ?? 'auto')

  const { graph, externals, unresolved } = buildGraph({
    rootAbs,
    config,
    tsconfig,
    scanResult
  })

  const metrics = applyMetrics(graph, { config, gitInfo })
  const projectRules = readProjectRules(rootAbs, config.memory)

  const facts = buildFacts({ graph, metrics, scanResult, externals, unresolved })
  const documents = renderDocuments({ graph, metrics, projectRules, unresolved })

  const outputs = {
    'graph.json': json(graph),
    'symbols.json': buildSymbolsJson(graph),
    ...facts,
    ...documents
  }

  const stats = {
    ...graph.stats,
    unresolved: unresolved.length,
    skipped: scanResult.skipped.length
  }

  const manifest = buildManifest({
    writerVersion: pkg.version,
    generatedAt: now(),
    gitInfo,
    fingerprint: computeFingerprint(scanResult.files),
    stats,
    outputs: Object.entries(outputs).map(([path, content]) => outputEntry(path, content)),
    durationMs: Date.now() - startedAt
  })

  publishPackage({
    outputDirAbs: config.outputDirAbs,
    outputs: {
      ...outputs,
      'manifest.json': json(manifest)
    }
  })

  return {
    manifest,
    graph,
    metrics,
    facts,
    documents,
    projectRules,
    externals,
    unresolved
  }
}
