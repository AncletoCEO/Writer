## ADDED Requirements

### Requirement: Comando lint

El sistema SHALL exponer `ancleto-writer lint` y devolver exit `5` cuando una regla configurada falla.

#### Scenario: Ciclo de imports

- **WHEN** el grafo contiene un ciclo y la regla de ciclos está activa
- **THEN** `lint` reporta el ciclo
- **AND** devuelve exit `5`

#### Scenario: Violación de capa

- **WHEN** existe un import upward y la regla de capas está activa
- **THEN** `lint` reporta el archivo y la línea
- **AND** devuelve exit `5`

#### Scenario: Repositorio limpio

- **WHEN** no hay violaciones configuradas
- **THEN** `lint` devuelve exit `0`

#### Scenario: Salida JSON

- **WHEN** se ejecuta `lint --json`
- **THEN** la salida es JSON parseable con los hallazgos
