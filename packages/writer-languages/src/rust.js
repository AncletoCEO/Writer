// SPDX-License-Identifier: AGPL-3.0-only

import { statSync } from 'node:fs'
import { basename, dirname, isAbsolute, join, relative } from 'node:path'
import Parser from 'tree-sitter'
import Rust from 'tree-sitter-rust'

function toPosix(path) {
  return String(path).split('\\').join('/')
}

function normalize(text) {
  return String(text ?? '').replace(/\s+/g, ' ').trim()
}

function lineOf(node) {
  return node.startPosition.row + 1
}

function endLineOf(node) {
  return node.endPosition.row + 1
}

function walk(node, visit) {
  visit(node)
  for (const child of node.namedChildren) walk(child, visit)
}

function isFile(path) {
  try {
    return statSync(path).isFile()
  } catch {
    return false
  }
}

function isDirectory(path) {
  try {
    return statSync(path).isDirectory()
  } catch {
    return false
  }
}

function hasVisibility(node) {
  return node.namedChildren.some((child) => child.type === 'visibility_modifier')
}

function itemNameNode(node) {
  return (
    node.childForFieldName('name') ??
    node.namedChildren.find(
      (child) =>
        child.type === 'type_identifier' ||
        child.type === 'identifier'
    ) ??
    null
  )
}

function lastSegment(name) {
  const value = String(name ?? '')
  if (value.includes('::')) return value.split('::').pop()
  if (value.includes('.')) return value.split('.').pop()
  return value
}

function summaryBefore(source, node) {
  const lines = source.split(/\r?\n/)
  let index = node.startPosition.row - 1
  const collected = []

  while (index >= 0) {
    const line = lines[index].trim()
    if (line === '') break
    if (line.startsWith('///') || line.startsWith('//!')) {
      collected.unshift(line.replace(/^\/\/[\/!]\s?/, '').trim())
      index -= 1
      continue
    }
    if (line.startsWith('#[') || line.startsWith('#![') || line.startsWith(']')) {
      index -= 1
      continue
    }
    if (line.endsWith('*/')) {
      let start = index
      while (start >= 0 && !lines[start].includes('/*')) start -= 1
      if (start < 0) break
      const block = lines
        .slice(start, index + 1)
        .join('\n')
        .replace(/^\s*\/\*+!?/, '')
        .replace(/\*\/\s*$/, '')
        .split(/\r?\n/)
        .map((entry) => entry.trim().replace(/^\*\s?/, ''))
        .filter(Boolean)
      collected.unshift(...block)
      index = start - 1
      break
    }
    break
  }

  return collected.map((entry) => entry.trim()).find(Boolean) ?? null
}

function rustBaseName(node) {
  if (!node) return null
  if (node.type === 'type_identifier') return normalize(node.text)
  if (node.type === 'scoped_type_identifier') return normalize(node.text)
  if (
    node.type === 'generic_type' ||
    node.type === 'reference_type' ||
    node.type === 'parenthesized_type'
  ) {
    return rustBaseName(node.namedChildren[0])
  }
  return null
}

function functionSignature(node, name) {
  const parameters = node.childForFieldName('parameters')
  const returnType = node.childForFieldName('return_type')
  return `${name}${normalize(parameters?.text) || '()'}${returnType ? ` -> ${normalize(returnType.text)}` : ''}`
}

function addSymbol(symbols, symbol) {
  if (!symbol.name) return
  const duplicate = symbols.some(
    (current) => current.name === symbol.name && current.startOffset === symbol.startOffset
  )
  if (!duplicate) symbols.push(symbol)
}

function addMethod(node, owner, ownerExported, symbols, source) {
  const nameNode = node.childForFieldName('name')
  const name = nameNode?.text
  if (!name) return
  const body = node.childForFieldName('body')
  addSymbol(symbols, {
    name,
    kind: 'method',
    exported: ownerExported || hasVisibility(node),
    owner,
    summary: summaryBefore(source, node),
    line: lineOf(node),
    endLine: endLineOf(body ?? node),
    signature: functionSignature(node, name),
    nameOffset: nameNode.startIndex,
    startOffset: node.startIndex,
    endOffset: (body ?? node).endIndex
  })
}

