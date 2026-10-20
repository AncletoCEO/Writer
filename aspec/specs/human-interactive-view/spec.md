# Spec: human-interactive-view

## Purpose

Define la vista HTML interactiva opcional de Writer: Cytoscape.js vendorizado, grafo de
comunidades, filtros, drill-down, offline, seguridad y contrato derivado.

## Requirements

### Requirement: Vista interactiva opcional

The system SHALL generar `outputDir/human/interactive.html` cuando se ejecute
`ancleto-writer human --interactive`, sin modificar el HTML estático existente.

#### Scenario: Generación

- **WHEN** se ejecuta `human --interactive`
- **THEN** existe `human/interactive.html`
- **AND** `human/index.html` sigue existiendo

#### Scenario: Sin flag

- **WHEN** se ejecuta `human` sin `--interactive`
- **THEN** no se genera `interactive.html`

### Requirement: Grafo de comunidades

The system SHALL renderizar un grafo Cytoscape de comunidades agregadas, no un grafo global de
archivos, con nodos dimensionados por archivos y coloreados por lenguaje dominante.

#### Scenario: Comunidades

- **WHEN** el paquete tiene comunidades
- **THEN** el grafo muestra como máximo `maxCommunities`
- **AND** las aristas representan imports agregados entre comunidades
- **AND** no se dibujan nodos archivo→archivo

#### Scenario: Drill-down

- **WHEN** el usuario hace click en una comunidad
- **THEN** se resaltan sus vecinos
- **AND** se listan sus archivos principales

#### Scenario: Límite

- **WHEN** se pasa `--max-communities N`
- **THEN** el grafo usa como máximo N comunidades

### Requirement: Offline, seguridad y determinismo

The system SHALL embeber Cytoscape y los datos en el HTML, sin recursos externos, y SHALL
escapar todo texto del repo.

#### Scenario: Offline

- **WHEN** se abre `interactive.html` sin red
- **THEN** Cytoscape y los datos están disponibles
- **AND** no hay `src`/`href` remotos

#### Scenario: Texto malicioso

- **WHEN** un path o ID contiene HTML
- **THEN** aparece escapado y no se ejecuta

#### Scenario: Determinismo

- **WHEN** se ejecuta dos veces con el mismo paquete
- **THEN** `interactive.html` es byte-idéntico

### Requirement: Vendor MIT

The system SHALL incluir Cytoscape.js vendorizado con su licencia MIT y SHALL NOT agregarlo
como dependencia de runtime del core.

#### Scenario: Licencia

- **WHEN** se inspecciona `src/human/vendor/`
- **THEN** existe `cytoscape.min.js` y su licencia MIT

#### Scenario: Dependencias

- **WHEN** se inspecciona `package.json`
- **THEN** `cytoscape` no aparece en `dependencies`
