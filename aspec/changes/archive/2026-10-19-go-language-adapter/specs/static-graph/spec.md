## ADDED Requirements

### Requirement: Resolución de un import a múltiples targets

The system SHALL aceptar que un adapter resuelva un import a múltiples archivos destino y
SHALL emitir una arista `import` por cada target, de forma ordenada y deduplicada, sin cambiar
el `schemaVersion` ni el formato de las aristas.

#### Scenario: Adapter multi-target

- **WHEN** un adapter devuelve `{ type: 'resolved', targets: ['pkg/a.go', 'pkg/b.go'] }`
- **THEN** el grafo emite una arista `import` hacia cada archivo
- **AND** el orden de las aristas es determinista
- **AND** los targets duplicados se colapsan

#### Scenario: Adapter single-target

- **WHEN** un adapter devuelve `{ type: 'resolved', target: 'pkg/a.go' }`
- **THEN** el comportamiento es idéntico al anterior a esta extensión
