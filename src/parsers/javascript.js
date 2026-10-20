// SPDX-License-Identifier: AGPL-3.0-only
// Derived from ReadMenator readmenator/parsers/_javascript.py (commit dac48f868722620f0d01dac0d33102c5a514c03c),
// modified 2026-10-19 by AncletoCEO.

import { tokenizeWithComments } from './lexer.js'

const MODIFIERS = new Set([
  'default',
  'async',
  'abstract',
  'declare',
  'const',
  'let',
  'var'
])

const METHOD_MODIFIERS = new Set([
  'static',
  'async',
  'get',
  'set',
  'public',
  'private',
  'protected',
  'readonly',
  'override',
  'abstract'
])

function isPunct(token, value) {
  return token?.type === 'punctuator' && token.value === value
}

function isIdent(token, value) {
  return token?.type === 'identifier' && (value === undefined || token.value === value)
}

function isStringLike(token) {
  return token?.type === 'string' || (token?.type === 'template' && !token.hasExpressions)
}

function findMatching(tokens, startIndex, open, close) {
  let depth = 0
  for (let i = startIndex; i < tokens.length; i += 1) {
    const token = tokens[i]
    if (token.type === 'eof') break
    if (token.type === 'punctuator' && token.value === open) depth += 1
    else if (token.type === 'punctuator' && token.value === close) {
      depth -= 1
      if (depth === 0) return i
    }
  }
  return -1
}

function findOpeningAngleBackwards(tokens, closeIndex) {
  let depth = 0
  for (let i = closeIndex; i >= 0; i -= 1) {
    const token = tokens[i]
    if (token.type !== 'punctuator') continue
    if (token.value === '>') depth += 1
    else if (token.value === '>>') depth += 2
    else if (token.value === '>>>') depth += 3
    else if (token.value === '<') {
      depth -= 1
      if (depth === 0) return i
    }
  }
  return -1
}

function findMatchingAngle(tokens, startIndex) {
  let depth = 0
  for (let i = startIndex; i < tokens.length; i += 1) {
    const token = tokens[i]
    if (token.type === 'eof') break
    if (token.type !== 'punctuator') continue
    if (token.value === '<') depth += 1
    else if (token.value === '>') {
      depth -= 1
      if (depth <= 0) return i
    } else if (token.value === '>>') {
      depth -= 2
      if (depth <= 0) return i
    } else if (token.value === '>>>') {
      depth -= 3
      if (depth <= 0) return i
    } else if (token.value === ';' || token.value === '{' || token.value === '}') {
      return -1
    }
  }
  return -1
}

function findBodyStart(tokens, startIndex) {
  for (let i = startIndex; i < tokens.length; i += 1) {
    const token = tokens[i]
    if (token.type === 'eof') return -1
    if (isPunct(token, '{')) return i
    if (isPunct(token, ';')) return -1
  }
  return -1
}

function isExported(tokens, index) {
  for (let i = index - 1, steps = 0; i >= 0 && steps < 6; i -= 1, steps += 1) {
    const token = tokens[i]
    if (isIdent(token, 'export')) return true
    if (isIdent(token) && MODIFIERS.has(token.value)) continue
    if (isPunct(token, ';') || isPunct(token, '}')) return false
    return false
  }
  return false
}

function paramsText(source, tokens, openIndex, closeIndex) {
  if (openIndex < 0 || closeIndex < 0) return ''
  return source
    .slice(tokens[openIndex].end, tokens[closeIndex].start)
    .replace(/\s+/g, ' ')
    .trim()
}

function readDottedName(tokens, index) {
  if (!isIdent(tokens[index])) return { name: null, endIndex: index }
  let name = tokens[index].value
  let cursor = index + 1
  while (isPunct(tokens[cursor], '.') && isIdent(tokens[cursor + 1])) {
    name += `.${tokens[cursor + 1].value}`
    cursor += 2
  }
  return { name, endIndex: cursor }
}

