// SPDX-License-Identifier: AGPL-3.0-only

import { createRequire } from 'node:module'
import { relative } from 'node:path'
import Parser from 'tree-sitter'

const require = createRequire(import.meta.url)
const { php } = require('tree-sitter-php')

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

function findChild(node, type) {
  return node.namedChildren.find((child) => child.type === type) ?? null
}

function summaryBefore(source, node) {
  const lines = source.split(/\r?\n/)
  let index = node.startPosition.row - 1
  const collected = []

  while (index >= 0) {
    const line = lines[index].trim()
    if (line === '') break
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
      collected.unshift(...block)
      index = start - 1
      break
    }
    if (line.startsWith('//')) {
      collected.unshift(line.replace(/^\/\/\s?/, ''))
      index -= 1
      continue
    }
    break
  }

  return (
    collected
      .map((entry) => entry.trim())
      .find((entry) => entry && !entry.startsWith('@')) ?? null
  )
}

function visibilityOf(node) {
  return (
    node.namedChildren.find((child) => child.type === 'visibility_modifier')?.text ??
    'public'
  )
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
  const body = node.childForFieldName('body') ?? findChild(node, 'compound_statement')
  const parameters = node.childForFieldName('parameters') ?? findChild(node, 'formal_parameters')
  addSymbol(symbols, {
    name,
    kind: 'method',
    exported:
      visibilityOf(node) !== 'private' &&
      visibilityOf(node) !== 'protected' &&
      (visibilityOf(node) === 'public' || ownerExported),
    owner,
    summary: summaryBefore(source, node),
    line: lineOf(node),
    endLine: endLineOf(body ?? node),
    signature: `${name}${normalize(parameters?.text) || '()'}`,
    nameOffset: nameNode.startIndex,
    startOffset: node.startIndex,
    endOffset: (body ?? node).endIndex
  })
}

function processMembers(body, owner, ownerExported, symbols, inheritance, source) {
  if (!body) return
  for (const child of body.namedChildren) {
    if (child.type === 'method_declaration') {
      addMethod(child, owner, ownerExported, symbols, source)
    } else if (
      child.type === 'class_declaration' ||
      child.type === 'interface_declaration' ||
      child.type === 'trait_declaration' ||
      child.type === 'enum_declaration'
    ) {
      processType(child, symbols, inheritance, source)
    }
  }
}

function baseNames(node) {
  return node.namedChildren
    .filter((child) => child.type === 'name' || child.type === 'qualified_name')
    .map((child) => normalize(child.text).replace(/^\\/, ''))
}

function processType(node, symbols, inheritance, source) {
  const nameNode = node.childForFieldName('name')
  const name = nameNode?.text
  if (!name) return
  const kind =
    node.type === 'interface_declaration'
      ? 'interface'
      : node.type === 'enum_declaration'
        ? 'enum'
        : 'class'
  const prefix =
    node.type === 'interface_declaration'
      ? 'interface'
      : node.type === 'trait_declaration'
        ? 'trait'
        : node.type === 'enum_declaration'
          ? 'enum'
          : 'class'

  addSymbol(symbols, {
    name,
    kind,
    exported: true,
    owner: null,
    summary: summaryBefore(source, node),
    line: lineOf(node),
    endLine: endLineOf(node),
    signature: `${prefix} ${name}`,
    nameOffset: nameNode.startIndex,
    startOffset: node.startIndex,
    endOffset: node.endIndex
  })

  const base = findChild(node, 'base_clause')
  for (const parent of base ? baseNames(base) : []) {
    inheritance.push({
      child: name,
      parent,
      line: lineOf(base),
      implements: false,
      confidence: 'inferred'
    })
  }

  const interfaces = findChild(node, 'class_interface_clause')
  for (const parent of interfaces ? baseNames(interfaces) : []) {
    inheritance.push({
      child: name,
      parent,
      line: lineOf(interfaces),
      implements: true,
      confidence: 'inferred'
    })
  }

  const body =
    findChild(node, 'declaration_list') ?? findChild(node, 'enum_declaration_list')
  processMembers(body, name, kind === 'interface', symbols, inheritance, source)
}

function processFunction(node, symbols, source) {
  const nameNode = node.childForFieldName('name')
  const name = nameNode?.text
  if (!name) return
  const body = node.childForFieldName('body') ?? findChild(node, 'compound_statement')
  const parameters = node.childForFieldName('parameters') ?? findChild(node, 'formal_parameters')
  addSymbol(symbols, {
    name,
    kind: 'function',
    exported: true,
    owner: null,
    summary: summaryBefore(source, node),
    line: lineOf(node),
    endLine: endLineOf(body ?? node),
    signature: `${name}${normalize(parameters?.text) || '()'}`,
    nameOffset: nameNode.startIndex,
    startOffset: node.startIndex,
    endOffset: (body ?? node).endIndex
  })
}

