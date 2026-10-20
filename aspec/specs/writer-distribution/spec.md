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

### Requirement: Publicación del language pack

The system SHALL publicar `@ancleto/writer` y `@ancleto/writer-languages` como paquetes
separados, con versiones independientes, procedencia OIDC y un único tag de release basado en
la versión del core.

#### Scenario: Release 0.3.0

- **WHEN** se crea el tag `v0.3.0` y la versión del core es `0.3.0`
- **THEN** el workflow publica `@ancleto/writer@0.3.0`
- **AND** publica `@ancleto/writer-languages@0.1.0`
- **AND** ambas publicaciones usan `--provenance` y OIDC, sin `NPM_TOKEN`

#### Scenario: Versión ya publicada

- **WHEN** la versión del core o del pack ya existe en npm
- **THEN** su publicación se omite
- **AND** el workflow continúa con el otro paquete y el GitHub Release

#### Scenario: Trusted Publisher faltante

- **WHEN** el pack no tiene Trusted Publisher configurado
- **THEN** la primera publicación se hace manualmente
- **AND** la documentación explica cómo configurarlo antes de usar OIDC

### Requirement: Contenido del language pack

The system SHALL publicar el pack con su código, README, LICENSE y NOTICE, y SHALL declarar
sus dependencias de grammars únicamente en el pack, sin agregar dependencias al core.

#### Scenario: Tarball del pack

- **WHEN** se ejecuta `npm pack --dry-run` en `packages/writer-languages`
- **THEN** el tarball incluye `src/`, `README.md`, `LICENSE` y `NOTICE`
- **AND** no incluye tests ni `@ancleto/writer` como dependencia

#### Scenario: Core sin dependencias

- **WHEN** se inspecciona el `package.json` de `@ancleto/writer@0.3.0`
- **THEN** `dependencies` está ausente o vacío
- **AND** las grammars solo aparecen en el pack

### Requirement: Smoke de release con y sin pack

The system SHALL poder verificarse en un proyecto limpio con el core solo y con el core más el
pack, sin depender de un checkout del repositorio.

#### Scenario: Core solo

- **WHEN** se instala solo el tarball de `@ancleto/writer@0.3.0` en un proyecto limpio
- **AND** el proyecto contiene un `.py`
- **THEN** el build termina
- **AND** el `.py` aparece en `facts/unsupported.json`

#### Scenario: Core + pack

- **WHEN** se instalan los tarballs de core y pack en un proyecto limpio
- **AND** el proyecto contiene un `.py` y un `.ts`
- **THEN** el build analiza ambos
- **AND** `facts/unsupported.json` queda vacío
