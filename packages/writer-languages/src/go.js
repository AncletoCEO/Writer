// SPDX-License-Identifier: AGPL-3.0-only

import { readFileSync, readdirSync, statSync } from 'node:fs'
import { isAbsolute, join, relative } from 'node:path'
import Parser from 'tree-sitter'
import Go from 'tree-sitter-go'

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

function isExported(name) {
  return /^[A-Z]/.test(String(name))
}

function unquote(text) {
  return String(text ?? '').trim().replace(/^"|"$/g, '')
}

function importedName(specifier) {
  const parts = String(specifier).split('/')
  return parts[parts.length - 1] || null
}

function summaryBefore(source, node) {
  const lines = source.split(/\r?\n/)
  let index = node.startPosition.row - 1
  const collected = []

  while (index >= 0) {
    const line = lines[index].trim()
    if (line === '') break
    if (line.startsWith('//')) {
      collected.unshift(line.replace(/^\/\/\/?\s?/, '').trim())
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
        .replace(/^\s*\/\*+/, '')
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

  return (
    collected
      .map((entry) => entry.trim())
      .find((entry) => entry && !entry.startsWith('go:') && !entry.startsWith('+build')) ?? null
  )
}

function baseTypeName(node) {
  if (!node) return null
  if (node.type === 'type_identifier') return normalize(node.text)
  if (node.type === 'qualified_type') return normalize(node.text)
  if (node.type === 'pointer_type' || node.type === 'parenthesized_type' || node.type === 'generic_type') {
    return baseTypeName(node.namedChildren[0])
  }
  return null
}

function receiverOwner(node) {
  const receiver = node.childForFieldName('receiver')
  if (!receiver) return null
  const parameter = receiver.namedChildren[0]
  const typeNode = parameter?.childForFieldName('type') ?? parameter?.namedChildren[0]
  const name = baseTypeName(typeNode)
  return name ? name.split('.').pop() : null
}

function signatureFor(node, name) {
  const parameters = node.childForFieldName('parameters')
  const result = node.childForFieldName('result')
  return `${name}${normalize(parameters?.text) || '()'}${result ? ` ${normalize(result.text)}` : ''}`
}

function collectImports(root, imports, importedNames) {
  walk(root, (node) => {
    if (node.type !== 'import_spec') return
    const pathNode = node.childForFieldName('path')
    if (!pathNode) return
    const specifier = unquote(pathNode.text)
    if (!specifier) return
    imports.push({
      specifier,
      kind: 'static',
      line: lineOf(node),
      confidence: 'extracted'
    })

    const alias = node.childForFieldName('name')?.text ?? null
    if (alias === '_') return
    if (alias === '.') return
    const bound = alias ?? importedName(specifier)
    if (bound) importedNames.add(bound)
  })
}

function collectStructEmbedding(typeNode, child, inheritance) {
  const list = typeNode.namedChildren.find((node) => node.type === 'field_declaration_list')
  if (!list) return
  for (const field of list.namedChildren) {
    if (field.type !== 'field_declaration') continue
    if (field.childForFieldName('name')) continue
    const parent = baseTypeName(field.childForFieldName('type'))
    if (!parent) continue
    inheritance.push({
      child,
      parent,
      line: lineOf(field),
      implements: false,
      confidence: 'inferred'
    })
  }
}

function collectInterfaceElements(typeNode, owner, symbols, inheritance, source) {
  for (const element of typeNode.namedChildren) {
    if (element.type === 'method_elem') {
      const nameNode = element.childForFieldName('name')
      const name = nameNode?.text
      if (!name) continue
      const parameters = element.childForFieldName('parameters')
      const result = element.childForFieldName('result')
      symbols.push({
        name,
        kind: 'method',
        exported: isExported(name),
        owner,
        summary: summaryBefore(source, element),
        line: lineOf(element),
        endLine: endLineOf(element),
        signature: `${name}${normalize(parameters?.text) || '()'}${result ? ` ${normalize(result.text)}` : ''}`,
        nameOffset: nameNode.startIndex,
        startOffset: element.startIndex,
        endOffset: element.endIndex
      })
    } else if (element.type === 'type_elem') {
      const parent = normalize(element.text)
      if (parent) {
        inheritance.push({
          child: owner,
          parent,
          line: lineOf(element),
          implements: false,
          confidence: 'inferred'
        })
      }
    }
  }
}

function collectTypes(root, symbols, inheritance, source) {
  for (const node of root.namedChildren) {
    if (node.type === 'type_declaration') {
      const specs = []
      for (const child of node.namedChildren) {
        if (child.type === 'type_spec') specs.push(child)
        else if (child.type === 'type_spec_list') {
          specs.push(...child.namedChildren.filter((entry) => entry.type === 'type_spec'))
        }
      }
      for (const spec of specs) {
        const nameNode = spec.childForFieldName('name')
        const name = nameNode?.text
        const typeNode = spec.childForFieldName('type')
        if (!name || !typeNode) continue
        const kind =
          typeNode.type === 'struct_type'
            ? 'class'
            : typeNode.type === 'interface_type'
              ? 'interface'
              : 'type'
        const signature =
          kind === 'class'
            ? `type ${name} struct`
            : kind === 'interface'
              ? `type ${name} interface`
              : `type ${name} ${normalize(typeNode.text)}`
        symbols.push({
          name,
          kind,
          exported: isExported(name),
          owner: null,
          summary: summaryBefore(source, node),
          line: lineOf(node),
          endLine: endLineOf(node),
          signature,
          nameOffset: nameNode.startIndex,
          startOffset: node.startIndex,
          endOffset: node.endIndex
        })
        if (typeNode.type === 'struct_type') {
          collectStructEmbedding(typeNode, name, inheritance)
        } else if (typeNode.type === 'interface_type') {
          collectInterfaceElements(typeNode, name, symbols, inheritance, source)
        }
      }
    } else if (node.type === 'function_declaration' || node.type === 'method_declaration') {
      const nameNode = node.childForFieldName('name')
      const name = nameNode?.text
      if (!name) continue
      const owner = node.type === 'method_declaration' ? receiverOwner(node) : null
      const body = node.childForFieldName('body')
      symbols.push({
        name,
        kind: owner ? 'method' : 'function',
        exported: isExported(name),
        owner,
        summary: summaryBefore(source, node),
        line: lineOf(node),
        endLine: endLineOf(body ?? node),
        signature: signatureFor(node, name),
        nameOffset: nameNode.startIndex,
        startOffset: node.startIndex,
        endOffset: (body ?? node).endIndex
      })
    }
  }
}

function callName(fn) {
  if (!fn) return null
  if (fn.type === 'identifier') return fn.text
  if (fn.type === 'selector_expression') {
    return fn.childForFieldName('field')?.text ?? normalize(fn.text).split('.').pop()
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

function isDirectory(path) {
  try {
    return statSync(path).isDirectory()
  } catch {
    return false
  }
}

function readModulePath(rootAbs, cache) {
  if (cache.has(rootAbs)) return cache.get(rootAbs)
  let modulePath = null
  try {
    const content = readFileSync(join(rootAbs, 'go.mod'), 'utf8')
    const match = /^\s*module\s+(\S+)/m.exec(content)
    if (match) modulePath = match[1]
  } catch {
    modulePath = null
  }
  cache.set(rootAbs, modulePath)
  return modulePath
}

function packageFiles(dirAbs) {
  try {
    return readdirSync(dirAbs, { withFileTypes: true })
      .filter(
        (entry) =>
          entry.isFile() && entry.name.endsWith('.go') && !entry.name.endsWith('_test.go')
      )
      .map((entry) => join(dirAbs, entry.name))
      .sort()
  } catch {
    return []
  }
}

function createResolver(cache) {
  return function resolveGoImport({ specifier, rootAbs }) {
    if (typeof specifier !== 'string' || specifier.trim() === '') {
      return { type: 'unresolved', reason: 'not-found' }
    }
    const clean = specifier.trim()
    const modulePath = readModulePath(rootAbs, cache)
    if (!modulePath) return { type: 'external' }

    let relativePath = null
    if (clean === modulePath) relativePath = ''
    else if (clean.startsWith(`${modulePath}/`)) relativePath = clean.slice(modulePath.length + 1)
    if (relativePath === null) return { type: 'external' }

    const dirAbs = relativePath ? join(rootAbs, ...relativePath.split('/')) : rootAbs
    const rel = relative(rootAbs, dirAbs)
    if (rel.startsWith('..') || isAbsolute(rel)) {
      return { type: 'unresolved', reason: 'outside-root' }
    }
    if (!isDirectory(dirAbs)) return { type: 'unresolved', reason: 'not-found' }

    const files = packageFiles(dirAbs)
    if (files.length === 0) return { type: 'unresolved', reason: 'not-found' }
    return {
      type: 'resolved',
      targets: files.map((file) => toPosix(relative(rootAbs, file)))
    }
  }
}

export function createGoAdapter() {
  const parser = new Parser()
  parser.setLanguage(Go)
  const moduleCache = new Map()
  const resolveImport = createResolver(moduleCache)

  return {
    id: 'go',
    extensions: ['.go'],

    parse({ path, lang, source }) {
      const tree = parser.parse(source)
      const root = tree.rootNode
      const imports = []
      const importedNames = new Set()
      const symbols = []
      const inheritance = []

      collectImports(root, imports, importedNames)
      collectTypes(root, symbols, inheritance, source)
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

    resolveImport
  }
}
