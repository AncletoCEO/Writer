// SPDX-License-Identifier: AGPL-3.0-only

import { analyzeRepository } from '../../build/analyze.js'

function stripFile(id) {
  return String(id).replace(/^file:/, '')
}

function location(finding) {
  const path = finding.path ?? (finding.from ? stripFile(finding.from) : null)
  if (!path) return ''
  return finding.line === null || finding.line === undefined
    ? ` (${path})`
    : ` (${path}:${finding.line})`
}

export function runLint({ rootAbs, config }) {
  const analysis = analyzeRepository({ rootAbs, config })
  const rules = config.lint ?? {}
  const findings = []

  if (rules.cycles !== false) {
    for (const cycle of analysis.metrics.cycles.cycles) {
      findings.push({
        rule: 'cycles',
        message: `Ciclo de imports: ${cycle.files.map(stripFile).join(' → ')}`,
        files: cycle.files,
        size: cycle.size
      })
    }
    for (const loop of analysis.metrics.cycles.selfLoops) {
      findings.push({
        rule: 'cycles',
        message: `Self-loop: ${stripFile(loop)}`,
        files: [loop],
        size: 1
      })
    }
  }

  if (rules.layerViolations !== false) {
    for (const violation of analysis.metrics.layers.violations) {
      findings.push({
        rule: 'layer-violations',
        message: `Import upward: ${violation.from} (${violation.fromLayer}) → ${violation.to} (${violation.toLayer})`,
        from: violation.from,
        to: violation.to,
        fromLayer: violation.fromLayer,
        toLayer: violation.toLayer,
        line: violation.line
      })
    }
  }

  if (rules.unresolved !== false) {
    for (const entry of analysis.unresolved) {
      findings.push({
        rule: 'unresolved-imports',
        message: `Import no resuelto: ${entry.specifier ?? '(no literal)'} (${entry.reason})`,
        path: entry.path,
        specifier: entry.specifier ?? null,
        line: entry.line
      })
    }
  }

  if (Number.isInteger(rules.maxBlastRadius) && rules.maxBlastRadius >= 0) {
    for (const seed of analysis.metrics.blastRadius) {
      if (seed.transitive <= rules.maxBlastRadius) continue
      findings.push({
        rule: 'max-blast-radius',
        message: `Blast radius excede el umbral: ${seed.transitive} > ${rules.maxBlastRadius}`,
        path: seed.path,
        transitive: seed.transitive,
        threshold: rules.maxBlastRadius
      })
    }
  }

  findings.sort(
    (a, b) =>
      a.rule.localeCompare(b.rule) ||
      String(a.path ?? a.from ?? '').localeCompare(String(b.path ?? b.from ?? '')) ||
      (a.line ?? 0) - (b.line ?? 0) ||
      String(a.to ?? a.specifier ?? '').localeCompare(String(b.to ?? b.specifier ?? ''))
  )

  return {
    findings,
    exitCode: findings.length > 0 ? 5 : 0,
    analysis
  }
}

export function formatFinding(finding) {
  return `- [${finding.rule}] ${finding.message}${location(finding)}`
}
