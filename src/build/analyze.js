// SPDX-License-Identifier: AGPL-3.0-only

import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { buildGraph } from '../graph/build.js'
import { loadLanguagePack } from '../languages/registry.js'
import { applyMetrics } from '../metrics/index.js'
import { detectOrphanFiles } from '../metrics/orphans.js'
import { loadTsconfig } from '../resolve/tsconfig.js'
import { readGitInfo } from '../scan/git.js'
import { scanRepository } from '../scan/scanner.js'

export function analyzeRepository({ rootAbs, config }) {
  const languagePack = loadLanguagePack(config.languagePack)
  const scanResult = scanRepository({
    rootAbs,
    config,
    languageExtensions: languagePack.extensions
  })
  const gitInfo = readGitInfo(rootAbs)
  const tsconfig = loadTsconfig(rootAbs, config.resolve?.tsconfig ?? 'auto')
  const { graph, externals, unresolved } = buildGraph({
    rootAbs,
    config,
    tsconfig,
    scanResult,
    adapters: languagePack.adapters
  })
  const metrics = applyMetrics(graph, { config, gitInfo })

  let packageJson = null
  try {
    packageJson = JSON.parse(readFileSync(join(rootAbs, 'package.json'), 'utf8'))
  } catch {
    packageJson = null
  }

  const orphans = detectOrphanFiles({
    fileNodes: graph.nodes.filter((node) => node.kind === 'file'),
    packageJson,
    config,
    hasDynamicImports: unresolved.some((entry) => entry.reason === 'non-literal'),
    hasUnresolved: unresolved.length > 0
  })

  return { scanResult, gitInfo, graph, externals, unresolved, metrics, orphans }
}