function processTrait(node, symbols, inheritance, source) {
  const nameNode = itemNameNode(node)
  const name = nameNode?.text
  if (!name) return
  const exported = hasVisibility(node)
  addSymbol(symbols, {
    name,
    kind: 'interface',
    exported,
    owner: null,
    summary: summaryBefore(source, node),
    line: lineOf(node),
    endLine: endLineOf(node),
    signature: `trait ${name}`,
    nameOffset: nameNode.startIndex,
    startOffset: node.startIndex,
    endOffset: node.endIndex
  })

  const bounds = node.childForFieldName('bounds')
  for (const bound of bounds?.namedChildren ?? []) {
    const parent = rustBaseName(bound)
    if (!parent) continue
    inheritance.push({
      child: name,
      parent,
      line: lineOf(bound),
      implements: true,
      confidence: 'inferred'
    })
  }

  const body = node.childForFieldName('body')
  for (const child of body?.namedChildren ?? []) {
    if (child.type === 'function_signature_item' || child.type === 'function_item') {
      addMethod(child, name, exported, symbols, source)
    }
  }
}

function processImpl(node, symbols, inheritance, source) {
  const typeNode = node.childForFieldName('type')
  const traitNode = node.childForFieldName('trait')
  const owner = rustBaseName(typeNode)
  if (!owner) return

  if (traitNode) {
    const parent = rustBaseName(traitNode)
    if (parent) {
      inheritance.push({
        child: owner,
        parent,
        line: lineOf(node),
        implements: true,
        confidence: 'inferred'
      })
    }
  }

  const body = node.childForFieldName('body')
  for (const child of body?.namedChildren ?? []) {
    if (child.type === 'function_item') {
      addMethod(child, owner, hasVisibility(child) || Boolean(traitNode), symbols, source)
    }
  }
}

function addTypeSymbol(node, kind, prefix, symbols, source) {
  const nameNode = itemNameNode(node)
  const name = nameNode?.text
  if (!name) return
  addSymbol(symbols, {
    name,
    kind,
    exported: hasVisibility(node),
    owner: null,
    summary: summaryBefore(source, node),
    line: lineOf(node),
    endLine: endLineOf(node),
    signature: `${prefix} ${name}`,
    nameOffset: nameNode.startIndex,
    startOffset: node.startIndex,
    endOffset: node.endIndex
  })
}

function collectItems(container, symbols, inheritance, source) {
  for (const node of container.namedChildren) {
    if (node.type === 'struct_item') addTypeSymbol(node, 'class', 'struct', symbols, source)
    else if (node.type === 'enum_item') addTypeSymbol(node, 'enum', 'enum', symbols, source)
    else if (node.type === 'union_item') addTypeSymbol(node, 'class', 'union', symbols, source)
    else if (node.type === 'type_item') addTypeSymbol(node, 'type', 'type', symbols, source)
    else if (node.type === 'trait_item') processTrait(node, symbols, inheritance, source)
    else if (node.type === 'impl_item') processImpl(node, symbols, inheritance, source)
    else if (node.type === 'function_item') {
      const nameNode = node.childForFieldName('name')
      const name = nameNode?.text
      if (!name) continue
      const body = node.childForFieldName('body')
      addSymbol(symbols, {
        name,
        kind: 'function',
        exported: hasVisibility(node),
        owner: null,
        summary: summaryBefore(source, node),
        line: lineOf(node),
        endLine: endLineOf(body ?? node),
        signature: functionSignature(node, name),
        nameOffset: nameNode.startIndex,
        startOffset: node.startIndex,
        endOffset: (body ?? node).endIndex
      })
    } else if (node.type === 'mod_item') {
      const body = node.childForFieldName('body')
      if (body) collectItems(body, symbols, inheritance, source)
    }
  }
}

