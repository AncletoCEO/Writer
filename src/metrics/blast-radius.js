// SPDX-License-Identifier: AGPL-3.0-only
// Derived from ReadMenator readmenator/_analyzer.py (commit dac48f868722620f0d01dac0d33102c5a514c03c),
// modified 2026-10-19 by AncletoCEO.

const FILE_PREFIX = /^file:/
const DEPENDENT_LIMIT = 200
const SEED_LIMIT = 100

function stripFile(id) {
  return String(id).replace(FILE_PREFIX, '')
}

function buildReverseGraph(fileNodes, edges) {
  const reverse = new Map()
  for (const node of fileNodes) reverse.set(node.path, [])

  for (const edge of edges) {
    if (edge.kind !== 'import') continue
    const from = stripFile(edge.from)
    const to = stripFile(edge.to)
    if (!reverse.has(from) || !reverse.has(to)) continue
    reverse.get(to).push(from)
  }

  for (const [key, list] of reverse) {
    reverse.set(key, [...new Set(list)].sort())
  }

  return reverse
}

export function defaultSeeds(fileNodes, { changedFiles = [], impactSeeds = [] } = {}) {
  const fileSet = new Set(fileNodes.map((node) => node.path))
  const byPath = new Map()

  const add = (path, reason, priority) => {
    if (!fileSet.has(path)) return
    const current = byPath.get(path)
    if (!current || priority < current.priority) byPath.set(path, { path, reason, priority })
  }

  for (const path of changedFiles) add(path, 'changed', 0)
  for (const path of impactSeeds) add(path, 'config', 1)

  const byFanIn = [...fileNodes].sort(
    (a, b) => (b.fanIn ?? 0) - (a.fanIn ?? 0) || a.path.localeCompare(b.path)
  )
  for (const node of byFanIn.slice(0, SEED_LIMIT)) add(node.path, 'fan-in', 2)

  return [...byPath.values()]
    .map(({ path, reason }) => ({ path, reason }))
    .sort((a, b) => a.path.localeCompare(b.path))
}

export function computeBlastRadius(fileNodes, edges, { seeds = [] } = {}) {
  const reverse = buildReverseGraph(fileNodes, edges)
  const fileSet = new Set(fileNodes.map((node) => node.path))

  const unique = new Map()
  for (const seed of seeds) {
    if (!seed || !fileSet.has(seed.path)) continue
    if (!unique.has(seed.path)) unique.set(seed.path, seed.reason)
  }

  const results = []
  for (const [path, reason] of [...unique.entries()].sort((a, b) => a[0].localeCompare(b[0]))) {
    const direct = reverse.get(path) ?? []
    const visited = new Set()
    const queue = [...direct]
    let cursor = 0

    while (cursor < queue.length) {
      const current = queue[cursor]
      cursor += 1
      if (visited.has(current)) continue
      visited.add(current)
      for (const dependent of reverse.get(current) ?? []) {
        if (!visited.has(dependent)) queue.push(dependent)
      }
    }

    visited.delete(path)
    const dependents = [...visited].sort()
    results.push({
      path,
      reason,
      direct: direct.length,
      transitive: dependents.length,
      dependents: dependents.slice(0, DEPENDENT_LIMIT)
    })
  }

  return results
}
