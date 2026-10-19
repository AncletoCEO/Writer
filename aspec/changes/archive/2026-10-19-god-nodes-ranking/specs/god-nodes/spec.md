## ADDED Requirements

### Requirement: Ranking de god nodes

El sistema SHALL publicar un ranking determinista de god nodes en `facts/god-nodes.json` combinando PageRank, fan-in y símbolos exportados.

#### Scenario: Ranking por centralidad

- **WHEN** un archivo concentra alta centralidad y fan-in
- **THEN** aparece primero en `facts/god-nodes.json`

#### Scenario: Desempate estable

- **WHEN** dos archivos tienen el mismo score
- **THEN** el desempate es por path ascendente

#### Scenario: Límite configurable

- **WHEN** se configura un límite menor que la cantidad de archivos
- **THEN** el fact incluye como máximo ese límite
