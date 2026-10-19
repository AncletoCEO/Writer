// SPDX-License-Identifier: AGPL-3.0-only

const DESCRIPTIONS = {
  'manifest.json': 'Metadatos, frescura y hashes de las salidas.',
  'graph.json': 'Grafo de archivos, símbolos y aristas.',
  'symbols.json': 'Índice de símbolos con firmas y summaries.',
  'README.md': 'Este archivo: guía de los artefactos generados.',
  'facts/cycles.json': 'Ciclos y self-loops de imports.',
  'facts/communities.json': 'Comunidades cohesivas y su cohesión.',
  'facts/god-nodes.json': 'Ranking de archivos con alta centralidad.',
  'facts/bridges.json': 'Imports que cruzan comunidades.',
  'facts/layers.json': 'Capas arquitectónicas y violaciones upward.',
  'facts/hotspots.json': 'Archivos con mayor riesgo estructural.',
  'facts/blast-radius.json': 'Dependientes directos y transitivos por semilla.',
  'facts/dead-code.json': 'Candidatos a archivos huérfanos y exclusiones.',
  'facts/doc-coverage.json': 'Cobertura de documentación por archivo.',
  'facts/unresolved.json': 'Imports que no pudieron resolverse.',
  'facts/externals.json': 'Paquetes externos usados por el proyecto.',
  'facts/skipped.json': 'Archivos omitidos por límites o symlinks.',
  'facts/unsupported.json': 'Archivos de lenguajes todavía no analizados.',
  'facts/inventory.md': 'Inventario tabular de archivos y métricas.',
  'agent/INDEX.md': 'Índice de archivos y god nodes.',
  'agent/API.md': 'API pública exportada.',
  'agent/SYMBOLS.md': 'Símbolos con file:line, firma y summary.',
  'agent/GOTCHAS.md': 'Riesgos, ciclos, capas, huérfanos y reglas del proyecto.',
  'agent/ARCHITECTURE.md': 'Capas, comunidades, UML, imports y ciclos.'
}

export function renderOutputReadme({ paths = [] } = {}) {
  const lines = [
    '# @ancleto/writer context',
    '',
    'Paquete de conocimiento estático generado por `@ancleto/writer` para complementar',
    '`@ancleto/spec`. Es un directorio generado: no lo edites a mano.',
    '',
    '## Archivos',
    ''
  ]

  for (const path of [...paths].sort()) {
    lines.push(`- \`${path}\` — ${DESCRIPTIONS[path] ?? 'Artefacto generado.'}`)
  }

  lines.push(
    '',
    '## Regenerar',
    '',
    '```bash',
    'ancleto-writer build',
    '```',
    '',
    '## Licencia',
    '',
    'Este paquete se distribuye bajo AGPL-3.0-only. Ver `LICENSE` y `NOTICE` del proyecto',
    'de Writer.',
    ''
  )

  return `${lines.join('\n')}`
}
