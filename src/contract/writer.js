// SPDX-License-Identifier: AGPL-3.0-only

import { existsSync, mkdirSync, mkdtempSync, renameSync, rmSync, writeFileSync } from 'node:fs'
import { dirname, isAbsolute, join } from 'node:path'
import { ContractError } from './errors.js'

function writeRelative(baseDir, relPath, content) {
  if (isAbsolute(relPath) || relPath.split(/[\\/]/).includes('..')) {
    throw new ContractError(`path inválido en el paquete: ${relPath}`)
  }
  const abs = join(baseDir, relPath)
  mkdirSync(dirname(abs), { recursive: true })
  writeFileSync(abs, content)
}

export function publishPackage({ outputDirAbs, outputs }) {
  if (!outputs || typeof outputs !== 'object' || outputs['manifest.json'] === undefined) {
    throw new ContractError('el paquete debe incluir manifest.json')
  }

  const parent = dirname(outputDirAbs)
  mkdirSync(parent, { recursive: true })

  const tempDir = mkdtempSync(join(parent, '.writer-tmp-'))
  const backupDir = `${outputDirAbs}.bak-${process.pid}`
  let swapped = false

  try {
    for (const [relPath, content] of Object.entries(outputs)) {
      if (relPath === 'manifest.json') continue
      writeRelative(tempDir, relPath, content)
    }
    writeRelative(tempDir, 'manifest.json', outputs['manifest.json'])

    if (existsSync(outputDirAbs)) {
      if (existsSync(backupDir)) rmSync(backupDir, { recursive: true, force: true })
      renameSync(outputDirAbs, backupDir)
    }
    renameSync(tempDir, outputDirAbs)
    swapped = true

    if (existsSync(backupDir)) rmSync(backupDir, { recursive: true, force: true })

    return { published: true, outputDirAbs }
  } catch (error) {
    try {
      if (existsSync(tempDir)) rmSync(tempDir, { recursive: true, force: true })
    } catch {
      // la limpieza del temporal es best-effort
    }
    try {
      if (!swapped && existsSync(backupDir) && !existsSync(outputDirAbs)) {
        renameSync(backupDir, outputDirAbs)
      }
    } catch {
      // la restauración del backup es best-effort
    }
    throw error
  }
}
