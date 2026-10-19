# Proposal: Multi-language support

> Issue: [#9 — Multi-language support](https://github.com/AncletoCEO/Writer/issues/9)
> Tipo: analysis
> Base: @ancleto/writer 0.1.1; change archivado `ancleto-writer`.

## Problem

ReadMenator soporta 19 lenguajes. Writer soporta JS/TS/JSX/TSX con lexer/parser propio. @ancleto/spec hoy es un proyecto Node, pero sus usuarios podrían analizar repos políglotas.

- `src/parsers/lexer.js` y `src/parsers/javascript.js` son específicos de JS/TS.
- `src/scan/scanner.js` filtra por extensiones.
- `src/resolve/imports.js` resuelve imports JS/TS.
- No hay parsers para Python, Go, Rust, Java, etc.

## Proposed change

¿Qué lenguajes adicionales justifican el costo y cómo implementarlos sin romper cero dependencias, rendimiento y mantenibilidad?
Este change es de análisis: no implementa código; entrega un ADR/diseño con la recomendación.

No se crean delta specs: este change no especifica comportamiento nuevo; el entregable es un ADR/diseño.
A. Parsers propios por lenguaje (como ReadMenator): control total, cero deps, mucho mantenimiento.
B. Tree-sitter como peer/optional dependency: cobertura amplia, rompe cero-deps y agrega WASM/binarios.
C. Delegar a herramientas externas (ReadMenator, Semgrep, etc.): rápido, pero acopla y puede traer AGPL/entornos.
D. Quedarse en JS/TS.

## Scope

In scope: investigar, comparar opciones y entregar un ADR.

Out of scope:
Implementación de parsers y cambios de contrato.

## Risks

Riesgo de decidir con evidencia incompleta: mitigar con benchmark/prototipo y criterios explícitos.
