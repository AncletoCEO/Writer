# Proposal: Taint, security, SARIF, CPG and dataflow

> Issue: [#17 — Taint, security, SARIF, CPG and dataflow](https://github.com/AncletoCEO/Writer/issues/17)
> Tipo: analysis
> Base: @ancleto/writer 0.1.1; change archivado `ancleto-writer`.

## Problem

ReadMenator incluye taint propagation, hallazgos de seguridad, SARIF, CPG y dataflow. Writer no tiene nada de eso. Es un dominio especializado y con alto riesgo de falsos positivos.

- `src/graph/build.js` solo tiene imports, calls e inherits.
- No hay sinks/sources, sanitización, CPG ni SARIF.

## Proposed change

¿Writer debe incorporar análisis de seguridad/dataflow o mantenerse como un motor de estructura?
Este change es de análisis: no implementa código; entrega un ADR/diseño con la recomendación.

No se crean delta specs: este change no especifica comportamiento nuevo; el entregable es un ADR/diseño.
A. Taint mínimo sobre imports peligrosos (`child_process`, `eval`, etc.) con confianza baja.
B. CPG/dataflow completo (muy costoso).
C. Integrar Semgrep/CodeQL como herramienta externa.
D. SARIF solo como formato de salida de hallazgos existentes.
E. No hacerlo.

## Scope

In scope: investigar, comparar opciones y entregar un ADR.

Out of scope:
Reglas de seguridad específicas de frameworks.

## Risks

Riesgo de decidir con evidencia incompleta: mitigar con benchmark/prototipo y criterios explícitos.
