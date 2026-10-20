// SPDX-License-Identifier: AGPL-3.0-only

import { existsSync, mkdirSync, readFileSync, renameSync, rmSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import {
  renderCommunityGraph,
  renderCycleGraph,
  renderImportGraph,
  renderLayerGraph
} from '../render/mermaid.js'
import { renderUml } from '../render/uml.js'
import { renderHumanHtml } from './html.js'
import { renderInteractiveHtml } from './interactive.js'

export const HUMAN_DEFAULTS = {
  top: 20,
  maxClasses: 20,
  maxNodes: 30,
  maxCommunities: 6
}

function readJson(path) {
  return JSON.parse(readFileSync(path, 'utf8'))
}

function readJsonOptional(path) {
  if (!existsSync(path)) return null
  try {
    return readJson(path)
  } catch {
    return null
  }
}

function stripFile(id) {
  return String(id).replace(/^file:/, '')
}

function formatNumber(value) {
  return String(value ?? 0).replace(/\B(?=(\d{3})+(?!\d))/g, '.')
}

function formatScore(value) {
  return Number(value ?? 0).toFixed(4)
}

function formatPercent(value) {
  return `${(Number(value ?? 0) * 100).toFixed(1)}%`
}

function table(headers, rows) {
  const lines = [`| ${headers.join(' | ')} |`, `| ${headers.map(() => '---').join(' | ')} |`]
  for (const row of rows) lines.push(`| ${row.join(' | ')} |`)
  return lines
}

function mermaidBlock(source) {
  if (!source || source.trim() === '') return []
  return ['```mermaid', source.trimEnd(), '```']
}

function normalizeLimit(value, fallback, max) {
  const number = Number(value)
  if (!Number.isInteger(number) || number <= 0) return fallback
  return Math.min(number, max)
}

export function normalizeHumanLimits(options = {}) {
  return {
    top: normalizeLimit(options.top, HUMAN_DEFAULTS.top, 200),
    maxClasses: normalizeLimit(options.maxClasses, HUMAN_DEFAULTS.maxClasses, 200),
    maxNodes: normalizeLimit(options.maxNodes, HUMAN_DEFAULTS.maxNodes, 200),
    maxCommunities: normalizeLimit(options.maxCommunities, HUMAN_DEFAULTS.maxCommunities, 50)
  }
}

function loadModel(outputDirAbs) {
  const manifestPath = join(outputDirAbs, 'manifest.json')
  const graphPath = join(outputDirAbs, 'graph.json')

  if (!existsSync(manifestPath) || !existsSync(graphPath)) {
    throw new Error(
      `no existe un paquete de Writer en ${outputDirAbs}; ejecutá "ancleto-writer build" primero`
    )
  }

  const manifest = readJson(manifestPath)
  if (manifest?.schemaVersion !== 1) {
    throw new Error(`manifest incompatible: schemaVersion ${manifest?.schemaVersion ?? 'desconocido'}`)
  }

  const graph = readJson(graphPath)
  const facts = {
    godNodes: readJsonOptional(join(outputDirAbs, 'facts', 'god-nodes.json'))?.godNodes ?? [],
    hotspots: readJsonOptional(join(outputDirAbs, 'facts', 'hotspots.json'))?.hotspots ?? [],
    bridges: readJsonOptional(join(outputDirAbs, 'facts', 'bridges.json'))?.bridges ?? [],
    communities:
      readJsonOptional(join(outputDirAbs, 'facts', 'communities.json'))?.communities ?? [],
    cycles: readJsonOptional(join(outputDirAbs, 'facts', 'cycles.json')) ?? {
      cycles: [],
      selfLoops: []
    },
    layers: readJsonOptional(join(outputDirAbs, 'facts', 'layers.json')) ?? {
      layers: {},
      violations: []
    },
    deadCode: readJsonOptional(join(outputDirAbs, 'facts', 'dead-code.json')) ?? {
      orphanFiles: [],
      excluded: [],
      dynamicImports: false
    },
    unresolved: readJsonOptional(join(outputDirAbs, 'facts', 'unresolved.json'))?.unresolved ?? [],
    unsupported: readJsonOptional(join(outputDirAbs, 'facts', 'unsupported.json')) ?? {
      unsupported: [],
      totals: { files: 0, languages: 0 }
    },
    docCoverage: readJsonOptional(join(outputDirAbs, 'facts', 'doc-coverage.json')) ?? {
      files: [],
      totals: { documented: 0, total: 0, ratio: 0 }
    }
  }

  return { manifest, graph, facts }
}

function languageStats(graph) {
  const stats = new Map()
  for (const node of graph.nodes) {
    if (node.kind !== 'file') continue
    const current = stats.get(node.lang) ?? {
      lang: node.lang,
      files: 0,
      lines: 0,
      symbols: 0,
      bytes: 0
    }
    current.files += 1
    current.lines += node.lines ?? 0
    current.symbols += node.symbolCount ?? 0
    current.bytes += node.size ?? 0
    stats.set(node.lang, current)
  }
  return [...stats.values()].sort(
    (a, b) => b.files - a.files || a.lang.localeCompare(b.lang)
  )
}

function unresolvedByReason(entries) {
  const byReason = new Map()
  for (const entry of entries) {
    const reason = entry.reason ?? 'unknown'
    const current = byReason.get(reason) ?? { reason, count: 0, samples: [] }
    current.count += 1
    if (current.samples.length < 3) current.samples.push(entry.path)
    byReason.set(reason, current)
  }
  return [...byReason.values()].sort(
    (a, b) => b.count - a.count || a.reason.localeCompare(b.reason)
  )
}

function buildOverview(model, limits) {
  const { graph, manifest, facts } = model
  const languages = languageStats(graph)
  const communities = [...facts.communities]
    .sort((a, b) => b.size - a.size || a.id.localeCompare(b.id))
    .slice(0, limits.top)
  const cycles = [...facts.cycles.cycles].sort(
    (a, b) => b.size - a.size || a.files.join('|').localeCompare(b.files.join('|'))
  )
  const orphans = [...facts.deadCode.orphanFiles].sort((a, b) => a.path.localeCompare(b.path))
  const unresolved = unresolvedByReason(facts.unresolved)
  const coverage = facts.docCoverage.totals ?? { documented: 0, total: 0, ratio: 0 }

  const body = [
    '# Writer — Overview',
    '',
    '> Vista humana derivada del paquete de agentes. Para el detalle completo usá',
    '> `agent/ARCHITECTURE.md`, `agent/SYMBOLS.md` y `graph.json`.',
    '',
    '## Resumen',
    '',
    ...table(
      ['Métrica', 'Valor'],
      [
        ['Archivos', formatNumber(graph.stats.files)],
        ['Símbolos', formatNumber(graph.stats.symbols)],
        ['Aristas', formatNumber(graph.stats.edges)],
        ['Lenguajes', formatNumber(languages.length)],
        ['Comunidades', formatNumber(facts.communities.length)],
        ['Ciclos', formatNumber(cycles.length)],
        ['Candidatos a huérfanos', formatNumber(orphans.length)],
        ['Imports no resueltos', formatNumber(facts.unresolved.length)],
        ['Lenguajes no soportados', formatNumber(facts.unsupported.totals?.files ?? 0)],
        ['Writer', String(manifest.writerVersion)],
        ['Schema', String(manifest.schemaVersion)]
      ]
    ),
    '',
    '## Lenguajes',
    '',
    ...table(
      ['Lenguaje', 'Archivos', 'Líneas', 'Símbolos'],
      languages
        .slice(0, limits.top)
        .map((entry) => [
          `\`${entry.lang}\``,
          formatNumber(entry.files),
          formatNumber(entry.lines),
          formatNumber(entry.symbols)
        ])
    ),
    '',
    '## Top god nodes',
    ''
  ]

  if (facts.godNodes.length === 0) {
    body.push('- Sin god nodes.', '')
  } else {
    body.push(
      ...table(
        ['Archivo', 'Score', 'Fan-in', 'Símbolos'],
        facts.godNodes
          .slice(0, limits.top)
          .map((entry) => [
            `\`${entry.path}\``,
            formatScore(entry.score),
            formatNumber(entry.fanIn),
            formatNumber(entry.symbols)
          ])
      ),
      ''
    )
  }

  body.push('## Hotspots', '')
  if (facts.hotspots.length === 0) {
    body.push('- Sin hotspots.', '')
  } else {
    body.push(
      ...table(
        ['Archivo', 'Score', 'Fan-in', 'Fan-out'],
        facts.hotspots
          .slice(0, limits.top)
          .map((entry) => [
            `\`${entry.path}\``,
            formatScore(entry.score),
            formatNumber(entry.fanIn),
            formatNumber(entry.fanOut)
          ])
      ),
      ''
    )
  }

  body.push('## Comunidades principales', '')
  if (communities.length === 0) {
    body.push('- Sin comunidades.', '')
  } else {
    body.push(
      ...table(
        ['Comunidad', 'Archivos', 'Cohesión'],
        communities.map((entry) => [
          entry.id,
          formatNumber(entry.size),
          Number(entry.cohesion ?? 0).toFixed(2)
        ])
      ),
      ''
    )
  }

  body.push('## Ciclos', '')
  if (cycles.length === 0) {
    body.push('- Sin ciclos de imports.', '')
  } else {
    for (const cycle of cycles.slice(0, limits.top)) {
      const sample = cycle.files.slice(0, 4).map((file) => `\`${stripFile(file)}\``).join(' → ')
      body.push(`- ${cycle.size} archivos: ${sample}${cycle.files.length > 4 ? ' → …' : ''}`)
    }
    body.push('')
  }

  body.push('## Archivos huérfanos', '')
  if (orphans.length === 0) {
    body.push('- Sin candidatos a huérfanos.', '')
  } else {
    body.push(
      `Hay ${formatNumber(orphans.length)} candidatos. Los primeros ${Math.min(limits.top, orphans.length)}:`,
      ''
    )
    for (const orphan of orphans.slice(0, limits.top)) {
      body.push(`- \`${orphan.path}\` — ${orphan.confidence}`)
    }
    body.push('')
  }

  body.push('## Imports no resueltos', '')
  if (unresolved.length === 0) {
    body.push('- Sin imports no resueltos.', '')
  } else {
    body.push(
      ...table(
        ['Motivo', 'Cantidad'],
        unresolved.map((entry) => [entry.reason, formatNumber(entry.count)])
      ),
      ''
    )
    for (const entry of unresolved.slice(0, 5)) {
      body.push(`- \`${entry.reason}\`: ${entry.samples.map((path) => `\`${path}\``).join(', ')}`)
    }
    body.push('')
  }

  body.push('## Lenguajes no soportados', '')
  const unsupported = facts.unsupported.unsupported ?? []
  if (unsupported.length === 0) {
    body.push('- Sin archivos de lenguajes no soportados.', '')
  } else {
    body.push(
      ...table(
        ['Lenguaje', 'Extensión', 'Archivos'],
        unsupported.map((entry) => [
          entry.language,
          entry.extension,
          formatNumber(entry.count)
        ])
      ),
      ''
    )
  }

  body.push('## Cobertura de documentación', '')
  if ((coverage.total ?? 0) === 0) {
    body.push('- Sin símbolos para medir.', '')
  } else {
    body.push(
      `- ${formatNumber(coverage.documented)}/${formatNumber(coverage.total)} ` +
        `(${formatPercent(coverage.ratio)})`,
      ''
    )
    const low = [...(facts.docCoverage.files ?? [])]
      .filter((entry) => (entry.total ?? 0) > 0)
      .sort((a, b) => a.ratio - b.ratio || a.path.localeCompare(b.path))
      .slice(0, 5)
    for (const entry of low) {
      body.push(`- \`${entry.path}\`: ${formatPercent(entry.ratio)}`)
    }
    body.push('')
  }

  body.push('## Conexiones inesperadas', '')
  if (facts.bridges.length === 0) {
    body.push('- Sin conexiones entre comunidades.', '')
  } else {
    for (const bridge of facts.bridges.slice(0, limits.top)) {
      body.push(
        `- \`${bridge.from}\` (${bridge.fromCommunity}) → \`${bridge.to}\` ` +
          `(${bridge.toCommunity}) — ${formatScore(bridge.score)}`
      )
    }
    body.push('')
  }

  body.push('## Próximos pasos', '')
  const suggestions = []
  if (cycles.length > 0) suggestions.push('revisar los ciclos principales y decidir si son seams o deuda.')
  if (facts.unresolved.length > 0) suggestions.push('resolver o aislar los imports no resueltos.')
  if (orphans.length > 0) suggestions.push('validar los candidatos a huérfanos antes de borrar código.')
  if ((coverage.total ?? 0) > 0 && (coverage.ratio ?? 0) < 0.5) suggestions.push('subir la cobertura de documentación en los módulos centrales.')
  if (unsupported.length > 0) suggestions.push('evaluar el language pack para los lenguajes no soportados.')
  if (suggestions.length === 0) suggestions.push('sin alertas estructurales: usar esta vista para orientar el próximo cambio.')
  for (const suggestion of suggestions) body.push(`- ${suggestion}`)
  body.push('')

  return `${body.join('\n')}\n`
}

