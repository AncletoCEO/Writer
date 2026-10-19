// SPDX-License-Identifier: AGPL-3.0-only
// Derived from ReadMenator readmenator/_layers.py, readmenator/_layer_rules.py (commit dac48f868722620f0d01dac0d33102c5a514c03c),
// modified 2026-10-19 by AncletoCEO.

import { matchesGlob, toPosix } from '../config/glob.js'

const LAYER_RULES = [
  {
    layer: 'presentation',
    patterns: ['ui', 'views', 'view', 'components', 'component', 'pages', 'page', 'cli', 'render', 'frontend']
  },
  {
    layer: 'application',
    patterns: ['app', 'application', 'services', 'service', 'use-cases', 'usecases', 'commands', 'command', 'handlers', 'handler']
  },
  {
    layer: 'domain',
    patterns: ['domain', 'core', 'models', 'model', 'entities', 'entity']
  },
  {
    layer: 'infrastructure',
    patterns: ['infra', 'infrastructure', 'adapters', 'adapter', 'db', 'database', 'http', 'config', 'persistence', 'repository', 'repositories']
  },
  {
    layer: 'shared',
    patterns: ['lib', 'libs', 'utils', 'util', 'shared', 'common', 'types', 'type', 'helpers', 'helper']
  }
]

export const LAYER_RANK = {
  shared: 0,
  domain: 1,
  infrastructure: 2,
  application: 3,
  presentation: 4,
  unknown: -1
}

const SEGMENT_LAYER = new Map()
for (const rule of LAYER_RULES) {
  for (const pattern of rule.patterns) SEGMENT_LAYER.set(pattern, rule.layer)
}

export function classifyFile(path, overrides = {}) {
  const normalized = toPosix(path)

  for (const [layer, patterns] of Object.entries(overrides ?? {})) {
    if (!Array.isArray(patterns)) continue
    for (const pattern of patterns) {
      if (typeof pattern === 'string' && matchesGlob(normalized, pattern)) return layer
    }
  }

  const segments = normalized.split('/').filter(Boolean)
  for (let i = segments.length - 1; i >= 0; i -= 1) {
    const segment = segments[i].toLowerCase().replace(/\.[^.]+$/, '')
    if (SEGMENT_LAYER.has(segment)) return SEGMENT_LAYER.get(segment)
  }

  return 'unknown'
}

export function classifyLayers(fileNodes, edges, { overrides = {} } = {}) {
  const layers = {}
  const violations = []

  for (const node of fileNodes) {
    layers[node.path] = classifyFile(node.path, overrides)
  }

  for (const edge of edges) {
    if (edge.kind !== 'import') continue
    const from = edge.from.replace(/^file:/, '')
    const to = edge.to.replace(/^file:/, '')
    const fromLayer = layers[from]
    const toLayer = layers[to]
    if (!fromLayer || !toLayer) continue
    if (LAYER_RANK[fromLayer] === undefined || LAYER_RANK[toLayer] === undefined) continue
    if (LAYER_RANK[fromLayer] < 0 || LAYER_RANK[toLayer] < 0) continue
    if (LAYER_RANK[fromLayer] < LAYER_RANK[toLayer]) {
      violations.push({ from, to, fromLayer, toLayer, line: edge.line ?? null })
    }
  }

  violations.sort(
    (a, b) => a.from.localeCompare(b.from) || a.to.localeCompare(b.to) || (a.line ?? 0) - (b.line ?? 0)
  )

  return { layers, violations }
}
