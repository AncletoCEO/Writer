## ADDED Requirements

### Requirement: Contexto del import para adapters

The system SHALL pasar la entrada completa del import a `resolveImport`, además del specifier
y el archivo origen, para que los adapters puedan usar metadatos específicos del lenguaje
(por ejemplo, si un include de C es quoted o system).

#### Scenario: Adapter recibe la entrada

- **WHEN** un adapter resuelve un import
- **THEN** recibe el specifier, el archivo origen y la entrada del import
- **AND** los adapters que no la usan no cambian su comportamiento

#### Scenario: Include quoted

- **WHEN** un adapter marcó un import con `quoted: true`
- **THEN** puede leer ese valor desde `importEntry`
- **AND** decidir la estrategia de resolución
