// SPDX-License-Identifier: AGPL-3.0-only
// Derived from ReadMenator readmenator/_exclusions.py, readmenator/_config.py (commit dac48f868722620f0d01dac0d33102c5a514c03c),
// modified 2026-10-19 by AncletoCEO.

import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import { isAbsolute, join, relative, resolve } from 'node:path'
import { toPosix } from './glob.js'

export const CONFIG_FILE = '.ancleto-writer.json'
export const ANCLETORC_FILE = '.ancletorc'
export const SCHEMA_VERSION = 1
export const ALLOWED_LANGUAGES = ['js', 'ts', 'jsx', 'tsx']

const DEFAULTS = {
  schemaVersion: SCHEMA_VERSION,
  root: '.',
  outputDir: '.ancleto/writer',
  include: ['**/*'],
  exclude: ['node_modules', '.git', '.ancleto', 'dist', 'build', 'coverage', 'aspec'],
  languages: ['js', 'ts', 'jsx', 'tsx'],
  maxFileSizeBytes: 1048576,
  maxDepth: 32,
  followSymlinks: false,
  resolve: {
    tsconfig: 'auto',
    extensions: ['.js', '.mjs', '.cjs', '.jsx', '.ts', '.tsx', '.json']
  },
  layers: {
    enabled: true,
    overrides: {}
  },
  impactSeeds: [],
  memory: {
    enabled: true,
    path: '.ancleto/memory.db',
    scope: 'project'
  },
  agentDocs: true
}

export class ConfigError extends Error {
  constructor(message) {
    super(message)
    this.name = 'ConfigError'
  }
}

export function defaultConfig() {
  return JSON.parse(JSON.stringify(DEFAULTS))
}

