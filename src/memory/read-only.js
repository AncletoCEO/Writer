// SPDX-License-Identifier: AGPL-3.0-only

import { existsSync } from 'node:fs'
import { resolve } from 'node:path'
import { DatabaseSync } from 'node:sqlite'

export function readProjectRules(rootAbs, memoryConfig = {}) {
  const result = { available: false, rules: [], reason: null, path: null }

  if (memoryConfig?.enabled === false) {
    result.reason = 'disabled'
    return result
  }

  const configuredPath = memoryConfig?.path ?? '.ancleto/memory.db'
  const path = resolve(rootAbs, configuredPath)
  result.path = path

  if (!existsSync(path)) {
    result.reason = 'missing'
    return result
  }

  let db
  try {
    db = new DatabaseSync(path, { readOnly: true })
    db.exec('PRAGMA busy_timeout = 5000')

    const scope = memoryConfig?.scope ?? 'project'
    const rows = db
      .prepare(
        `SELECT memory_key, type, scope, content, justification, created_at
         FROM memory_nodes
         WHERE status = 'active' AND type = 'rule' AND scope = ?
         ORDER BY created_at DESC, rowid DESC`
      )
      .all(scope)

    result.available = true
    result.rules = rows.map((row) => ({
      memory_key: row.memory_key,
      scope: row.scope,
      content: row.content,
      justification: row.justification,
      created_at: row.created_at
    }))
  } catch (error) {
    result.reason = error.message
  } finally {
    try {
      db?.close()
    } catch {
      // el cierre es best-effort
    }
  }

  return result
}
