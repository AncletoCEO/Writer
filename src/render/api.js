// SPDX-License-Identifier: AGPL-3.0-only

import { paginate } from './paginate.js'

export function renderApi(graph, { enabled = true } = {}) {
  if (!enabled) return {}

  const files = new Map()
  for (const node of graph.nodes) {
    if (node.kind !== 'symbol' || !node.exported) continue
    if (!files.has(node.path)) files.set(node.path, [])
    files.get(node.path).push(node)
  }

  if (files.size === 0) {
    return { 'API.md': '# API\n\nSin símbolos exportados.\n' }
  }

  const body = []
  for (const [path, symbols] of [...files.entries()].sort((a, b) =>
    a[0].localeCompare(b[0])
  )) {
    body.push(`## ${path}`, '')
    for (const symbol of symbols.sort(
      (a, b) => a.line - b.line || a.name.localeCompare(b.name)
    )) {
      const summary = symbol.summary ? ` — ${symbol.summary}` : ''
      body.push(`- \`${symbol.name}\` — ${symbol.signature ?? ''}${summary}`)
    }
    body.push('')
  }

  return paginate('API', 'API', body)
}
