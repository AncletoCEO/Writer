// SPDX-License-Identifier: AGPL-3.0-only

import { createRequire } from 'node:module'
import { statSync } from 'node:fs'
import { dirname, isAbsolute, relative, resolve } from 'node:path'
import Parser from 'tree-sitter'

const require = createRequire(import.meta.url)
const Cpp = require('tree-sitter-cpp')

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

  return collected.map((entry) => entry.trim()).find(Boolean) ?? null
}

function declaratorParts(node) {
  if (!node) return { name: null, owner: null }
  if (node.type === 'qualified_identifier') {
    const parts = normalize(node.text).split('::')
    return {
      name: parts[parts.length - 1],
      owner: parts.length > 1 ? parts[parts.length - 2] : null
    }
  }
  if (node.type === 'destructor_name') {
    return { name: normalize(node.text), owner: null }
  }
  if (
    node.type === 'identifier' ||
    node.type === 'field_identifier' ||
    node.type === 'operator_name'
  ) {
    return { name: normalize(node.text), owner: null }
  }
  if (node.type === 'function_declarator') {
    return declaratorParts(node.childForFieldName('declarator') ?? node.namedChildren[0])
  }
  if (
    node.type === 'pointer_declarator' ||
    node.type === 'reference_declarator' ||
    node.type === 'parenthesized_declarator'
  ) {
    return declaratorParts(node.namedChildren[0])
  }
  return { name: null, owner: null }
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
  if (
    node.type === 'pointer_declarator' ||
    node.type === 'reference_declarator' ||
    node.type === 'parenthesized_declarator'
  ) {
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

function addMethod(node, owner, exported, symbols, source) {
  const declarator = node.childForFieldName('declarator')
  const parameters = declaratorParameters(declarator)
  if (!parameters) return
  const parts = declaratorParts(declarator)
  const resolvedOwner = owner ?? parts.owner
  if (!resolvedOwner || !parts.name) return

  const body =
    node.childForFieldName('body') ??
    findChild(node, 'compound_statement') ??
    null
  addSymbol(symbols, {
    name: parts.name,
    kind: 'method',
    exported,
    owner: resolvedOwner,
    summary: summaryBefore(source, node),
    line: lineOf(node),
    endLine: endLineOf(body ?? node),
    signature: `${parts.name}${normalize(parameters.text)}`,
    nameOffset: declarator?.startIndex ?? node.startIndex,
    startOffset: node.startIndex,
    endOffset: (body ?? node).endIndex
  })
}

function addFunction(node, symbols, source) {
  const declarator = node.childForFieldName('declarator')
  const parameters = declaratorParameters(declarator)
  if (!parameters) return
  const parts = declaratorParts(declarator)
  if (!parts.name) return
  const body =
    node.childForFieldName('body') ??
    findChild(node, 'compound_statement') ??
    null
  if (parts.owner) {
    addMethod(node, parts.owner, true, symbols, source)
    return
  }
  addSymbol(symbols, {
    name: parts.name,
    kind: 'function',
    exported: !hasStatic(node),
    owner: null,
    summary: summaryBefore(source, node),
    line: lineOf(node),
    endLine: endLineOf(body ?? node),
    signature: `${parts.name}${normalize(parameters.text)}`,
    nameOffset: declarator?.startIndex ?? node.startIndex,
    startOffset: node.startIndex,
    endOffset: (body ?? node).endIndex
  })
}

function baseTypeName(node) {
  if (!node) return null
  if (node.type === 'type_identifier' || node.type === 'qualified_identifier') {
    return normalize(node.text).split('::').pop()
  }
  if (node.type === 'template_type' || node.type === 'template_function') {
    return baseTypeName(node.namedChildren[0])
  }
  if (node.type === 'access_specifier' || node.type === 'virtual_specifier') return null
  return null
}

function addTypeSymbol(node, name, kind, prefix, symbols, source) {
  addSymbol(symbols, {
    name,
    kind,
    exported: true,
    owner: null,
    summary: summaryBefore(source, node),
    line: lineOf(node),
    endLine: endLineOf(node),
    signature: `${prefix} ${name}`,
    nameOffset: node.childForFieldName('name')?.startIndex ?? node.startIndex,
    startOffset: node.startIndex,
    endOffset: node.endIndex
  })
}

function processClass(node, symbols, inheritance, source) {
  const nameNode = node.childForFieldName('name')
  const name = nameNode?.text
  if (!name) return
  const prefix =
    node.type === 'struct_specifier'
      ? 'struct'
      : node.type === 'union_specifier'
        ? 'union'
        : 'class'
  addTypeSymbol(node, name, 'class', prefix, symbols, source)

  const bases = findChild(node, 'base_class_clause')
  for (const base of bases?.namedChildren ?? []) {
    const parent = baseTypeName(base)
    if (!parent) continue
    inheritance.push({
      child: name,
      parent,
      line: lineOf(base),
      implements: false,
      confidence: 'inferred'
    })
  }

  const body = findChild(node, 'field_declaration_list')
  processClassBody(body, name, prefix === 'class' ? 'private' : 'public', symbols, inheritance, source)
}

function processClassBody(body, owner, defaultAccess, symbols, inheritance, source) {
  if (!body) return
  let access = defaultAccess

  for (const child of body.namedChildren) {
    if (child.type === 'access_specifier') {
      access = child.text
      continue
    }
    if (child.type === 'field_declaration' || child.type === 'declaration') {
      const declarator = child.childForFieldName('declarator')
      if (declaratorParameters(declarator)) {
        addMethod(child, owner, access === 'public', symbols, source)
      }
      continue
    }
    if (child.type === 'function_definition') {
      addMethod(child, owner, access === 'public', symbols, source)
      continue
    }
    if (
      child.type === 'class_specifier' ||
      child.type === 'struct_specifier' ||
      child.type === 'union_specifier'
    ) {
      processClass(child, symbols, inheritance, source)
      continue
    }
    if (child.type === 'enum_specifier') {
      const name = child.childForFieldName('name')?.text
      if (name) addTypeSymbol(child, name, 'enum', 'enum', symbols, source)
      continue
    }
    if (child.type === 'alias_declaration') {
      const name = child.childForFieldName('name')?.text
      if (name) addTypeSymbol(child, name, 'type', 'using', symbols, source)
      continue
    }
    if (child.type === 'type_definition') {
      processTypedef(child, symbols, source)
    }
  }
}

function processTypedef(node, symbols, source) {
  const typeNode = node.childForFieldName('type')
  const alias = node.childForFieldName('declarator')?.text
  if (!alias) return

  if (typeNode?.type === 'struct_specifier') {
    const structName = typeNode.childForFieldName('name')?.text
    if (structName) {
      processClass(typeNode, symbols, [], source)
      if (alias !== structName) {
        addTypeSymbol(node, alias, 'type', 'typedef', symbols, source)
      }
    } else {
      addTypeSymbol(typeNode, alias, 'class', 'typedef struct', symbols, source)
    }
    return
  }

  if (typeNode?.type === 'enum_specifier') {
    const enumName = typeNode.childForFieldName('name')?.text
    if (enumName) {
      addTypeSymbol(typeNode, enumName, 'enum', 'enum', symbols, source)
      if (alias !== enumName) {
        addTypeSymbol(node, alias, 'type', 'typedef', symbols, source)
      }
    } else {
      addTypeSymbol(typeNode, alias, 'enum', 'typedef enum', symbols, source)
    }
    return
  }

  addTypeSymbol(node, alias, 'type', 'typedef', symbols, source)
}

function collectItems(container, symbols, inheritance, source) {
  for (const node of container.namedChildren) {
    if (
      node.type === 'class_specifier' ||
      node.type === 'struct_specifier' ||
      node.type === 'union_specifier'
    ) {
      processClass(node, symbols, inheritance, source)
    } else if (node.type === 'enum_specifier') {
      const name = node.childForFieldName('name')?.text
      if (name) addTypeSymbol(node, name, 'enum', 'enum', symbols, source)
    } else if (node.type === 'alias_declaration') {
      const name = node.childForFieldName('name')?.text
      if (name) addTypeSymbol(node, name, 'type', 'using', symbols, source)
    } else if (node.type === 'type_definition') {
      processTypedef(node, symbols, source)
    } else if (node.type === 'function_definition') {
      addFunction(node, symbols, source)
    } else if (node.type === 'declaration') {
      const typeNode = node.childForFieldName('type')
      if (
        typeNode?.type === 'class_specifier' ||
        typeNode?.type === 'struct_specifier' ||
        typeNode?.type === 'union_specifier'
      ) {
        processClass(typeNode, symbols, inheritance, source)
      } else if (typeNode?.type === 'enum_specifier') {
        const name = typeNode.childForFieldName('name')?.text
        if (name) addTypeSymbol(typeNode, name, 'enum', 'enum', symbols, source)
      }
      const declarator = node.childForFieldName('declarator')
      if (declaratorParameters(declarator)) addFunction(node, symbols, source)
    } else if (node.type === 'namespace_definition') {
      const body = findChild(node, 'declaration_list')
      if (body) collectItems(body, symbols, inheritance, source)
    } else if (node.type === 'template_declaration') {
      collectItems(node, symbols, inheritance, source)
    } else if (node.type === 'linkage_specification') {
      const body = findChild(node, 'declaration_list')
      if (body) collectItems(body, symbols, inheritance, source)
    } else if (
      node.type === 'preproc_ifdef' ||
      node.type === 'preproc_if' ||
      node.type === 'preproc_else' ||
      node.type === 'preproc_elif' ||
      node.type === 'preproc_elifdef'
    ) {
      collectItems(node, symbols, inheritance, source)
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
  if (node.type === 'qualified_identifier') return normalize(node.text).split('::').pop()
  if (node.type === 'field_expression') {
    return node.childForFieldName('field')?.text ?? normalize(node.text).split('.').pop()
  }
  if (node.type === 'template_function') return callName(node.namedChildren[0])
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

function resolveCppImport({ specifier, fromFileAbs, rootAbs, importEntry }) {
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

export function createCppAdapter() {
  const parser = new Parser()
  parser.setLanguage(Cpp)

  return {
    id: 'cpp',
    extensions: ['.cpp', '.cc', '.cxx', '.hpp', '.hh', '.hxx'],

    parse({ path, lang, source }) {
      const tree = parser.parse(source)
      const root = tree.rootNode
      const imports = []
      const symbols = []
      const inheritance = []

      collectIncludes(root, imports)
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
        importedNames: []
      }
    },

    resolveImport(context) {
      return resolveCppImport(context)
    }
  }
}
