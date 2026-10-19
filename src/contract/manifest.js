// SPDX-License-Identifier: AGPL-3.0-only

import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { sha256 } from '../util/hash.js'
import { ContractError } from './errors.js'

export const MANIFEST_SCHEMA_VERSION = 1
export const MANIFEST_FILE = 'manifest.json'

export function computeFingerprint(files = []) {
  const body = [...files]
    .map((file) => ({ path: file.path, size: file.size, hash: file.hash }))
    .sort((a, b) => a.path.localeCompare(b.path))
    .map((file) => `${file.path}\0${file.size}\0${file.hash}`)
    .join('\n')

  return sha256(body)
}

export function outputEntry(path, content) {
  return {
    path,
    sha256: sha256(content),
    bytes: Buffer.byteLength(content)
  }
}

export function buildManifest({
  writerVersion,
  generatedAt,
  root = '.',
  gitInfo = null,
  fingerprint,
  stats,
  outputs = [],
  durationMs
}) {
  return {
    schemaVersion: MANIFEST_SCHEMA_VERSION,
    writerVersion,
    generatedAt,
    root,
    gitCommit: gitInfo?.commit ?? null,
    gitDirty: gitInfo?.dirty ?? null,
    fingerprint,
    stats,
    ...(durationMs === undefined ? {} : { durationMs }),
    outputs: [...outputs]
      .map((entry) => ({ path: entry.path, sha256: entry.sha256, bytes: entry.bytes }))
      .sort((a, b) => a.path.localeCompare(b.path))
  }
}

export function readManifest(outputDirAbs) {
  const path = join(outputDirAbs, MANIFEST_FILE)
  if (!existsSync(path)) return null

  let raw
  try {
    raw = readFileSync(path, 'utf8')
  } catch (error) {
    throw new ContractError(`no se pudo leer ${MANIFEST_FILE}: ${error.message}`)
  }

  try {
    return JSON.parse(raw)
  } catch (error) {
    throw new ContractError(`${MANIFEST_FILE} no es JSON válido: ${error.message}`)
  }
}

export function isCompatible(manifest) {
  return manifest?.schemaVersion === MANIFEST_SCHEMA_VERSION
}
