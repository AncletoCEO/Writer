// SPDX-License-Identifier: AGPL-3.0-only

import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { sha256 } from '../util/hash.js'
import { ContractError } from './errors.js'
import { MANIFEST_SCHEMA_VERSION } from './manifest.js'

const HASH = /^sha256:[0-9a-f]{64}$/

function isObject(value) {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

export function validateManifest(manifest) {
  if (!isObject(manifest)) throw new ContractError('manifest debe ser un objeto')
  if (manifest.schemaVersion !== MANIFEST_SCHEMA_VERSION) {
    throw new ContractError(`schemaVersion incompatible: ${manifest.schemaVersion}`)
  }
  if (typeof manifest.writerVersion !== 'string' || manifest.writerVersion === '') {
    throw new ContractError('writerVersion inválido')
  }
  if (typeof manifest.generatedAt !== 'string' || Number.isNaN(Date.parse(manifest.generatedAt))) {
    throw new ContractError('generatedAt inválido')
  }
  if (typeof manifest.root !== 'string') throw new ContractError('root inválido')
  if (manifest.gitCommit !== null && typeof manifest.gitCommit !== 'string') {
    throw new ContractError('gitCommit inválido')
  }
  if (manifest.gitDirty !== null && typeof manifest.gitDirty !== 'boolean') {
    throw new ContractError('gitDirty inválido')
  }
  if (typeof manifest.fingerprint !== 'string' || !HASH.test(manifest.fingerprint)) {
    throw new ContractError('fingerprint inválido')
  }
  if (!isObject(manifest.stats)) throw new ContractError('stats inválido')
  if (!Array.isArray(manifest.outputs)) throw new ContractError('outputs inválido')

  for (const entry of manifest.outputs) {
    if (!isObject(entry) || typeof entry.path !== 'string') {
      throw new ContractError('cada output debe declarar path')
    }
    if (typeof entry.sha256 !== 'string' || !HASH.test(entry.sha256)) {
      throw new ContractError(`sha256 inválido en output ${entry.path}`)
    }
    if (!Number.isInteger(entry.bytes) || entry.bytes < 0) {
      throw new ContractError(`bytes inválido en output ${entry.path}`)
    }
  }

  return true
}

export function validateGraph(graph) {
  if (!isObject(graph)) throw new ContractError('graph debe ser un objeto')
  if (graph.schemaVersion !== 1) throw new ContractError('graph.schemaVersion incompatible')
  if (!Array.isArray(graph.nodes)) throw new ContractError('graph.nodes inválido')
  if (!Array.isArray(graph.edges)) throw new ContractError('graph.edges inválido')
  if (!isObject(graph.stats)) throw new ContractError('graph.stats inválido')

  for (const node of graph.nodes) {
    if (!isObject(node) || typeof node.id !== 'string' || typeof node.kind !== 'string') {
      throw new ContractError('nodo inválido')
    }
  }
  for (const edge of graph.edges) {
    if (
      !isObject(edge) ||
      typeof edge.from !== 'string' ||
      typeof edge.to !== 'string' ||
      typeof edge.kind !== 'string'
    ) {
      throw new ContractError('arista inválida')
    }
  }

  return true
}

export function validateOutputs(outputDirAbs, manifest) {
  const problems = []

  for (const entry of manifest.outputs ?? []) {
    const path = join(outputDirAbs, entry.path)
    if (!existsSync(path)) {
      problems.push({ path: entry.path, reason: 'missing' })
      continue
    }
    const content = readFileSync(path)
    if (sha256(content) !== entry.sha256) {
      problems.push({ path: entry.path, reason: 'hash-mismatch' })
      continue
    }
    if (content.length !== entry.bytes) {
      problems.push({ path: entry.path, reason: 'size-mismatch' })
    }
  }

  return { ok: problems.length === 0, problems }
}
