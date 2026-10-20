// SPDX-License-Identifier: AGPL-3.0-only
// Derived from ReadMenator readmenator/_models.py, readmenator/_scanner.py (commit dac48f868722620f0d01dac0d33102c5a514c03c),
// modified 2026-10-19 by AncletoCEO.

import { parseJavaScript } from '../parsers/javascript.js'
import { createResolver, resolveImports } from '../resolve/imports.js'

const FILE_PREFIX = 'file:'
const BUILTIN_LANGUAGES = new Set(['js', 'ts', 'jsx', 'tsx'])

export function fileId(path) {
  return `${FILE_PREFIX}${path}`
}

export function symbolId(path, name, line) {
  return `sym:${path}#${name}@${line}`
}

function pickSymbol(symbols, name, line) {
  if (!symbols) return null
  let candidates = symbols.filter((symbol) => symbol.name === name)
  if (line !== undefined && line !== null) {
    const exact = candidates.find((symbol) => symbol.line === line)
    if (exact) return exact
  }
  if (candidates.length === 0) return null
  candidates = candidates.sort((a, b) => {
    const priority = (symbol) => (symbol.kind === 'function' || symbol.kind === 'class' ? 0 : 1)
    return priority(a) - priority(b) || a.line - b.line
  })
  return candidates[0]
}

function resolveParent(name, path, symbolsByName) {
  const lastSegment = String(name).split('.').pop()
  const candidates = [
    ...(symbolsByName.get(name) ?? []),
    ...(lastSegment && lastSegment !== name ? symbolsByName.get(lastSegment) ?? [] : [])
  ].filter((symbol) => symbol.kind === 'class' || symbol.kind === 'interface')
  if (candidates.length === 0) return null

  const sameFile = candidates.find((symbol) => symbol.path === path)
  if (sameFile) return { symbol: sameFile, sameFile: true }

  return { symbol: candidates[0], sameFile: false }
}