function selectClasses(graph, maxClasses) {
  const files = new Map(
    graph.nodes.filter((node) => node.kind === 'file').map((node) => [node.path, node])
  )
  const classes = graph.nodes.filter(
    (node) =>
      node.kind === 'symbol' && (node.symbolKind === 'class' || node.symbolKind === 'interface')
  )
  return classes
    .map((symbol) => {
      const file = files.get(symbol.path)
      const score =
        Number(file?.pageRank ?? 0) * 100000 +
        Number(file?.fanIn ?? 0) * 10 +
        (symbol.exported ? 1 : 0)
      return { symbol, score }
    })
    .sort(
      (a, b) =>
        b.score - a.score ||
        a.symbol.path.localeCompare(b.symbol.path) ||
        a.symbol.line - b.symbol.line
    )
    .slice(0, maxClasses)
    .map((entry) => entry.symbol)
}

function compactUml(graph, maxClasses) {
  const selected = selectClasses(graph, maxClasses)
  if (selected.length === 0) return ''

  const ids = new Set(selected.map((symbol) => symbol.id))
  const owners = new Set(selected.map((symbol) => `${symbol.path}#${symbol.name}`))
  const nodes = graph.nodes.filter(
    (node) =>
      ids.has(node.id) ||
      (node.kind === 'symbol' &&
        node.symbolKind === 'method' &&
        owners.has(`${node.path}#${node.owner}`))
  )
  const edges = graph.edges.filter(
    (edge) => edge.kind === 'inherits' && ids.has(edge.from) && ids.has(edge.to)
  )

  return renderUml({ ...graph, nodes, edges }, { maxClasses: selected.length }).join('\n\n')
}