function collectImportedNames(tokens, start, end, names) {
  let cursor = start
  if (isIdent(tokens[cursor], 'type')) cursor += 1

  if (isIdent(tokens[cursor]) && !isIdent(tokens[cursor], 'from')) {
    names.add(tokens[cursor].value)
    cursor += 1
    if (isPunct(tokens[cursor], ',')) cursor += 1
  }

  if (isPunct(tokens[cursor], '*')) {
    if (isIdent(tokens[cursor + 1], 'as') && isIdent(tokens[cursor + 2])) {
      names.add(tokens[cursor + 2].value)
    }
    return
  }

  if (isPunct(tokens[cursor], '{')) {
    cursor += 1
    while (cursor < end && !isPunct(tokens[cursor], '}')) {
      if (isIdent(tokens[cursor], 'type')) {
        cursor += 1
        continue
      }
      if (isIdent(tokens[cursor])) {
        if (isIdent(tokens[cursor + 1], 'as') && isIdent(tokens[cursor + 2])) {
          names.add(tokens[cursor + 2].value)
          cursor += 3
        } else {
          names.add(tokens[cursor].value)
          cursor += 1
        }
      } else {
        cursor += 1
      }
    }
  }
}

function extractImports(tokens) {
  const imports = []
  const unresolved = []
  const importedNames = new Set()
  const ranges = []

  for (let i = 0; i < tokens.length; i += 1) {
    const token = tokens[i]

    if (isIdent(token, 'import')) {
      const next = tokens[i + 1]
      if (isPunct(next, '.')) continue

      if (isPunct(next, '(')) {
        const close = findMatching(tokens, i + 1, '(', ')')
        const argument = tokens[i + 2]
        if (isStringLike(argument)) {
          imports.push({
            specifier: argument.value,
            kind: 'dynamic',
            line: token.line,
            confidence: 'extracted'
          })
        } else {
          unresolved.push({ line: token.line, reason: 'non-literal', kind: 'dynamic' })
        }
        const end = close >= 0 ? tokens[close].end : argument?.end ?? token.end
        ranges.push({ start: token.start, end })
        continue
      }

      if (isStringLike(next)) {
        imports.push({
          specifier: next.value,
          kind: 'side-effect',
          line: token.line,
          confidence: 'extracted'
        })
        ranges.push({ start: token.start, end: next.end })
        continue
      }

      const clauseStart = i + 1
      let fromIndex = -1
      for (let j = clauseStart; j < tokens.length && j < clauseStart + 200; j += 1) {
        if (tokens[j].type === 'eof') break
        if (isPunct(tokens[j], ';')) break
        if (isIdent(tokens[j], 'from') && isStringLike(tokens[j + 1])) {
          fromIndex = j
          break
        }
      }

      if (fromIndex >= 0) {
        const specifier = tokens[fromIndex + 1]
        imports.push({
          specifier: specifier.value,
          kind: 'static',
          line: token.line,
          confidence: 'extracted'
        })
        ranges.push({ start: token.start, end: specifier.end })
        collectImportedNames(tokens, clauseStart, fromIndex, importedNames)
      }
      continue
    }

    if (isIdent(token, 'export')) {
      let cursor = i + 1
      if (isIdent(tokens[cursor], 'type')) cursor += 1
      if (!isPunct(tokens[cursor], '*') && !isPunct(tokens[cursor], '{')) continue

      for (let j = cursor; j < tokens.length; j += 1) {
        const current = tokens[j]
        if (current.type === 'eof' || isPunct(current, ';')) break
        if (isIdent(current, 'from') && isStringLike(tokens[j + 1])) {
          imports.push({
            specifier: tokens[j + 1].value,
            kind: 're-export',
            line: token.line,
            confidence: 'extracted'
          })
          ranges.push({ start: token.start, end: tokens[j + 1].end })
          break
        }
      }
      continue
    }

    if (
      isIdent(token, 'require') &&
      isPunct(tokens[i + 1], '(') &&
      !isPunct(tokens[i - 1], '.') &&
      !isPunct(tokens[i - 1], '?.')
    ) {
      const close = findMatching(tokens, i + 1, '(', ')')
      const argument = tokens[i + 2]
      if (isStringLike(argument)) {
        imports.push({
          specifier: argument.value,
          kind: 'require',
          line: token.line,
          confidence: 'extracted'
        })
      } else {
        unresolved.push({ line: token.line, reason: 'non-literal', kind: 'require' })
      }
      const end = close >= 0 ? tokens[close].end : argument?.end ?? token.end
      ranges.push({ start: token.start, end })
    }
  }

  return { imports, unresolved, importedNames, ranges }
}

function addSymbol(symbols, symbol) {
  if (!symbol) return
  const duplicate = symbols.some(
    (current) => current.startOffset === symbol.startOffset && current.name === symbol.name
  )
  if (!duplicate) symbols.push(symbol)
}