export function buildGraph({ rootAbs, config, tsconfig = null, scanResult, adapters = [] }) {
  const resolveBuiltin = createResolver({ rootAbs, config, tsconfig })
  const adapterById = new Map(adapters.map((adapter) => [adapter.id, adapter]))
  const parsed = new Map()
  const parsedRaw = new Map()
  const externals = []
  const unresolved = []

  for (const file of scanResult.files) {
    const adapter = adapterById.get(file.lang)
    let parse
    if (adapter) {
      parse = adapter.parse({ path: file.path, lang: file.lang, source: file.content })
    } else if (BUILTIN_LANGUAGES.has(file.lang)) {
      parse = parseJavaScript({ path: file.path, lang: file.lang, source: file.content })
    } else {
      continue
    }
    parsedRaw.set(file.path, { file, parse })
  }

  const namespaceIndex = new Map()
  for (const [path, entry] of parsedRaw) {
    for (const namespace of entry.parse.namespaces ?? []) {
      if (!namespaceIndex.has(namespace)) namespaceIndex.set(namespace, [])
      namespaceIndex.get(namespace).push(path)
    }
  }
  for (const paths of namespaceIndex.values()) paths.sort()

  for (const [path, entry] of parsedRaw) {
    const { file, parse } = entry
    const adapter = adapterById.get(file.lang)
    const resolve = adapter
      ? (specifier, fromFileAbs, importEntry) =>
          adapter.resolveImport({
            specifier,
            fromFileAbs,
            rootAbs,
            config,
            namespaces: namespaceIndex,
            importEntry
          })
      : resolveBuiltin
    const resolution = resolveImports({ file, parseResult: parse, resolve })
    parsed.set(path, { file, parse, resolution })
    for (const external of resolution.external) {
      externals.push({ specifier: external.specifier, path: file.path })
    }
    unresolved.push(...resolution.unresolved)
  }

  const symbolsByFile = new Map()
  const symbolsByName = new Map()

  for (const [path, entry] of parsed) {
    symbolsByFile.set(path, entry.parse.symbols)
    for (const symbol of entry.parse.symbols) {
      if (!symbolsByName.has(symbol.name)) symbolsByName.set(symbol.name, [])
      symbolsByName.get(symbol.name).push({ ...symbol, path })
    }
  }
  for (const list of symbolsByName.values()) {
    list.sort((a, b) => a.path.localeCompare(b.path) || a.line - b.line)
  }

  const fileSet = new Set(scanResult.files.map((file) => file.path))
  const nodes = []
  const edges = []
  const edgeKeys = new Set()

  function addEdge(edge) {
    const key = `${edge.from}|${edge.to}|${edge.kind}`
    if (edgeKeys.has(key)) return
    edgeKeys.add(key)
    edges.push(edge)
  }

  for (const [path, entry] of parsed) {
    const { file, parse } = entry

    nodes.push({
      id: fileId(path),
      kind: 'file',
      path,
      lang: file.lang,
      size: file.size,
      lines: file.lines,
      symbolCount: parse.symbols.length,
      exportedSymbols: parse.symbols.filter((symbol) => symbol.exported).length,
      fanIn: 0,
      fanOut: 0,
      pageRank: 0,
      layer: 'unknown',
      community: null,
      hotspot: 0
    })

    for (const symbol of parse.symbols) {
      nodes.push({
        id: symbolId(path, symbol.name, symbol.line),
        kind: 'symbol',
        path,
        name: symbol.name,
        symbolKind: symbol.kind,
        exported: symbol.exported,
        owner: symbol.owner ?? null,
        summary: symbol.summary ?? null,
        line: symbol.line,
        endLine: symbol.endLine,
        signature: symbol.signature
      })
    }

    for (const importEntry of entry.resolution.resolved) {
      if (!fileSet.has(importEntry.target)) continue
      addEdge({
        from: fileId(path),
        to: fileId(importEntry.target),
        kind: 'import',
        confidence: importEntry.confidence,
        line: importEntry.line
      })
    }

    for (const call of parse.calls) {
      const callee = pickSymbol(symbolsByFile.get(path), call.callee)
      if (!callee) continue
      const caller = call.caller
        ? pickSymbol(symbolsByFile.get(path), call.caller, call.callerLine)
        : null
      addEdge({
        from: caller ? symbolId(path, caller.name, caller.line) : fileId(path),
        to: symbolId(path, callee.name, callee.line),
        kind: 'call',
        confidence: call.confidence,
        line: call.line
      })
    }

    for (const inherit of parse.inheritance) {
      const child = pickSymbol(symbolsByFile.get(path), inherit.child)
      if (!child) continue
      const parent = resolveParent(inherit.parent, path, symbolsByName)
      if (!parent) continue
      addEdge({
        from: symbolId(path, child.name, child.line),
        to: symbolId(parent.symbol.path, parent.symbol.name, parent.symbol.line),
        kind: 'inherits',
        confidence: parent.sameFile && inherit.confidence === 'extracted' ? 'extracted' : 'inferred',
        inheritsKind:
          inherit.implements || parent.symbol.kind === 'interface' ? 'implements' : 'extends',
        line: inherit.line
      })
    }
  }

  nodes.sort((a, b) => a.id.localeCompare(b.id))
  edges.sort(
    (a, b) =>
      a.from.localeCompare(b.from) ||
      a.kind.localeCompare(b.kind) ||
      a.to.localeCompare(b.to) ||
      (a.line ?? 0) - (b.line ?? 0)
  )

  return {
    graph: {
      schemaVersion: 1,
      stats: {
        files: scanResult.files.length,
        symbols: nodes.filter((node) => node.kind === 'symbol').length,
        edges: edges.length,
        externalImports: externals.length
      },
      nodes,
      edges
    },
    externals,
    unresolved
  }
}