function buildArchitecture(model, limits) {
  const { graph, facts } = model
  const layers = facts.layers.layers ?? {}
  const communities = [...facts.communities]
    .sort((a, b) => b.size - a.size || a.id.localeCompare(b.id))
    .slice(0, limits.maxCommunities)
  const cycles = [...facts.cycles.cycles].sort(
    (a, b) => b.size - a.size || a.files.join('|').localeCompare(b.files.join('|'))
  )
  const body = [
    '# Writer — Architecture',
    '',
    '> Diagramas acotados para lectura humana. El detalle completo está en `agent/ARCHITECTURE.md`.',
    ''
  ]

  body.push('## Capas', '')
  const layerEntries = Object.entries(layers).sort((a, b) => a[0].localeCompare(b[0]))
  if (layerEntries.length === 0) {
    body.push('- Sin capas clasificadas.', '')
  } else {
    const counts = new Map()
    for (const layer of Object.values(layers)) {
      counts.set(layer, (counts.get(layer) ?? 0) + 1)
    }
    body.push(
      ...table(
        ['Capa', 'Archivos'],
        [...counts.entries()]
          .sort((a, b) => a[0].localeCompare(b[0]))
          .map(([layer, count]) => [layer, formatNumber(count)])
      ),
      ''
    )
    body.push(...mermaidBlock(renderLayerGraph(layers, graph.edges)), '')
  }

  body.push('## Comunidades principales', '')
  if (communities.length === 0) {
    body.push('- Sin comunidades.', '')
  } else {
    body.push(
      ...table(
        ['Comunidad', 'Archivos', 'Cohesión'],
        communities.map((entry) => [
          entry.id,
          formatNumber(entry.size),
          Number(entry.cohesion ?? 0).toFixed(2)
        ])
      ),
      ''
    )
    const communityGraph = renderCommunityGraph(graph, communities, {
      maxCommunities: limits.maxCommunities,
      maxFiles: 5
    })
    body.push(...mermaidBlock(communityGraph), '')
  }

  body.push('## UML', '')
  const uml = compactUml(graph, limits.maxClasses)
  if (!uml) {
    body.push('- Sin clases o interfaces para mostrar.', '')
  } else {
    body.push(
      `Selección de hasta ${limits.maxClasses} clases/interfaces por PageRank del archivo, fan-in y exportación.`,
      '',
      ...mermaidBlock(uml),
      ''
    )
  }

  body.push('## Imports principales', '')
  body.push(
    `Top ${limits.maxNodes} archivos por fan-in; solo se dibujan aristas entre ellos.`,
    '',
    ...mermaidBlock(renderImportGraph(graph, { maxNodes: limits.maxNodes })),
    ''
  )

  body.push('## Ciclos', '')
  if (cycles.length === 0) {
    body.push('- Sin ciclos de imports.', '')
  } else if (cycles[0].size > limits.maxNodes) {
    body.push(
      `El ciclo mayor tiene ${cycles[0].size} archivos y supera el límite de ${limits.maxNodes}; ` +
        'se muestra un resumen en lugar del diagrama.',
      ''
    )
    for (const cycle of cycles.slice(0, limits.top)) {
      body.push(
        `- ${cycle.size} archivos: ${cycle.files
          .slice(0, 5)
          .map((file) => `\`${stripFile(file)}\``)
          .join(' → ')}${cycle.files.length > 5 ? ' → …' : ''}`
      )
    }
    body.push('')
  } else {
    body.push(
      `Ciclo mayor: ${cycles[0].size} archivos.`,
      '',
      ...mermaidBlock(renderCycleGraph(cycles[0], graph)),
      ''
    )
  }

  body.push('## Límites usados', '')
  body.push(
    `- top: ${limits.top}`,
    `- maxClasses: ${limits.maxClasses}`,
    `- maxNodes: ${limits.maxNodes}`,
    `- maxCommunities: ${limits.maxCommunities}`,
    ''
  )

  return `${body.join('\n')}\n`
}

function buildData(model, limits) {
  const { graph, manifest, facts } = model
  const languages = languageStats(graph)
  const communities = [...facts.communities]
    .sort((a, b) => b.size - a.size || a.id.localeCompare(b.id))
    .slice(0, limits.top)
    .map((entry) => ({
      id: entry.id,
      size: entry.size,
      cohesion: entry.cohesion,
      files: [...entry.files].sort()
    }))
  const cycles = [...facts.cycles.cycles]
    .sort((a, b) => b.size - a.size || a.files.join('|').localeCompare(b.files.join('|')))
    .map((entry) => ({ size: entry.size, files: [...entry.files].sort() }))
  const orphans = [...facts.deadCode.orphanFiles].sort((a, b) => a.path.localeCompare(b.path))
  const unresolved = unresolvedByReason(facts.unresolved)
  const coverage = facts.docCoverage.totals ?? { documented: 0, total: 0, ratio: 0 }
  const lowCoverage = [...(facts.docCoverage.files ?? [])]
    .filter((entry) => (entry.total ?? 0) > 0)
    .sort((a, b) => a.ratio - b.ratio || a.path.localeCompare(b.path))
    .slice(0, limits.top)
    .map((entry) => ({
      path: entry.path,
      documented: entry.documented,
      total: entry.total,
      ratio: entry.ratio
    }))

  return {
    schemaVersion: 1,
    package: {
      writerVersion: manifest.writerVersion,
      schemaVersion: manifest.schemaVersion,
      fingerprint: manifest.fingerprint,
      stats: manifest.stats
    },
    totals: {
      files: graph.stats.files,
      symbols: graph.stats.symbols,
      edges: graph.stats.edges,
      languages: languages.length,
      communities: facts.communities.length,
      cycles: cycles.length,
      orphanFiles: orphans.length,
      unresolved: facts.unresolved.length,
      unsupported: facts.unsupported.totals?.files ?? 0
    },
    languages,
    godNodes: facts.godNodes.slice(0, limits.top),
    hotspots: facts.hotspots.slice(0, limits.top),
    bridges: facts.bridges.slice(0, limits.top),
    communities,
    cycles,
    orphans: {
      total: orphans.length,
      sample: orphans.slice(0, limits.top)
    },
    unresolved: {
      total: facts.unresolved.length,
      byReason: unresolved,
      sample: facts.unresolved.slice(0, limits.top)
    },
    unsupported: {
      totals: facts.unsupported.totals,
      entries: facts.unsupported.unsupported ?? []
    },
    docCoverage: {
      totals: coverage,
      lowCoverage
    },
    limits
  }
}

export function runHuman({ outputDirAbs, ...options } = {}) {
  if (!outputDirAbs) throw new Error('outputDirAbs es requerido')

  const limits = normalizeHumanLimits(options)
  if (options.interactive && options.maxCommunities === undefined) {
    limits.maxCommunities = 20
  }
  const model = loadModel(outputDirAbs)
  const files = {
    'OVERVIEW.md': buildOverview(model, limits),
    'ARCHITECTURE.md': buildArchitecture(model, limits),
    'data.json': `${JSON.stringify(buildData(model, limits), null, 2)}\n`,
    'index.html': renderHumanHtml(model, limits)
  }
  if (options.interactive) {
    files['interactive.html'] = renderInteractiveHtml(model, limits)
  }

  const humanDir = join(outputDirAbs, 'human')
  const tempDir = join(outputDirAbs, '.human.tmp')
  rmSync(tempDir, { recursive: true, force: true })
  mkdirSync(tempDir, { recursive: true })
  for (const [name, content] of Object.entries(files)) {
    writeFileSync(join(tempDir, name), content)
  }
  rmSync(humanDir, { recursive: true, force: true })
  renameSync(tempDir, humanDir)

  return {
    humanDir,
    files: Object.keys(files).sort(),
    limits,
    data: JSON.parse(files['data.json'])
  }
}
