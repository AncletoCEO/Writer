// SPDX-License-Identifier: AGPL-3.0-only

import { createRequire } from 'node:module'
import { statSync } from 'node:fs'
import { dirname, isAbsolute, relative, resolve } from 'node:path'
import Parser from 'tree-sitter'

const require = createRequire(import.meta.url)
const C = require('tree-sitter-c')

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

function hasStatic(node) {
  return node.namedChildren.some(
    (child) => child.type === 'storage_class_specifier' && /\bstatic\b/.test(child.text)
  )
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

  return collected.map((entry) => entry.trim()).find(Boolean) ?? null
}

function declaratorName(node) {
  if (!node) return null
  if (node.type === 'identifier') return node.text
  if (node.type === 'function_declarator') {
    return declaratorName(
      node.childForFieldName('declarator') ??
        node.namedChildren.find((child) => child.type !== 'parameter_list')
    )
  }
  if (node.type === 'pointer_declarator' || node.type === 'parenthesized_declarator') {
    return declaratorName(node.namedChildren[0])
  }
  return null
}

function declaratorParameters(node) {
  if (!node) return null
  if (node.type === 'function_declarator') {
    return (
      node.childForFieldName('parameters') ??
      node.namedChildren.find((child) => child.type === 'parameter_list') ??
      null
    )
  }
  if (node.type === 'pointer_declarator' || node.type === 'parenthesized_declarator') {
    return declaratorParameters(node.namedChildren[0])
  }
  return null
}

function addSymbol(symbols, symbol) {
  if (!symbol.name) return
  const duplicate = symbols.some(
    (current) => current.name === symbol.name && current.startOffset === symbol.startOffset
  )
  if (!duplicate) symbols.push(symbol)
}

function addFunction(node, symbols, source) {
  const declarator = node.childForFieldName('declarator')
  const parameters = declaratorParameters(declarator)
  if (!parameters) return
  const name = declaratorName(declarator)
  if (!name) return
  const body = node.childForFieldName('body') ?? null
  addSymbol(symbols, {
    name,
    kind: 'function',
    exported: !hasStatic(node),
    owner: null,
    summary: summaryBefore(source, node),
    line: lineOf(node),
    endLine: endLineOf(body ?? node),
    signature: `${name}${normalize(parameters.text)}`,
    nameOffset: declarator?.startIndex ?? node.startIndex,
    startOffset: node.startIndex,
    endOffset: (body ?? node).endIndex
  })
}

function addStruct(node, name, symbols, source, { typedef = false } = {}) {
  addSymbol(symbols, {
    name,
    kind: 'class',
    exported: true,
    owner: null,
    summary: summaryBefore(source, node),
    line: lineOf(node),
    endLine: endLineOf(node),
    signature: `${typedef ? 'typedef struct' : 'struct'} ${name}`,
    nameOffset: node.childForFieldName('name')?.startIndex ?? node.startIndex,
    startOffset: node.startIndex,
    endOffset: node.endIndex
  })
}

function addEnum(node, name, symbols, source, { typedef = false } = {}) {
  addSymbol(symbols, {
    name,
    kind: 'enum',
    exported: true,
    owner: null,
    summary: summaryBefore(source, node),
    line: lineOf(node),
    endLine: endLineOf(node),
    signature: `${typedef ? 'typedef enum' : 'enum'} ${name}`,
    nameOffset: node.childForFieldName('name')?.startIndex ?? node.startIndex,
    startOffset: node.startIndex,
    endOffset: node.endIndex
  })
}

function addTypeAlias(node, name, symbols, source, signature) {
  addSymbol(symbols, {
    name,
    kind: 'type',
    exported: true,
    owner: null,
    summary: summaryBefore(source, node),
    line: lineOf(node),
    endLine: endLineOf(node),
    signature,
    nameOffset: node.childForFieldName('declarator')?.startIndex ?? node.startIndex,
    startOffset: node.startIndex,
    endOffset: node.endIndex
  })
}

function processTypedef(node, symbols, source) {
  const typeNode = node.childForFieldName('type')
  const alias = node.childForFieldName('declarator')?.text
  if (!alias) return

  if (typeNode?.type === 'struct_specifier') {
    const structName = typeNode.childForFieldName('name')?.text
    if (structName) {
      addStruct(typeNode, structName, symbols, source)
      if (alias !== structName) {
        addTypeAlias(node, alias, symbols, source, `typedef struct ${structName} ${alias}`)
      }
    } else {
      addStruct(typeNode, alias, symbols, source, { typedef: true })
    }
    return
  }

  if (typeNode?.type === 'enum_specifier') {
    const enumName = typeNode.childForFieldName('name')?.text
    if (enumName) {
      addEnum(typeNode, enumName, symbols, source)
      if (alias !== enumName) {
        addTypeAlias(node, alias, symbols, source, `typedef enum ${enumName} ${alias}`)
      }
    } else {
      addEnum(typeNode, alias, symbols, source, { typedef: true })
    }
    return
  }

  addTypeAlias(node, alias, symbols, source, `typedef ${alias}`)
}

