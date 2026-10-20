# Spec: c-language-adapter

## Purpose

Define el adapter de C del language pack opcional: descubrimiento de `.c`/`.h`, parsing de
`#include`, structs, typedefs, enums, prototipos, definiciones, llamadas y comentarios, y
resolución de headers quoted contra ubicaciones locales.

## Requirements

### Requirement: Adapter de C

The system SHALL incluir archivos `.c` y `.h` cuando el language pack está activo y SHALL
extraer includes quoted/system, structs, typedefs, enums, prototipos, definiciones, llamadas
intra-archivo y comentarios de documentación.

#### Scenario: Include quoted y system

- **WHEN** un archivo contiene `#include "foo.h"` y `#include <stdio.h>`
- **THEN** el primero se marca como quoted y el segundo como system
- **AND** el resolver distingue ambos

#### Scenario: Struct y typedef

- **WHEN** un archivo contiene `struct Base { ... }` y `typedef struct { ... } Point`
- **THEN** se publican `Base` y `Point` con `kind: class`
- **AND** las firmas indican `struct Base` y `typedef struct Point`

#### Scenario: Prototipo y definición

- **WHEN** un header declara `int add(int a, int b);` y un `.c` lo define
- **THEN** ambos se publican como `function`
- **AND** la definición `static` se marca `exported: false`

#### Scenario: Summary

- **WHEN** una declaración tiene un comentario `/** ... */` o `//` inmediatamente anterior
- **THEN** el símbolo publica `summary` con la primera línea no vacía

#### Scenario: Llamada local

- **WHEN** una función del archivo llama a otra función local resoluble
- **THEN** se emite una arista `call` con `confidence: inferred`

### Requirement: Resolución de headers C

The system SHALL resolver includes quoted contra el directorio del archivo, el root y
`<root>/include`, en ese orden, y SHALL dejar los includes system como externos.

#### Scenario: Header en el mismo directorio

- **WHEN** `src/main.c` incluye `"base.h"` y existe `src/base.h`
- **THEN** se emite una arista `import` hacia `src/base.h`

#### Scenario: Header en subdirectorio

- **WHEN** `src/main.c` incluye `"sub/bar.h"` y existe `src/sub/bar.h`
- **THEN** se emite una arista hacia ese archivo

#### Scenario: Header en include/

- **WHEN** un include quoted no existe junto al archivo ni en el root, pero sí en
  `<root>/include/<specifier>`
- **THEN** se resuelve a ese archivo

#### Scenario: System include

- **WHEN** un archivo contiene `#include <stdio.h>`
- **THEN** no se crea nodo
- **AND** se incrementa `stats.externalImports`

#### Scenario: Header inexistente

- **WHEN** un include quoted no existe en ninguna de las ubicaciones
- **THEN** se registra en `facts/unresolved.json` con `reason: not-found`

### Requirement: Fallback de C sin pack

The system SHALL mantener `.c` y `.h` en `facts/unsupported.json` cuando el language pack no
está activo.

#### Scenario: Sin pack

- **WHEN** el repositorio contiene `src/main.c` y el pack no está activo
- **THEN** no se emite nodo `lang: c`
- **AND** aparece en `facts/unsupported.json`
