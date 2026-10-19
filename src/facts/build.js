// SPDX-License-Identifier: AGPL-3.0-only
// Derived from ReadMenator readmenator/_exporter.py (commit dac48f868722620f0d01dac0d33102c5a514c03c),
// modified 2026-10-19 by AncletoCEO.

import { buildExternalsFact } from './externals.js'
import { buildSkippedFact } from './skipped.js'
import { buildUnresolvedFact } from './unresolved.js'

function json(value) {
  return `${JSON.stringify(value, null, 2)}\n`
}

function escapeCell(value) {
  return String(value).replace(/\|/g, '\\|')
}

export function renderInventory(graph) {
  const files = graph.nodes.filter((node) => node.kind === 'file')
  const lines = [
    '# Inventory',
    '',
    `Total: ${files.length} archivos, ${graph.stats.symbols} símbolos, ${graph.stats.edges} aristas.`,
    '',
    '| Archivo | Capa | Líneas | Símbolos | Fan-in | Fan-out | PageRank |',
    '| --- | --- | ---: | ---: | ---: | ---: | ---: |'
  ]

  for (const file of files) {
    lines.push(
      `| ${escapeCell(file.path)} | ${file.layer} | ${file.lines} | ${file.symbolCount} | ${file.fanIn} | ${file.fanOut} | ${file.pageRank.toFixed(6)} |`
    )
  }

  return `${lines.join('\n')}\n`
}

export function buildFacts({ graph, metrics, scanResult, externals, unresolved }) {
  return {
    'facts/cycles.json': json({
      schemaVersion: 1,
      cycles: metrics.cycles.cycles,
      selfLoops: metrics.cycles.selfLoops
    }),
    'facts/layers.json': json({
      schemaVersion: 1,
      layers: metrics.layers.layers,
      violations: metrics.layers.violations
    }),
    'facts/communities.json': json({
      schemaVersion: 1,
      communities: metrics.communities ?? []
    }),
    'facts/hotspots.json': json({
      schemaVersion: 1,
      hotspots: metrics.hotspots
    }),
    'facts/blast-radius.json': json({
      schemaVersion: 1,
      seeds: metrics.blastRadius
    }),
    'facts/inventory.md': renderInventory(graph),
    'facts/unresolved.json': json(buildUnresolvedFact(unresolved)),
    'facts/externals.json': json(buildExternalsFact(externals)),
    'facts/skipped.json': json(buildSkippedFact(scanResult.skipped))
  }
}
