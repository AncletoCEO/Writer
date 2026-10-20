# Spec: output-folder-readme

## Purpose

Define el README autodescriptivo publicado dentro de `outputDir`, sin tocar archivos del
usuario.

## Requirements

### Requirement: README dentro de outputDir

El sistema SHALL generar un `README.md` dentro de `outputDir` que describa los artefactos
publicados y cómo regenerarlos.

#### Scenario: Build exitoso

- **WHEN** se ejecuta `ancleto-writer build`
- **THEN** existe `README.md` dentro de `outputDir`
- **AND** lista los artefactos que realmente existen

#### Scenario: README del usuario intacto

- **WHEN** el repositorio del usuario tiene un `README.md`
- **THEN** Writer no lo modifica
- **AND** el README generado vive solo dentro de `outputDir`

#### Scenario: Regeneración

- **WHEN** se ejecuta el build de nuevo
- **THEN** el README dentro de `outputDir` se actualiza
- **AND** no conserva entradas de artefactos eliminados
