# Proposal: README injection and self-describing folders

> Issue: [#25 — README injection and self-describing folders](https://github.com/AncletoCEO/Writer/issues/25)
> Tipo: analysis
> Base: @ancleto/writer 0.1.1; change archivado `ancleto-writer`.

## Problem

ReadMenator inyecta un link al knowledge base en el README y genera READMEs autodescriptivos por carpeta de salida. Writer adoptó la regla de no tocar archivos fuera de `outputDir`. Cambiar eso afecta la confianza y la idempotencia.

- Writer solo escribe dentro de `outputDir`.
- No modifica README ni genera READMEs por carpeta.
- `docs/contracts` define la frontera de escritura.

## Proposed change

¿Writer debe inyectar links en el README del usuario o generar READMEs por carpeta?
Este change es de análisis: no implementa código; entrega un ADR/diseño con la recomendación.

No se crean delta specs: este change no especifica comportamiento nuevo; el entregable es un ADR/diseño.
A. Mantener cero efectos laterales (actual).
B. Inyección opt-in con bloque marcado e idempotente.
C. READMEs solo dentro de `.ancleto/writer/` (no en el repo del usuario).
D. No hacerlo.

## Scope

In scope: investigar, comparar opciones y entregar un ADR.

Out of scope:
Modificar README sin confirmación explícita.

## Risks

Riesgo de decidir con evidencia incompleta: mitigar con benchmark/prototipo y criterios explícitos.
