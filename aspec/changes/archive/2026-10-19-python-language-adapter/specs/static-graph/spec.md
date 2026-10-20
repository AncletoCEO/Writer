## MODIFIED Requirements

### Requirement: Descubrimiento determinista de archivos fuente

The system SHALL recorrer el repositorio y seleccionar archivos JavaScript, TypeScript, JSX y TSX, y SHALL incluir las extensiones de los adapters del language pack opcional cuando estén activos, aplicando las exclusiones efectivas, sin seguir symlinks y respetando los topes de tamaño y profundidad.

#### Scenario: Exclusiones por defecto

- **WHEN** se ejecuta un build sobre un repositorio con `node_modules`, `.git`, `dist`, `build`, `coverage` y `aspec`
- **THEN** ninguno de esos directorios aporta archivos al grafo
- **AND** el resultado es idéntico al de un repositorio que no los contiene

#### Scenario: Symlink fuera del root

- **WHEN** el scanner encuentra un symlink que apunta fuera del root
- **THEN** no lo sigue
- **AND** registra el archivo en `facts/skipped.json` con `reason: symlink`

#### Scenario: Archivo por encima del límite

- **WHEN** un archivo fuente supera `maxFileSizeBytes`
- **THEN** no se parsea
- **AND** se registra en `facts/skipped.json` con `reason: too-large`

#### Scenario: Orden estable

- **WHEN** dos builds recorren el mismo repositorio
- **THEN** los archivos se procesan y emiten en el mismo orden, independiente del orden del filesystem

#### Scenario: Language pack activo

- **WHEN** un adapter del language pack está activo y el repositorio contiene sus extensiones
- **THEN** esos archivos se incluyen en el grafo con su `lang`
- **AND** dejan de reportarse en `facts/unsupported.json`

#### Scenario: Language pack ausente

- **WHEN** el language pack no está instalado o está deshabilitado
- **THEN** solo se incluyen JS, TS, JSX y TSX
- **AND** las extensiones de otros lenguajes conocidos se reportan en `facts/unsupported.json`
