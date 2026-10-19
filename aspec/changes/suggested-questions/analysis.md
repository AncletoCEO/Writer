# Analysis: Suggested questions

> Issue: [#16](https://github.com/AncletoCEO/Writer/issues/16)
> Change: `suggested-questions`
> Fecha: 2026-10-19

## Pregunta

¿Las preguntas sugeridas aportan algo sobre el technical seed de spec o son redundantes?

## Evidencia

- `GOTCHAS.md` ya lista ciclos, god nodes, bridges, hotspots y capas.
- `facts/hotspots.json`, `cycles.json`, `bridges.json` y `layers.json` son deterministas.
- `@ancleto/spec` genera un seed narrativo con LLM y puede formular preguntas con más
  contexto del negocio.
- Writer no genera `facts/questions.json`.

## Opciones

### A. Plantillas deterministas

- Preguntas fijas a partir de anomalías: "¿por qué este ciclo?", "¿este god node debería
  dividirse?", "¿esta capa se importa al revés?".
- Barato, pero genérico y redundante con `GOTCHAS.md`.

### B. Generación con LLM

- Mejor contextualización, pero fuera del alcance token-free de Writer y duplica spec.

### C. No hacerlo

- Dejar que spec/LLM genere preguntas desde los facts.

### D. Solo preguntas operativas fijas

- Un puñado de prompts conocidos en la documentación, no un fact nuevo.

## Recomendación

**C.** Writer produce hechos; spec/LLM decide qué preguntar. Si se quiere una ayuda, mantener
una lista corta de preguntas operativas en la documentación, sin `facts/questions.json` ni
generación automática.

## Criterios para revisar

- Evidencia de que los agentes no aprovechan `GOTCHAS.md`.
- Demanda de preguntas específicas por dominio que no requieran LLM.

## Decisión

No generar preguntas sugeridas en Writer; evitar duplicación con el technical seed.
