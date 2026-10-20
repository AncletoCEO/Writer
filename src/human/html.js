// SPDX-License-Identifier: AGPL-3.0-only

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
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

function stripFile(id) {
  return String(id).replace(/^file:/, '')
}

function basename(path) {
  return String(path).split('/').pop()
}

function truncate(value, max) {
  const text = String(value ?? '')
  return text.length <= max ? text : `…${text.slice(-(max - 1))}`
}

function shortLabel(path, max = 24) {
  return truncate(basename(path), max)
}

function languageStats(graph) {
  const stats = new Map()
  for (const node of graph.nodes) {
    if (node.kind !== 'file') continue
    const current = stats.get(node.lang) ?? {
      lang: node.lang,
      files: 0,
      lines: 0,
      symbols: 0
    }
    current.files += 1
    current.lines += node.lines ?? 0
    current.symbols += node.symbolCount ?? 0
    stats.set(node.lang, current)
  }
  return [...stats.values()].sort(
    (a, b) => b.files - a.files || a.lang.localeCompare(b.lang)
  )
}

function selectClasses(graph, maxClasses) {
  const files = new Map(
    graph.nodes.filter((node) => node.kind === 'file').map((node) => [node.path, node])
  )
  return graph.nodes
    .filter(
      (node) =>
        node.kind === 'symbol' && (node.symbolKind === 'class' || node.symbolKind === 'interface')
    )
    .map((symbol) => {
      const file = files.get(symbol.path)
      return {
        symbol,
        score:
          Number(file?.pageRank ?? 0) * 100000 +
          Number(file?.fanIn ?? 0) * 10 +
          (symbol.exported ? 1 : 0)
      }
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

function svg(width, height, title, content) {
  return (
    `<svg viewBox="0 0 ${width} ${height}" role="img" aria-label="${escapeHtml(title)}">` +
    `<title>${escapeHtml(title)}</title>${content}</svg>`
  )
}

function marker(id) {
  return (
    `<defs><marker id="${id}" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">` +
    '<path d="M 0 0 L 10 5 L 0 10 z" fill="#64748b"></path></marker></defs>'
  )
}

function barChart(rows, { title, width = 900, empty = 'Sin datos' } = {}) {
  if (rows.length === 0) return `<p class="muted">${escapeHtml(empty)}</p>`
  const height = rows.length * 30 + 20
  const max = Math.max(1, ...rows.map((row) => row.value))
  let content = ''
  rows.forEach((row, index) => {
    const y = 10 + index * 30
    const barWidth = Math.max(2, (row.value / max) * 520)
    content +=
      `<text x="0" y="${y + 14}" class="svg-label">${escapeHtml(row.label)}</text>` +
      `<rect x="260" y="${y}" width="${barWidth}" height="20" rx="4" class="bar"></rect>` +
      `<text x="${270 + barWidth}" y="${y + 14}" class="svg-value">${escapeHtml(formatNumber(row.value))}` +
      `${row.detail ? ` · ${escapeHtml(row.detail)}` : ''}</text>`
  })
  return svg(width, height, title, content)
}

function circularGraph(paths, edges, { title, markerId, width = 900, height = 620 } = {}) {
  if (paths.length === 0) return '<p class="muted">Sin datos para dibujar.</p>'
  const cx = width / 2
  const cy = height / 2
  const rx = width / 2 - 120
  const ry = height / 2 - 80
  const positions = new Map()

  paths.forEach((path, index) => {
    const angle = (Math.PI * 2 * index) / paths.length - Math.PI / 2
    positions.set(path, {
      x: cx + Math.cos(angle) * rx,
      y: cy + Math.sin(angle) * ry
    })
  })

  const pathSet = new Set(paths)
  let content = marker(markerId)
  for (const edge of edges) {
    const from = stripFile(edge.from)
    const to = stripFile(edge.to)
    if (!pathSet.has(from) || !pathSet.has(to)) continue
    const a = positions.get(from)
    const b = positions.get(to)
    content += `<line x1="${a.x.toFixed(1)}" y1="${a.y.toFixed(1)}" x2="${b.x.toFixed(1)}" y2="${b.y.toFixed(1)}" class="edge" marker-end="url(#${markerId})"></line>`
  }

  for (const path of paths) {
    const point = positions.get(path)
    const label = shortLabel(path, 22)
    content +=
      `<g><title>${escapeHtml(path)}</title>` +
      `<circle cx="${point.x.toFixed(1)}" cy="${point.y.toFixed(1)}" r="6" class="node"></circle>` +
      `<text x="${(point.x + 10).toFixed(1)}" y="${(point.y + 4).toFixed(1)}" class="svg-label">${escapeHtml(label)}</text>` +
      '</g>'
  }

  return svg(width, height, title, content)
}

function umlSvg(classes, methodsByOwner, edges, markerId, maxClasses) {
  if (classes.length === 0) return '<p class="muted">Sin clases o interfaces.</p>'
  const selected = classes.slice(0, maxClasses)
  const ids = new Set(selected.map((symbol) => symbol.id))
  const columns = 3
  const boxWidth = 280
  const boxHeight = 104
  const gap = 22
  const left = 20
  const top = 20
  const rows = Math.ceil(selected.length / columns)
  const width = left * 2 + columns * boxWidth + (columns - 1) * gap
  const height = top * 2 + rows * boxHeight + Math.max(0, rows - 1) * gap
  const positions = new Map()

  selected.forEach((symbol, index) => {
    const column = index % columns
    const row = Math.floor(index / columns)
    positions.set(symbol.id, {
      x: left + column * (boxWidth + gap),
      y: top + row * (boxHeight + gap),
      width: boxWidth,
      height: boxHeight
    })
  })

  let content = marker(markerId)
  for (const edge of edges) {
    if (!ids.has(edge.from) || !ids.has(edge.to)) continue
    const from = positions.get(edge.from)
    const to = positions.get(edge.to)
    content += `<line x1="${(from.x + from.width / 2).toFixed(1)}" y1="${(from.y + from.height / 2).toFixed(1)}" x2="${(to.x + to.width / 2).toFixed(1)}" y2="${(to.y + to.height / 2).toFixed(1)}" class="edge" marker-end="url(#${markerId})"></line>`
  }

  for (const symbol of selected) {
    const point = positions.get(symbol.id)
    const methods = methodsByOwner.get(`${symbol.path}#${symbol.name}`) ?? []
    const label = symbol.symbolKind === 'interface' ? 'interface' : 'class'
    content +=
      `<g><title>${escapeHtml(`${symbol.name} — ${symbol.path}:${symbol.line}`)}</title>` +
      `<rect x="${point.x}" y="${point.y}" width="${point.width}" height="${point.height}" rx="8" class="${symbol.symbolKind === 'interface' ? 'uml-interface' : 'uml-class'}"></rect>` +
      `<text x="${point.x + 12}" y="${point.y + 22}" class="uml-name">${escapeHtml(truncate(symbol.name, 28))}</text>` +
      `<text x="${point.x + 12}" y="${point.y + 40}" class="svg-muted">${label}</text>`
    methods.slice(0, 3).forEach((method, index) => {
      content += `<text x="${point.x + 12}" y="${point.y + 60 + index * 14}" class="svg-method">+ ${escapeHtml(truncate(method.signature ?? method.name, 30))}</text>`
    })
    content += '</g>'
  }

  return svg(width, height, 'UML acotado', content)
}

function htmlTable(headers, rows) {
  const head = headers.map((header) => `<th>${escapeHtml(header)}</th>`).join('')
  const body = rows
    .map(
      (row) =>
        `<tr>${row
          .map((cell) => `<td>${cell === null || cell === undefined ? '' : cell}</td>`)
          .join('')}</tr>`
    )
    .join('')
  return `<table><thead><tr>${head}</tr></thead><tbody>${body}</tbody></table>`
}

function code(value) {
  return `<code>${escapeHtml(value)}</code>`
}

function card(label, value) {
  return `<div class="card"><span>${escapeHtml(label)}</span><strong>${escapeHtml(value)}</strong></div>`
}

function suggestions({ cycles, unresolved, orphans, unsupported, coverage }) {
  const items = []
  if (cycles.length > 0) items.push('Revisar los ciclos principales y decidir si son seams o deuda.')
  if (unresolved.length > 0) items.push('Resolver o aislar los imports no resueltos.')
  if (orphans.length > 0) items.push('Validar los candidatos a huérfanos antes de borrar código.')
  if ((coverage.total ?? 0) > 0 && (coverage.ratio ?? 0) < 0.5) {
    items.push('Subir la cobertura de documentación en los módulos centrales.')
  }
  if (unsupported.length > 0) {
    items.push('Evaluar el language pack para los lenguajes no soportados.')
  }
  if (items.length === 0) items.push('Sin alertas estructurales: usar esta vista para orientar el próximo cambio.')
  return `<ul>${items.map((item) => `<li>${escapeHtml(item)}</li>`).join('')}</ul>`
}

const STYLE = `
:root { color-scheme: light; --ink:#172033; --muted:#64748b; --line:#e2e8f0; --bg:#f6f8fb; --card:#ffffff; --accent:#2563eb; --accent-2:#0f766e; --warn:#b45309; --bad:#b91c1c; }
* { box-sizing: border-box; }
body { margin:0; background:var(--bg); color:var(--ink); font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; line-height:1.5; }
main { max-width:1180px; margin:0 auto; padding:28px 20px 56px; }
header { background:linear-gradient(135deg,#0f172a,#1e3a8a); color:white; padding:30px 34px; border-radius:18px; margin-bottom:22px; box-shadow:0 18px 40px rgba(15,23,42,.18); }
header h1 { margin:0 0 6px; font-size:30px; letter-spacing:-.02em; }
header p { margin:0; color:#cbd5e1; }
.cards { display:grid; grid-template-columns:repeat(auto-fit,minmax(150px,1fr)); gap:12px; margin:18px 0 24px; }
.card { background:var(--card); border:1px solid var(--line); border-radius:12px; padding:14px 16px; box-shadow:0 4px 14px rgba(15,23,42,.04); }
.card span { display:block; color:var(--muted); font-size:12px; text-transform:uppercase; letter-spacing:.08em; }
.card strong { display:block; font-size:24px; margin-top:4px; }
section { background:var(--card); border:1px solid var(--line); border-radius:14px; padding:20px 22px; margin:18px 0; box-shadow:0 4px 14px rgba(15,23,42,.04); }
h2 { margin:0 0 12px; font-size:20px; }
h3 { margin:18px 0 8px; font-size:16px; }
p { margin:0 0 10px; }
.muted { color:var(--muted); }
.grid2 { display:grid; grid-template-columns:1fr 1fr; gap:18px; }
table { width:100%; border-collapse:collapse; font-size:13px; margin:8px 0 14px; }
th,td { border-bottom:1px solid var(--line); padding:7px 8px; text-align:left; vertical-align:top; }
th { color:var(--muted); font-weight:600; font-size:12px; text-transform:uppercase; letter-spacing:.05em; }
code { font-family: ui-monospace, SFMono-Regular, Menlo, monospace; font-size:12px; background:#f1f5f9; padding:1px 5px; border-radius:4px; }
svg { display:block; width:100%; height:auto; background:#fff; border:1px solid var(--line); border-radius:10px; margin:10px 0 16px; }
.svg-label { font-size:12px; fill:#334155; }
.svg-muted { font-size:11px; fill:#64748b; }
.svg-value { font-size:12px; fill:#475569; }
.svg-method { font-size:10px; fill:#475569; }
.uml-name { font-size:13px; font-weight:700; fill:#0f172a; }
.bar { fill:#3b82f6; opacity:.8; }
.node { fill:#2563eb; stroke:#fff; stroke-width:2; }
.edge { stroke:#94a3b8; stroke-width:1.2; fill:none; opacity:.75; }
.uml-class { fill:#eff6ff; stroke:#93c5fd; }
.uml-interface { fill:#ecfdf5; stroke:#6ee7b7; }
.badge { display:inline-block; padding:2px 8px; border-radius:999px; background:#e0f2fe; color:#075985; font-size:12px; }
.alert { border-left:4px solid var(--warn); padding:10px 14px; background:#fffbeb; border-radius:8px; margin:8px 0; }
footer { color:var(--muted); font-size:12px; text-align:center; padding:24px 0 0; }
@media (max-width:800px) { .grid2 { grid-template-columns:1fr; } header { padding:22px; } }
`

export function renderHumanHtml(model, limits) {
  const { graph, manifest, facts } = model
  const languages = languageStats(graph)
  const communities = [...facts.communities]
    .sort((a, b) => b.size - a.size || a.id.localeCompare(b.id))
    .slice(0, limits.maxCommunities)
  const cycles = [...facts.cycles.cycles].sort(
    (a, b) => b.size - a.size || a.files.join('|').localeCompare(b.files.join('|'))
  )
  const orphans = [...facts.deadCode.orphanFiles].sort((a, b) => a.path.localeCompare(b.path))
  const unresolved = unresolvedByReason(facts.unresolved)
  const unsupported = facts.unsupported.unsupported ?? []
  const coverage = facts.docCoverage.totals ?? { documented: 0, total: 0, ratio: 0 }
  const layerCounts = new Map()
  for (const layer of Object.values(facts.layers.layers ?? {})) {
    layerCounts.set(layer, (layerCounts.get(layer) ?? 0) + 1)
  }
  const layerRows = [...layerCounts.entries()]
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([label, value]) => ({ label, value }))
  const communityRows = communities.map((entry) => ({
    label: entry.id,
    value: entry.size,
    detail: `cohesión ${Number(entry.cohesion ?? 0).toFixed(2)}`
  }))
  const selected = selectClasses(graph, limits.maxClasses)
  const selectedIds = new Set(selected.map((symbol) => symbol.id))
  const inheritanceEdges = graph.edges.filter(
    (edge) => edge.kind === 'inherits' && selectedIds.has(edge.from) && selectedIds.has(edge.to)
  )
  const methodsByOwner = new Map()
  for (const node of graph.nodes) {
    if (node.kind !== 'symbol' || node.symbolKind !== 'method' || !node.owner) continue
    const key = `${node.path}#${node.owner}`
    if (!methodsByOwner.has(key)) methodsByOwner.set(key, [])
    methodsByOwner.get(key).push(node)
  }
  const importPaths = graph.nodes
    .filter((node) => node.kind === 'file')
    .sort((a, b) => b.fanIn - a.fanIn || a.path.localeCompare(b.path))
    .slice(0, Math.min(limits.maxNodes, 16))
    .map((node) => node.path)
  const cycle = cycles[0]
  const cycleSvg =
    cycle && cycle.size <= limits.maxNodes
      ? circularGraph(cycle.files.map(stripFile), graph.edges, {
          title: 'Ciclo principal',
          markerId: 'arrow-cycle',
          height: 520
        })
      : null

  const body = [
    '<!doctype html>',
    '<html lang="es">',
    '<head>',
    '<meta charset="utf-8">',
    '<meta name="viewport" content="width=device-width, initial-scale=1">',
    '<meta name="generator" content="ancleto-writer">',
    `<title>Writer — Human report ${escapeHtml(manifest.writerVersion)}</title>`,
    `<style>${STYLE}</style>`,
    '</head>',
    '<body><main>',
    '<header>',
    `<h1>Writer — Human report</h1>`,
    `<p>Paquete generado por Writer ${escapeHtml(manifest.writerVersion)} · schema ${escapeHtml(manifest.schemaVersion)} · vista derivada; el paquete de agentes es la fuente de verdad.</p>`,
    '</header>',
    '<div class="cards">',
    card('Archivos', formatNumber(graph.stats.files)),
    card('Símbolos', formatNumber(graph.stats.symbols)),
    card('Aristas', formatNumber(graph.stats.edges)),
    card('Lenguajes', formatNumber(languages.length)),
    card('Ciclos', formatNumber(cycles.length)),
    card('Huérfanos', formatNumber(orphans.length)),
    card('Unresolved', formatNumber(facts.unresolved.length)),
    card('No soportados', formatNumber(facts.unsupported.totals?.files ?? 0)),
    '</div>',
    '<section>',
    '<h2>Lenguajes</h2>',
    htmlTable(
      ['Lenguaje', 'Archivos', 'Líneas', 'Símbolos'],
      languages
        .slice(0, limits.top)
        .map((entry) => [
          code(entry.lang),
          formatNumber(entry.files),
          formatNumber(entry.lines),
          formatNumber(entry.symbols)
        ])
    ),
    '</section>',
    '<section>',
    '<h2>Capas</h2>',
    barChart(layerRows, { title: 'Archivos por capa', empty: 'Sin capas clasificadas.' }),
    '</section>',
    '<section>',
    '<h2>Comunidades</h2>',
    barChart(communityRows, {
      title: 'Comunidades principales',
      empty: 'Sin comunidades.'
    }),
    '</section>',
    '<section>',
    '<h2>UML acotado</h2>',
    `<p class="muted">Hasta ${limits.maxClasses} clases/interfaces por PageRank del archivo, fan-in y exportación.</p>`,
    umlSvg(selected, methodsByOwner, inheritanceEdges, 'arrow-uml', limits.maxClasses),
    '</section>',
    '<section>',
    '<h2>Imports principales</h2>',
    `<p class="muted">Top ${Math.min(limits.maxNodes, 16)} archivos por fan-in; solo aristas entre los nodos visibles.</p>`,
    circularGraph(importPaths, graph.edges, {
      title: 'Imports principales',
      markerId: 'arrow-imports'
    }),
    '</section>',
    '<section>',
    '<h2>Ciclos</h2>',
    cycles.length === 0
      ? '<p class="muted">Sin ciclos de imports.</p>'
      : `<p>${cycles.length} ciclo(s). El mayor tiene ${formatNumber(cycle.size)} archivos.</p>`,
    cycleSvg ?? '<p class="muted">El ciclo principal supera el límite; se muestra el resumen en las tablas.</p>',
    cycles.length > 0
      ? htmlTable(
          ['Archivos', 'Muestra'],
          cycles.slice(0, limits.top).map((entry) => [
            formatNumber(entry.size),
            entry.files
              .slice(0, 4)
              .map((file) => code(stripFile(file)))
              .join(' → ') + (entry.files.length > 4 ? ' → …' : '')
          ])
        )
      : '',
    '</section>',
    '<div class="grid2">',
    '<section>',
    '<h2>Top god nodes</h2>',
    facts.godNodes.length === 0
      ? '<p class="muted">Sin god nodes.</p>'
      : htmlTable(
          ['Archivo', 'Score', 'Fan-in'],
          facts.godNodes
            .slice(0, limits.top)
            .map((entry) => [code(entry.path), formatScore(entry.score), formatNumber(entry.fanIn)])
        ),
    '<h2>Hotspots</h2>',
    facts.hotspots.length === 0
      ? '<p class="muted">Sin hotspots.</p>'
      : htmlTable(
          ['Archivo', 'Score', 'Fan-in', 'Fan-out'],
          facts.hotspots
            .slice(0, limits.top)
            .map((entry) => [
              code(entry.path),
              formatScore(entry.score),
              formatNumber(entry.fanIn),
              formatNumber(entry.fanOut)
            ])
        ),
    '</section>',
    '<section>',
    '<h2>Comunidades</h2>',
    communities.length === 0
      ? '<p class="muted">Sin comunidades.</p>'
      : htmlTable(
          ['Comunidad', 'Archivos', 'Cohesión'],
          communities.map((entry) => [
            escapeHtml(entry.id),
            formatNumber(entry.size),
            Number(entry.cohesion ?? 0).toFixed(2)
          ])
        ),
    '</section>',
    '</div>',
    '<section>',
    '<h2>Alertas</h2>',
    '<div class="grid2">',
    '<div><h3>Huérfanos</h3>',
    orphans.length === 0
      ? '<p class="muted">Sin candidatos.</p>'
      : `<p>${formatNumber(orphans.length)} candidatos. Muestra:</p>` +
        htmlTable(
          ['Archivo', 'Confianza'],
          orphans.slice(0, limits.top).map((entry) => [code(entry.path), escapeHtml(entry.confidence)])
        ),
    '</div>',
    '<div><h3>Imports no resueltos</h3>',
    unresolved.length === 0
      ? '<p class="muted">Sin imports no resueltos.</p>'
      : htmlTable(
          ['Motivo', 'Cantidad'],
          unresolved.map((entry) => [escapeHtml(entry.reason), formatNumber(entry.count)])
        ),
    '</div>',
    '</div>',
    '<h3>Lenguajes no soportados</h3>',
    unsupported.length === 0
      ? '<p class="muted">Sin archivos de lenguajes no soportados.</p>'
      : htmlTable(
          ['Lenguaje', 'Extensión', 'Archivos'],
          unsupported.map((entry) => [escapeHtml(entry.language), escapeHtml(entry.extension), formatNumber(entry.count)])
        ),
    '</section>',
    '<section>',
    '<h2>Cobertura de documentación</h2>',
    (coverage.total ?? 0) === 0
      ? '<p class="muted">Sin símbolos para medir.</p>'
      : `<p>${formatNumber(coverage.documented)}/${formatNumber(coverage.total)} (${formatPercent(coverage.ratio)})</p>` +
        htmlTable(
          ['Archivo', 'Ratio'],
          [...(facts.docCoverage.files ?? [])]
            .filter((entry) => (entry.total ?? 0) > 0)
            .sort((a, b) => a.ratio - b.ratio || a.path.localeCompare(b.path))
            .slice(0, limits.top)
            .map((entry) => [code(entry.path), formatPercent(entry.ratio)])
        ),
    '</section>',
    '<section>',
    '<h2>Próximos pasos</h2>',
    suggestions({
      cycles,
      unresolved: facts.unresolved,
      orphans,
      unsupported,
      coverage
    }),
    '</section>',
    '<footer>Writer ' +
      escapeHtml(manifest.writerVersion) +
      ' · schema ' +
      escapeHtml(manifest.schemaVersion) +
      ' · vista humana derivada. No editar a mano; regenerar con <code>ancleto-writer human</code>.</footer>',
    '</main></body></html>',
    ''
  ]

  return body.join('\n')
}