function flattenUse(node, prefix, out) {
  if (!node) return

  if (node.type === 'self') {
    if (prefix) {
      out.push({ specifier: prefix, alias: lastSegment(prefix), wildcard: false })
    } else {
      out.push({ specifier: 'self', alias: null, wildcard: false })
    }
    return
  }

  if (
    node.type === 'identifier' ||
    node.type === 'scoped_identifier' ||
    node.type === 'crate' ||
    node.type === 'super'
  ) {
    out.push({
      specifier: prefix ? `${prefix}::${node.text}` : node.text,
      alias: null,
      wildcard: false
    })
    return
  }

  if (node.type === 'use_as_clause') {
    const target = node.namedChildren[0]
    const alias = node.namedChildren[1]?.text ?? null
    const entries = []
    flattenUse(target, prefix, entries)
    for (const entry of entries) entry.alias = alias
    out.push(...entries)
    return
  }

  if (node.type === 'use_wildcard') {
    const entries = []
    flattenUse(node.namedChildren[0], prefix, entries)
    for (const entry of entries) {
      entry.alias = null
      entry.wildcard = true
    }
    out.push(...entries)
    return
  }

  if (node.type === 'scoped_use_list') {
    const pathNode = node.namedChildren[0]
    const list = node.namedChildren.find((child) => child.type === 'use_list')
    const base = prefix ? `${prefix}::${pathNode.text}` : pathNode.text
    for (const child of list?.namedChildren ?? []) flattenUse(child, base, out)
    return
  }

  if (node.type === 'use_list') {
    for (const child of node.namedChildren) flattenUse(child, prefix, out)
  }
}

function collectImports(root, imports, importedNames) {
  walk(root, (node) => {
    if (node.type === 'use_declaration') {
      const tree =
        node.namedChildren.find((child) => child.type !== 'visibility_modifier') ?? null
      const entries = []
      flattenUse(tree, '', entries)
      for (const entry of entries) {
        const specifier = normalize(entry.specifier)
        if (!specifier) continue
        imports.push({
          specifier,
          kind: 'static',
          line: lineOf(node),
          confidence: 'extracted'
        })
        if (entry.wildcard) continue
        const bound = entry.alias ?? lastSegment(specifier)
        if (bound && bound !== '_' && bound !== '*') importedNames.add(bound)
      }
      return
    }

    if (node.type === 'mod_item') {
      const name = node.childForFieldName('name')?.text
      if (!name) return
      const body = node.childForFieldName('body')
      if (body) return
      imports.push({
        specifier: `self::${name}`,
        kind: 'static',
        line: lineOf(node),
        confidence: 'extracted'
      })
      importedNames.add(name)
    }
  })
}

function callName(fn) {
  if (!fn) return null
  if (fn.type === 'identifier') return fn.text
  if (fn.type === 'scoped_identifier') return lastSegment(fn.text)
  if (fn.type === 'field_expression') {
    return fn.childForFieldName('field')?.text ?? lastSegment(fn.text)
  }
  return null
}

function findCaller(symbols, start, end) {
  let best = null
  for (const symbol of symbols) {
    if (symbol.startOffset > start || symbol.endOffset < end) continue
    if (!best || symbol.endOffset - symbol.startOffset < best.endOffset - best.startOffset) {
      best = symbol
    }
  }
  return best
}

function collectCalls(root, symbols) {
  const localNames = new Set(
    symbols
      .filter((symbol) => symbol.kind === 'function' || symbol.kind === 'method')
      .map((symbol) => symbol.name)
  )
  const calls = []
  const seen = new Set()

  walk(root, (node) => {
    if (node.type !== 'call_expression') return
    const callee = callName(node.childForFieldName('function'))
    if (!callee || !localNames.has(callee)) return
    const caller = findCaller(symbols, node.startIndex, node.endIndex)
    const line = lineOf(node)
    const key = `${caller?.name ?? ''}|${callee}|${line}`
    if (seen.has(key)) return
    seen.add(key)
    calls.push({
      caller: caller?.name ?? null,
      callerLine: caller?.line ?? null,
      callee,
      line,
      confidence: 'inferred'
    })
  })

  calls.sort((a, b) => a.line - b.line || a.callee.localeCompare(b.callee))
  return calls
}

function crateRootDir(rootAbs) {
  const src = join(rootAbs, 'src')
  return isDirectory(src) ? src : rootAbs
}

