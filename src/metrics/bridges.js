// SPDX-License-Identifier: AGPL-3.0-only
// Derived from ReadMenator readmenator/_analyzer.py (commit dac48f868722620f0d01dac0d33102c5a514c03c),
// modified 2026-10-19 by AncletoCEO.

const DEFAULT_LIMIT = 20

function normalize(values) {
  if (values.length === 0) return []
  const min = Math.min(...values)
  const max = Math.max(...values)
  if (max === min) return values.map(() => 0)
  return values.map((value) => (value - min) / (max - min))
}

function stripFile(id) {
  return String(id).replace(/^file:/, '')
}

export function computeBridges(fileNodes, edges, communities, layers, { limit = DEFAULT_LIMIT } = {}) {
  if (!Array.isArray(communities) || communities.length === 0) return []

  const fileByPath = new Map(fileNodes.map((node) => [node.path, node]))
  const communityByPath = new Map()
  for (const community of communities) {
    for (const file of community.files) communityByPath.set(file, community)
  }

  const fanInNormalized = normalize(fileNodes.map((node) => node.fanIn ?? 0))
  const fanInByPath = new Map(
    fileNodes.map((node, position) => [node.path, fanInNormalized[position] ?? 0])
  )

  const byKey = new Map()
  for (const edge of edges) {
    if (edge.kind !== 'import') continue
    const from = stripFile(edge.from)
    const to = stripFile(edge.to)
    const fromNode = fileByPath.get(from)
    const toNode = fileByPath.get(to)
    const fromCommunity = communityByPath.get(from)
    const toCommunity = communityByPath.get(to)
    if (!fromNode || !toNode || !fromCommunity || !toCommunity) continue
    if (fromCommunity.id === toCommunity.id) continue

    const key = `${from}|${to}`
    const line = edge.line ?? null
    const existing = byKey.get(key)
    if (existing) {
      if (
        line !== null &&
        (existing.line === null || line < existing.line)
      ) {
        existing.line = line
      }
      continue
    }

    const fromLayer = layers?.[from] ?? fromNode.layer ?? 'unknown'
    const toLayer = layers?.[to] ?? toNode.layer ?? 'unknown'
    const crossLayer =
      fromLayer !== 'unknown' && toLayer !== 'unknown' && fromLayer !== toLayer ? 1 : 0
    const pageRankAverage = ((fromNode.pageRank ?? 0) + (toNode.pageRank ?? 0)) / 2
    const communitySurprise =
      1 - ((fromCommunity.cohesion ?? 0) + (toCommunity.cohesion ?? 0)) / 2
    const score =
      0.35 * pageRankAverage +
      0.3 * (fanInByPath.get(to) ?? 0) +
      0.2 * communitySurprise +
      0.15 * crossLayer

    byKey.set(key, {
      from,
      to,
      fromCommunity: fromCommunity.id,
      toCommunity: toCommunity.id,
      fromLayer,
      toLayer,
      score: Number(score.toFixed(6)),
      line
    })
  }

  const safeLimit = Number.isInteger(limit) && limit > 0 ? limit : DEFAULT_LIMIT
  return [...byKey.values()]
    .sort(
      (a, b) =>
        b.score - a.score ||
        a.from.localeCompare(b.from) ||
        a.to.localeCompare(b.to) ||
        (a.line ?? 0) - (b.line ?? 0)
    )
    .slice(0, safeLimit)
}
