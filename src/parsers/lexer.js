// SPDX-License-Identifier: AGPL-3.0-only
// Derived from ReadMenator readmenator/parsers/_base.py (commit dac48f868722620f0d01dac0d33102c5a514c03c),
// modified 2026-10-19 by AncletoCEO.

const PUNCTUATORS = [
  '>>>=',
  '===',
  '!==',
  '>>>',
  '**=',
  '<<=',
  '>>=',
  '&&=',
  '||=',
  '??=',
  '...',
  '=>',
  '==',
  '!=',
  '<=',
  '>=',
  '&&',
  '||',
  '??',
  '?.',
  '++',
  '--',
  '+=',
  '-=',
  '*=',
  '/=',
  '%=',
  '&=',
  '|=',
  '^=',
  '<<',
  '>>',
  '**',
  '{',
  '}',
  '(',
  ')',
  '[',
  ']',
  ';',
  ',',
  '.',
  ':',
  '?',
  '=',
  '+',
  '-',
  '*',
  '/',
  '%',
  '&',
  '|',
  '^',
  '!',
  '~',
  '@',
  '#',
  '<',
  '>'
].sort((a, b) => b.length - a.length)

const REGEX_PREFIX_TOKENS = new Set([
  '(',
  '[',
  '{',
  ',',
  ';',
  ':',
  '?',
  '=',
  '==',
  '===',
  '!=',
  '!==',
  '&&',
  '||',
  '??',
  '!',
  '+',
  '-',
  '*',
  '%',
  '**',
  '=>',
  '&',
  '|',
  '^',
  '~',
  '<',
  '>',
  '<=',
  '>=',
  '<<',
  '>>',
  '>>>',
  '+=',
  '-=',
  '*=',
  '/=',
  '%=',
  '&=',
  '|=',
  '^=',
  '??=',
  '&&=',
  '||=',
  '...'
])

const REGEX_PREFIX_KEYWORDS = new Set([
  'return',
  'throw',
  'case',
  'delete',
  'void',
  'typeof',
  'instanceof',
  'in',
  'of',
  'new',
  'yield',
  'await',
  'else',
  'do'
])

const JSX_PREFIX_TOKENS = new Set([
  '(',
  '[',
  '{',
  ',',
  ';',
  ':',
  '?',
  '=',
  '=>',
  '&&',
  '||',
  '??'
])

const JSX_PREFIX_KEYWORDS = new Set([
  'return',
  'yield',
  'await',
  'case',
  'else',
  'do',
  'throw'
])

const IDENT_START = /[A-Za-z_$]/
const IDENT_PART = /[A-Za-z0-9_$]/
const DIGIT = /[0-9]/
const WHITESPACE = /[ \t\n\r\f\v\uFEFF]/

function isIdentifierStart(char) {
  return typeof char === 'string' && IDENT_START.test(char)
}

function isIdentifierPart(char) {
  return typeof char === 'string' && IDENT_PART.test(char)
}

function isDigit(char) {
  return typeof char === 'string' && DIGIT.test(char)
}

function canStartRegex(prev) {
  if (!prev) return true
  if (prev.type === 'identifier') return REGEX_PREFIX_KEYWORDS.has(prev.value)
  if (prev.type === 'punctuator') return REGEX_PREFIX_TOKENS.has(prev.value)
  if (prev.type === 'number' || prev.type === 'string' || prev.type === 'template') return false
  if (prev.type === 'regex' || prev.type === 'jsx') return false
  return false
}

function canStartJsx(prev) {
  if (!prev) return true
  if (prev.type === 'identifier') return JSX_PREFIX_KEYWORDS.has(prev.value)
  if (prev.type === 'punctuator') return JSX_PREFIX_TOKENS.has(prev.value)
  return false
}

export class LexerError extends Error {
  constructor(message, token) {
    super(message)
    this.name = 'LexerError'
    this.token = token
  }
}

