// SPDX-License-Identifier: AGPL-3.0-only

export class ContractError extends Error {
  constructor(message) {
    super(message)
    this.name = 'ContractError'
  }
}
