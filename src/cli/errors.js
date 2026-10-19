// SPDX-License-Identifier: AGPL-3.0-only

export class CliError extends Error {
  constructor(message) {
    super(message)
    this.name = 'CliError'
  }
}
