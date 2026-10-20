## ADDED Requirements

### Requirement: Índice de namespaces compartido

The system SHALL construir un índice de namespaces después de parsear todos los archivos y
SHALL pasarlo a los adapters durante la resolución de imports, de modo que un adapter pueda
resolver una referencia de namespace a múltiples archivos sin reescanear el repositorio.

#### Scenario: Adapter resuelve namespace

- **WHEN** los archivos parseados declaran `namespace A` y `namespace A.B`
- **THEN** el índice contiene `A -> [archivos]` y `A.B -> [archivos]`
- **AND** el adapter recibe el índice en `resolveImport`
- **AND** puede devolver `{ type: 'resolved', targets: [...] }`

#### Scenario: Archivo sin namespaces

- **WHEN** un archivo no declara namespaces
- **THEN** no aporta entradas al índice
- **AND** el resto del grafo no cambia

### Requirement: Tipo de herencia según el padre local

The system SHALL emitir `inheritsKind: implements` cuando el símbolo padre local es una
interfaz, aunque el adapter no haya podido determinarlo por sintaxis; en los demás casos SHALL
respetar el flag `implements` del adapter y usar `extends` por defecto.

#### Scenario: Clase con base e interfaz

- **WHEN** `class App : Base, IRunner` y `Base` es `class` e `IRunner` es `interface`
- **THEN** la arista hacia `Base` es `extends`
- **AND** la arista hacia `IRunner` es `implements`

#### Scenario: Interfaz que hereda interfaz

- **WHEN** `interface IChild : IBase` y `IBase` es una interfaz local
- **THEN** la arista es `implements`
