# Analysis: Agent memory and skills integration

> Issue: [#26](https://github.com/AncletoCEO/Writer/issues/26)
> Change: `agent-memory-skills`
> Fecha: 2026-10-19

## Pregunta

¿Writer debe generar `MEMORY.md`/skills o mantener `@ancleto/spec` como única fuente de
memoria y skills?

## Evidencia

- `src/memory/read-only.js` lee reglas activas de scope `project` desde `.ancleto/memory.db`.
- `GOTCHAS.md` incluye esas reglas.
- Writer no escribe `memory.db`, no genera `MEMORY.md` ni instala skills.
- `@ancleto/spec` ya tiene motor de memoria, MCP y skills; duplicarlos rompería la fuente de
  verdad.

## Opciones

### A. Mantener spec como fuente de verdad

- Writer lee memoria read-only y la refleja en `GOTCHAS.md`; no escribe ni duplica.

### B. Sugerencias sin escritura

- Writer detecta posibles reglas/decisiones y las sugiere; spec decide si las registra.

### C. `MEMORY.md` efímero en `outputDir`

- Derivado de `memory.db`; no duplica la fuente, pero puede quedar desactualizado si no se
  regenera.

### D. Instalar skills

- Duplica spec y agrega mantenimiento; no recomendado.

## Recomendación

**A + B.** Spec es la única fuente de memoria y skills. Writer puede leer reglas read-only,
incluirlas en `GOTCHAS.md` y sugerir candidatos (sin escribir). No generar `MEMORY.md`
persistente ni instalar skills. Un `MEMORY.md` efímero dentro de `outputDir` solo si se
demuestra que `GOTCHAS.md` no alcanza.

## Criterios para revisar

- Evidencia de agentes que necesiten un `MEMORY.md` separado.
- Un flujo de sugerencias que no escriba en `memory.db` sin confirmación.

## Decisión

Spec sigue siendo la fuente de verdad. Writer lee read-only y sugiere; no escribe memoria ni
instala skills.
