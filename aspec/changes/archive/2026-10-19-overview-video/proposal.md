# Proposal: Overview video generation

> Issue: [#21 — Overview video generation](https://github.com/AncletoCEO/Writer/issues/21)
> Tipo: analysis
> Base: @ancleto/writer 0.1.1; change archivado `ancleto-writer`.

## Problem

ReadMenator genera un video synthwave con escenas de arquitectura, comunidades y ejecución. Es una feature de marketing/demostración, no de contexto para agentes. Agrega dependencias de render y mucho mantenimiento.

- No hay generación de video.
- Las salidas son JSON/Markdown/Mermaid.

## Proposed change

¿Tiene sentido que Writer genere un video de overview del repo?
Este change es de análisis: no implementa código; entrega un ADR/diseño con la recomendación.

No se crean delta specs: este change no especifica comportamiento nuevo; el entregable es un ADR/diseño.
A. No implementar.
B. Script externo opcional que consuma `graph.json`.
C. Integrar ReadMenator como herramienta externa.
D. Generar frames/HTML y dejar el render al usuario.

## Scope

In scope: investigar, comparar opciones y entregar un ADR.

Out of scope:
Edición de video profesional.

## Risks

Riesgo de decidir con evidencia incompleta: mitigar con benchmark/prototipo y criterios explícitos.