function currentModuleDir(fromFileAbs, crateRoot) {
  const name = basename(fromFileAbs)
  if (name === 'lib.rs' || name === 'main.rs') return crateRoot
  if (name === 'mod.rs') return dirname(fromFileAbs)
  return join(dirname(fromFileAbs), name.replace(/\.rs$/, ''))
}

function moduleCandidates(baseAbs) {
  const candidates = []
  const file = `${baseAbs}.rs`
  if (isFile(file)) candidates.push(file)
  const mod = join(baseAbs, 'mod.rs')
  if (isFile(mod)) candidates.push(mod)
  return candidates
}

function crateRootCandidates(crateRoot) {
  const candidates = []
  const lib = join(crateRoot, 'lib.rs')
  if (isFile(lib)) candidates.push(lib)
  const main = join(crateRoot, 'main.rs')
  if (isFile(main)) candidates.push(main)
  return candidates
}

function moduleFileCandidates(start, crateRoot) {
  return start === crateRoot ? crateRootCandidates(crateRoot) : moduleCandidates(start)
}

function resolveRustImport({ specifier, fromFileAbs, rootAbs }) {
  if (typeof specifier !== 'string' || specifier.trim() === '') {
    return { type: 'unresolved', reason: 'not-found' }
  }

  const parts = specifier.trim().split('::').filter(Boolean)
  const head = parts[0]
  const crateRoot = crateRootDir(rootAbs)
  const current = currentModuleDir(fromFileAbs, crateRoot)

  let start
  let rest
  if (head === 'crate') {
    start = crateRoot
    rest = parts.slice(1)
  } else if (head === 'self') {
    start = current
    rest = parts.slice(1)
  } else if (head === 'super') {
    start = current
    let index = 0
    while (parts[index] === 'super') {
      start = dirname(start)
      index += 1
    }
    rest = parts.slice(index)
    const rel = relative(crateRoot, start)
    if (rel.startsWith('..') || isAbsolute(rel)) {
      return { type: 'unresolved', reason: 'outside-root' }
    }
  } else {
    return { type: 'external' }
  }

  if (rest.length === 0) {
    const candidates = moduleFileCandidates(start, crateRoot)
    if (candidates.length === 0) return { type: 'unresolved', reason: 'not-found' }
    return finalize(candidates, rootAbs)
  }

  let candidates = moduleCandidates(join(start, ...rest))
  if (candidates.length === 0 && rest.length > 1) {
    candidates = moduleCandidates(join(start, ...rest.slice(0, -1)))
  }
  if (candidates.length === 0 && rest.length === 1) {
    candidates = moduleFileCandidates(start, crateRoot)
  }
  if (candidates.length === 0) return { type: 'unresolved', reason: 'not-found' }
  return finalize(candidates, rootAbs)
}

function finalize(candidates, rootAbs) {
  const unique = [...new Set(candidates)]
  if (unique.length > 1) {
    return {
      type: 'unresolved',
      reason: 'ambiguous',
      candidates: unique.map((candidate) => toPosix(relative(rootAbs, candidate)))
    }
  }

  const target = unique[0]
  const rel = relative(rootAbs, target)
  if (rel.startsWith('..') || isAbsolute(rel)) {
    return { type: 'unresolved', reason: 'outside-root' }
  }
  return { type: 'resolved', target: toPosix(rel) }
}

export function createRustAdapter() {
  const parser = new Parser()
  parser.setLanguage(Rust)

  return {
    id: 'rust',
    extensions: ['.rs'],

    parse({ path, lang, source }) {
      const tree = parser.parse(source)
      const root = tree.rootNode
      const imports = []
      const importedNames = new Set()
      const symbols = []
      const inheritance = []

      collectImports(root, imports, importedNames)
      collectItems(root, symbols, inheritance, source)
      symbols.sort((a, b) => a.line - b.line || a.name.localeCompare(b.name))
      const calls = collectCalls(root, symbols)

      return {
        path,
        lang,
        imports,
        unresolved: [],
        symbols,
        calls,
        inheritance,
        importedNames: [...importedNames].sort()
      }
    },

    resolveImport(context) {
      return resolveRustImport(context)
    }
  }
}
