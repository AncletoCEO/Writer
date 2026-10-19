# Spec: community-detection

## Purpose

Detección determinista de comunidades cohesivas sobre el grafo de imports, con cohesión y asignación por archivo.

## Requirements

### Requirement: Detección de comunidades

El sistema SHALL agrupar archivos en comunidades deterministas a partir de las aristas de import y publicarlas en `facts/communities.json` con `schemaVersion: 1`.

#### Scenario: Dos clusters y un puente

- **WHEN** el grafo contiene dos grupos densamente conectados y una arista de puente
- **THEN** el fact reporta dos comunidades separadas y la asignación de cada archivo es estable

#### Scenario: Determinismo

- **WHEN** se ejecuta el build dos veces sobre el mismo repositorio
- **THEN** las comunidades y sus archivos son idénticos

#### Scenario: Grafo vacío

- **WHEN** no hay archivos fuente
- **THEN** `facts/communities.json` existe con una lista vacía
- **AND** el build no falla