function parseFunction(tokens, source, index) {
  let cursor = index + 1
  if (isPunct(tokens[cursor], '*')) cursor += 1

  let name = 'default'
  let nameOffset = tokens[index].start
  if (isIdent(tokens[cursor])) {
    name = tokens[cursor].value
    nameOffset = tokens[cursor].start
    cursor += 1
  }

  let open = -1
  let close = -1
  for (; cursor < tokens.length; cursor += 1) {
    const token = tokens[cursor]
    if (isPunct(token, '(')) {
      open = cursor
      close = findMatching(tokens, cursor, '(', ')')
      break
    }
    if (isPunct(token, ';') || isPunct(token, '{') || token.type === 'eof') break
  }
  if (open < 0 || close < 0) return null

  const body = findBodyStart(tokens, close + 1)
  const endIndex = body >= 0 ? findMatching(tokens, body, '{', '}') : -1
  const lastIndex = endIndex >= 0 ? endIndex : close

  return {
    name,
    kind: 'function',
    exported: isExported(tokens, index),
    line: tokens[index].line,
    endLine: tokens[lastIndex].line,
    signature: `${name}(${paramsText(source, tokens, open, close)})`,
    nameOffset,
    startOffset: tokens[index].start,
    endOffset: tokens[lastIndex].end
  }
}

function parseInheritance(tokens, startIndex, bodyIndex, child) {
  const entries = []
  let mode = null

  for (let i = startIndex; i < bodyIndex; i += 1) {
    const token = tokens[i]
    if (isIdent(token, 'extends')) {
      mode = 'extends'
      continue
    }
    if (isIdent(token, 'implements')) {
      mode = 'implements'
      continue
    }
    if (mode === 'extends' && !isIdent(token) && !isPunct(token, ',')) {
      mode = null
      continue
    }
    if (!mode || !isIdent(token)) continue

    const { name, endIndex } = readDottedName(tokens, i)
    if (!name) continue
    entries.push({
      child,
      parent: name,
      line: token.line,
      implements: mode === 'implements',
      confidence: 'inferred'
    })
    i = Math.max(i, endIndex - 1)
  }

  return entries
}

function extractMethods(tokens, source, bodyIndex, endIndex, owner) {
  const methods = []
  let depth = 1

  for (let i = bodyIndex + 1; i < endIndex; i += 1) {
    const token = tokens[i]

    if (isPunct(token, '{')) {
      depth += 1
      continue
    }
    if (isPunct(token, '}')) {
      depth -= 1
      if (depth === 0) break
      continue
    }
    if (depth !== 1 || !isPunct(token, '(')) continue

    let nameIndex = i - 1
    if (
      isPunct(tokens[nameIndex], '>') ||
      isPunct(tokens[nameIndex], '>>') ||
      isPunct(tokens[nameIndex], '>>>')
    ) {
      const genericOpen = findOpeningAngleBackwards(tokens, nameIndex)
      if (genericOpen >= 0) nameIndex = genericOpen - 1
    }
    if (isPunct(tokens[nameIndex], '?') || isPunct(tokens[nameIndex], '!')) nameIndex -= 1
    const nameToken = tokens[nameIndex]
    if (!isIdent(nameToken)) continue

    const before = tokens[nameIndex - 1]
    const allowed =
      !before ||
      isPunct(before, '{') ||
      isPunct(before, '}') ||
      isPunct(before, ';') ||
      isPunct(before, '*') ||
      isPunct(before, '#') ||
      (isIdent(before) && METHOD_MODIFIERS.has(before.value))
    if (!allowed) continue

    const close = findMatching(tokens, i, '(', ')')
    if (close < 0) continue

    const body = findBodyStart(tokens, close + 1)
    let end = close
    if (body >= 0 && isPunct(tokens[body], '{')) {
      const match = findMatching(tokens, body, '{', '}')
      end = match >= 0 ? match : body
    }

    methods.push({
      name: nameToken.value,
      kind: 'method',
      exported: false,
      owner,
      line: nameToken.line,
      endLine: tokens[end].line,
      signature: `${nameToken.value}(${paramsText(source, tokens, i, close)})`,
      nameOffset: nameToken.start,
      startOffset: nameToken.start,
      endOffset: tokens[end].end
    })

    i = Math.max(i, end)
    depth = 1
  }

  return methods
}

