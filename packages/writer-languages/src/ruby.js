// SPDX-License-Identifier: AGPL-3.0-only

import { createRequire } from 'node:module'
import { statSync } from 'node:fs'
import { dirname, isAbsolute, relative, resolve } from 'node:path'
import Parser from 'tree-sitter'

const require = createRequire(import.meta.url)
const Ruby = require('tree-sitter-ruby')

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

function summaryBefore(source, node) {
  const lines = source.split(/\r?\n/)
  let index = node.startPosition.row - 1
  const collected = []

  while (index >= 0) {
    const line = lines[index].trim()
    if (!line.startsWith('#')) break
    collected.unshift(line.replace(/^#\s?/, '').trim())
    index -= 1
  }

  return (
    collected.find(
      (entry) =>
        entry !== '' &&
        !entry.startsWith('frozen_string_literal') &&
        !entry.startsWith('encoding:') &&
        !entry.startsWith('rubocop:')
    ) ?? null
  )
}

function addSymbol(symbols, symbol) {
  if (!symbol.name) return
  const duplicate = symbols.some(
    (current) => current.name === symbol.name && current.startOffset === symbol.startOffset
  )
  if (!duplicate) symbols.push(symbol)
}

function baseName(node) {
  if (!node) return null
  const text = normalize(node.text)
  if (!text) return null
  return text.split('::').pop()
}

function methodParameters(node) {
  return node.childForFieldName('parameters')?.text ?? ''
}

function addMethod(node, owner, exported, symbols, source) {
  const nameNode = node.childForFieldName('name')
  const name = nameNode?.text
  if (!name) return
  const body = node.childForFieldName('body')
  const parameters = normalize(methodParameters(node))
  addSymbol(symbols, {
    name,
    kind: owner ? 'method' : 'function',
    exported,
    owner: owner ?? null,
    summary: summaryBefore(source, node),
    line: lineOf(node),
    endLine: endLineOf(body ?? node),
    signature: `${name}${parameters || '()'}`,
    nameOffset: nameNode.startIndex,
    startOffset: node.startIndex,
    endOffset: (body ?? node).endIndex
  })
}

function stringContent(node) {
  if (!node) return null
  if (node.type !== 'string') return null
  const content = node.namedChildren.find((child) => child.type === 'string_content')
  return content ? normalize(content.text) : normalize(node.text.replace(/^['"]|['"]$/g, ''))
}

function callMethod(node) {
  return node.childForFieldName('method')?.text ?? null
}

function argumentConstants(node) {
  const list = node.childForFieldName('arguments')
  if (!list) return []
  return list.namedChildren
    .map((child) => baseName(child))
    .filter(Boolean)
}

function processCall(node, owner, inheritance, imports, unresolved) {
  const method = callMethod(node)
  if (!method) return

  if (method === 'require' || method === 'require_relative' || method === 'load') {
    const argument = node.childForFieldName('arguments')?.namedChildren[0]
    const specifier = stringContent(argument)
    if (!specifier) {
      if (method === 'require_relative') {
        unresolved.push({ line: lineOf(node), reason: 'non-literal', kind: 'require' })
      }
      return
    }
    imports.push({
      specifier,
      kind: 'static',
      line: lineOf(node),
      confidence: 'extracted',
      relative: method === 'require_relative'
    })
    return
  }

  if (method === 'include' || method === 'extend' || method === 'prepend') {
    if (!owner) return
    for (const parent of argumentConstants(node)) {
      inheritance.push({
        child: owner,
        parent,
        line: lineOf(node),
        implements: true,
        confidence: 'inferred'
      })
    }
  }
}

function processBody(body, owner, defaultVisibility, symbols, inheritance, imports, unresolved, source) {
  if (!body) return
  let visibility = defaultVisibility

  for (const child of body.namedChildren) {
    if (child.type === 'comment') continue

    if (child.type === 'identifier') {
      if (child.text === 'private' || child.text === 'protected' || child.text === 'public') {
        visibility = child.text
      }
      continue
    }

    if (child.type === 'call') {
      const method = callMethod(child)
      if (method === 'private' || method === 'protected' || method === 'public') {
        if (!child.childForFieldName('arguments')) visibility = method
        continue
      }
      processCall(child, owner, inheritance, imports, unresolved)
      continue
    }

    if (child.type === 'method' || child.type === 'singleton_method') {
      addMethod(child, owner, owner ? visibility === 'public' : true, symbols, source)
      continue
    }

    if (child.type === 'class' || child.type === 'module') {
      processType(child, symbols, inheritance, imports, unresolved, source)
      continue
    }
  }
}

function processType(node, symbols, inheritance, imports, unresolved, source) {
  const nameNode = node.childForFieldName('name')
  const name = nameNode?.text
  if (!name) return
  const kind = 'class'
  const prefix = node.type === 'module' ? 'module' : 'class'

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

  const superclass = node.childForFieldName('superclass')
  if (superclass) {
    const parent = baseName(superclass.namedChildren[0])
    if (parent) {
      inheritance.push({
        child: name,
        parent,
        line: lineOf(superclass),
        implements: false,
        confidence: 'inferred'
      })
    }
  }

  const body = node.childForFieldName('body')
  processBody(body, name, 'public', symbols, inheritance, imports, unresolved, source)
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
    if (node.type !== 'call') return
    const callee = callMethod(node)
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

function resolveRubyImport({ specifier, fromFileAbs, rootAbs, importEntry }) {
  if (!importEntry?.relative) return { type: 'external' }
  if (typeof specifier !== 'string' || specifier.trim() === '') {
    return { type: 'unresolved', reason: 'not-found' }
  }

  const clean = specifier.trim()
  const base = resolve(dirname(fromFileAbs), clean)
  const candidates = clean.endsWith('.rb') ? [base] : [base, `${base}.rb`]

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

export function createRubyAdapter() {
  const parser = new Parser()
  parser.setLanguage(Ruby)

  return {
    id: 'ruby',
    extensions: ['.rb'],

    parse({ path, lang, source }) {
      const tree = parser.parse(source)
      const root = tree.rootNode
      const imports = []
      const symbols = []
      const inheritance = []
      const unresolved = []

      processBody(
        root,
        null,
        'public',
        symbols,
        inheritance,
        imports,
        unresolved,
        source
      )
      symbols.sort((a, b) => a.line - b.line || a.name.localeCompare(b.name))
      const calls = collectCalls(root, symbols)

      return {
        path,
        lang,
        imports,
        unresolved,
        symbols,
        calls,
        inheritance,
        importedNames: []
      }
    },

    resolveImport(context) {
      return resolveRubyImport(context)
    }
  }
}
