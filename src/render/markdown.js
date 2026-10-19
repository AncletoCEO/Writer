// SPDX-License-Identifier: AGPL-3.0-only
// Derived from ReadMenator readmenator/_documentation.py (commit dac48f868722620f0d01dac0d33102c5a514c03c),
// modified 2026-10-19 by AncletoCEO.

import {
  renderCommunityGraph,
  renderCycleGraph,
  renderImportGraph,
  renderLayerGraph
} from './mermaid.js'

const PAGE_LIMIT = 500

function chunkLines(lines, size) {
  const chunks = []
  let current = []
  let inFence = false

  for (const line of lines) {
    if (line.startsWith('```')) inFence = !inFence
    current.push(line)
    if (current.length >= size && !inFence) {
      chunks.push(current)
      current = []
    }
  }

  if (current.length > 0) chunks.push(current)
  if (chunks.length === 0) chunks.push([])
  return chunks
}

function paginate(baseName, title, bodyLines) {
  const chunks = chunkLines(bodyLines, PAGE_LIMIT - 6)
  const pages = {}

  chunks.forEach((chunk, index) => {
    const page = index + 1
    const name = page === 1 ? `${baseName}.md` : `${baseName}_p${page}.md`
    const lines = [`# ${title}${page > 1 ? ` (página ${page})` : ''}`, '']

    if (page > 1) {
      const previous = page === 2 ? `${baseName}.md` : `${baseName}_p${page - 1}.md`
      lines.push(`[← Página anterior](./${previous})`, '')
    }

    lines.push(...chunk)

    if (page < chunks.length) {
      lines.push('', `[Página siguiente →](./${baseName}_p${page + 1}.md)`)
    }

    pages[name] = `${lines.join('\n')}\n`
  })

  return pages
}

function stripFile(id) {
  return String(id).replace(/^file:/, '')
}

function layerCounts(layers) {
  const counts = new Map()
  for (const layer of Object.values(layers)) {
    counts.set(layer, (counts.get(layer) ?? 0) + 1)
  }
  return [...counts.entries()].sort((a, b) => a[0].localeCompare(b[0]))
}

export function renderIndex(graph, godNodes = []) {
  const body = [
    `Total: ${graph.stats.files} archivos, ${graph.stats.symbols} símbolos, ${graph.stats.edges} aristas.`,
    ''
  ]

  if (godNodes.length > 0) {
    body.push('## God nodes', '')
    for (const node of godNodes.slice(0, 10)) {
      body.push(`- \`${node.path}\` — score ${node.score.toFixed(4)}`)
    }
    body.push('')
  }

  for (const file of graph.nodes.filter((node) => node.kind === 'file')) {
    body.push(
      `- \`${file.path}\` — ${file.layer} · ${file.symbolCount} símbolos · used by ${file.fanIn}`
    )
  }

  return paginate('INDEX', 'Index', body)
}

export function renderSymbols(graph) {
  const body = []
  const files = new Map()

  for (const node of graph.nodes) {
    if (node.kind !== 'symbol') continue
    if (!files.has(node.path)) files.set(node.path, [])
    files.get(node.path).push(node)
  }

  for (const [path, symbols] of [...files.entries()].sort((a, b) => a[0].localeCompare(b[0]))) {
    body.push(`## ${path}`, '')
    for (const symbol of symbols.sort((a, b) => Number(b.exported) - Number(a.exported) || a.line - b.line)) {
      const exported = symbol.exported ? ' · export' : ''
      body.push(
        `- \`${symbol.name}\` (${symbol.symbolKind}, línea ${symbol.line})${exported} — ${symbol.signature ?? ''}`
      )
    }
    body.push('')
  }

  return paginate('SYMBOLS', 'Symbols', body)
}