function parseClass(tokens, source, index) {
  let cursor = index + 1
  let name = 'default'
  let nameOffset = tokens[index].start
  if (isIdent(tokens[cursor])) {
    name = tokens[cursor].value
    nameOffset = tokens[cursor].start
    cursor += 1
  }

  let body = -1
  for (; cursor < tokens.length; cursor += 1) {
    const token = tokens[cursor]
    if (isPunct(token, '{')) {
      body = cursor
      break
    }
    if (isPunct(token, ';') || token.type === 'eof') break
  }
  if (body < 0) return null

  const endIndex = findMatching(tokens, body, '{', '}')
  const lastIndex = endIndex >= 0 ? endIndex : body
  const signature = source
    .slice(tokens[index].start, tokens[body].start)
    .replace(/\s+/g, ' ')
    .trim()

  return {
    symbol: {
      name,
      kind: 'class',
      exported: isExported(tokens, index),
      line: tokens[index].line,
      endLine: tokens[lastIndex].line,
      signature,
      nameOffset,
      startOffset: tokens[index].start,
      endOffset: tokens[lastIndex].end
    },
    methods: endIndex >= 0 ? extractMethods(tokens, source, body, endIndex, name) : [],
    inheritance: parseInheritance(tokens, cursor, body, name),
    endIndex: lastIndex
  }
}

function parseInterface(tokens, source, index) {
  let cursor = index + 1
  if (!isIdent(tokens[cursor])) return null
  const name = tokens[cursor].value
  cursor += 1

  let body = -1
  for (; cursor < tokens.length; cursor += 1) {
    const token = tokens[cursor]
    if (isPunct(token, '{')) {
      body = cursor
      break
    }
    if (isPunct(token, ';') || token.type === 'eof') break
  }
  if (body < 0) return null

  const endIndex = findMatching(tokens, body, '{', '}')
  const lastIndex = endIndex >= 0 ? endIndex : body

  return {
    symbol: {
      name,
      kind: 'interface',
      exported: isExported(tokens, index),
      line: tokens[index].line,
      endLine: tokens[lastIndex].line,
      signature: `interface ${name}`,
      nameOffset: tokens[index + 1].start,
      startOffset: tokens[index].start,
      endOffset: tokens[lastIndex].end
    },
    methods: endIndex >= 0 ? extractMethods(tokens, source, body, endIndex, name) : [],
    inheritance: parseInheritance(tokens, cursor, body, name),
    endIndex: lastIndex
  }
}

function findTypeEnd(tokens, startIndex) {
  let last = startIndex
  for (let i = startIndex; i < tokens.length; i += 1) {
    const token = tokens[i]
    if (token.type === 'eof') return last
    last = i
    if (isPunct(token, ';')) return i
    if (
      i > startIndex &&
      token.line > tokens[startIndex].line &&
      (isIdent(token, 'export') || isIdent(token, 'type') || isIdent(token, 'interface'))
    ) {
      return i - 1
    }
  }
  return last
}

function parseTypeAlias(tokens, index) {
  const nameToken = tokens[index + 1]
  if (!isIdent(nameToken)) return null

  const endIndex = findTypeEnd(tokens, index + 2)
  return {
    name: nameToken.value,
    kind: 'type',
    exported: isExported(tokens, index),
    line: tokens[index].line,
    endLine: tokens[endIndex].line,
    signature: `type ${nameToken.value}`,
    nameOffset: nameToken.start,
    startOffset: tokens[index].start,
    endOffset: tokens[endIndex].end
  }
}

function parseEnum(tokens, source, index) {
  const nameToken = tokens[index + 1]
  if (!isIdent(nameToken)) return null

  let body = -1
  for (let i = index + 2; i < tokens.length; i += 1) {
    if (isPunct(tokens[i], '{')) {
      body = i
      break
    }
    if (isPunct(tokens[i], ';') || tokens[i].type === 'eof') break
  }
  if (body < 0) return null

  const endIndex = findMatching(tokens, body, '{', '}')
  const lastIndex = endIndex >= 0 ? endIndex : body

  return {
    name: nameToken.value,
    kind: 'enum',
    exported: isExported(tokens, index),
    line: tokens[index].line,
    endLine: tokens[lastIndex].line,
    signature: source.slice(tokens[index].start, tokens[body].start).replace(/\s+/g, ' ').trim(),
    nameOffset: nameToken.start,
    startOffset: tokens[index].start,
    endOffset: tokens[lastIndex].end
  }
}

