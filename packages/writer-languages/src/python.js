// SPDX-License-Identifier: AGPL-3.0-only

import { statSync } from 'node:fs'
import { dirname, isAbsolute, join, relative } from 'node:path'
import Parser from 'tree-sitter'
import Python from 'tree-sitter-python'

function toPosix(path) {
  return String(path).split('\\').join('/')
}

function isFile(path) {
  try {
    return statSync(path).isFile()
  } catch {
    return false
  }
}

function lineOf(node) {
  return node.startPosition.row + 1
}

function endLineOf(node) {
  return node.endPosition.row + 1
}

function normalize(text) {
  return String(text ?? '').replace(/\s+/g, ' ').trim()
}

function walk(node, visit) {
  visit(node)
  for (const child of node.namedChildren) walk(child, visit)
}

function findChild(node, predicate) {
  for (const child of node.namedChildren) {
    if (predicate(child)) return child
  }
  return null
}

function stripStringLiteral(text) {
  let value = String(text ?? '').trim()
  if (value === '') return ''
  value = value.replace(/^[rRbBuUfF]{0,3}(?=["'])/, '')
  if (value.startsWith('"""') || value.startsWith("'''")) {
    value = value.slice(3, value.length >= 6 ? -3 : undefined)
  } else if (value.startsWith('"') || value.startsWith("'")) {
    value = value.slice(1, value.length >= 2 ? -1 : undefined)
  }
  return value
}

function summaryFromDocstring(node) {
  const body = node.childForFieldName('body')
  if (!body) return null
  const first = body.namedChildren[0]
  if (!first || first.type !== 'expression_statement') return null
  const inner = first.namedChildren[0]
  if (!inner || (inner.type !== 'string' && inner.type !== 'concatenated_string')) return null
  const cleaned = stripStringLiteral(inner.text)
  const line = cleaned
    .split('\n')
    .map((entry) => entry.trim())
    .find((entry) => entry !== '')
  return line ? normalize(line) : null
}

function baseName(node) {
  if (!node) return null
  if (node.type === 'identifier' || node.type === 'attribute') return normalize(node.text)
  if (node.type === 'subscript') {
    const value = node.childForFieldName('value') ?? node.namedChildren[0]
    return baseName(value)
  }
  return null
}

function paramsText(parameters) {
  if (!parameters) return '()'
  return normalize(parameters.text)
}

function basesText(bases) {
  if (!bases) return ''
  const text = normalize(bases.text)
  return text.startsWith('(') ? text : `(${text})`
}

function collectImports(root, imports, importedNames) {
  walk(root, (node) => {
    if (node.type === 'import_statement') {
      for (const clause of node.namedChildren) {
        let specifier = null
        let alias = null
        if (clause.type === 'aliased_import') {
          specifier = clause.childForFieldName('name')?.text ?? null
          alias = clause.childForFieldName('alias')?.text ?? null
        } else if (clause.type === 'dotted_name') {
          specifier = clause.text
        }
        if (!specifier) continue
        imports.push({
          specifier: normalize(specifier),
          kind: 'static',
          line: lineOf(clause),
          confidence: 'extracted'
        })
        const bound = alias ?? normalize(specifier).split('.')[0]
        if (bound && bound !== '*') importedNames.add(bound)
      }
      return
    }

    if (node.type === 'import_from_statement') {
      const moduleNode = node.childForFieldName('module_name')
      if (moduleNode?.text) {
        imports.push({
          specifier: normalize(moduleNode.text),
          kind: 'static',
          line: lineOf(node),
          confidence: 'extracted'
        })
      }
      const start = moduleNode ? node.namedChildren.indexOf(moduleNode) + 1 : 0
      const clauses = []
      for (let index = start; index < node.namedChildren.length; index += 1) {
        const clause = node.namedChildren[index]
        if (clause.type === 'parenthesized_import') {
          clauses.push(...clause.namedChildren)
        } else {
          clauses.push(clause)
        }
      }
      for (const clause of clauses) {
        if (clause.type === 'aliased_import') {
          const alias = clause.childForFieldName('alias')?.text
          const name = clause.childForFieldName('name')?.text
          if (alias) importedNames.add(alias)
          else if (name && !name.includes('.')) importedNames.add(name)
        } else if (clause.type === 'dotted_name') {
          const name = normalize(clause.text)
          if (name && !name.includes('.')) importedNames.add(name)
        }
      }
    }
  })
}

function pushSymbol(symbols, symbol) {
  if (!symbol.name) return
  const duplicate = symbols.some(
    (current) => current.name === symbol.name && current.startOffset === symbol.startOffset
  )
  if (!duplicate) symbols.push(symbol)
}

function processFunction(node, owner, decorated, symbols) {
  const nameNode = node.childForFieldName('name')
  const name = nameNode?.text
  if (!name) return
  const body = node.childForFieldName('body')
  const startNode = decorated ?? node
  const endNode = body ?? node
  pushSymbol(symbols, {
    name,
    kind: owner ? 'method' : 'function',
    exported: owner === null && !name.startsWith('_'),
    owner: owner ?? null,
    summary: summaryFromDocstring(node),
    line: lineOf(node),
    endLine: endLineOf(endNode),
    signature: `${name}${paramsText(node.childForFieldName('parameters'))}`,
    nameOffset: nameNode.startIndex,
    startOffset: startNode.startIndex,
    endOffset: endNode.endIndex
  })
}

function processDefinition(node, owner, decorated, symbols, inheritance) {
  if (node.type === 'function_definition') {
    processFunction(node, owner, decorated, symbols)
    return
  }
  if (node.type !== 'class_definition') return

  const nameNode = node.childForFieldName('name')
  const name = nameNode?.text
  if (!name) return
  const body = node.childForFieldName('body')
  const basesNode =
    node.childForFieldName('superclasses') ??
    findChild(node, (child) => child.type === 'argument_list')
  const startNode = decorated ?? node
  const endNode = body ?? node

  pushSymbol(symbols, {
    name,
    kind: 'class',
    exported: owner === null && !name.startsWith('_'),
    owner: owner ?? null,
    summary: summaryFromDocstring(node),
    line: lineOf(node),
    endLine: endLineOf(endNode),
    signature: `class ${name}${basesText(basesNode)}`,
    nameOffset: nameNode.startIndex,
    startOffset: startNode.startIndex,
    endOffset: endNode.endIndex
  })

  if (basesNode) {
    for (const base of basesNode.namedChildren) {
      const parent = baseName(base)
      if (!parent) continue
      inheritance.push({
        child: name,
        parent,
        line: lineOf(base),
        implements: false,
        confidence: 'inferred'
      })
    }
  }

  if (!body) return
  for (const child of body.namedChildren) {
    if (child.type === 'function_definition') {
      processFunction(child, name, null, symbols)
    } else if (child.type === 'decorated_definition') {
      const definition = child.childForFieldName('definition')
      if (definition?.type === 'function_definition') {
        processFunction(definition, name, child, symbols)
      }
    }
  }
}

function collectSymbols(root, symbols, inheritance) {
  for (const node of root.namedChildren) {
    if (node.type === 'class_definition' || node.type === 'function_definition') {
      processDefinition(node, null, null, symbols, inheritance)
    } else if (node.type === 'decorated_definition') {
      const definition = node.childForFieldName('definition')
      if (definition) processDefinition(definition, null, node, symbols, inheritance)
    }
  }
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
  const localNames = new Set(symbols.map((symbol) => symbol.name))
  const calls = []
  const seen = new Set()

  walk(root, (node) => {
    if (node.type !== 'call') return
    const fn = node.childForFieldName('function')
    let callee = null
    if (fn?.type === 'identifier') callee = fn.text
    else if (fn?.type === 'attribute') callee = fn.childForFieldName('attribute')?.text ?? null
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

function moduleCandidates(baseAbs, rest) {
  const candidates = []
  if (!rest) {
    for (const name of ['__init__.py', '__init__.pyi']) {
      const candidate = join(baseAbs, name)
      if (isFile(candidate)) candidates.push(candidate)
    }
    return candidates
  }

  const parts = rest.split('.').filter(Boolean)
  const base = join(baseAbs, ...parts)
  for (const extension of ['.py', '.pyi']) {
    const candidate = `${base}${extension}`
    if (isFile(candidate)) candidates.push(candidate)
  }
  for (const name of ['__init__.py', '__init__.pyi']) {
    const candidate = join(base, name)
    if (isFile(candidate)) candidates.push(candidate)
  }
  return candidates
}

function resolvePythonImport({ specifier, fromFileAbs, rootAbs }) {
  if (typeof specifier !== 'string' || specifier.trim() === '') {
    return { type: 'unresolved', reason: 'not-found' }
  }

  const clean = specifier.trim()
  const relativeMatch = /^(\.+)(.*)$/.exec(clean)

  if (relativeMatch) {
    const level = relativeMatch[1].length
    let baseDir = dirname(fromFileAbs)
    for (let index = 1; index < level; index += 1) baseDir = dirname(baseDir)
    const candidates = moduleCandidates(baseDir, relativeMatch[2])
    if (candidates.length === 0) return { type: 'unresolved', reason: 'not-found' }
    return finalize(candidates, rootAbs)
  }

  if (clean.startsWith('__future__')) return { type: 'external' }

  const candidates = moduleCandidates(rootAbs, clean)
  if (candidates.length === 0) return { type: 'external' }
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

export function createPythonAdapter() {
  const parser = new Parser()
  parser.setLanguage(Python)

  return {
    id: 'python',
    extensions: ['.py', '.pyi'],

    parse({ path, lang, source }) {
      const tree = parser.parse(source)
      const root = tree.rootNode
      const imports = []
      const importedNames = new Set()
      const symbols = []
      const inheritance = []

      collectImports(root, imports, importedNames)
      collectSymbols(root, symbols, inheritance)
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
      return resolvePythonImport(context)
    }
  }
}