export function tokenize(source, { jsx = false } = {}) {
  let pos = 0
  let line = 1
  let column = 1

  const eof = () => pos >= source.length
  const peek = (offset = 0) => source[pos + offset]

  function advance(count = 1) {
    let remaining = count
    while (remaining > 0 && pos < source.length) {
      if (source[pos] === '\n') {
        line += 1
        column = 1
      } else {
        column += 1
      }
      pos += 1
      remaining -= 1
    }
  }

  function makeToken(type, value, extra, start, startLine, startColumn) {
    return {
      type,
      value,
      raw: source.slice(start, pos),
      start,
      end: pos,
      line: startLine,
      column: startColumn,
      ...extra
    }
  }

  function skipLineComment() {
    while (!eof() && peek() !== '\n') advance()
  }

  function skipBlockComment() {
    advance(2)
    while (!eof() && !(peek() === '*' && peek(1) === '/')) advance()
    if (!eof()) advance(2)
  }

  function skipTrivia() {
    while (!eof()) {
      const char = peek()
      if (WHITESPACE.test(char)) {
        advance()
        continue
      }
      if (char === '/' && peek(1) === '/') {
        skipLineComment()
        continue
      }
      if (char === '/' && peek(1) === '*') {
        skipBlockComment()
        continue
      }
      break
    }
  }

  function readIdentifier() {
    const start = pos
    const startLine = line
    const startColumn = column
    while (!eof() && isIdentifierPart(peek())) advance()
    return makeToken('identifier', source.slice(start, pos), {}, start, startLine, startColumn)
  }

  function readNumber() {
    const start = pos
    const startLine = line
    const startColumn = column
    const match = /^(?:0[xX][0-9a-fA-F_]+n?|0[bB][01_]+n?|0[oO][0-7_]+n?|(?:\d[\d_]*\.?[\d_]*|\.\d[\d_]*)(?:[eE][+-]?\d[\d_]*)?n?)/.exec(
      source.slice(pos)
    )
    const raw = match ? match[0] : peek()
    advance(raw.length)
    return makeToken('number', raw, {}, start, startLine, startColumn)
  }

  function skipQuoted(quote) {
    advance()
    while (!eof()) {
      const char = peek()
      if (char === '\\') {
        advance(2)
        continue
      }
      if (char === quote) {
        advance()
        return
      }
      if (char === '\n') return
      advance()
    }
  }

  function readString(quote) {
    const start = pos
    const startLine = line
    const startColumn = column
    advance()
    let value = ''

    while (!eof()) {
      const char = peek()
      if (char === '\\') {
        advance()
        if (eof()) break
        const escaped = peek()
        const map = {
          n: '\n',
          r: '\r',
          t: '\t',
          b: '\b',
          f: '\f',
          v: '\v',
          0: '\0'
        }
        if (Object.prototype.hasOwnProperty.call(map, escaped)) {
          value += map[escaped]
          advance()
        } else if (escaped === 'x') {
          const hex = source.slice(pos + 1, pos + 3)
          if (/^[0-9a-fA-F]{2}$/.test(hex)) {
            value += String.fromCharCode(parseInt(hex, 16))
            advance(3)
          } else {
            value += escaped
            advance()
          }
        } else if (escaped === 'u') {
          const hex = source.slice(pos + 1, pos + 5)
          if (/^[0-9a-fA-F]{4}$/.test(hex)) {
            value += String.fromCharCode(parseInt(hex, 16))
            advance(5)
          } else {
            value += escaped
            advance()
          }
        } else {
          value += escaped
          advance()
        }
        continue
      }
      if (char === quote) {
        advance()
        break
      }
      if (char === '\n') break
      value += char
      advance()
    }

    return makeToken(
      'string',
      value,
      { quote },
      start,
      startLine,
      startColumn
    )
  }

  function skipTemplateExpression() {
    advance(2)
    let depth = 1
    while (!eof() && depth > 0) {
      const char = peek()
      if (char === '{') {
        depth += 1
        advance()
      } else if (char === '}') {
        depth -= 1
        advance()
      } else if (char === '"' || char === "'") {
        skipQuoted(char)
      } else if (char === '`') {
        skipTemplateLiteral()
      } else if (char === '/' && peek(1) === '/') {
        skipLineComment()
      } else if (char === '/' && peek(1) === '*') {
        skipBlockComment()
      } else {
        advance()
      }
    }
  }

  function skipTemplateLiteral() {
    advance()
    while (!eof()) {
      const char = peek()
      if (char === '\\') {
        advance(2)
        continue
      }
      if (char === '`') {
        advance()
        return
      }
      if (char === '$' && peek(1) === '{') {
        skipTemplateExpression()
        continue
      }
      advance()
    }
  }

  function readTemplate() {
    const start = pos
    const startLine = line
    const startColumn = column
    advance()
    let value = ''
    let hasExpressions = false

    while (!eof()) {
      const char = peek()
      if (char === '\\') {
        advance()
        if (!eof()) {
          value += peek()
          advance()
        }
        continue
      }
      if (char === '`') {
        advance()
        break
      }
      if (char === '$' && peek(1) === '{') {
        hasExpressions = true
        skipTemplateExpression()
        continue
      }
      value += char
      advance()
    }

    return makeToken(
      'template',
      hasExpressions ? null : value,
      { hasExpressions },
      start,
      startLine,
      startColumn
    )
  }

  function readRegex() {
    const start = pos
    const startLine = line
    const startColumn = column
    advance()
    let inClass = false

    while (!eof()) {
      const char = peek()
      if (char === '\\') {
        advance(2)
        continue
      }
      if (char === '[') {
        inClass = true
        advance()
        continue
      }
      if (char === ']') {
        inClass = false
        advance()
        continue
      }
      if (char === '/' && !inClass) {
        advance()
        while (!eof() && /[a-z]/i.test(peek())) advance()
        break
      }
      if (char === '\n') break
      advance()
    }

    return makeToken('regex', source.slice(start, pos), {}, start, startLine, startColumn)
  }

  function readPunctuator() {
    const start = pos
    const startLine = line
    const startColumn = column
    const match = PUNCTUATORS.find((punctuator) => source.startsWith(punctuator, pos))
    const raw = match ?? peek()
    advance(raw.length || 1)
    return makeToken('punctuator', raw, {}, start, startLine, startColumn)
  }

  function looksLikeGenericArrow() {
    let cursor = pos + 1
    while (cursor < source.length && WHITESPACE.test(source[cursor])) cursor += 1
    if (!isIdentifierStart(source[cursor])) return false
    while (cursor < source.length && /[A-Za-z0-9_$.,\s]/.test(source[cursor])) cursor += 1
    return source[cursor] === '>' && source[cursor + 1] === '('
  }

  function skipBraces() {
    advance()
    let depth = 1
    while (!eof() && depth > 0) {
      const char = peek()
      if (char === '{') {
        depth += 1
        advance()
      } else if (char === '}') {
        depth -= 1
        advance()
      } else if (char === '"' || char === "'") {
        skipQuoted(char)
      } else if (char === '`') {
        skipTemplateLiteral()
      } else if (char === '/' && peek(1) === '/') {
        skipLineComment()
      } else if (char === '/' && peek(1) === '*') {
        skipBlockComment()
      } else {
        advance()
      }
    }
  }

  function readJsxTag() {
    advance()
    if (peek() === '/') {
      advance()
      while (!eof() && peek() !== '>') advance()
      if (!eof()) advance()
      return { closing: true, selfClosing: false, fragment: false }
    }
    if (peek() === '>') {
      advance()
      return { closing: false, selfClosing: false, fragment: true }
    }

    while (!eof() && !/[\s/>]/.test(peek())) advance()

    while (!eof()) {
      const char = peek()
      if (char === '/' && peek(1) === '>') {
        advance(2)
        return { closing: false, selfClosing: true, fragment: false }
      }
      if (char === '>') {
        advance()
        return { closing: false, selfClosing: false, fragment: false }
      }
      if (char === '{') {
        skipBraces()
        continue
      }
      if (char === '"' || char === "'") {
        skipQuoted(char)
        continue
      }
      advance()
    }

    return { closing: false, selfClosing: false, fragment: false }
  }

  function readJsx() {
    const start = pos
    const startLine = line
    const startColumn = column
    const first = readJsxTag()
    let depth = first.closing || first.selfClosing ? 0 : 1

    while (!eof() && depth > 0) {
      const char = peek()
      if (char === '{') {
        skipBraces()
        continue
      }
      if (char === '<') {
        const tag = readJsxTag()
        if (tag.closing) depth -= 1
        else if (!tag.selfClosing) depth += 1
        continue
      }
      advance()
    }

    return makeToken('jsx', null, {}, start, startLine, startColumn)
  }

  const tokens = []
  let prev = null

  while (true) {
    skipTrivia()
    if (eof()) break

    const char = peek()
    let token

    if (isIdentifierStart(char)) {
      token = readIdentifier()
    } else if (isDigit(char) || (char === '.' && isDigit(peek(1)))) {
      token = readNumber()
    } else if (char === '"' || char === "'") {
      token = readString(char)
    } else if (char === '`') {
      token = readTemplate()
    } else if (char === '/' && canStartRegex(prev)) {
      token = readRegex()
    } else if (
      char === '<' &&
      jsx &&
      canStartJsx(prev) &&
      !looksLikeGenericArrow() &&
      (isIdentifierStart(peek(1)) || peek(1) === '>')
    ) {
      token = readJsx()
    } else {
      token = readPunctuator()
    }

    tokens.push(token)
    prev = token
  }

  tokens.push({
    type: 'eof',
    value: null,
    raw: '',
    start: pos,
    end: pos,
    line,
    column
  })

  return tokens
}
