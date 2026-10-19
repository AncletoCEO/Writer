// SPDX-License-Identifier: AGPL-3.0-only
// Derived from ReadMenator readmenator/_rank.py (commit dac48f868722620f0d01dac0d33102c5a514c03c),
// modified 2026-10-19 by AncletoCEO.

export function computePageRank(fileNodes, edges, options = {}) {
  const { damping = 0.85, tolerance = 1e-6, maxIterations = 100 } = options
  const ids = fileNodes.map((node) => node.id).sort()
  const size = ids.length
  const ranks = new Map()

  if (size === 0) return ranks

  const index = new Map(ids.map((id, position) => [id, position]))
  const out = ids.map(() => [])

  for (const edge of edges) {
    if (edge.kind !== 'import') continue
    const from = index.get(edge.from)
    const to = index.get(edge.to)
    if (from === undefined || to === undefined) continue
    out[from].push(to)
  }

  for (let i = 0; i < size; i += 1) {
    out[i] = [...new Set(out[i])].sort((a, b) => a - b)
  }

  let current = new Array(size).fill(1 / size)

  for (let iteration = 0; iteration < maxIterations; iteration += 1) {
    const next = new Array(size).fill((1 - damping) / size)
    let dangling = 0

    for (let i = 0; i < size; i += 1) {
      if (out[i].length === 0) dangling += current[i]
    }

    for (let i = 0; i < size; i += 1) {
      if (out[i].length === 0) continue
      const share = (damping * current[i]) / out[i].length
      for (const target of out[i]) next[target] += share
    }

    const danglingShare = (damping * dangling) / size
    for (let i = 0; i < size; i += 1) next[i] += danglingShare

    let difference = 0
    for (let i = 0; i < size; i += 1) difference += Math.abs(next[i] - current[i])
    current = next
    if (difference < tolerance) break
  }

  const total = current.reduce((sum, value) => sum + value, 0)
  for (let i = 0; i < size; i += 1) {
    ranks.set(ids[i], total === 0 ? 0 : current[i] / total)
  }

  return ranks
}
