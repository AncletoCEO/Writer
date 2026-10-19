// SPDX-License-Identifier: AGPL-3.0-only
// Derived from ReadMenator readmenator/_analyzer.py (commit dac48f868722620f0d01dac0d33102c5a514c03c),
// modified 2026-10-19 by AncletoCEO.

const DEFAULT_MAX_ITERATIONS = 50

function buildUndirectedAdjacency(ids, edges) {
  const index = new Map(ids.map((id, position) => [id, position]))
  const adjacency = ids.map(() => new Set())

  for (const edge of edges) {
    if (edge.kind !== 'import') continue
    const from = index.get(edge.from)
    const to = index.get(edge.to)
    if (from === undefined || to === undefined || from === to) continue
    adjacency[from].add(to)
    adjacency[to].add(from)
  }

  return {
    index,
    adjacency: adjacency.map((neighbors) => [...neighbors].sort((a, b) => a - b))
  }
}

function groupByCommunity(labels) {
  const groups = new Map()
  for (let i = 0; i < labels.length; i += 1) {
    const label = labels[i]
    if (!groups.has(label)) groups.set(label, [])
    groups.get(label).push(i)
  }
  return groups
}

function cohesionFor(files, pairs) {
  const members = new Set(files)
  let internal = 0
  let incident = 0

  for (const [a, b] of pairs) {
    const inA = members.has(a)
    const inB = members.has(b)
    if (inA || inB) incident += 1
    if (inA && inB) internal += 1
  }

  return incident === 0 ? 0 : Number((internal / incident).toFixed(4))
}

function uniquePairs(adjacency) {
  const pairs = []
  for (let i = 0; i < adjacency.length; i += 1) {
    for (const j of adjacency[i]) {
      if (i < j) pairs.push([i, j])
    }
  }
  return pairs
}

export function detectCommunities(fileNodes, edges, options = {}) {
  const enabled = options?.enabled !== false
  const maxIterations =
    Number.isInteger(options?.maxIterations) && options.maxIterations > 0
      ? options.maxIterations
      : DEFAULT_MAX_ITERATIONS

  const ids = fileNodes.map((node) => node.id).sort()
  const paths = new Map(fileNodes.map((node) => [node.id, node.path]))
  const size = ids.length

  if (!enabled || size === 0) {
    return { communities: [], assignments: {} }
  }

  const { adjacency } = buildUndirectedAdjacency(ids, edges)
  const degree = adjacency.map((neighbors) => neighbors.length)
  const twoM = degree.reduce((total, value) => total + value, 0) || 1
  const labels = ids.map((_, position) => position)
  const communityDegree = new Map()

  for (let i = 0; i < size; i += 1) communityDegree.set(i, degree[i])

  for (let iteration = 0; iteration < maxIterations; iteration += 1) {
    let moved = false

    for (let i = 0; i < size; i += 1) {
      const current = labels[i]
      const weight = degree[i]
      if (weight === 0) continue

      communityDegree.set(current, (communityDegree.get(current) ?? 0) - weight)

      const links = new Map()
      for (const neighbor of adjacency[i]) {
        const target = labels[neighbor]
        links.set(target, (links.get(target) ?? 0) + 1)
      }

      let bestCommunity = current
      let bestGain =
        (links.get(current) ?? 0) - ((communityDegree.get(current) ?? 0) * weight) / twoM

      for (const [candidate, edgesToCommunity] of [...links.entries()].sort(
        (a, b) => a[0] - b[0]
      )) {
        const gain =
          edgesToCommunity - ((communityDegree.get(candidate) ?? 0) * weight) / twoM

        if (
          gain > bestGain + 1e-12 ||
          (Math.abs(gain - bestGain) <= 1e-12 && bestGain > 0 && candidate < bestCommunity)
        ) {
          bestGain = gain
          bestCommunity = candidate
        }
      }

      if (bestGain > 1e-12 && bestCommunity !== current) {
        communityDegree.set(bestCommunity, (communityDegree.get(bestCommunity) ?? 0) + weight)
        labels[i] = bestCommunity
        moved = true
      } else {
        communityDegree.set(current, (communityDegree.get(current) ?? 0) + weight)
      }
    }

    if (!moved) break
  }

  const pairs = uniquePairs(adjacency)
  const groups = groupByCommunity(labels)
  const ordered = [...groups.values()].sort(
    (a, b) =>
      b.length - a.length ||
      paths.get(ids[a[0]]).localeCompare(paths.get(ids[b[0]]))
  )

  const assignments = {}
  const communities = ordered.map((members, position) => {
    const id = `c${position + 1}`
    const files = members.map((index) => paths.get(ids[index])).sort()
    for (const file of files) assignments[file] = id
    return {
      id,
      size: files.length,
      cohesion: cohesionFor(members, pairs),
      files
    }
  })

  return { communities, assignments }
}