function collectItems(container, prefix, namespaces, symbols, inheritance, source) {
  let current = prefix

  for (const node of container.namedChildren) {
    if (node.type === 'namespace_definition') {
      const name = normalize(node.childForFieldName('name')?.text)
      const full = current ? `${current}\\${name}` : name
      const body = findChild(node, 'compound_statement') ?? findChild(node, 'declaration_list')
      if (body) {
        namespaces.push(full)
        collectItems(body, full, namespaces, symbols, inheritance, source)
      } else {
        current = full
        namespaces.push(full)
      }
      continue
    }

    if (
      node.type === 'class_declaration' ||
      node.type === 'interface_declaration' ||
      node.type === 'trait_declaration' ||
      node.type === 'enum_declaration'
    ) {
      processType(node, symbols, inheritance, source)
    } else if (node.type === 'function_definition') {
      processFunction(node, symbols, source)
    }
  }
}

function collectUses(root, imports, importedNames) {
  walk(root, (node) => {
    if (node.type !== 'namespace_use_declaration') return
    const prefix = normalize(
      (findChild(node, 'namespace_name') ?? node.childForFieldName('name'))?.text
    )
    const group = findChild(node, 'namespace_use_group')

    if (group) {
      for (const clause of group.namedChildren) {
        if (clause.type !== 'namespace_use_clause') continue
        const names = clause.namedChildren.filter((child) => child.type === 'name')
        const target = names[0]?.text
        const alias = names[1]?.text ?? null
        if (!target) continue
        const specifier = target.includes('\\') || !prefix ? target : `${prefix}\\${target}`
        imports.push({
          specifier,
          kind: 'static',
          line: lineOf(node),
          confidence: 'extracted'
        })
        importedNames.add(alias ?? specifier.split('\\').pop())
      }
      return
    }

    const clause = findChild(node, 'namespace_use_clause')
    const target =
      clause?.childForFieldName('name')?.text ??
      clause?.namedChildren.find(
        (child) => child.type === 'qualified_name' || child.type === 'name'
      )?.text
    if (!target) return
    const names = clause?.namedChildren ?? []
    const alias =
      names.length > 1 && names[names.length - 1].type === 'name'
        ? names[names.length - 1].text
        : null
    imports.push({
      specifier: normalize(target).replace(/^\\/, ''),
      kind: 'static',
      line: lineOf(node),
      confidence: 'extracted'
    })
    importedNames.add(alias ?? normalize(target).split('\\').pop())
  })
}

function callName(node) {
  if (!node) return null
  if (node.type === 'name') return node.text
  const name =
    node.childForFieldName('name') ??
    node.namedChildren.find(
      (child) => child.type === 'name' || child.type === 'qualified_name'
    )
  if (!name) return null
  return normalize(name.text).split('\\').pop()
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
    if (
      node.type !== 'function_call_expression' &&
      node.type !== 'member_call_expression' &&
      node.type !== 'scoped_call_expression'
    ) {
      return
    }
    const callee = callName(node)
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

function resolvePhpImport({ specifier, fromFileAbs, rootAbs, namespaces }) {
  if (typeof specifier !== 'string' || specifier.trim() === '') {
    return { type: 'unresolved', reason: 'not-found' }
  }

  const clean = specifier.trim().replace(/^\\/, '')
  const parts = clean.split('\\').filter(Boolean)
  const from = toPosix(relative(rootAbs, fromFileAbs))

  for (let end = parts.length; end >= 1; end -= 1) {
    const key = parts.slice(0, end).join('\\')
    const targets = namespaces?.get(key)
    if (!targets || targets.length === 0) continue
    const filtered = targets.filter((target) => target !== from)
    if (filtered.length === 0) return { type: 'external' }
    return { type: 'resolved', targets: filtered }
  }

  return { type: 'external' }
}

export function createPhpAdapter() {
  const parser = new Parser()
  parser.setLanguage(php)

  return {
    id: 'php',
    extensions: ['.php'],

    parse({ path, lang, source }) {
      const tree = parser.parse(source)
      const root = tree.rootNode
      const imports = []
      const importedNames = new Set()
      const symbols = []
      const inheritance = []
      const namespaces = []

      collectUses(root, imports, importedNames)
      collectItems(root, '', namespaces, symbols, inheritance, source)
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
        importedNames: [...importedNames].sort(),
        namespaces: [...new Set(namespaces)].sort()
      }
    },

    resolveImport(context) {
      return resolvePhpImport(context)
    }
  }
}
