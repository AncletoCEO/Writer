// SPDX-License-Identifier: AGPL-3.0-only

import { createRequire } from 'node:module'

const require = createRequire(import.meta.url)

export const DEFAULT_LANGUAGE_PACK = '@ancleto/writer-languages'

function emptyPack() {
  return { adapters: [], extensions: {} }
}

function extensionsFrom(adapters) {
  const extensions = {}
  for (const adapter of adapters) {
    if (!adapter || typeof adapter.id !== 'string') continue
    for (const extension of adapter.extensions ?? []) {
      extensions[String(extension).toLowerCase()] = adapter.id
    }
  }
  return extensions
}

export function loadLanguagePack({ enabled = true, module: moduleName = DEFAULT_LANGUAGE_PACK } = {}) {
  if (enabled === false) return emptyPack()
  if (typeof moduleName !== 'string' || moduleName.trim() === '') return emptyPack()

  let pack
  try {
    pack = require(moduleName)
  } catch (error) {
    if (error?.code !== 'MODULE_NOT_FOUND' && error?.code !== 'ERR_MODULE_NOT_FOUND') {
      return { ...emptyPack(), error }
    }
    return emptyPack()
  }

  const adapters = Array.isArray(pack?.adapters) ? pack.adapters : []
  const valid = adapters.filter(
    (adapter) =>
      adapter &&
      typeof adapter.id === 'string' &&
      Array.isArray(adapter.extensions) &&
      typeof adapter.parse === 'function' &&
      typeof adapter.resolveImport === 'function'
  )

  return { adapters: valid, extensions: extensionsFrom(valid) }
}
