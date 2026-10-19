# Proposal: Suggested questions

> Issue: [#16 — Suggested questions](https://github.com/AncletoCEO/Writer/issues/16)
> Tipo: analysis
> Base: @ancleto/writer 0.1.1; change archivado `ancleto-writer`.

## Problem

ReadMenator genera preguntas sugeridas a partir de la estructura del grafo. Writer no las genera. @ancleto/spec ya produce un seed narrativo con un LLM y podría generar preguntas con más contexto.

- `GOTCHAS.md` y `facts/hotspots.json` ofrecen señales.
- No hay `facts/questions.json` ni sección de preguntas.

## Proposed change

¿Las preguntas sugeridas aportan algo sobre el technical seed de spec o son redundantes?
Este change es de análisis: no implementa código; entrega un ADR/diseño con la recomendación.

No se crean delta specs: este change no especifica comportamiento nuevo; el entregable es un ADR/diseño.
A. Plantillas deterministas a partir de anomalías (ciclos, god nodes, capas, huérfanos).
B. Generación con LLM (fuera del alcance token-free de Writer).
C. No hacerlo; dejarlo a spec.
D. Solo preguntas operativas fijas ("¿por qué este ciclo?").

## Scope

In scope: investigar, comparar opciones y entregar un ADR.

Out of scope:
Generación con LLM.

## Risks

Riesgo de decidir con evidencia incompleta: mitigar con benchmark/prototipo y criterios explícitos.
