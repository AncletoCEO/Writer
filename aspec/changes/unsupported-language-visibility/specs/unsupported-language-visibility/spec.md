## ADDED Requirements

### Requirement: Inventario de lenguajes no soportados

El sistema SHALL detectar archivos de lenguajes conocidos no soportados y publicar conteos en
`facts/unsupported.json` sin analizarlos.

#### Scenario: Archivo Python

- **WHEN** el repositorio contiene `src/app.py`
- **THEN** aparece en `unsupported` con `extension: .py` y `language: python`
- **AND** no se crea un nodo de archivo en `graph.json`

#### Scenario: Archivo binario o desconocido

- **WHEN** el repositorio contiene una imagen o una extensión no mapeada
- **THEN** no se cuenta como lenguaje no soportado

#### Scenario: Path excluido

- **WHEN** un archivo `.py` está dentro de un directorio excluido
- **THEN** no aparece en `unsupported`

#### Scenario: Archivo soportado

- **WHEN** el repositorio contiene un `.ts` soportado
- **THEN** no aparece en `unsupported`
- **AND** sigue el flujo normal de análisis

#### Scenario: Límite de lista

- **WHEN** un lenguaje supera `unsupported.maxFilesPerLanguage`
- **THEN** `count` conserva el total
- **AND** `files` se corta en el límite
