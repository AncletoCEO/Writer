# Analysis: Call sites and source viewer

> Issue: [#15](https://github.com/AncletoCEO/Writer/issues/15)
> Change: `call-sites-source-viewer`
> Fecha: 2026-10-19

## Pregunta

¿Vale la pena un índice de call sites y snippets de código, o `file:line` y las firmas son
suficientes para agentes?

## Evidencia

- `src/graph/build.js` crea aristas `call` con línea, pero solo intra-archivo.
- `symbols.json` tiene `line`/`endLine` y firma.
- No hay índice de call sites cross-file ni snippets.
- El análisis de dead code (#10) mostró que el call graph actual no ve templates, JSX,
  callbacks, `new` ni acceso por miembro; un índice de call sites heredaría esos huecos.

## Opciones

### A. Índice de call sites

- `{ caller, callee, file, line, confidence }` para llamadas resueltas.
- Útil para `explain`, dead code y review, pero requiere mejorar la resolución cross-file.

### B. Snippets embebidos

- Guardar un fragmento de código por símbolo (con tope de bytes).
- Aumenta el tamaño de `symbols.json` y puede exponer código sensible; mejor opt-in.

### C. Source viewer HTML

- Fuera de alcance: HTML/JS, AGPL de plantillas, mantenimiento.

### D. No hacerlo

- `file:line` + firma es suficiente para que el agente abra el archivo.

## Recomendación

**D por ahora.** Antes de un índice de call sites hay que construir un **reference graph**
cross-file que cubra templates, JSX, callbacks, `new` y acceso por miembro (prerrequisito
también para símbolos huérfanos). Si se implementa, empezar por **A**; snippets (**B**) solo
opt-in con tope de bytes; **C** descartado.

## Criterios para revisar

- Reference graph con precisión aceptable (≥90% de llamadas resueltas en una muestra).
- Demanda de agentes que no se cubra con `file:line`.
- Tamaño de salida y privacidad de snippets.

## Decisión

Diferir call sites/snippets; el reference graph es el prerrequisito. No implementar viewer HTML.
