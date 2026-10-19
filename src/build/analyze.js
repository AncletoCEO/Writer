// SPDX-License-Identifier: AGPL-3.0-only

import { buildGraph } from '../graph/build.js'
import { applyMetrics } from '../metrics/index.js'
import { loadTsconfig } from '../resolve/tsconfig.js'
import { readGitInfo } from '../scan/git.js'
import { scanRepository } from '../scan/scanner.js'

export function analyzeRepository({ rootAbs, config }) {
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

  return { scanResult, gitInfo, graph, externals, unresolved, metrics }
}
