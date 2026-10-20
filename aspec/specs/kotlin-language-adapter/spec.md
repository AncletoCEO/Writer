# Spec: kotlin-language-adapter

## Purpose

Define el adapter de Kotlin del language pack opcional: descubrimiento de `.kt`/`.kts`,
parsing de package, imports, tipos, funciones, métodos, constructores, companions, herencia,
llamadas y KDoc, y resolución de imports contra el índice de packages.

## Requirements

### Requirement: Adapter de Kotlin

The system SHALL incluir archivos `.kt` y `.kts` cuando el language pack está activo y SHALL
extraer package, imports, clases, interfaces, objects, enums, data/sealed classes,
typealiases, funciones, métodos, constructores, companions, herencia, llamadas y doc comments.

#### Scenario: Package e imports

- **WHEN** un archivo declara `package com.example.app` e importa
  `com.example.services.Service`, `com.example.contracts.Runner as RunnerContract` y
  `com.example.db.*`
- **THEN** `parse.namespaces` incluye `com.example.app`
- **AND** se extraen los tres imports, con alias y wildcard

#### Scenario: Clase con extends e implements

- **WHEN** un archivo contiene `class App : Base(), IRunner`
- **THEN** `App` se publica con `kind: class`
- **AND** se emiten relaciones hacia `Base` e `IRunner`
- **AND** el core emite `extends` para `Base` e `implements` para `IRunner`

#### Scenario: Object, enum y data class

- **WHEN** un archivo contiene `object S`, `enum class E` y `data class P`
- **THEN** `S` y `P` se publican como `class`
- **AND** `E` se publica como `enum`
- **AND** `S` tiene firma `object S`

#### Scenario: Companion object

- **WHEN** una clase contiene `companion object { fun create() }`
- **THEN** `create` se publica como `method` con `owner` de la clase contenedora

#### Scenario: Visibilidad

- **WHEN** una clase declara métodos públicos y `private`
- **THEN** solo el público se marca `exported: true`

#### Scenario: Doc comment

- **WHEN** una declaración tiene un KDoc `/** ... */` anterior
- **THEN** el símbolo publica `summary` sin `*` ni tags `@`

#### Scenario: Llamada local

- **WHEN** una función o método llama a otra función/método local resoluble
- **THEN** se emite una arista `call` con `confidence: inferred`

### Requirement: Resolución de imports Kotlin

The system SHALL resolver un import contra el índice de packages probando el nombre completo y
quitando segmentos hasta encontrar un package conocido, y SHALL emitir una arista por cada
archivo de ese package, excluyendo el archivo actual. Los imports externos SHALL quedar
externos.

#### Scenario: Import de clase local

- **WHEN** `import com.example.services.Service` y `com.example.services` contiene
  `Service.kt`
- **THEN** se emite una arista `import` hacia `Service.kt`
- **AND** no se emite arista hacia el archivo actual

#### Scenario: Wildcard

- **WHEN** `import com.example.db.*`
- **THEN** se emiten aristas hacia los archivos de `com.example.db`

#### Scenario: Import externo

- **WHEN** un archivo contiene `import kotlin.collections.List`
- **THEN** no se crea nodo
- **AND** se incrementa `stats.externalImports`

### Requirement: Fallback de Kotlin sin pack

The system SHALL mantener `.kt` y `.kts` en `facts/unsupported.json` cuando el language pack
no está activo.

#### Scenario: Sin pack

- **WHEN** el repositorio contiene `src/App.kt` y el pack no está activo
- **THEN** no se emite nodo `lang: kotlin`
- **AND** aparece en `facts/unsupported.json`
