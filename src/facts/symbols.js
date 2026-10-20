// SPDX-License-Identifier: AGPL-3.0-only
// Derived from ReadMenator readmenator/_exporter.py (commit dac48f868722620f0d01dac0d33102c5a514c03c),
// modified 2026-10-19 by AncletoCEO.

export function buildSymbolsJson(graph) {
  const files = new Map()

  for (const node of graph.nodes) {
    if (node.kind !== 'symbol') continue
    if (!files.has(node.path)) files.set(node.path, [])
    files.get(node.path).push({
      id: node.id,
      name: node.name,
      kind: node.symbolKind,
      exported: node.exported,
      summary: node.summary ?? null,
      line: node.line,
      endLine: node.endLine,
      signature: node.signature
    })
  }

  const list = [...files.entries()]
    .map(([path, symbols]) => ({
      path,
      symbols: symbols.sort((a, b) => a.line - b.line || a.name.localeCompare(b.name))
    }))
    .sort((a, b) => a.path.localeCompare(b.path))

  return `${JSON.stringify({ schemaVersion: 1, files: list }, null, 2)}\n`
}