function parseArrow(tokens, index) {
  let cursor = index
  let isAsync = false

  if (isIdent(tokens[cursor], 'async')) {
    isAsync = true
    cursor += 1
  }

  if (isPunct(tokens[cursor], '<')) {
    const end = findMatchingAngle(tokens, cursor)
    if (end < 0) return null
    cursor = end + 1
  }

  let open = -1
  let close = -1
  let arrowIndex = -1

  if (isPunct(tokens[cursor], '(')) {
    const end = findMatching(tokens, cursor, '(', ')')
    if (end < 0 || !isPunct(tokens[end + 1], '=>')) return null
    open = cursor
    close = end
    arrowIndex = end + 1
  } else if (isIdent(tokens[cursor]) && isPunct(tokens[cursor + 1], '=>')) {
    arrowIndex = cursor + 1
  } else {
    return null
  }

  let endIndex = arrowIndex
  if (isPunct(tokens[arrowIndex + 1], '{')) {
    const match = findMatching(tokens, arrowIndex + 1, '{', '}')
    endIndex = match >= 0 ? match : arrowIndex + 1
  }

  return { open, close, arrowIndex, endIndex, isAsync }
}

function parseArrowDeclaration(tokens, source, index) {
  if (!isIdent(tokens[index + 1])) return null
  const name = tokens[index + 1].value
  let cursor = index + 2

  if (isPunct(tokens[cursor], ':')) {
    let depth = 0
    for (; cursor < tokens.length; cursor += 1) {
      const token = tokens[cursor]
      if (token.type === 'eof') break
      if (isPunct(token, '=') && depth === 0) break
      if (token.type === 'punctuator' && ['<', '(', '[', '{'].includes(token.value)) depth += 1
      if (token.type === 'punctuator' && ['>', ')', ']', '}'].includes(token.value)) depth -= 1
    }
  }

  if (!isPunct(tokens[cursor], '=')) return null
  const arrow = parseArrow(tokens, cursor + 1)
  if (!arrow) return null

  const params =
    arrow.open >= 0
      ? paramsText(source, tokens, arrow.open, arrow.close)
      : tokens[arrow.arrowIndex - 1].value
  const prefix = arrow.isAsync ? 'async ' : ''

  return {
    name,
    kind: 'function',
    exported: isExported(tokens, index),
    line: tokens[index].line,
    endLine: tokens[arrow.endIndex].line,
    signature: `${prefix}${name}(${params}) =>`,
    nameOffset: tokens[index + 1].start,
    startOffset: tokens[index].start,
    endOffset: tokens[arrow.endIndex].end
  }
}

function extractSymbols(tokens, source) {
  const symbols = []

  for (let i = 0; i < tokens.length; i += 1) {
    const token = tokens[i]
    if (token.type === 'eof') break

    if (isIdent(token, 'function')) {
      addSymbol(symbols, parseFunction(tokens, source, i))
      continue
    }

    if (isIdent(token, 'class')) {
      const parsed = parseClass(tokens, source, i)
      if (parsed) {
        addSymbol(symbols, parsed.symbol)
        for (const method of parsed.methods) addSymbol(symbols, method)
      }
      continue
    }

    if (isIdent(token, 'interface')) {
      const parsed = parseInterface(tokens, source, i)
      if (parsed) {
        addSymbol(symbols, parsed.symbol)
        for (const method of parsed.methods) addSymbol(symbols, method)
      }
      continue
    }

    if (isIdent(token, 'type') && isIdent(tokens[i + 1])) {
      addSymbol(symbols, parseTypeAlias(tokens, i))
      continue
    }

    if (isIdent(token, 'enum')) {
      addSymbol(symbols, parseEnum(tokens, source, i))
      continue
    }

    if (isIdent(token, 'const') || isIdent(token, 'let') || isIdent(token, 'var')) {
      addSymbol(symbols, parseArrowDeclaration(tokens, source, i))
    }
  }

  symbols.sort((a, b) => a.line - b.line || a.name.localeCompare(b.name))
  return symbols
}

