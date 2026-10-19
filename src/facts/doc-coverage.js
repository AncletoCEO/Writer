// SPDX-License-Identifier: AGPL-3.0-only

export function buildDocCoverageFact(graph) {
  const byFile = new Map()

  for (const node of graph.nodes) {
    if (node.kind !== 'symbol') continue
    if (!byFile.has(node.path)) byFile.set(node.path, { documented: 0, total: 0 })
    const entry = byFile.get(node.path)
    entry.total += 1
    if (node.summary) entry.documented += 1
  }

  let documented = 0
  let total = 0
  const files = [...byFile.entries()]
    .map(([path, entry]) => {
      documented += entry.documented
      total += entry.total
      return {
        path,
        documented: entry.documented,
        total: entry.total,
        ratio: entry.total === 0 ? 1 : Number((entry.documented / entry.total).toFixed(4))
      }
    })
    .sort((a, b) => a.path.localeCompare(b.path))

  return {
    schemaVersion: 1,
    files,
    totals: {
      documented,
      total,
      ratio: total === 0 ? 1 : Number((documented / total).toFixed(4))
    }
  }
}
