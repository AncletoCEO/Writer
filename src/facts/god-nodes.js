// SPDX-License-Identifier: AGPL-3.0-only
// Derived from ReadMenator readmenator/_analyzer.py (commit dac48f868722620f0d01dac0d33102c5a514c03c),
// modified 2026-10-19 by AncletoCEO.

const DEFAULT_LIMIT = 20

function normalize(values) {
  if (values.length === 0) return []
  const min = Math.min(...values)
  const max = Math.max(...values)
  if (max === min) return values.map(() => 0)
  return values.map((value) => (value - min) / (max - min))
}

export function buildGodNodes(fileNodes, { limit = DEFAULT_LIMIT } = {}) {
  const files = fileNodes.filter((node) => node.kind === 'file')
  const pageRank = normalize(files.map((node) => node.pageRank ?? 0))
  const fanIn = normalize(files.map((node) => node.fanIn ?? 0))
  const exported = normalize(files.map((node) => node.exportedSymbols ?? 0))

  const ranked = files.map((node, position) => ({
    path: node.path,
    score: Number(
      (
        0.5 * pageRank[position] +
        0.3 * fanIn[position] +
        0.2 * exported[position]
      ).toFixed(6)
    ),
    pageRank: Number((node.pageRank ?? 0).toFixed(6)),
    fanIn: node.fanIn ?? 0,
    fanOut: node.fanOut ?? 0,
    symbols: node.symbolCount ?? 0,
    exportedSymbols: node.exportedSymbols ?? 0
  }))

  ranked.sort((a, b) => b.score - a.score || a.path.localeCompare(b.path))
  const safeLimit = Number.isInteger(limit) && limit > 0 ? limit : DEFAULT_LIMIT
  return ranked.slice(0, safeLimit)
}
