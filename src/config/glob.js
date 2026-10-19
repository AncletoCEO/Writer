// SPDX-License-Identifier: AGPL-3.0-only

const CACHE = new Map()

export function toPosix(value) {
  return String(value).replace(/\\/g, '/')
}

function escapeRegex(char) {
  return /[.*+?^${}()|[\]\\]/.test(char) ? `\\${char}` : char
}

export function globToRegExp(pattern) {
  const normalized = toPosix(pattern).replace(/^\.\//, '').replace(/\/+$/, '')
  const cached = CACHE.get(normalized)
  if (cached) return cached

  let source = '^'
  for (let i = 0; i < normalized.length; i += 1) {
    const char = normalized[i]

    if (char === '*') {
      if (normalized[i + 1] === '*') {
        while (normalized[i + 1] === '*') i += 1
        if (normalized[i + 1] === '/') {
          source += '(?:.*/)?'
          i += 1
        } else {
          source += '.*'
        }
      } else {
        source += '[^/]*'
      }
      continue
    }

    if (char === '?') {
      source += '[^/]'
      continue
    }

    if (char === '[') {
      let cursor = i + 1
      let content = ''
      if (normalized[cursor] === '!' || normalized[cursor] === '^') {
        content += '^'
        cursor += 1
      }
      let closed = false
      for (; cursor < normalized.length; cursor += 1) {
        if (normalized[cursor] === ']' && content !== '' && content !== '^') {
          closed = true
          break
        }
        content += normalized[cursor] === '\\' ? '\\\\' : normalized[cursor]
      }
      if (closed) {
        source += `[${content}]`
        i = cursor
      } else {
        source += '\\['
      }
      continue
    }

    if (char === '\\' && i + 1 < normalized.length) {
      source += escapeRegex(normalized[i + 1])
      i += 1
      continue
    }

    source += escapeRegex(char)
  }

  source += '$'
  const regex = new RegExp(source)
  CACHE.set(normalized, regex)
  return regex
}

export function matchesGlob(relPath, pattern) {
  const target = toPosix(relPath).replace(/^\.\//, '')
  const normalized = toPosix(pattern).replace(/^\.\//, '').replace(/\/+$/, '')
  if (!normalized) return false
  const regex = globToRegExp(normalized)
  if (!normalized.includes('/')) {
    const base = target.split('/').pop() || target
    return regex.test(base) || regex.test(target)
  }
  return regex.test(target)
}

export function matchesAny(relPath, patterns = []) {
  return patterns.some((pattern) => matchesGlob(relPath, pattern))
}

export function createIgnoreMatcher(patterns = []) {
  const normalized = patterns
    .filter((pattern) => typeof pattern === 'string' && pattern.trim() !== '')
    .map((pattern) => toPosix(pattern).replace(/^\.\//, '').replace(/\/+$/, ''))

  return function isIgnored(relPath, { isDirectory = false } = {}) {
    const target = toPosix(relPath).replace(/^\.\//, '').replace(/\/+$/, '')
    if (!target) return false
    const base = target.split('/').pop() || target

    for (const pattern of normalized) {
      const hasSlash = pattern.includes('/')
      const candidate = hasSlash ? target : base
      if (globToRegExp(pattern).test(candidate)) return true
      if (isDirectory && globToRegExp(pattern).test(`${target}/`)) return true
    }

    return false
  }
}