export function renderGotchas({ metrics, projectRules = null, unresolved = [] }) {
  const body = []

  body.push('## Blast radius', '')
  for (const seed of metrics.blastRadius.slice(0, 10)) {
    body.push(
      `- \`${seed.path}\` (${seed.reason}): ${seed.direct} directos, ${seed.transitive} transitivos`
    )
  }
  if (metrics.blastRadius.length === 0) body.push('- Sin semillas de impacto.')
  body.push('')

  const communities = metrics.communities ?? []
  const multiFileCommunities = communities.filter((community) => community.size > 1)
  body.push('## Comunidades', '')
  if (multiFileCommunities.length === 0) {
    body.push('- Sin comunidades de más de un archivo.')
  } else {
    for (const community of multiFileCommunities.slice(0, 10)) {
      const flags = [
        community.size >= 5 ? 'grande' : null,
        community.cohesion < 0.3 ? 'baja cohesión' : null
      ].filter(Boolean)
      body.push(
        `- ${community.id}: ${community.size} archivos, cohesión ${community.cohesion.toFixed(2)}` +
          (flags.length > 0 ? ` (${flags.join(', ')})` : '')
      )
    }
  }
  body.push('')

  body.push('## Ciclos', '')
  if (metrics.cycles.cycles.length === 0) body.push('- Sin ciclos de imports.')
  for (const cycle of metrics.cycles.cycles) {
    body.push(`- Ciclo de ${cycle.size}: ${cycle.files.map(stripFile).join(' → ')}`)
  }
  for (const loop of metrics.cycles.selfLoops) body.push(`- Self-loop: \`${stripFile(loop)}\``)
  body.push('')

  body.push('## Hotspots', '')
  for (const hotspot of metrics.hotspots.slice(0, 10)) {
    body.push(`- \`${hotspot.path}\` — score ${hotspot.score.toFixed(4)}`)
  }
  body.push('')

  body.push('## God nodes', '')
  const godNodes = metrics.godNodes ?? []
  if (godNodes.length === 0) body.push('- Sin god nodes.')
  for (const node of godNodes.slice(0, 10)) {
    body.push(
      `- \`${node.path}\` — score ${node.score.toFixed(4)} ` +
        `(fan-in ${node.fanIn}, ${node.exportedSymbols} símbolos exportados)`
    )
  }
  body.push('')

  body.push('## Violaciones de capa', '')
  if (metrics.layers.violations.length === 0) body.push('- Sin imports upward.')
  for (const violation of metrics.layers.violations) {
    body.push(
      `- \`${violation.from}\` (${violation.fromLayer}) → \`${violation.to}\` (${violation.toLayer})`
    )
  }
  body.push('')

  body.push('## Imports no resueltos', '')
  if (unresolved.length === 0) body.push('- Sin imports no resueltos.')
  for (const entry of unresolved.slice(0, 20)) {
    body.push(
      `- \`${entry.path}\`${entry.specifier ? ` → \`${entry.specifier}\`` : ''} — ${entry.reason}`
    )
  }
  body.push('')

  body.push('## Reglas del proyecto', '')
  if (!projectRules?.available || projectRules.rules.length === 0) {
    body.push('- Sin reglas activas o memoria no disponible.')
  } else {
    for (const rule of projectRules.rules) {
      body.push(`- [${rule.memory_key}] ${rule.content}`)
    }
  }

  return paginate('GOTCHAS', 'Gotchas', body)
}

export function renderArchitecture({ graph, metrics }) {
  const body = []

  body.push('## Capas', '')
  for (const [layer, count] of layerCounts(metrics.layers.layers)) {
    body.push(`- ${layer}: ${count}`)
  }
  body.push('')

  const communities = metrics.communities ?? []
  const multiFileCommunities = communities.filter((community) => community.size > 1)

  body.push('## Comunidades', '')
  if (multiFileCommunities.length === 0) {
    body.push('- Sin comunidades de más de un archivo.', '')
  } else {
    for (const community of multiFileCommunities.slice(0, 10)) {
      body.push(
        `- ${community.id} (${community.size} archivos, cohesión ${community.cohesion.toFixed(2)}): ` +
          `${community.files.slice(0, 8).map(stripFile).join(', ')}` +
          (community.files.length > 8 ? ', …' : '')
      )
    }
    body.push('')
    const communityGraph = renderCommunityGraph(graph, communities)
    if (communityGraph) {
      body.push('```mermaid')
      body.push(communityGraph.trimEnd())
      body.push('```', '')
    }
  }

  body.push('## Grafo de imports', '')
  body.push('```mermaid')
  body.push(renderImportGraph(graph).trimEnd())
  body.push('```', '')

  body.push('## Ciclos', '')
  if (metrics.cycles.cycles.length === 0) {
    body.push('- Sin ciclos de imports.', '')
  } else {
    for (const cycle of metrics.cycles.cycles.slice(0, 5)) {
      body.push('```mermaid')
      body.push(renderCycleGraph(cycle, graph).trimEnd())
      body.push('```', '')
    }
  }

  body.push('## Capas (Mermaid)', '')
  body.push('```mermaid')
  body.push(renderLayerGraph(metrics.layers.layers, graph.edges).trimEnd())
  body.push('```')

  return paginate('ARCHITECTURE', 'Architecture', body)
}

export function renderDocuments({ graph, metrics, projectRules = null, unresolved = [] }) {
  const documents = {
    ...renderIndex(graph, metrics.godNodes ?? []),
    ...renderSymbols(graph),
    ...renderGotchas({ metrics, projectRules, unresolved }),
    ...renderArchitecture({ graph, metrics })
  }

  return Object.fromEntries(
    Object.entries(documents).map(([name, content]) => [`agent/${name}`, content])
  )
}
