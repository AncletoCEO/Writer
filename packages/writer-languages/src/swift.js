// SPDX-License-Identifier: AGPL-3.0-only

import { createRequire } from 'node:module'
import Parser from 'tree-sitter'

const require = createRequire(import.meta.url)
const Swift = require('tree-sitter-swift')

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

function hasPublicModifier(node) {
  const modifiers = findChild(node, 'modifiers')
  return Boolean(modifiers && /\b(public|open)\b/.test(modifiers.text))
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
    if (line.startsWith('@')) {
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
      collected.unshift(...block)
      index = start - 1
      break
    }
    break
  }

  return collected.map((entry) => entry.trim()).find(Boolean) ?? null
}

function addSymbol(symbols, symbol) {
  if (!symbol.name) return
  const duplicate = symbols.some(
    (current) => current.name === symbol.name && current.startOffset === symbol.startOffset
  )
  if (!duplicate) symbols.push(symbol)
}

function parameterText(node) {
  return node.namedChildren
    .filter((child) => child.type === 'parameter')
    .map((child) => normalize(child.text))
    .join(', ')
}

function methodName(node) {
  if (node.type === 'init_declaration') return 'init'
  if (node.type === 'deinit_declaration') return 'deinit'
  return node.childForFieldName('name')?.text ?? findChild(node, 'simple_identifier')?.text ?? null
}

function addMethod(node, owner, ownerExported, symbols, source, { protocol = false } = {}) {
  const name = methodName(node)
  if (!name) return
  const body =
    findChild(node, 'function_body') ??
    findChild(node, 'statements') ??
    null
  addSymbol(symbols, {
    name,
    kind: 'method',
    exported: hasPublicModifier(node) || (protocol && ownerExported),
    owner,
    summary: summaryBefore(source, node),
    line: lineOf(node),
    endLine: endLineOf(body ?? node),
    signature: `${name}(${parameterText(node)})`,
    nameOffset: node.startIndex,
    startOffset: node.startIndex,
    endOffset: (body ?? node).endIndex
  })
}

function baseNames(node) {
  return node.namedChildren
    .map((child) => {
      if (child.type === 'user_type') {
        const identifier = child.namedChildren.find(
          (entry) => entry.type === 'type_identifier'
        )
        return identifier?.text ?? null
      }
      return null
    })
    .filter(Boolean)
}

function processMembers(body, owner, ownerExported, symbols, inheritance, source, options = {}) {
  if (!body) return
  for (const child of body.namedChildren) {
    if (
      child.type === 'function_declaration' ||
      child.type === 'init_declaration' ||
      child.type === 'deinit_declaration' ||
      child.type === 'protocol_function_declaration'
    ) {
      addMethod(child, owner, ownerExported, symbols, source, options)
    } else if (child.type === 'typealias_declaration') {
      processTypeAlias(child, symbols, source)
    } else if (child.type === 'class_declaration' || child.type === 'protocol_declaration') {
      processType(child, symbols, inheritance, source)
    }
  }
}

function processTypeAlias(node, symbols, source) {
  const nameNode =
    node.childForFieldName('name') ??
    node.namedChildren.find((child) => child.type === 'type_identifier')
  const name = nameNode?.text
  if (!name) return
  addSymbol(symbols, {
    name,
    kind: 'type',
    exported: hasPublicModifier(node),
    owner: null,
    summary: summaryBefore(source, node),
    line: lineOf(node),
    endLine: endLineOf(node),
    signature: `typealias ${name}`,
    nameOffset: nameNode.startIndex,
    startOffset: node.startIndex,
    endOffset: node.endIndex
  })
}

function processInheritance(node, child, inheritance) {
  for (const specifier of node.namedChildren.filter(
    (entry) => entry.type === 'inheritance_specifier'
  )) {
    for (const parent of baseNames(specifier)) {
      inheritance.push({
        child,
        parent,
        line: lineOf(specifier),
        implements: false,
        confidence: 'inferred'
      })
    }
  }
}

