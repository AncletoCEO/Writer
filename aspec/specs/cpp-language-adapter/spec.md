# Spec: cpp-language-adapter

## Purpose

Define el adapter de C++ del language pack opcional: descubrimiento de extensiones C++,
parsing de includes, namespaces, clases/structs, métodos, constructores/destructores,
herencia, templates, llamadas y comentarios, y resolución de headers quoted.

## Requirements

### Requirement: Adapter de C++

The system SHALL incluir archivos `.cpp`, `.cc`, `.cxx`, `.hpp`, `.hh` y `.hxx` cuando el
language pack está activo y SHALL extraer includes, namespaces, clases, structs, unions, enums,
templates, métodos, constructores, destructores, herencia, llamadas y comentarios.

#### Scenario: Include quoted y system

- **WHEN** un archivo contiene `#include "base.hpp"` y `#include <iostream>`
- **THEN** el primero se marca como quoted y el segundo como system
- **AND** el resolver distingue ambos

#### Scenario: Clase con herencia y métodos

- **WHEN** un archivo contiene `class App : public Base` con `void run(int)` en `public`
- **THEN** `App` se publica con `kind: class`
- **AND** `run` se publica como `method` con `owner: App` y `exported: true`
- **AND** se emite una relación de `App` hacia `Base`

#### Scenario: Método privado

- **WHEN** un método está en una sección `private:`
- **THEN** se publica con `exported: false`

#### Scenario: Definición out-of-line

- **WHEN** un archivo contiene `void App::run(int x) { ... }`
- **THEN** `run` se publica con `owner: App`

#### Scenario: Constructor y destructor

- **WHEN** una clase declara `App();` y `~App();`
- **THEN** ambos se publican como `method` con `owner: App`
- **AND** las firmas son `App()` y `~App()`

#### Scenario: Template

- **WHEN** un archivo contiene `template <typename T> class Box { ... }`
- **THEN** `Box` y sus métodos se extraen como símbolos

#### Scenario: Llamada local

- **WHEN** una función o método llama a otra función/método local resoluble
- **THEN** se emite una arista `call` con `confidence: inferred`

### Requirement: Resolución de headers C++

The system SHALL resolver includes quoted contra el directorio del archivo, el root y
`<root>/include`, en ese orden, y SHALL dejar los includes system como externos.

#### Scenario: Header local

- **WHEN** `src/app.cpp` incluye `"app.hpp"` y existe `src/app.hpp`
- **THEN** se emite una arista `import` hacia `src/app.hpp`

#### Scenario: Header en include/

- **WHEN** un include quoted solo existe en `<root>/include/<specifier>`
- **THEN** se resuelve a ese archivo

#### Scenario: System include

- **WHEN** un archivo contiene `#include <iostream>`
- **THEN** no se crea nodo
- **AND** se incrementa `stats.externalImports`

#### Scenario: Header inexistente

- **WHEN** un include quoted no existe en ninguna de las ubicaciones
- **THEN** se registra en `facts/unresolved.json` con `reason: not-found`

### Requirement: Fallback de C++ sin pack

The system SHALL mantener las extensiones C++ en `facts/unsupported.json` cuando el language
pack no está activo.

#### Scenario: Sin pack

- **WHEN** el repositorio contiene `src/app.cpp` y el pack no está activo
- **THEN** no se emite nodo `lang: cpp`
- **AND** aparece en `facts/unsupported.json`
