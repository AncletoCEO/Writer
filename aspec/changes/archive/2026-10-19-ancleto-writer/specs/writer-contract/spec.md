# Spec: writer-contract

## Purpose

Define el contrato de artefactos que `@ancleto/writer` publica en `.ancleto/writer/`, sus reglas de frescura, publicación atómica, frontera de escritura y la forma en que un consumidor como `@ancleto/spec` lo usa o lo ignora sin acoplarse.

## ADDED Requirements

### Requirement: Layout versionado de artefactos

The system SHALL publicar el paquete de contexto en el directorio configurado `outputDir` con esta estructura mínima y `schemaVersion: 1`:

- `manifest.json`
- `graph.json`
- `symbols.json`
- `facts/cycles.json`
- `facts/layers.json`
- `facts/hotspots.json`
- `facts/blast-radius.json`
- `facts/inventory.md`
- `facts/unresolved.json`
- `facts/externals.json`
- `facts/skipped.json`
- `agent/INDEX.md`
- `agent/SYMBOLS.md`
- `agent/GOTCHAS.md`
- `agent/ARCHITECTURE.md`

#### Scenario: Build exitoso

- **WHEN** se ejecuta `ancleto-writer build` sobre un repositorio válido
- **THEN** todos los artefactos declarados existen en `outputDir`
- **AND** cada JSON de nivel superior declara `schemaVersion: 1`

#### Scenario: Directorio de salida alternativo

- **WHEN** se ejecuta `build --out .cache/writer`
- **THEN** todos los artefactos se publican en `.cache/writer/`
- **AND** no se escribe nada en `.ancleto/writer/`

### Requirement: Manifest de frescura

The system SHALL escribir `manifest.json` con `schemaVersion`, `writerVersion`, `generatedAt`, `root`, `gitCommit`, `gitDirty`, `fingerprint`, `stats` y la lista de `outputs` con hash y tamaño.

The system SHALL calcular `fingerprint` como SHA-256 sobre la lista ordenada `path\0size\0sha256(content)` de los archivos incluidos.

#### Scenario: Repositorio git limpio

- **WHEN** el manifest tiene el mismo `gitCommit` que `HEAD` y `gitDirty: false`
- **THEN** `check` considera el paquete fresco y devuelve exit `0`

#### Scenario: Cambio sin commit

- **WHEN** un archivo incluido cambia y el árbol git queda sucio
- **THEN** `check` recalcula el fingerprint
- **AND** si difiere, considera el paquete stale y devuelve exit `3`

#### Scenario: Repositorio sin git

- **WHEN** no existe `.git` en el root
- **THEN** `check` usa únicamente el fingerprint para decidir frescura

#### Scenario: Esquema incompatible

- **WHEN** `manifest.schemaVersion` no es 1
- **THEN** `check` devuelve exit `4`
- **AND** el consumidor ignora el paquete y usa su fallback

### Requirement: Publicación atómica

The system SHALL publicar el paquete mediante un directorio temporal y un swap atómico, escribiendo `manifest.json` al final, de modo que nunca exista un estado mixto entre artefactos.

#### Scenario: Build exitoso

- **WHEN** termina un build
- **THEN** el directorio de salida contiene un paquete completo
- **AND** el manifest corresponde a los artefactos publicados

#### Scenario: Fallo durante la escritura

- **WHEN** el build falla antes del swap
- **THEN** el paquete anterior permanece intacto
- **AND** no queda un manifest nuevo apuntando a artefactos viejos

#### Scenario: Fallo durante el swap

- **WHEN** falla el rename final
- **THEN** el backup se restaura
- **AND** el build devuelve exit `2`

### Requirement: Frontera de escritura y lectura

The system SHALL escribir únicamente dentro de `outputDir` y SHALL NOT escribir en `aspec/`, `docs/technical-discovery/`, `.ancletorc`, `README.md` ni `.ancleto/memory.db`.

The system SHALL abrir `.ancleto/memory.db` en modo read-only y SHALL NOT ejecutar migraciones, escrituras, checkpoints ni cambios de schema.

#### Scenario: Memoria presente

- **WHEN** existe `.ancleto/memory.db`
- **THEN** el hash del archivo es idéntico antes y después del build
- **AND** `GOTCHAS.md` incluye las reglas activas de scope `project`

#### Scenario: Memoria ausente o bloqueada

- **WHEN** `.ancleto/memory.db` no existe o no puede abrirse en read-only
- **THEN** el build continúa
- **AND** la sección de reglas del proyecto queda vacía con una nota

#### Scenario: Sin escrituras laterales

- **WHEN** se ejecuta un build en un repositorio con `aspec/` y `README.md`
- **THEN** ningún archivo fuera de `outputDir` cambia

### Requirement: Documentación para agentes

The system SHALL generar `INDEX.md`, `SYMBOLS.md`, `GOTCHAS.md` y `ARCHITECTURE.md`, cada uno con un tope de 500 líneas y paginación `_pN.md` cuando el contenido exceda el tope.

#### Scenario: Repositorio grande

- **WHEN** `SYMBOLS.md` supera 500 líneas
- **THEN** se genera `SYMBOLS_p2.md` con el resto
- **AND** el documento principal enlaza a la página siguiente

#### Scenario: Contenido de GOTCHAS

- **WHEN** existen ciclos, hotspots, violaciones de capa o imports no resueltos
- **THEN** `GOTCHAS.md` los lista con `file:line` cuando corresponde
- **AND** incluye las reglas activas del proyecto sin mapearlas semánticamente a archivos

### Requirement: Salidas propias sin plantillas AGPL

The system SHALL emitir únicamente JSON, Markdown y Mermaid generados por código propio, y SHALL NOT copiar HTML, JavaScript, CSS, video, GraphRAG, wiki ni plantillas del upstream en los artefactos.

#### Scenario: Auditoría de artefactos

- **WHEN** se inspeccionan los archivos publicados
- **THEN** no hay archivos `.html`, `.js` ni `.css`
- **AND** no aparece el aviso de copyright de ReadMenator en las salidas del usuario

### Requirement: Fallback independiente

The system SHALL ser opcional para el consumidor: la ausencia, vejez o incompatibilidad del paquete SHALL NOT impedir que `@ancleto/spec` opere con su discovery y affected-set actuales.

#### Scenario: Writer ausente

- **WHEN** el consumidor no encuentra `.ancleto/writer/manifest.json`
- **THEN** usa su fallback
- **AND** el resultado es equivalente al de un repositorio sin writer

#### Scenario: Writer stale

- **WHEN** el manifest existe pero el fingerprint no coincide
- **THEN** el consumidor ignora el paquete
- **AND** usa su fallback sin error fatal

#### Scenario: Writer con esquema futuro

- **WHEN** el manifest declara `schemaVersion: 2`
- **THEN** el consumidor de `schemaVersion: 1` lo ignora
- **AND** no intenta interpretar campos desconocidos
