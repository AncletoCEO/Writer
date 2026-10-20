# Spec: python-language-adapter

## Purpose

Define el language pack opcional de `@ancleto/writer` y el adapter de Python: carga
optativa, descubrimiento de `.py`/`.pyi`, extracción de estructura, resolución de imports
locales y fallback cuando el pack no está activo.

## Requirements

### Requirement: Language pack opcional

El sistema SHALL cargar adapters externos de forma opcional desde un paquete configurable, y
SHALL degradar a solo JS/TS cuando el paquete no esté instalado o falle, sin cambiar el
`schemaVersion` del contrato.

#### Scenario: Pack ausente

- **WHEN** el paquete del language pack no está instalado
- **THEN** el build continúa con JS/TS
- **AND** los archivos `.py` aparecen en `facts/unsupported.json`
- **AND** no se emite ningún nodo `lang: python`

#### Scenario: Pack deshabilitado por config

- **WHEN** `languagePack.enabled` es `false`
- **THEN** el pack no se carga aunque esté instalado
- **AND** el comportamiento es idéntico al del pack ausente

#### Scenario: Fallo de carga

- **WHEN** el pack existe pero lanza un error al cargarse
- **THEN** el build continúa
- **AND** el error no revienta el proceso

### Requirement: Descubrimiento de Python con el pack activo

The system SHALL incluir archivos `.py` y `.pyi` en el scan cuando el pack está activo, sin
depender de que `languages` los liste explícitamente.

#### Scenario: Archivo Python analizado

- **WHEN** el repositorio contiene `src/app.py` y el pack está activo
- **THEN** el archivo aparece en el scan con `lang: python`
- **AND** no aparece en `facts/unsupported.json`
- **AND** se emite un nodo de archivo en `graph.json`

#### Scenario: Sin pack

- **WHEN** el repositorio contiene `src/app.py` y el pack no está activo
- **THEN** el archivo no genera nodo
- **AND** aparece en `facts/unsupported.json` con `extension: .py` y `language: python`

### Requirement: Extracción de estructura Python

The system SHALL extraer de cada archivo Python imports, clases, funciones top-level, métodos,
herencia, llamadas intra-archivo y docstrings, usando el mismo formato que el parser JS/TS.

#### Scenario: Clase con herencia y métodos

- **WHEN** un archivo contiene `class Child(Base):` con un método `run(self)`
- **THEN** `symbols.json` incluye `Child` con `kind: class` y `run` con `kind: method` y
  `owner: Child`
- **AND** el grafo emite una arista `inherits` de `Child` hacia `Base` cuando es local
- **AND** la arista usa `confidence: extracted` si `Base` es local

#### Scenario: Docstring como summary

- **WHEN** una clase o función tiene un docstring como primera sentencia
- **THEN** su símbolo publica `summary` con la primera línea no vacía del docstring

#### Scenario: Llamada local

- **WHEN** una función del archivo llama a otro símbolo local resoluble
- **THEN** se emite una arista `call` con `confidence: inferred`

#### Scenario: Import relativo

- **WHEN** un archivo contiene `from .base import Base` y existe `base.py` en el mismo paquete
- **THEN** se emite una arista `import` hacia ese archivo

#### Scenario: Import absoluto del proyecto

- **WHEN** un archivo contiene `from pkg.mod import X` y existe `pkg/mod.py` en el root
- **THEN** se emite una arista `import` hacia `pkg/mod.py`

#### Scenario: Import externo

- **WHEN** un archivo contiene `import os` o `from __future__ import annotations`
- **THEN** no se crea nodo
- **AND** se incrementa `stats.externalImports`
- **AND** el especificador se lista en `facts/externals.json`

### Requirement: Core sin dependencias de runtime

The system SHALL mantener `@ancleto/writer` sin `dependencies` de runtime; las dependencias del
language pack SHALL declararse únicamente en el paquete del pack.

#### Scenario: Paquete del core

- **WHEN** se inspecciona `package.json` de `@ancleto/writer`
- **THEN** `dependencies` está ausente o vacío
- **AND** tree-sitter no aparece en el core

#### Scenario: Publicación del core

- **WHEN** se empaqueta `@ancleto/writer`
- **THEN** el tarball no incluye el código ni las dependencias del pack