function extractInheritance(tokens) {
  const entries = []

  for (let i = 0; i < tokens.length; i += 1) {
    const token = tokens[i]
    if (token.type === 'eof') break

    if (isIdent(token, 'class')) {
      let cursor = i + 1
      let name = 'default'
      if (isIdent(tokens[cursor])) {
        name = tokens[cursor].value
        cursor += 1
      }
      let body = -1
      for (; cursor < tokens.length; cursor += 1) {
        if (isPunct(tokens[cursor], '{')) {
          body = cursor
          break
        }
        if (isPunct(tokens[cursor], ';') || tokens[cursor].type === 'eof') break
      }
      if (body >= 0) entries.push(...parseInheritance(tokens, i + 1, body, name))
      continue
    }

    if (isIdent(token, 'interface')) {
      let cursor = i + 1
      if (!isIdent(tokens[cursor])) continue
      const name = tokens[cursor].value
      cursor += 1
      let body = -1
      for (; cursor < tokens.length; cursor += 1) {
        if (isPunct(tokens[cursor], '{')) {
          body = cursor
          break
        }
        if (isPunct(tokens[cursor], ';') || tokens[cursor].type === 'eof') break
      }
      if (body >= 0) entries.push(...parseInheritance(tokens, i + 1, body, name))
    }
  }

  return entries
}

function findCaller(symbols, token) {
  let best = null
  for (const symbol of symbols) {
    if (symbol.startOffset > token.start || symbol.endOffset < token.end) continue
    if (!best || symbol.endOffset - symbol.startOffset < best.endOffset - best.startOffset) {
      best = symbol
    }
  }
  return best
}

function insideRange(token, ranges) {
  return ranges.some((range) => token.start >= range.start && token.end <= range.end)
}

function extractCalls(tokens, symbols, importRanges) {
  const localCallees = new Set(
    symbols.filter((symbol) => symbol.kind !== 'method').map((symbol) => symbol.name)
  )
  const declarationStarts = new Set(
    symbols.map((symbol) => symbol.nameOffset ?? symbol.startOffset)
  )
  const calls = []
  const seen = new Set()

  for (let i = 0; i < tokens.length - 1; i += 1) {
    const token = tokens[i]
    if (!isIdent(token) || !localCallees.has(token.value)) continue
    if (!isPunct(tokens[i + 1], '(')) continue
    if (isPunct(tokens[i - 1], '.') || isPunct(tokens[i - 1], '?.')) continue
    if (declarationStarts.has(token.start) || insideRange(token, importRanges)) continue

    const caller = findCaller(symbols, token)
    const key = `${caller?.name ?? ''}|${token.value}|${token.line}`
    if (seen.has(key)) continue
    seen.add(key)

    calls.push({
      caller: caller?.name ?? null,
      callerLine: caller?.line ?? null,
      callee: token.value,
      line: token.line,
      confidence: 'inferred'
    })
  }

  calls.sort((a, b) => a.line - b.line || a.callee.localeCompare(b.callee))
  return calls
}

function applyInheritanceConfidence(entries, symbols, importedNames) {
  const localNames = new Set(
    symbols
      .filter((symbol) => symbol.kind === 'class' || symbol.kind === 'interface')
      .map((symbol) => symbol.name)
  )

  for (const entry of entries) {
    const root = entry.parent.split('.')[0]
    if (localNames.has(entry.parent) || localNames.has(root)) {
      entry.confidence = 'extracted'
    } else if (importedNames.has(entry.parent) || importedNames.has(root)) {
      entry.confidence = 'inferred'
    } else {
      entry.confidence = 'inferred'
    }
  }
}

function summaryFromComment(comment) {
  return comment.lines.find((line) => !line.startsWith('@')) ?? null
}

function attachSummaries(symbols, comments) {
  if (!comments || comments.length === 0) return
  const ordered = [...comments].sort((a, b) => a.start - b.start)

  for (const symbol of symbols) {
    if (!Number.isInteger(symbol.startOffset)) continue
    let match = null
    for (const comment of ordered) {
      if (comment.end >= symbol.startOffset) continue
      if (comment.endLine === symbol.line - 1) match = comment
    }
    if (!match) continue
    const summary = summaryFromComment(match)
    if (summary) symbol.summary = summary
  }
}

export function parseJavaScript({ path, lang, source }) {
  const { tokens, comments } = tokenizeWithComments(source, { jsx: lang !== 'ts' })
  const { imports, unresolved, importedNames: importedNamesSet, ranges } = extractImports(tokens)
  const symbols = extractSymbols(tokens, source)
  attachSummaries(symbols, comments)
  const inheritance = extractInheritance(tokens)
  applyInheritanceConfidence(inheritance, symbols, importedNamesSet)
  const calls = extractCalls(tokens, symbols, ranges)

  return {
    path,
    lang,
    imports,
    unresolved,
    symbols,
    calls,
    inheritance,
    importedNames: [...importedNamesSet].sort()
  }
}