function isPlainObject(value) {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function deepMerge(base, override) {
  if (Array.isArray(override) || !isPlainObject(override)) return override
  if (!isPlainObject(base)) return override
  const merged = { ...base }
  for (const [key, value] of Object.entries(override)) {
    merged[key] = deepMerge(base[key], value)
  }
  return merged
}

function readJson(path, { optional = false } = {}) {
  if (!existsSync(path)) {
    if (optional) return null
    throw new ConfigError(`no existe el archivo de configuración: ${path}`)
  }
  let raw
  try {
    raw = readFileSync(path, 'utf8')
  } catch (error) {
    throw new ConfigError(`no se pudo leer ${path}: ${error.message}`)
  }
  try {
    return JSON.parse(raw.replace(/^\uFEFF/, ''))
  } catch (error) {
    throw new ConfigError(`JSON inválido en ${path}: ${error.message}`)
  }
}

function isInside(rootAbs, targetAbs) {
  const rel = relative(rootAbs, targetAbs)
  return rel === '' || (!rel.startsWith('..') && !isAbsolute(rel))
}

function unique(values) {
  const seen = new Set()
  const out = []
  for (const value of values) {
    if (typeof value !== 'string') continue
    const normalized = toPosix(value).replace(/^\.\//, '').replace(/\/+$/, '')
    if (!normalized || seen.has(normalized)) continue
    seen.add(normalized)
    out.push(normalized)
  }
  return out
}

function validate(config) {
  if (!Array.isArray(config.include) || config.include.some((item) => typeof item !== 'string')) {
    throw new ConfigError('include debe ser un array de strings')
  }
  if (!Array.isArray(config.exclude) || config.exclude.some((item) => typeof item !== 'string')) {
    throw new ConfigError('exclude debe ser un array de strings')
  }
  if (!Array.isArray(config.languages) || config.languages.length === 0) {
    throw new ConfigError('languages debe ser un array no vacío')
  }
  for (const language of config.languages) {
    if (!ALLOWED_LANGUAGES.includes(language)) {
      throw new ConfigError(`lenguaje no soportado: ${language}`)
    }
  }
  if (typeof config.outputDir !== 'string' || config.outputDir.trim() === '') {
    throw new ConfigError('outputDir debe ser un string no vacío')
  }
  if (!Number.isInteger(config.maxFileSizeBytes) || config.maxFileSizeBytes <= 0) {
    throw new ConfigError('maxFileSizeBytes debe ser un entero positivo')
  }
  if (!Number.isInteger(config.maxDepth) || config.maxDepth < 0) {
    throw new ConfigError('maxDepth debe ser un entero no negativo')
  }
  if (config.followSymlinks !== false) {
    throw new ConfigError('followSymlinks no está soportado: debe ser false')
  }
  if (!isPlainObject(config.memory)) {
    throw new ConfigError('memory debe ser un objeto')
  }
  if (typeof config.memory.path !== 'string' || config.memory.path.trim() === '') {
    throw new ConfigError('memory.path debe ser un string no vacío')
  }
  if (typeof config.agentDocs !== 'boolean') {
    throw new ConfigError('agentDocs debe ser boolean')
  }
  if (config.schemaVersion !== SCHEMA_VERSION) {
    throw new ConfigError(`schemaVersion incompatible: ${config.schemaVersion}`)
  }
}

export function loadConfig({ cwd = process.cwd(), cli = {} } = {}) {
  const rootAbs = resolve(cwd, cli.root ?? '.')
  if (!existsSync(rootAbs)) {
    throw new ConfigError(`no existe el root: ${rootAbs}`)
  }

  const warnings = []
  const defaults = defaultConfig()
  const configPath = join(rootAbs, CONFIG_FILE)
  const parsedConfig = readJson(configPath, { optional: true })
  const fileConfig = parsedConfig ?? {}
  if (!isPlainObject(fileConfig)) {
    throw new ConfigError(`${CONFIG_FILE} debe contener un objeto JSON`)
  }

  if (fileConfig.schemaVersion !== undefined && fileConfig.schemaVersion !== SCHEMA_VERSION) {
    throw new ConfigError(
      `schemaVersion incompatible en ${CONFIG_FILE}: ${fileConfig.schemaVersion}`
    )
  }

  let ancletoExcludes = []
  const rcPath = join(rootAbs, ANCLETORC_FILE)
  if (existsSync(rcPath)) {
    try {
      const rc = JSON.parse(readFileSync(rcPath, 'utf8').replace(/^\uFEFF/, ''))
      if (Array.isArray(rc?.discovery?.exclude)) {
        ancletoExcludes = rc.discovery.exclude
      }
    } catch (error) {
      warnings.push(`.ancletorc ignorado: ${error.message}`)
    }
  }

  const config = deepMerge(defaults, fileConfig)
  config.schemaVersion = SCHEMA_VERSION
  config.root = '.'
  config.exclude = unique([
    ...defaults.exclude,
    ...ancletoExcludes,
    ...(Array.isArray(fileConfig.exclude) ? fileConfig.exclude : [])
  ])

  if (cli.outputDir !== undefined) {
    config.outputDir = cli.outputDir
  }

  validate(config)

  const outputDirAbs = resolve(rootAbs, config.outputDir)
  if (!isInside(rootAbs, outputDirAbs)) {
    throw new ConfigError(`outputDir debe estar dentro del root: ${config.outputDir}`)
  }
  if (outputDirAbs === rootAbs) {
    throw new ConfigError('outputDir no puede ser la raíz del repositorio')
  }

  config.outputDir = toPosix(relative(rootAbs, outputDirAbs))
  config.warnings = warnings

  return {
    ...config,
    rootAbs,
    outputDirAbs
  }
}

export function writeConfigFile(rootAbs, config = defaultConfig()) {
  const payload = { ...config }
  delete payload.rootAbs
  delete payload.outputDirAbs
  delete payload.warnings
  const path = join(rootAbs, CONFIG_FILE)
  writeFileSync(path, `${JSON.stringify(payload, null, 2)}\n`)
  return path
}
