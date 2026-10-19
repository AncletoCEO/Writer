// SPDX-License-Identifier: AGPL-3.0-only
// Derived from ReadMenator readmenator/_mermaid.py (commit dac48f868722620f0d01dac0d33102c5a514c03c),
// modified 2026-10-19 by AncletoCEO.

function label(value) {
  return String(value).replace(/"/g, "'").replace(/\n/g, ' ')
}

function stripFile(id) {
  return String(id).replace(/^file:/, '')
}

function buildNodeMap(paths) {
  const map = new Map()
  paths.forEach((path, index) => map.set(path, `n${index}`))
  return map
}

export function renderImportGraph(graph, { maxNodes = 80 } = {}) {
  const files = graph.nodes
    .filter((node) => node.kind === 'file')
    .sort((a, b) => b.fanIn - a.fanIn || a.path.localeCompare(b.path))
    .slice(0, maxNodes)

  const nodes = buildNodeMap(files.map((file) => file.path))
  const lines = ['flowchart LR']

  for (const file of files) {
    lines.push(`  ${nodes.get(file.path)}["${label(file.path)}"]`)
  }

  for (const edge of graph.edges) {
    if (edge.kind !== 'import') continue
    const from = stripFile(edge.from)
    const to = stripFile(edge.to)
    if (!nodes.has(from) || !nodes.has(to)) continue
    lines.push(`  ${nodes.get(from)} --> ${nodes.get(to)}`)
  }

  return `${lines.join('\n')}\n`
}

export function renderCommunityGraph(graph, communities, { maxCommunities = 10, maxFiles = 20 } = {}) {
  const selected = (communities ?? []).filter((community) => community.size > 1).slice(0, maxCommunities)
  if (selected.length === 0) return ''

  const nodes = new Map()
  let counter = 0
  const lines = ['flowchart LR']

  for (const community of selected) {
    lines.push(`  subgraph ${community.id}["${community.id} (${community.size})"]`)
    for (const path of community.files.slice(0, maxFiles)) {
      const id = `n${counter}`
      counter += 1
      nodes.set(path, id)
      lines.push(`    ${id}["${label(path)}"]`)
    }
    if (community.files.length > maxFiles) {
      lines.push(`    ${community.id}_more["+${community.files.length - maxFiles} más"]`)
    }
    lines.push('  end')
  }

  for (const edge of graph.edges) {
    if (edge.kind !== 'import') continue
    const from = stripFile(edge.from)
    const to = stripFile(edge.to)
    if (!nodes.has(from) || !nodes.has(to)) continue
    lines.push(`  ${nodes.get(from)} --> ${nodes.get(to)}`)
  }

  return `${lines.join('\n')}\n`
}

export function renderCycleGraph(cycle, graph) {
  const paths = [...cycle.files].map(stripFile).sort()
  const nodes = buildNodeMap(paths)
  const lines = ['flowchart LR']

  for (const path of paths) {
    lines.push(`  ${nodes.get(path)}["${label(path)}"]`)
  }
  for (const edge of graph.edges) {
    if (edge.kind !== 'import') continue
    const from = stripFile(edge.from)
    const to = stripFile(edge.to)
    if (!nodes.has(from) || !nodes.has(to)) continue
    lines.push(`  ${nodes.get(from)} --> ${nodes.get(to)}`)
  }

  return `${lines.join('\n')}\n`
}

export function renderLayerGraph(layers, edges) {
  const counts = new Map()
  for (const layer of Object.values(layers)) {
    counts.set(layer, (counts.get(layer) ?? 0) + 1)
  }

  const names = [...counts.keys()].sort()
  const nodes = new Map(names.map((name, index) => [name, `l${index}`]))
  const lines = ['flowchart TB']

  for (const name of names) {
    lines.push(`  ${nodes.get(name)}["${label(name)} (${counts.get(name)})"]`)
  }

  const transitions = new Map()
  for (const edge of edges) {
    if (edge.kind !== 'import') continue
    const from = layers[stripFile(edge.from)]
    const to = layers[stripFile(edge.to)]
    if (!from || !to || from === to) continue
    const key = `${from}|${to}`
    transitions.set(key, (transitions.get(key) ?? 0) + 1)
  }

  for (const [key, count] of [...transitions.entries()].sort()) {
    const [from, to] = key.split('|')
    if (!nodes.has(from) || !nodes.has(to)) continue
    lines.push(`  ${nodes.get(from)} -->|${count}| ${nodes.get(to)}`)
  }

  return `${lines.join('\n')}\n`
}
