// SPDX-License-Identifier: AGPL-3.0-only

import { readFileSync } from 'node:fs'
import { isAbsolute, join, relative } from 'node:path'
import { runBuild } from '../../build/run.js'
import { checkPackage } from '../../contract/check.js'
import { findCycles } from '../../metrics/cycles.js'
import { CliError } from '../errors.js'

const DEPENDENT_LIMIT = 200

function toPosix(value) {
  return String(value).replace(/\\/g, '/')
}

function stripFile(id) {
  return String(id).replace(/^file:/, '')
}

function normalizeFile(file, rootAbs) {
  if (isAbsolute(file)) {
    const rel = relative(rootAbs, file)
    if (rel.startsWith('..') || isAbsolute(rel)) return null
    return toPosix(rel)
  }
  return toPosix(file).replace(/^\.\//, '')
}

function readGraph(outputDirAbs) {
  return JSON.parse(readFileSync(join(outputDirAbs, 'graph.json'), 'utf8'))
}

function isTestFile(path) {
  return /(^|\/)test\//.test(path) || /\.(test|spec)\.[cm]?[jt]sx?$/.test(path)
}

function impactForPath(path, graph, depth) {
  const fileNodes = graph.nodes.filter((node) => node.kind === 'file')
  const nodeByPath = new Map(fileNodes.map((node) => [node.path, node]))
  if (!nodeByPath.has(path)) return { path, found: false }

  const reverse = new Map(fileNodes.map((node) => [node.path, new Set()]))
  for (const edge of graph.edges) {
    if (edge.kind !== 'import') continue
    const from = stripFile(edge.from)
    const to = stripFile(edge.to)
    if (!reverse.has(from) || !reverse.has(to)) continue
    reverse.get(to).add(from)
  }

  const direct = new Set(
    [...(reverse.get(path) ?? [])].filter((dependent) => dependent !== path)
  )
  const visited = new Set()
  const transitive = new Set()
  const queue = [...direct].map((dependent) => ({ path: dependent, level: 1 }))
  let cursor = 0

  while (cursor < queue.length) {
    const current = queue[cursor]
    cursor += 1
    if (visited.has(current.path)) continue
    visited.add(current.path)
    if (current.level > 1) transitive.add(current.path)
    if (current.level >= depth) continue
    for (const dependent of reverse.get(current.path) ?? []) {
      if (dependent === path || visited.has(dependent)) continue
      queue.push({ path: dependent, level: current.level + 1 })
    }
  }

  const affected = new Set([path, ...direct, ...transitive])
  const cycleResult = findCycles(fileNodes, graph.edges)
  const cycles = cycleResult.cycles
    .filter((cycle) => cycle.files.some((file) => affected.has(stripFile(file))))
    .map((cycle) => ({ size: cycle.size, files: cycle.files.map(stripFile) }))
  const selfLoops = cycleResult.selfLoops
    .map(stripFile)
    .filter((file) => affected.has(file))

  const layers = {}
  for (const file of [...affected].sort()) {
    layers[file] = nodeByPath.get(file)?.layer ?? 'unknown'
  }

  const dependents = [...new Set([...direct, ...transitive])].sort()
  return {
    path,
    found: true,
    direct: [...direct].sort(),
    transitive: [...transitive].sort(),
    directCount: direct.size,
    transitiveCount: transitive.size,
    dependents: dependents.slice(0, DEPENDENT_LIMIT),
    truncated: dependents.length > DEPENDENT_LIMIT,
    cycles,
    selfLoops,
    tests: dependents.filter(isTestFile),
    layers
  }
}

export function runImpact({ rootAbs, config, files, depth = Infinity, build = false }) {
  if (build) {
    runBuild({ rootAbs, config })
  } else {
    const check = checkPackage({ rootAbs, config })
    if (check.status !== 'fresh') {
      const messages = {
        missing: 'No hay paquete de writer; ejecutá build o usá --build.',
        stale: 'El paquete está stale; ejecutá build o usá --build.',
        incompatible: 'El paquete tiene un esquema incompatible; ejecutá build.',
        invalid: 'El paquete está corrupto o incompleto; ejecutá build.'
      }
      return {
        status: check.status,
        exitCode: check.exitCode,
        message: messages[check.status] ?? 'El paquete no está disponible.'
      }
    }
  }

  const graph = readGraph(config.outputDirAbs)
  const results = []
  const notFound = []
  for (const file of files) {
    const path = normalizeFile(file, rootAbs)
    if (!path) {
      notFound.push(file)
      continue
    }
    const result = impactForPath(path, graph, depth)
    if (!result.found) notFound.push(file)
    results.push(result)
  }

  return {
    status: notFound.length > 0 ? 'not-found' : 'ok',
    exitCode: notFound.length > 0 ? 1 : 0,
    results,
    notFound
  }
}

export function parseImpactArgs(args) {
  const files = []
  let root = null
  let json = false
  let build = false
  let depth = Infinity

  for (let i = 0; i < args.length; i += 1) {
    const arg = args[i]
    if (arg === '--root') {
      const value = args[i + 1]
      if (!value || value.startsWith('--')) throw new CliError('falta valor para --root')
      root = value
      i += 1
    } else if (arg === '--json') {
      json = true
    } else if (arg === '--build') {
      build = true
    } else if (arg === '--depth') {
      const value = args[i + 1]
      const parsed = Number(value)
      if (!Number.isInteger(parsed) || parsed <= 0) {
        throw new CliError('--depth requiere un entero positivo')
      }
      depth = parsed
      i += 1
    } else if (arg.startsWith('-')) {
      throw new CliError(`opción desconocida: ${arg}`)
    } else {
      files.push(arg)
    }
  }

  if (files.length === 0) throw new CliError('impact requiere al menos un archivo')
  return { root, json, build, depth, files }
}

export function formatImpact(result) {
  if (result.status !== 'ok' && result.status !== 'not-found') {
    return `ancleto-writer: ${result.message ?? result.status}`
  }

  const lines = result.results
    .map((entry) => {
      if (!entry.found) return `- ${entry.path}: no encontrado en el grafo`
      const lines = [
        entry.path,
        `  directos (${entry.directCount}): ${entry.direct.join(', ') || '-'}`,
        `  transitivos (${entry.transitiveCount}): ${entry.transitive.join(', ') || '-'}`
      ]
      if (entry.truncated) lines.push(`  dependientes truncados a ${entry.dependents.length}`)
      if (entry.cycles.length > 0) {
        lines.push(`  ciclos: ${entry.cycles.map((cycle) => cycle.files.join(' → ')).join('; ')}`)
      }
      if (entry.selfLoops.length > 0) lines.push(`  self-loops: ${entry.selfLoops.join(', ')}`)
      if (entry.tests.length > 0) lines.push(`  tests: ${entry.tests.join(', ')}`)
      return lines.join('\n')
    })
    .join('\n')

  return result.notFound?.length > 0
    ? `${lines}\nNo encontrados: ${result.notFound.join(', ')}`
    : lines
}
