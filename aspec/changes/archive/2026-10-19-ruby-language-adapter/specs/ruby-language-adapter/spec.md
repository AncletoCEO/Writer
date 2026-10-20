## ADDED Requirements

### Requirement: Adapter de Ruby

The system SHALL incluir archivos `.rb` cuando el language pack está activo y SHALL extraer
`require`/`require_relative`, clases, módulos, mixins, métodos, constructores, herencia,
visibilidad, llamadas intra-archivo y comentarios.

#### Scenario: Require y require_relative

- **WHEN** un archivo contiene `require 'json'` y `require_relative 'lib/base'`
- **THEN** el primero se marca como no relativo y se deja externo
- **AND** el segundo se marca como relativo y se resuelve a `lib/base.rb`

#### Scenario: Clase con herencia

- **WHEN** un archivo contiene `class App < Base`
- **THEN** `App` se publica con `kind: class`
- **AND** se emite una relación de `App` hacia `Base`

#### Scenario: Módulo y mixin

- **WHEN** un archivo declara `module M` y una clase contiene `include M`
- **THEN** `M` se publica como `class` con firma `module M`
- **AND** se emite una relación `implements` de la clase hacia `M`

#### Scenario: Métodos y visibilidad

- **WHEN** una clase contiene métodos públicos, `private` y `protected`
- **THEN** solo los públicos se marcan `exported: true`

#### Scenario: Doc comment

- **WHEN** una declaración tiene comentarios `#` inmediatamente anteriores
- **THEN** el símbolo publica `summary` con la primera línea útil

#### Scenario: Llamada local

- **WHEN** una función o método llama a otra función/método local resoluble
- **THEN** se emite una arista `call` con `confidence: inferred`

### Requirement: Resolución de `require_relative`

The system SHALL resolver `require_relative` contra el directorio del archivo, probando el
path tal cual y con `.rb` si no tiene extensión. Los `require` no relativos SHALL quedar
externos.

#### Scenario: Path con extensión implícita

- **WHEN** `src/app.rb` contiene `require_relative 'lib/base'` y existe `src/lib/base.rb`
- **THEN** se emite una arista `import` hacia `src/lib/base.rb`

#### Scenario: Path con `.rb`

- **WHEN** `require_relative 'lib/base.rb'` y el archivo existe
- **THEN** se resuelve a ese archivo

#### Scenario: Path con `../`

- **WHEN** `src/app.rb` contiene `require_relative '../shared'` y existe `shared.rb`
- **THEN** se resuelve a `shared.rb`

#### Scenario: Require externo

- **WHEN** un archivo contiene `require 'json'` sin path relativo
- **THEN** no se crea nodo
- **AND** se incrementa `stats.externalImports`

#### Scenario: Require relativo inexistente

- **WHEN** un `require_relative` no encuentra el archivo
- **THEN** se registra en `facts/unresolved.json` con `reason: not-found`

### Requirement: Fallback de Ruby sin pack

The system SHALL mantener `.rb` en `facts/unsupported.json` cuando el language pack no está
activo.

#### Scenario: Sin pack

- **WHEN** el repositorio contiene `src/app.rb` y el pack no está activo
- **THEN** no se emite nodo `lang: ruby`
- **AND** aparece en `facts/unsupported.json`
