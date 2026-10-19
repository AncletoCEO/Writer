# Spec: writer-cli

## Purpose

Define la superficie de línea de comandos de `ancleto-writer`, la precedencia de configuración, los códigos de salida, el contrato de runtime y los límites de seguridad del proceso.

## ADDED Requirements

### Requirement: Comandos y flags

The system SHALL exponer el binario `ancleto-writer` con los comandos `init`, `build`, `check` y `doctor`, y las opciones globales `--help` y `--version`.

#### Scenario: Build

- **WHEN** se ejecuta `ancleto-writer build`
- **THEN** se genera el paquete completo en `outputDir`
- **AND** el comando devuelve exit `0`

#### Scenario: Check sin escritura

- **WHEN** se ejecuta `ancleto-writer check`
- **THEN** no se modifica ningún archivo
- **AND** se informa fresco, stale o incompatible

#### Scenario: Init idempotente

- **WHEN** se ejecuta `ancleto-writer init` y ya existe `.ancleto-writer.json`
- **THEN** no se sobrescribe
- **AND** con `--force` sí se reemplaza

#### Scenario: Doctor

- **WHEN** se ejecuta `ancleto-writer doctor`
- **THEN** reporta versión de Node, disponibilidad de git, permisos de escritura, estado de `memory.db`, configuración efectiva y último manifest

#### Scenario: Flag desconocido

- **WHEN** se pasa un flag no reconocido
- **THEN** el comando imprime el uso
- **AND** devuelve exit `1`

### Requirement: Precedencia de configuración

The system SHALL resolver la configuración con esta precedencia: flags de CLI > `.ancleto-writer.json` > `.ancletorc` (`discovery.exclude`) > defaults. Los excludes SHALL unirse; el resto de los valores SHALL sobrescribirse.

#### Scenario: Excludes combinados

- **WHEN** `.ancletorc` excluye `docs` y `.ancleto-writer.json` excluye `fixtures`
- **THEN** el build excluye ambos

#### Scenario: Override por flag

- **WHEN** `.ancleto-writer.json` declara `outputDir: .ancleto/writer` y se pasa `--out .cache/writer`
- **THEN** la salida se escribe en `.cache/writer`

#### Scenario: Sin archivos de configuración

- **WHEN** no existe `.ancleto-writer.json` ni `.ancletorc`
- **THEN** se aplican los defaults documentados
- **AND** el build funciona sin pasos previos

### Requirement: Códigos de salida

The system SHALL devolver códigos de salida estables:

- `0`: éxito o paquete fresco
- `1`: error de uso o configuración
- `2`: error de análisis o publicación
- `3`: paquete stale en `check`
- `4`: esquema incompatible en `check`

#### Scenario: Check stale

- **WHEN** `check` detecta fingerprint distinto
- **THEN** devuelve exit `3`

#### Scenario: Error de configuración

- **WHEN** `.ancleto-writer.json` no es JSON válido
- **THEN** devuelve exit `1`
- **AND** el mensaje indica el archivo y la posición del error cuando es posible

#### Scenario: Error de análisis

- **WHEN** el scanner no puede leer el root
- **THEN** devuelve exit `2`

### Requirement: Cero dependencias de runtime y Node mínimo

The system SHALL declarar cero `dependencies` de runtime, usar únicamente módulos nativos de Node y SHALL rechazar la ejecución en Node menor a 24 con un mensaje claro.

#### Scenario: Auditoría de dependencias

- **WHEN** se inspecciona `package.json`
- **THEN** no existe el campo `dependencies`
- **AND** `npm ls --omit=dev` no lista paquetes externos

#### Scenario: Node incompatible

- **WHEN** se ejecuta el CLI con Node 22
- **THEN** muestra un mensaje que indica Node ≥ 24
- **AND** devuelve exit `1`

### Requirement: Límites de seguridad

The system SHALL NOT seguir symlinks, SHALL NOT ejecutar código del repositorio analizado, SHALL NOT realizar llamadas de red y SHALL mantener toda lectura y escritura dentro del `root` configurado, salvo la lectura opcional de `memory.db`.

#### Scenario: Intento de path traversal

- **WHEN** un import relativo resuelve fuera del root
- **THEN** se rechaza
- **AND** se registra en `facts/unresolved.json` con `reason: outside-root`
- **AND** no se lee el archivo destino

#### Scenario: Git en modo lectura

- **WHEN** el repositorio tiene git
- **THEN** solo se ejecutan `git rev-parse` y `git diff --name-only`
- **AND** nunca se ejecutan hooks ni comandos del repositorio

#### Scenario: Sin red

- **WHEN** se ejecuta cualquier comando
- **THEN** no se abre ninguna conexión de red

### Requirement: Avisos legales

The system SHALL mostrar en `--version` y `--help` el copyright, la licencia AGPL-3.0-only y la ausencia de garantía.

#### Scenario: Versión

- **WHEN** se ejecuta `ancleto-writer --version`
- **THEN** imprime la versión, el copyright y la referencia a AGPL-3.0-only
- **AND** indica que no hay garantía

#### Scenario: Ayuda

- **WHEN** se ejecuta `ancleto-writer --help`
- **THEN** incluye los comandos, las opciones globales y el aviso legal
