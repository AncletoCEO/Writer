// SPDX-License-Identifier: AGPL-3.0-only

const DEFAULT_MAX_FILES = 50

export function buildUnsupportedFact(entries = [], { maxFilesPerLanguage = DEFAULT_MAX_FILES } = {}) {
  const limit =
    Number.isInteger(maxFilesPerLanguage) && maxFilesPerLanguage > 0
      ? maxFilesPerLanguage
      : DEFAULT_MAX_FILES
  const byLanguage = new Map()
  const languages = new Set()

  for (const entry of entries) {
    if (!entry?.path || !entry?.extension || !entry?.language) continue
    const key = `${entry.extension}|${entry.language}`
    const current = byLanguage.get(key) ?? {
      extension: entry.extension,
      language: entry.language,
      count: 0,
      files: []
    }
    current.count += 1
    current.files.push(entry.path)
    byLanguage.set(key, current)
    languages.add(entry.language)
  }

  const unsupported = [...byLanguage.values()]
    .map((entry) => ({
      ...entry,
      files: [...new Set(entry.files)].sort().slice(0, limit)
    }))
    .sort(
      (a, b) =>
        b.count - a.count ||
        a.language.localeCompare(b.language) ||
        a.extension.localeCompare(b.extension)
    )

  return {
    schemaVersion: 1,
    unsupported,
    totals: {
      files: entries.length,
      languages: languages.size
    }
  }
}
