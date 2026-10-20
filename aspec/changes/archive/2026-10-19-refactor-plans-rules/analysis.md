# Analysis: Refactor plans and rule generation

> Issue: [#24](https://github.com/AncletoCEO/Writer/issues/24)
> Change: `refactor-plans-rules`
> Fecha: 2026-10-19

## Pregunta

¿Writer debe proponer refactors o generar reglas para agentes (`.cursorrules`)?

## Evidencia

- Writer publica hechos: `GOTCHAS.md`, ciclos, capas, hotspots, bridges, god nodes.
- `@ancleto/spec` ya tiene skills, agents y memoria para decidir y ejecutar cambios.
- Writer no genera scripts ni reglas de agente.
- Scripts de refactor ejecutables son riesgosos y difíciles de validar.

## Opciones

### A. No implementar

- Spec decide con los hechos; Writer no opina sobre refactors.

### B. Sugerencias read-only

- Agregar bullets accionables en `GOTCHAS.md` (p. ej. "romper este ciclo").
- Bajo riesgo, pero puede ser redundante con el análisis humano/LLM.

### C. Scripts ejecutables

- Alto riesgo; no recomendado.

### D. Generar `.cursorrules`/reglas

- Duplica el sistema de skills/agents de spec y envejece rápido.

## Recomendación

**A**, con **B** opcional si se detecta que los hechos no alcanzan. No generar scripts ni
reglas de agente. La decisión de refactor y su ejecución pertenecen a spec.

## Criterios para revisar

- Evidencia de que los agentes no pueden priorizar refactors desde `GOTCHAS.md`.
- Un formato de sugerencia read-only que no duplique reglas de spec.

## Decisión

No generar refactor plans, scripts ni reglas de agente.
