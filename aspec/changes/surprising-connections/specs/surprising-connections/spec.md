## ADDED Requirements

### Requirement: Conexiones inesperadas

El sistema SHALL reportar conexiones de import entre comunidades distintas en `facts/bridges.json` con un score determinista.

#### Scenario: Puente entre dos comunidades

- **WHEN** dos comunidades densas están unidas por una sola arista de import
- **THEN** esa arista aparece primero en `facts/bridges.json`
- **AND** incluye las comunidades de origen y destino

#### Scenario: Sin comunidades

- **WHEN** no hay comunidades calculadas
- **THEN** el fact existe con una lista vacía
- **AND** el build no falla

#### Scenario: Determinismo

- **WHEN** se repite el build sobre el mismo repositorio
- **THEN** el orden y los scores son idénticos
