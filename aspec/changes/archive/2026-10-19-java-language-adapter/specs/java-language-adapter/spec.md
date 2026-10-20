## ADDED Requirements

### Requirement: Adapter de Java

The system SHALL incluir archivos `.java` cuando el language pack está activo y SHALL extraer
`package`, imports, clases, interfaces, enums, records, anotaciones, métodos, constructores,
herencia/implementación, llamadas intra-archivo y Javadoc.

#### Scenario: Package e imports

- **WHEN** un archivo declara `package com.example.app;` e importa `java.util.List`,
  `static com.example.util.Utils.helper` y `com.example.db.*`
- **THEN** `parse.namespaces` incluye `com.example.app`
- **AND** se extraen los tres imports
- **AND** `List` y `helper` se publican como nombres importados

#### Scenario: Clase con extends e implements

- **WHEN** un archivo contiene `class App extends Base implements IRunner`
- **THEN** `symbols.json` incluye `App` con `kind: class`
- **AND** se emiten relaciones hacia `Base` e `IRunner`
- **AND** `IRunner` se marca como `implements`

#### Scenario: Interface que extiende interfaces

- **WHEN** un archivo contiene `interface IChild extends IBase`
- **THEN** se emite una relación `implements` de `IChild` hacia `IBase`

#### Scenario: Métodos y constructores

- **WHEN** una clase contiene `public void run(int x)` y `public App()`
- **THEN** ambos se publican como `method` con `owner: App`

#### Scenario: Javadoc

- **WHEN** una declaración tiene `/** ... */` anterior, con anotaciones `@Override`
  intermedias
- **THEN** el símbolo publica `summary` sin los `*` ni los tags Javadoc

### Requirement: Resolución de imports Java

The system SHALL resolver un import contra el índice de packages probando el specifier
completo y quitando segmentos hasta encontrar un package conocido, y SHALL emitir una arista
por cada archivo de ese package, excluyendo el archivo actual. Los imports externos SHALL
quedar externos.

#### Scenario: Import de clase local

- **WHEN** `import com.example.db.Store;` y `com.example.db` contiene `Store.java` y
  `Repo.java`
- **THEN** se emiten aristas `import` hacia ambos archivos
- **AND** no se emite arista hacia el archivo actual

#### Scenario: Import estático

- **WHEN** `import static com.example.util.Utils.helper;` y `com.example.util` es un package
  local
- **THEN** se emiten aristas hacia los archivos del package

#### Scenario: Wildcard

- **WHEN** `import com.example.db.*;`
- **THEN** se emiten aristas hacia los archivos de `com.example.db`

#### Scenario: Import externo

- **WHEN** un archivo contiene `import java.util.List;` sin package local
- **THEN** no se crea nodo
- **AND** se incrementa `stats.externalImports`

### Requirement: Fallback de Java sin pack

The system SHALL mantener `.java` en `facts/unsupported.json` cuando el language pack no está
activo.

#### Scenario: Sin pack

- **WHEN** el repositorio contiene `src/App.java` y el pack no está activo
- **THEN** no se emite nodo `lang: java`
- **AND** aparece en `facts/unsupported.json`
