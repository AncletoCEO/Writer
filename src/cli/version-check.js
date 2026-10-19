// SPDX-License-Identifier: AGPL-3.0-only

export const MIN_NODE_MAJOR = 24

export function assertNodeVersion(version = process.versions.node) {
  const major = Number(String(version).split('.')[0])

  if (!Number.isInteger(major) || major < MIN_NODE_MAJOR) {
    throw new Error(`Node.js >= ${MIN_NODE_MAJOR} es obligatorio (actual: ${version}).`)
  }

  return major
}
