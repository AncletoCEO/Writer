// SPDX-License-Identifier: AGPL-3.0-only

import { createHash } from 'node:crypto'

export function sha256(content) {
  return `sha256:${createHash('sha256').update(content).digest('hex')}`
}
