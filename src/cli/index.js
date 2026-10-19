#!/usr/bin/env node
// SPDX-License-Identifier: AGPL-3.0-only

import { readFileSync } from 'node:fs'
import { runBuild } from '../build/run.js'
import { CONFIG_FILE, loadConfig } from '../config/load.js'
import { checkPackage } from '../contract/check.js'
import { runDoctor } from './commands/doctor.js'
import { runInit } from './commands/init.js'
import { CliError } from './errors.js'
import { assertNodeVersion } from './version-check.js'

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

function usage() {
  console.log('')
  console.log('Uso: ancleto-writer <comando> [opciones]')
  console.log('')
  console.log('Comandos:')
  console.log('  init [--force]                        Crea .ancleto-writer.json')
  console.log('  build [--root <dir>] [--out <dir>]    Escanea y publica .ancleto/writer/')
  console.log('         [--json] [--quiet]')
  console.log('  check [--root <dir>] [--json]         Verifica frescura y compatibilidad')
  console.log('  doctor [--root <dir>] [--json]        Diagnostica el entorno')
  console.log('')
  console.log('Opciones: --help, --version')
}

function parseFlags(rawArgs, spec) {
  const flags = Object.create(null)

  for (let i = 0; i < rawArgs.length; i += 1) {
    const arg = rawArgs[i]
    if (!arg.startsWith('--') || arg === '--') {
      throw new CliError(`argumento inesperado: ${arg}`)
    }

    const separator = arg.indexOf('=')
    const name = separator >= 0 ? arg.slice(0, separator) : arg
    const inline = separator >= 0 ? arg.slice(separator + 1) : undefined
    const definition = spec[name]

    if (!definition) throw new CliError(`opción desconocida: ${name}`)

    if (definition.value) {
      const value = inline ?? rawArgs[i + 1]
      if (value === undefined || value === '' || value.startsWith('--')) {
        throw new CliError(`falta valor para ${name}`)
      }
      if (inline === undefined) i += 1
      flags[definition.key] = value
    } else {
      if (inline !== undefined) throw new CliError(`la opción ${name} no acepta valor`)
      flags[definition.key] = true
    }
  }

  return flags
}

function printDoctor(report) {
  const git = report.git.available
    ? `${report.git.commit.slice(0, 7)}${report.git.dirty ? ' (dirty)' : ' (limpio)'}`
    : report.git.reason

  console.log(`Node: ${report.node} (>= ${report.minNode})`)
  console.log(`Root: ${report.root}`)
  console.log(
    `Output: ${report.outputDir} (${report.writable.writable ? 'escribible' : 'sin permiso'})`
  )
  console.log(`Git: ${git}`)
  console.log(
    `Memoria: ${
      report.memory.available ? `${report.memory.rules} reglas` : report.memory.reason
    }`
  )
  console.log(
    `Manifest: ${
      report.manifest
        ? `schema ${report.manifest.schemaVersion}`
        : report.manifestError ?? 'ausente'
    }`
  )
}

function main() {
  try {
    assertNodeVersion()
  } catch (error) {
    console.error(`ancleto-writer: ${error.message}`)
    process.exit(1)
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

  const [command, ...rest] = args

  try {
    if (!command) {
      usage()
      process.exit(1)
    }

    if (command === 'init') {
      const flags = parseFlags(rest, { '--force': { key: 'force' } })
      const result = runInit({ cwd: process.cwd(), force: Boolean(flags.force) })
      if (result.created) {
        console.log(`ancleto-writer: creado ${CONFIG_FILE}`)
      } else {
        console.log(`ancleto-writer: ${CONFIG_FILE} ya existe (usá --force para reemplazarlo)`)
      }
      process.exit(0)
    }

    if (command === 'build') {
      const flags = parseFlags(rest, {
        '--root': { key: 'root', value: true },
        '--out': { key: 'outputDir', value: true },
        '--json': { key: 'json' },
        '--quiet': { key: 'quiet' }
      })
      const config = loadConfig({
        cwd: process.cwd(),
        cli: { root: flags.root, outputDir: flags.outputDir }
      })
      const result = runBuild({ rootAbs: config.rootAbs, config })

      if (flags.json) {
        console.log(
          JSON.stringify({
            status: 'built',
            outputDir: config.outputDir,
            stats: result.manifest.stats,
            durationMs: result.manifest.durationMs
          })
        )
      } else if (!flags.quiet) {
        console.log(
          `ancleto-writer: publicado ${config.outputDir} ` +
            `(${result.manifest.stats.files} archivos, ${result.manifest.stats.edges} aristas, ` +
            `${result.manifest.durationMs} ms)`
        )
      }
      process.exit(0)
    }

    if (command === 'check') {
      const flags = parseFlags(rest, {
        '--root': { key: 'root', value: true },
        '--json': { key: 'json' }
      })
      const config = loadConfig({ cwd: process.cwd(), cli: { root: flags.root } })
      const result = checkPackage({ rootAbs: config.rootAbs, config })

      if (flags.json) {
        console.log(JSON.stringify({ status: result.status, exitCode: result.exitCode }))
      } else {
        console.log(`ancleto-writer: ${result.status}`)
      }
      process.exit(result.exitCode)
    }

    if (command === 'doctor') {
      const flags = parseFlags(rest, {
        '--root': { key: 'root', value: true },
        '--json': { key: 'json' }
      })
      const config = loadConfig({ cwd: process.cwd(), cli: { root: flags.root } })
      const report = runDoctor({ rootAbs: config.rootAbs, config })

      if (flags.json) {
        console.log(JSON.stringify(report, null, 2))
      } else {
        printDoctor(report)
      }
      process.exit(0)
    }

    throw new CliError(`comando no reconocido: ${command}`)
  } catch (error) {
    if (error instanceof CliError || error.name === 'ConfigError') {
      console.error(`ancleto-writer: ${error.message}`)
      usage()
      process.exit(1)
    }
    console.error(`ancleto-writer: ${error.message}`)
    process.exit(2)
  }
}

main()
