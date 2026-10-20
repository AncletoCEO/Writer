## ADDED Requirements

### Requirement: Summary desde comentarios

El sistema SHALL agregar un `summary` opcional a los símbolos documentados, usando la primera
línea no vacía del comentario inmediatamente anterior a la declaración.

#### Scenario: Comentario de bloque inmediato

- **WHEN** una función tiene un comentario de bloque en la línea inmediatamente anterior
- **THEN** el símbolo incluye un `summary` con la primera línea no vacía
- **AND** no incluye delimitadores de comentario ni tags

#### Scenario: Comentario de línea inmediato

- **WHEN** una declaración tiene un comentario `//` inmediatamente anterior
- **THEN** el símbolo incluye ese texto como `summary`

#### Scenario: Comentario separado

- **WHEN** hay una línea en blanco entre el comentario y la declaración
- **THEN** el símbolo no recibe `summary`

#### Scenario: Declaración sin comentario

- **WHEN** una declaración no tiene comentario anterior
- **THEN** el símbolo no incluye `summary`
- **AND** no se inventa texto

### Requirement: Cobertura de documentación

El sistema SHALL publicar `facts/doc-coverage.json` con símbolos documentados y totales por
archivo y por repositorio.

#### Scenario: Cobertura por archivo

- **WHEN** un archivo tiene símbolos con y sin `summary`
- **THEN** el fact reporta `documented`, `total` y `ratio` para ese archivo

#### Scenario: Cobertura total

- **WHEN** se ejecuta el build
- **THEN** el fact incluye totales agregados y deterministas

#### Scenario: Baja cobertura

- **WHEN** un archivo queda por debajo de `docs.minCoverage`
- **THEN** aparece en la sección de cobertura de `GOTCHAS.md`
