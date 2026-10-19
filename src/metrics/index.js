// SPDX-License-Identifier: AGPL-3.0-only

import { computeBlastRadius, defaultSeeds } from './blast-radius.js'
import { findCycles } from './cycles.js'
import { computeHotspots } from './hotspots.js'
import { classifyLayers } from './layers.js'
import { computePageRank } from './pagerank.js'

function stripFile(id) {
  return String(id).replace(/^file:/, '')
}

export function applyMetrics(graph, { config = {}, gitInfo = null } = {}) {
  const fileNodes = graph.nodes.filter((node) => node.kind === 'file')
  const importEdges = graph.edges.filter((edge) => edge.kind === 'import')

  const fanIn = new Map()
  const fanOut = new Map()
  for (const node of fileNodes) {
    fanIn.set(node.path, 0)
    fanOut.set(node.path, 0)
  }
  for (const edge of importEdges) {
    const from = stripFile(edge.from)
    const to = stripFile(edge.to)
    if (fanOut.has(from)) fanOut.set(from, fanOut.get(from) + 1)
    if (fanIn.has(to)) fanIn.set(to, fanIn.get(to) + 1)
  }
  for (const node of fileNodes) {
    node.fanIn = fanIn.get(node.path)
    node.fanOut = fanOut.get(node.path)
  }

  const pageRank = computePageRank(fileNodes, importEdges)
  for (const node of fileNodes) {
    node.pageRank = Number((pageRank.get(node.id) ?? 0).toFixed(6))
  }

  const layerResult = classifyLayers(fileNodes, graph.edges, {
    overrides: config?.layers?.overrides ?? {}
  })
  for (const node of fileNodes) {
    node.layer = layerResult.layers[node.path] ?? 'unknown'
  }

  const cycles = findCycles(fileNodes, importEdges)
  const cycleFiles = new Set(cycles.cycles.flatMap((cycle) => cycle.files))

  const hotspots = computeHotspots(fileNodes, cycleFiles)
  const hotspotScores = new Map(hotspots.map((entry) => [entry.path, entry.score]))
  for (const node of fileNodes) {
    node.hotspot = Number((hotspotScores.get(node.path) ?? 0).toFixed(6))
  }

  const seeds = defaultSeeds(fileNodes, {
    changedFiles: gitInfo?.changedFiles ?? [],
    impactSeeds: config?.impactSeeds ?? []
  })
  const blastRadius = computeBlastRadius(fileNodes, importEdges, { seeds })

  graph.stats.cycles = cycles.cycles.length
  graph.stats.selfLoops = cycles.selfLoops.length

  return {
    cycles,
    layers: layerResult,
    hotspots,
    blastRadius,
    seeds
  }
}
