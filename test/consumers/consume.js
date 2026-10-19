import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { computeFingerprint, readManifest } from '../../src/contract/manifest.js'
import { scanRepository } from '../../src/scan/scanner.js'

export function consume({ rootAbs, config }) {
  let manifest
  try {
    manifest = readManifest(config.outputDirAbs)
  } catch {
    return { mode: 'fallback', reason: 'invalid' }
  }

  if (!manifest) return { mode: 'fallback', reason: 'missing' }
  if (manifest.schemaVersion !== 1) return { mode: 'fallback', reason: 'incompatible' }

  const scanResult = scanRepository({ rootAbs, config })
  if (manifest.fingerprint !== computeFingerprint(scanResult.files)) {
    return { mode: 'fallback', reason: 'stale' }
  }

  return {
    mode: 'writer',
    graph: JSON.parse(readFileSync(join(config.outputDirAbs, 'graph.json'), 'utf8'))
  }
}
