## ADDED Requirements

### Requirement: Comando de reporte humano

The system SHALL exponer un comando `ancleto-writer human` que lea un paquete de Writer ya
construido y genere una vista humana compacta sin volver a escanear ni parsear el repositorio.

#### Scenario: Paquete existente

- **WHEN** existe `outputDir/manifest.json`, `graph.json` y facts
- **THEN** `human` genera `outputDir/human/OVERVIEW.md`, `ARCHITECTURE.md` y `data.json`
- **AND** no modifica los artefactos de agentes ni el manifest

#### Scenario: Paquete ausente

- **WHEN** no existe el paquete o falta `graph.json`
- **THEN** el comando falla con un error claro
- **AND** sugiere ejecutar `ancleto-writer build`

#### Scenario: Sin reanálisis

- **WHEN** se ejecuta `human`
- **THEN** no se ejecuta el scanner, el parser ni la resolución de imports

### Requirement: Salida humana acotada

The system SHALL limitar listas, grafos y UML para que la salida sea legible en repos grandes.

#### Scenario: Defaults

- **WHEN** se ejecuta sin flags
- **THEN** usa `top: 20`, `maxClasses: 20`, `maxNodes: 30` y `maxCommunities: 6`

#### Scenario: Flags

- **WHEN** se pasan `--top`, `--max-classes`, `--max-nodes` o `--max-communities`
- **THEN** los límites se aplican a las tablas y diagramas correspondientes

#### Scenario: Ciclo demasiado grande

- **WHEN** el primer ciclo supera `maxNodes`
- **THEN** no se genera su diagrama Mermaid
- **AND** se muestra un resumen en tabla

### Requirement: Determinismo y frontera

The system SHALL producir artefactos humanos deterministas y SHALL escribir únicamente dentro
de `outputDir/human`.

#### Scenario: Dos ejecuciones

- **WHEN** se ejecuta `human` dos veces sobre el mismo paquete
- **THEN** los tres archivos son byte-idénticos

#### Scenario: Frontera de escritura

- **WHEN** termina el comando
- **THEN** ningún archivo fuera de `outputDir/human` cambió

#### Scenario: Sin rutas absolutas

- **WHEN** se inspecciona `data.json`
- **THEN** las rutas son relativas al root y no incluyen el path absoluto del proyecto

### Requirement: Contrato estable

The system SHALL mantener `schemaVersion: 1` y SHALL tratar `human/` como una salida derivada
opcional fuera del manifest de agentes.

#### Scenario: Consumidor de agentes

- **WHEN** un consumidor lee el manifest
- **THEN** no encuentra entradas de `human/` en `outputs`
- **AND** puede ignorar el directorio sin romper el contrato

#### Scenario: Sin dependencias

- **WHEN** se inspecciona el `package.json` del core
- **THEN** no se agregaron dependencias de runtime por esta feature
