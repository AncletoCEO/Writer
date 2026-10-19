// SPDX-License-Identifier: AGPL-3.0-only

import { existsSync, readFileSync } from 'node:fs'
import { dirname, isAbsolute, join, resolve } from 'node:path'
import { toPosix } from '../config/glob.js'
import { parseJsonc } from './jsonc.js'

export function loadTsconfig(rootAbs, setting = 'auto') {
  const candidates = []

  if (setting && setting !== 'auto') {
    candidates.push(isAbsolute(setting) ? setting : resolve(rootAbs, setting))
  } else {
    candidates.push(join(rootAbs, 'tsconfig.json'), join(rootAbs, 'jsconfig.json'))
  }

  for (const path of candidates) {
    if (!existsSync(path)) continue

    const parsed = parseJsonc(readFileSync(path, 'utf8'))
    const options = parsed.compilerOptions ?? {}
    const dir = dirname(path)
    const baseUrlSet = typeof options.baseUrl === 'string'
    const baseUrlAbs = baseUrlSet ? resolve(dir, options.baseUrl) : dir
    const paths = []

    if (options.paths && typeof options.paths === 'object' && !Array.isArray(options.paths)) {
      for (const [pattern, targets] of Object.entries(options.paths)) {
        if (!Array.isArray(targets)) continue
        paths.push({
          pattern: toPosix(pattern),
          targets: targets
            .filter((target) => typeof target === 'string')
            .map((target) => resolve(baseUrlAbs, target))
        })
      }
    }

    return {
      source: toPosix(path),
      baseUrlAbs,
      baseUrlSet,
      paths,
      raw: parsed
    }
  }

  return null
}
