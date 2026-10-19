# Spec: writer-distribution

## Purpose

Define las obligaciones de licencia, atribución, procedencia y contenido del paquete `@ancleto/writer` derivado de ReadMenator, para que la distribución por GitHub y npm cumpla AGPL-3.0.

## Requirements

### Requirement: Licencia AGPL-3.0

The system SHALL distribuirse bajo `AGPL-3.0-only`, incluir el texto completo de la licencia y no imponer restricciones adicionales sobre el uso, la modificación o la redistribución.

#### Scenario: Metadatos del paquete

- **WHEN** se inspecciona `package.json`
- **THEN** `license` es `AGPL-3.0-only`
- **AND** existe `LICENSE` con el texto de GNU AGPL-3.0

#### Scenario: Sin restricciones extra

- **WHEN** se revisan `LICENSE`, `NOTICE` y `README.md`
- **THEN** no hay cláusulas de uso no comercial, campo de uso, límites de usuarios ni EULA propietaria

#### Scenario: Aviso en la interfaz

- **WHEN** se ejecuta el binario con `--version` o `--help`
- **THEN** se muestran copyright, licencia y ausencia de garantía

### Requirement: Atribución y procedencia

The system SHALL incluir un `NOTICE` con el proyecto upstream, su URL, autor, commit exacto, lista de archivos derivados y fecha de modificación, y SHALL marcar cada archivo derivado con una cabecera SPDX y la referencia al módulo upstream.

#### Scenario: NOTICE completo

- **WHEN** se lee `NOTICE`
- **THEN** contiene `https://github.com/grisuno/ReadMenator`, el commit de origen y la lista de archivos derivados

#### Scenario: Cabecera por archivo

- **WHEN** se audita cada archivo bajo `src/parsers/`, `src/graph/` o `src/metrics/` marcado como derivado
- **THEN** tiene `SPDX-License-Identifier: AGPL-3.0-only`
- **AND** referencia el módulo upstream y la fecha de modificación

#### Scenario: README atributivo

- **WHEN** se lee `README.md`
- **THEN** declara que el proyecto está basado en ReadMenator
- **AND** no usa la marca ReadMenator como nombre propio ni sugiere afiliación

### Requirement: Fuente completa en la distribución

The system SHALL incluir el código fuente completo, `LICENSE`, `NOTICE` y la documentación del contrato en el tarball de npm, y SHALL publicar el mismo código en el tag de GitHub correspondiente a la versión.

#### Scenario: Contenido del tarball

- **WHEN** se ejecuta `npm pack --dry-run`
- **THEN** el paquete incluye `src/`, `LICENSE`, `NOTICE`, `docs/` y `README.md`
- **AND** no incluye tests, fixtures ni artefactos generados

#### Scenario: Correspondencia versión-fuente

- **WHEN** se compara una versión publicada en npm con el tag `v<versión>` de GitHub
- **THEN** el código fuente coincide con el del tarball

### Requirement: Salidas del usuario

The system SHALL NOT incorporar código, plantillas HTML/JS/CSS ni avisos de copyright del upstream en los artefactos que genera en el repositorio del usuario.

#### Scenario: Artefactos generados

- **WHEN** se audita `.ancleto/writer/`
- **THEN** solo contiene JSON, Markdown y Mermaid generados por código propio
- **AND** no hay archivos ejecutables ni plantillas del upstream

#### Scenario: Repositorio del usuario

- **WHEN** el usuario publica su repositorio con los artefactos generados
- **THEN** los artefactos no le imponen obligaciones AGPL adicionales por sí mismos

### Requirement: Contribuciones y relicenciamiento

The system SHALL documentar que las contribuciones al repositorio quedan bajo AGPL-3.0-only y que un relicenciamiento futuro requiere reescribir el núcleo derivado y obtener permiso del upstream.

#### Scenario: Documentación de contribución

- **WHEN** se lee la sección de contribución del `README.md` o `CONTRIBUTING.md`
- **THEN** indica la licencia de las contribuciones
- **AND** advierte que el código derivado no puede relicenciarse sin reescritura y permiso
