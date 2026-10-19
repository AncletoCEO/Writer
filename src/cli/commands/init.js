// SPDX-License-Identifier: AGPL-3.0-only

import { existsSync } from 'node:fs'
import { join } from 'node:path'
import { CONFIG_FILE, defaultConfig, writeConfigFile } from '../../config/load.js'

export function runInit({ cwd = process.cwd(), force = false } = {}) {
  const path = join(cwd, CONFIG_FILE)

  if (existsSync(path) && !force) {
    return { created: false, path }
  }

  writeConfigFile(cwd, defaultConfig())
  return { created: true, path }
}
