## ADDED Requirements

### Requirement: API Markdown de símbolos exportados

El sistema SHALL generar `agent/API.md` con los símbolos exportados agrupados por archivo,
incluyendo firma y `summary` cuando exista.

#### Scenario: Símbolos exportados

- **WHEN** un archivo tiene símbolos exportados
- **THEN** `API.md` los lista bajo el path del archivo
- **AND** cada línea incluye la firma

#### Scenario: Summary disponible

- **WHEN** un símbolo exportado tiene `summary`
- **THEN** `API.md` lo incluye después de la firma

#### Scenario: Símbolos no exportados

- **WHEN** un archivo solo tiene símbolos no exportados
- **THEN** no aparecen en `API.md`

#### Scenario: Sin exportados

- **WHEN** el repositorio no tiene símbolos exportados
- **THEN** `API.md` existe con una nota de "Sin símbolos exportados"

### Requirement: Paginación

El sistema SHALL aplicar el mismo límite de 500 líneas y paginación `_pN.md` que los demás
documentos de agente.

#### Scenario: Documento largo

- **WHEN** `API.md` supera 500 líneas
- **THEN** se genera `API_p2.md` y el documento principal enlaza a la página siguiente
