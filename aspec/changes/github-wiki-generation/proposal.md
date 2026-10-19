# Proposal: GitHub wiki generation

> Issue: [#22 — GitHub wiki generation](https://github.com/AncletoCEO/Writer/issues/22)
> Tipo: analysis
> Base: @ancleto/writer 0.1.1; change archivado `ancleto-writer`.

## Problem

ReadMenator puede espejar docs a la wiki del repo. Writer genera docs en `.ancleto/writer/agent` y no tiene acceso de escritura al repo del usuario. Publicar una wiki requiere permisos y un flujo de sincronización.

- `agent/INDEX.md`, `SYMBOLS.md`, `GOTCHAS.md`, `ARCHITECTURE.md`.
- No hay integración con GitHub wiki.

## Proposed change

¿Writer debe publicar una GitHub wiki?
Este change es de análisis: no implementa código; entrega un ADR/diseño con la recomendación.

No se crean delta specs: este change no especifica comportamiento nuevo; el entregable es un ADR/diseño.
A. No implementar.
B. Comando `wiki` que renderice páginas en un directorio local.
C. Publicación opcional vía `gh` con permisos explícitos.
D. Copiar docs a wiki en CI del usuario.

## Scope

In scope: investigar, comparar opciones y entregar un ADR.

Out of scope:
Publicación automática sin confirmación.

## Risks

Riesgo de decidir con evidencia incompleta: mitigar con benchmark/prototipo y criterios explícitos.
