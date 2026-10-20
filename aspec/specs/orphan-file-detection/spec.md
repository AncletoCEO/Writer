# Spec: orphan-file-detection

## Purpose

Define la detección de archivos huérfanos, sus exclusiones y su integración opt-in con `lint`.

## Requirements

### Requirement: Detección de archivos huérfanos

El sistema SHALL publicar en `facts/dead-code.json` los archivos sin imports entrantes que no
sean entrypoints, tests, configuración, scripts ni estén excluidos por configuración.

#### Scenario: Archivo huérfano

- **WHEN** un archivo fuente no tiene ninguna arista `import` entrante y no está excluido
- **THEN** aparece en `orphanFiles`
- **AND** incluye `reason: no-inbound-imports` y `confidence`

#### Scenario: Entrypoint excluido

- **WHEN** un archivo es `bin`, `main`, `module` o `exports` de `package.json`
- **THEN** no aparece en `orphanFiles`
- **AND** aparece en `excluded` con el motivo correspondiente

#### Scenario: Test, config o script

- **WHEN** un archivo es test, configuración o script
- **THEN** no aparece en `orphanFiles`
- **AND** aparece en `excluded`

#### Scenario: Dynamic import no literal

- **WHEN** el repositorio contiene un dynamic import con argumento no literal
- **THEN** `dynamicImports` es `true`
- **AND** los candidatos se emiten con `confidence: low`

### Requirement: Lint opt-in de huérfanos

El sistema SHALL evaluar huérfanos en `lint` solo cuando `lint.orphanFiles` sea `true`.

#### Scenario: Desactivado por defecto

- **WHEN** `lint.orphanFiles` no está configurado
- **THEN** un archivo huérfano no hace fallar `lint`

#### Scenario: Activado

- **WHEN** `lint.orphanFiles` es `true` y existe un huérfano
- **THEN** `lint` reporta el hallazgo
- **AND** devuelve exit `5`
