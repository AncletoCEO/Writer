# Proposal: Class stubs in other languages

> Issue: [#23 — Class stubs in other languages](https://github.com/AncletoCEO/Writer/issues/23)
> Tipo: analysis
> Base: @ancleto/writer 0.1.1; change archivado `ancleto-writer`.

## Problem

ReadMenator traduce estructuras de clase a C++, Java, C#, Python, Go, Rust, PHP, Kotlin, Scala, Swift, Dart y Ruby. Writer solo analiza JS/TS y no genera código. Generar stubs multi-lenguaje es una feature de scaffolding, no de contexto.

- `symbols.json` y UML Mermaid (si se implementa) describen clases.
- No hay generación de código.

## Proposed change

¿Los usuarios necesitan generar stubs/clases en otros lenguajes desde el grafo?
Este change es de análisis: no implementa código; entrega un ADR/diseño con la recomendación.

No se crean delta specs: este change no especifica comportamiento nuevo; el entregable es un ADR/diseño.
A. No implementar.
B. Generar solo declaraciones desde plantillas para 1-2 lenguajes.
C. Generar desde UML con un motor de templates.
D. Delegar a herramientas externas.

## Scope

In scope: investigar, comparar opciones y entregar un ADR.

Out of scope:
Generación de implementaciones completas.

## Risks

Riesgo de decidir con evidencia incompleta: mitigar con benchmark/prototipo y criterios explícitos.
