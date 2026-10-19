#!/usr/bin/env node
// SPDX-License-Identifier: AGPL-3.0-only

import { readFileSync } from 'node:fs'
import { CONFIG_FILE } from '../config/load.js'
import { runInit } from './commands/init.js'

const pkg = JSON.parse(
  readFileSync(new URL('../../package.json', import.meta.url), 'utf8')
)
const args = process.argv.slice(2)
const [command, ...rest] = args

function legalNotice() {
  console.log(`ancleto-writer ${pkg.version}`)
  console.log('Copyright (C) 2026 AncletoCEO')
  console.log('License: AGPL-3.0-only')
  console.log('This program comes with ABSOLUTELY NO WARRANTY.')
}

function usage() {
  console.log('')
  console.log('Uso: ancleto-writer <comando> [opciones]')
  console.log('')
  console.log('Comandos:')
  console.log('  init [--force]   Crea .ancleto-writer.json')
  console.log('  build            Escanea y publica .ancleto/writer/ (planificado)')
  console.log('  check            Verifica frescura (planificado)')
  console.log('  doctor           Diagnostica el entorno (planificado)')
  console.log('')
  console.log('Opciones: --help, --version')
}

if (args.includes('--version') || args.includes('-v')) {
  legalNotice()
  process.exit(0)
}

if (args.includes('--help') || args.includes('-h')) {
  legalNotice()
  usage()
  process.exit(0)
}

if (command === 'init') {
  const unknown = rest.filter((arg) => arg !== '--force')
  if (unknown.length > 0) {
    console.error(`ancleto-writer: opción desconocida para init: ${unknown[0]}`)
    usage()
    process.exit(1)
  }

  const result = runInit({ cwd: process.cwd(), force: rest.includes('--force') })
  if (result.created) {
    console.log(`ancleto-writer: creado ${CONFIG_FILE}`)
  } else {
    console.log(`ancleto-writer: ${CONFIG_FILE} ya existe (usá --force para reemplazarlo)`)
  }
  process.exit(0)
}

if (command === 'build' || command === 'check' || command === 'doctor') {
  console.error(`ancleto-writer: "${command}" se implementa en una fase posterior.`)
  process.exit(1)
}

console.error('ancleto-writer: comando no reconocido.')
usage()
process.exit(1)
