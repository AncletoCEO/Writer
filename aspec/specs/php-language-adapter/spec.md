# Spec: php-language-adapter

## Purpose

Define el adapter de PHP del language pack opcional: descubrimiento de `.php`, parsing de
namespaces, `use`, clases, interfaces, traits, enums, métodos, herencia, llamadas y docblocks,
y resolución de `use` contra el índice de namespaces.

## Requirements

### Requirement: Adapter de PHP

The system SHALL incluir archivos `.php` cuando el language pack está activo y SHALL extraer
namespaces, `use`, clases, interfaces, traits, enums, métodos, constructores,
herencia/implementación, llamadas intra-archivo y docblocks.

#### Scenario: Namespace y use

- **WHEN** un archivo declara `namespace App\Core;` y usa
  `use App\Services\Service;`, `use function App\Util\helper;` y
  `use App\Services\{Repo, Cache as C};`
- **THEN** `parse.namespaces` incluye `App\Core`
- **AND** se extraen los cuatro imports, con alias `C`

#### Scenario: Clase con extends e implements

- **WHEN** un archivo contiene `class App extends Base implements IRunner`
- **THEN** `App` se publica con `kind: class`
- **AND** se emiten relaciones hacia `Base` e `IRunner`
- **AND** `IRunner` se marca como `implements`

#### Scenario: Interface, trait y enum

- **WHEN** un archivo declara `interface I`, `trait T` y `enum E`
- **THEN** se publican con `kind: interface`, `kind: class` (firma `trait T`) y `kind: enum`

#### Scenario: Visibilidad de métodos

- **WHEN** una clase declara métodos `public`, `private` y `protected`
- **THEN** solo el público se marca `exported: true`

#### Scenario: Docblock

- **WHEN** una declaración tiene un docblock `/** ... */` anterior
- **THEN** el símbolo publica `summary` sin `*` ni tags `@...`

#### Scenario: Llamada local

- **WHEN** una función o método llama a otra función/método local resoluble
- **THEN** se emite una arista `call` con `confidence: inferred`

### Requirement: Resolución de `use` PHP

The system SHALL resolver un `use` contra el índice de namespaces probando el nombre completo
y quitando segmentos hasta encontrar un namespace conocido, y SHALL emitir una arista por cada
archivo de ese namespace, excluyendo el archivo actual. Los nombres externos SHALL quedar
externos.

#### Scenario: Use de clase local

- **WHEN** `use App\Services\Service;` y `App\Services` contiene `Service.php` y `Repo.php`
- **THEN** se emiten aristas `import` hacia ambos archivos
- **AND** no se emite arista hacia el archivo actual

#### Scenario: Use de función

- **WHEN** `use function App\Util\helper;` y `App\Util` es un namespace local
- **THEN** se emiten aristas hacia los archivos de `App\Util`

#### Scenario: Use de namespace

- **WHEN** `use App\Services;`
- **THEN** se emiten aristas hacia los archivos de `App\Services`

#### Scenario: Use externo

- **WHEN** un archivo contiene `use DateTime;` sin namespace local
- **THEN** no se crea nodo
- **AND** se incrementa `stats.externalImports`

### Requirement: Fallback de PHP sin pack

The system SHALL mantener `.php` en `facts/unsupported.json` cuando el language pack no está
activo.

#### Scenario: Sin pack

- **WHEN** el repositorio contiene `src/App.php` y el pack no está activo
- **THEN** no se emite nodo `lang: php`
- **AND** aparece en `facts/unsupported.json`
