// SPDX-License-Identifier: AGPL-3.0-only

export function buildDeadCodeFact(orphans) {
  return {
    schemaVersion: 1,
    orphanFiles: orphans?.orphanFiles ?? [],
    excluded: orphans?.excluded ?? [],
    dynamicImports: orphans?.dynamicImports ?? false
  }
}
