// SPDX-License-Identifier: AGPL-3.0-only
// Derived from ReadMenator readmenator/_hotspots.py (commit dac48f868722620f0d01dac0d33102c5a514c03c),
// modified 2026-10-19 by AncletoCEO.

function normalize(values) {
  if (values.length === 0) return []
  const min = Math.min(...values)
  const max = Math.max(...values)
  if (max === min) return values.map(() => 0)
  return values.map((value) => (value - min) / (max - min))
}

export function computeHotspots(fileNodes, cycleFiles = new Set()) {
  const fanIn = normalize(fileNodes.map((node) => node.fanIn ?? 0))
  const fanOut = normalize(fileNodes.map((node) => node.fanOut ?? 0))
  const symbols = normalize(fileNodes.map((node) => node.symbolCount ?? 0))
  const cycle = fileNodes.map((node) => (cycleFiles.has(node.path) ? 1 : 0))
  const cycleNormalized = normalize(cycle)

  const hotspots = fileNodes.map((node, position) => ({
    path: node.path,
    score:
      0.35 * fanIn[position] +
      0.25 * fanOut[position] +
      0.2 * symbols[position] +
      0.2 * cycleNormalized[position],
    fanIn: node.fanIn ?? 0,
    fanOut: node.fanOut ?? 0,
    symbols: node.symbolCount ?? 0,
    cycle: cycle[position] === 1
  }))

  hotspots.sort((a, b) => b.score - a.score || a.path.localeCompare(b.path))
  return hotspots
}