function processType(node, symbols, inheritance, source) {
  const head = normalize(node.text)
  const keyword = /\b(class|struct|enum|actor|extension)\b/.exec(head)?.[1] ?? null

  if (node.type === 'protocol_declaration') {
    const nameNode =
      node.childForFieldName('name') ??
      node.namedChildren.find((child) => child.type === 'type_identifier')
    const name = nameNode?.text
    if (!name) return
    const exported = hasPublicModifier(node)
    addSymbol(symbols, {
      name,
      kind: 'interface',
      exported,
      owner: null,
      summary: summaryBefore(source, node),
      line: lineOf(node),
      endLine: endLineOf(node),
      signature: `protocol ${name}`,
      nameOffset: nameNode.startIndex,
      startOffset: node.startIndex,
      endOffset: node.endIndex
    })
    processInheritance(node, name, inheritance)
    processMembers(findChild(node, 'protocol_body'), name, exported, symbols, inheritance, source, {
      protocol: true
    })
    return
  }

  if (node.type !== 'class_declaration') return

  const nameNode =
    node.childForFieldName('name') ??
    node.namedChildren.find((child) => child.type === 'type_identifier') ??
    node.namedChildren.find((child) => child.type === 'user_type')
  const name = nameNode?.text?.split('.').pop()
  if (!name) return

  if (keyword === 'extension') {
    processInheritance(node, name, inheritance)
    processMembers(findChild(node, 'class_body'), name, true, symbols, inheritance, source)
    return
  }

  const kind = keyword === 'enum' ? 'enum' : 'class'
  const prefix = keyword ?? 'class'
  const exported = hasPublicModifier(node)
  addSymbol(symbols, {
    name,
    kind,
    exported,
    owner: null,
    summary: summaryBefore(source, node),
    line: lineOf(node),
    endLine: endLineOf(node),
    signature: `${prefix} ${name}`,
    nameOffset: nameNode.startIndex,
    startOffset: node.startIndex,
    endOffset: node.endIndex
  })
  processInheritance(node, name, inheritance)
  const body = findChild(node, 'class_body') ?? findChild(node, 'enum_class_body')
  processMembers(body, name, exported, symbols, inheritance, source)
}

function callName(node) {
  if (!node) return null
  if (node.type === 'simple_identifier') return node.text
  if (node.type === 'navigation_expression') return normalize(node.text).split('.').pop()
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
    const functionNode =
      node.namedChildren.find(
        (child) => child.type === 'simple_identifier' || child.type === 'navigation_expression'
      ) ?? null
    const callee = callName(functionNode)
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

function collectImports(root, imports) {
  for (const node of root.namedChildren) {
    if (node.type !== 'import_declaration') continue
    const name = normalize(node.namedChildren[0]?.text)
    if (!name) continue
    imports.push({
      specifier: name,
      kind: 'static',
      line: lineOf(node),
      confidence: 'extracted'
    })
  }
}

export function createSwiftAdapter() {
  const parser = new Parser()
  parser.setLanguage(Swift)

  return {
    id: 'swift',
    extensions: ['.swift'],

    parse({ path, lang, source }) {
      const tree = parser.parse(source)
      const root = tree.rootNode
      const imports = []
      const symbols = []
      const inheritance = []

      collectImports(root, imports)
      for (const node of root.namedChildren) {
        if (node.type === 'class_declaration' || node.type === 'protocol_declaration') {
          processType(node, symbols, inheritance, source)
        } else if (node.type === 'typealias_declaration') {
          processTypeAlias(node, symbols, source)
        } else if (node.type === 'function_declaration') {
          const nameNode = node.childForFieldName('name') ?? findChild(node, 'simple_identifier')
          const name = nameNode?.text
          if (name) {
            const body = findChild(node, 'function_body')
            addSymbol(symbols, {
              name,
              kind: 'function',
              exported: hasPublicModifier(node),
              owner: null,
              summary: summaryBefore(source, node),
              line: lineOf(node),
              endLine: endLineOf(body ?? node),
              signature: `${name}(${parameterText(node)})`,
              nameOffset: nameNode.startIndex,
              startOffset: node.startIndex,
              endOffset: (body ?? node).endIndex
            })
          }
        }
      }
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
        importedNames: []
      }
    },

    resolveImport() {
      return { type: 'external' }
    }
  }
}
