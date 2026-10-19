#!/usr/bin/env node
// SPDX-License-Identifier: AGPL-3.0-only

import { readFileSync } from 'node:fs'

const pkg = JSON.parse(
  readFileSync(new URL('../../package.json', import.meta.url), 'utf8')
)
const args = process.argv.slice(2)

function legalNotice() {
  console.log(`ancleto-writer ${pkg.version}`)
  console.log('Copyright (C) 2026 AncletoCEO')
  console.log('License: AGPL-3.0-only')
  console.log('This program comes with ABSOLUTELY NO WARRANTY.')
}

if (args.includes('--version') || args.includes('-v')) {
  legalNotice()
  process.exit(0)
}

if (args.includes('--help') || args.includes('-h')) {
  legalNotice()
  console.log('')
  console.log('Uso: ancleto-writer <comando> [opciones]')
  console.log('')
  console.log('Comandos previstos: init, build, check, doctor')
  console.log('Estado: scaffold (Fase 1). La CLI se implementa en la Fase 8.')
  process.exit(0)
}

console.error('ancleto-writer: CLI en construcción (Fase 8).')
console.error('Comandos previstos: init, build, check, doctor.')
process.exit(1)
