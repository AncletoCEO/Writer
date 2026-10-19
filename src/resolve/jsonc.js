// SPDX-License-Identifier: AGPL-3.0-only

function stripComments(input) {
  let out = ''
  let inString = false
  let quote = ''
  let i = 0

  while (i < input.length) {
    const char = input[i]

    if (inString) {
      out += char
      if (char === '\\') {
        out += input[i + 1] ?? ''
        i += 2
        continue
      }
      if (char === quote) inString = false
      i += 1
      continue
    }

    if (char === '"' || char === "'") {
      inString = true
      quote = char
      out += char
      i += 1
      continue
    }

    if (char === '/' && input[i + 1] === '/') {
      while (i < input.length && input[i] !== '\n') i += 1
      out += ' '
      continue
    }

    if (char === '/' && input[i + 1] === '*') {
      i += 2
      while (i < input.length && !(input[i] === '*' && input[i + 1] === '/')) i += 1
      i += 2
      out += ' '
      continue
    }

    out += char
    i += 1
  }

  return out
}

function removeTrailingCommas(input) {
  let out = ''
  let inString = false

  for (let i = 0; i < input.length; i += 1) {
    const char = input[i]

    if (inString) {
      out += char
      if (char === '\\') {
        out += input[i + 1] ?? ''
        i += 1
        continue
      }
      if (char === '"') inString = false
      continue
    }

    if (char === '"') {
      inString = true
      out += char
      continue
    }

    if (char === ',') {
      let cursor = i + 1
      while (cursor < input.length && /\s/.test(input[cursor])) cursor += 1
      if (input[cursor] === '}' || input[cursor] === ']') continue
      out += char
      continue
    }

    out += char
  }

  return out
}

export function parseJsonc(input) {
  return JSON.parse(removeTrailingCommas(stripComments(String(input))))
}
