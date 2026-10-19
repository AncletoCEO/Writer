// SPDX-License-Identifier: AGPL-3.0-only

import { readGitInfo } from '../scan/git.js'
import { scanRepository } from '../scan/scanner.js'
import { MANIFEST_SCHEMA_VERSION, computeFingerprint, readManifest } from './manifest.js'
import { validateOutputs } from './validate.js'

export function checkPackage({ rootAbs, config }) {
  let manifest
  try {
    manifest = readManifest(config.outputDirAbs)
  } catch (error) {
    return { status: 'invalid', exitCode: 4, error: error.message }
  }

  if (!manifest) return { status: 'missing', exitCode: 3 }
  if (manifest.schemaVersion !== MANIFEST_SCHEMA_VERSION) {
    return { status: 'incompatible', exitCode: 4, manifest }
  }

  const scanResult = scanRepository({ rootAbs, config })
  const fingerprint = computeFingerprint(scanResult.files)
  const gitInfo = readGitInfo(rootAbs)

  if (manifest.fingerprint !== fingerprint) {
    return { status: 'stale', exitCode: 3, manifest, fingerprint, gitInfo }
  }

  const outputs = validateOutputs(config.outputDirAbs, manifest)
  if (!outputs.ok) {
    return {
      status: 'invalid',
      exitCode: 4,
      manifest,
      fingerprint,
      gitInfo,
      problems: outputs.problems
    }
  }

  return { status: 'fresh', exitCode: 0, manifest, fingerprint, gitInfo }
}
