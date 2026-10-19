// SPDX-License-Identifier: AGPL-3.0-only

const DEFAULT_MAX_CLASSES = 40

function sanitizeIdentifier(name, used) {
  let base = String(name).replace(/[^A-Za-z0-9_]/g, '_')
  if (!/^[A-Za-z_]/.test(base)) base = `_${base}`
  let identifier = base
  let suffix = 2
  while (used.has(identifier)) {
    identifier = `${base}_${suffix}`
    suffix += 1
  }
  used.add(identifier)
  return identifier
}

function classify(graph) {
  const symbols = graph.nodes.filter((node) => node.kind === 'symbol')
  const classes = symbols
    .filter((node) => node.symbolKind === 'class' || node.symbolKind === 'interface')
    .sort((a, b) => a.path.localeCompare(b.path) || a.line - b.line || a.name.localeCompare(b.name))

  const methods = new Map()
  for (const symbol of symbols) {
    if (symbol.symbolKind !== 'method' || !symbol.owner) continue
    const key = `${symbol.path}#${symbol.owner}`
    if (!methods.has(key)) methods.set(key, [])
    methods.get(key).push(symbol)
  }
  for (const list of methods.values()) {
    list.sort((a, b) => a.line - b.line || a.name.localeCompare(b.name))
  }

  return { classes, methods, symbols: new Map(symbols.map((symbol) => [symbol.id, symbol])) }
}

function renderBlock(classes, methods, symbols, edges, usedIdentifiers) {
  const aliases = new Map()
  for (const symbol of classes) {
    aliases.set(symbol.id, sanitizeIdentifier(symbol.name, usedIdentifiers))
  }

  const lines = ['classDiagram']
  for (const symbol of classes) {
    const alias = aliases.get(symbol.id)
    const members = (methods.get(`${symbol.path}#${symbol.name}`) ?? []).map(
      (method) => `+${method.signature}`
    )
    const uniqueMembers = [...new Set(members)]

    if (symbol.symbolKind === 'interface' || uniqueMembers.length > 0) {
      lines.push(`  class ${alias} {`)
      if (symbol.symbolKind === 'interface') lines.push('    <<interface>>')
      for (const member of uniqueMembers) lines.push(`    ${member}`)
      lines.push('  }')
    } else {
      lines.push(`  class ${alias}`)
    }
  }

  const relations = new Set()
  for (const edge of edges) {
    if (edge.kind !== 'inherits') continue
    const from = symbols.get(edge.from)
    const to = symbols.get(edge.to)
    if (!from || !to || !aliases.has(from.id) || !aliases.has(to.id)) continue
    const fromAlias = aliases.get(from.id)
    const toAlias = aliases.get(to.id)
    relations.add(
      edge.inheritsKind === 'implements'
        ? `${toAlias} <|.. ${fromAlias}`
        : `${toAlias} <|-- ${fromAlias}`
    )
  }
  for (const relation of [...relations].sort()) lines.push(`  ${relation}`)

  return lines.join('\n')
}

export function renderUml(graph, { maxClasses = DEFAULT_MAX_CLASSES } = {}) {
  const { classes, methods, symbols } = classify(graph)
  if (classes.length === 0) return []

  const safeMax =
    Number.isInteger(maxClasses) && maxClasses > 0 ? maxClasses : DEFAULT_MAX_CLASSES
  const usedIdentifiers = new Set()
  const diagrams = []

  for (let start = 0; start < classes.length; start += safeMax) {
    const chunk = classes.slice(start, start + safeMax)
    const chunkIds = new Set(chunk.map((symbol) => symbol.id))
    const chunkEdges = graph.edges.filter(
      (edge) =>
        edge.kind === 'inherits' &&
        chunkIds.has(edge.from) &&
        chunkIds.has(edge.to)
    )
    diagrams.push(renderBlock(chunk, methods, symbols, chunkEdges, usedIdentifiers))
  }

  return diagrams
}