function collectItems(container, symbols, source) {
  for (const node of container.namedChildren) {
    if (node.type === 'struct_specifier') {
      if (node.childForFieldName('body')) {
        const name = node.childForFieldName('name')?.text
        if (name) addStruct(node, name, symbols, source)
      }
    } else if (node.type === 'enum_specifier') {
      if (node.childForFieldName('body')) {
        const name = node.childForFieldName('name')?.text
        if (name) addEnum(node, name, symbols, source)
      }
    } else if (node.type === 'type_definition') {
      processTypedef(node, symbols, source)
    } else if (node.type === 'function_definition') {
      addFunction(node, symbols, source)
    } else if (node.type === 'declaration') {
      const declarator = node.childForFieldName('declarator')
      if (
        declarator?.type === 'function_declarator' ||
        declarator?.type === 'pointer_declarator' ||
        declarator?.type === 'parenthesized_declarator'
      ) {
        addFunction(node, symbols, source)
      }
    } else if (
      node.type === 'preproc_ifdef' ||
      node.type === 'preproc_if' ||
      node.type === 'preproc_else' ||
      node.type === 'preproc_elif' ||
      node.type === 'preproc_elifdef'
    ) {
      collectItems(node, symbols, source)
    }
  }
}

function collectIncludes(root, imports) {
  walk(root, (node) => {
    if (node.type !== 'preproc_include') return
    const child = node.namedChildren[0]
    if (!child) return
    let specifier = null
    let quoted = false
    if (child.type === 'string_literal') {
      specifier = normalize(child.text.replace(/^"|"$/g, ''))
      quoted = true
    } else if (child.type === 'system_lib_string') {
      specifier = normalize(child.text.replace(/^<|>$/g, ''))
      quoted = false
    }
    if (!specifier) return
    imports.push({
      specifier,
      kind: 'static',
      line: lineOf(node),
      confidence: 'extracted',
      quoted
    })
  })
}

function callName(node) {
  if (!node) return null
  if (node.type === 'identifier') return node.text
  if (node.type === 'field_expression') {
    return node.childForFieldName('field')?.text ?? normalize(node.text).split('.').pop()
  }
  if (node.type === 'parenthesized_expression') return callName(node.namedChildren[0])
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
    symbols.filter((symbol) => symbol.kind === 'function').map((symbol) => symbol.name)
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

function resolveCImport({ specifier, fromFileAbs, rootAbs, importEntry }) {
  if (!importEntry?.quoted) return { type: 'external' }
  if (typeof specifier !== 'string' || specifier.trim() === '') {
    return { type: 'unresolved', reason: 'not-found' }
  }

  const clean = specifier.trim()
  const candidates = isAbsolute(clean)
    ? [clean]
    : [
        resolve(dirname(fromFileAbs), clean),
        resolve(rootAbs, clean),
        resolve(rootAbs, 'include', clean)
      ]

  for (const candidate of candidates) {
    if (!isFile(candidate)) continue
    const rel = relative(rootAbs, candidate)
    if (rel.startsWith('..') || isAbsolute(rel)) {
      return { type: 'unresolved', reason: 'outside-root' }
    }
    return { type: 'resolved', target: toPosix(rel) }
  }

  return { type: 'unresolved', reason: 'not-found' }
}

export function createCAdapter() {
  const parser = new Parser()
  parser.setLanguage(C)

  return {
    id: 'c',
    extensions: ['.c', '.h'],

    parse({ path, lang, source }) {
      const tree = parser.parse(source)
      const root = tree.rootNode
      const imports = []
      const symbols = []

      collectIncludes(root, imports)
      collectItems(root, symbols, source)
      symbols.sort((a, b) => a.line - b.line || a.name.localeCompare(b.name))
      const calls = collectCalls(root, symbols)

      return {
        path,
        lang,
        imports,
        unresolved: [],
        symbols,
        calls,
        inheritance: [],
        importedNames: []
      }
    },

    resolveImport(context) {
      return resolveCImport(context)
    }
  }
}
