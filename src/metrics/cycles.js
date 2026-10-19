// SPDX-License-Identifier: AGPL-3.0-only
// Derived from ReadMenator readmenator/_analyzer.py (commit dac48f868722620f0d01dac0d33102c5a514c03c),
// modified 2026-10-19 by AncletoCEO.

function buildAdjacency(nodeIds, edges) {
  const index = new Map(nodeIds.map((id, position) => [id, position]))
  const adjacency = nodeIds.map(() => [])

  for (const edge of edges) {
    if (edge.kind !== 'import') continue
    const from = index.get(edge.from)
    const to = index.get(edge.to)
    if (from === undefined || to === undefined) continue
    adjacency[from].push(to)
  }

  return adjacency.map((targets) => [...new Set(targets)].sort((a, b) => a - b))
}

export function findCycles(fileNodes, edges) {
  const nodeIds = fileNodes.map((node) => node.id).sort()
  const adjacency = buildAdjacency(nodeIds, edges)
  const size = nodeIds.length

  const index = new Array(size).fill(-1)
  const low = new Array(size).fill(0)
  const onStack = new Array(size).fill(false)
  const stack = []
  const components = []
  let counter = 0

  for (let root = 0; root < size; root += 1) {
    if (index[root] !== -1) continue

    const work = [{ node: root, next: 0 }]
    while (work.length > 0) {
      const frame = work[work.length - 1]
      const current = frame.node

      if (frame.next === 0) {
        index[current] = counter
        low[current] = counter
        counter += 1
        stack.push(current)
        onStack[current] = true
      }

      if (frame.next < adjacency[current].length) {
        const target = adjacency[current][frame.next]
        frame.next += 1
        if (index[target] === -1) {
          work.push({ node: target, next: 0 })
        } else if (onStack[target]) {
          low[current] = Math.min(low[current], index[target])
        }
        continue
      }

      if (low[current] === index[current]) {
        const component = []
        while (stack.length > 0) {
          const popped = stack.pop()
          onStack[popped] = false
          component.push(popped)
          if (popped === current) break
        }
        components.push(component)
      }

      work.pop()
      if (work.length > 0) {
        const parent = work[work.length - 1].node
        low[parent] = Math.min(low[parent], low[current])
      }
    }
  }

  const cycles = []
  const selfLoops = []

  for (const component of components) {
    if (component.length > 1) {
      cycles.push({
        size: component.length,
        files: component.map((position) => nodeIds[position]).sort()
      })
    } else {
      const position = component[0]
      if (adjacency[position].includes(position)) selfLoops.push(nodeIds[position])
    }
  }

  cycles.sort((a, b) => b.size - a.size || a.files[0].localeCompare(b.files[0]))
  selfLoops.sort()

  return { cycles, selfLoops }
}
