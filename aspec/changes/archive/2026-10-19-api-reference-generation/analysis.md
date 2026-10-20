# Analysis: API reference generation

> Issue: [#12](https://github.com/AncletoCEO/Writer/issues/12)
> Change: `api-reference-generation`
> Fecha: 2026-10-19

## Pregunta

¿Writer debe generar documentación de API determinista o eso pertenece al technical seed/LLM
de spec?

## Evidencia

- `src/facts/symbols.js` publica `symbols.json` con `name`, `kind`, `exported`, `line`,
  `endLine`, `signature`.
- `agent/SYMBOLS.md` lista símbolos con `file:line` y firma.
- No hay páginas por módulo, índice de API, parámetros/retornos ni cross-links.
- El technical seed de spec ya produce documentación narrativa con LLM.

## Opciones

### A. Markdown de API por módulo

- Generar una página por módulo con símbolos exportados, firmas y summaries (si existe #11).
- Sin dependencias; valor medio.

### B. Sphinx/Doxygen

- Formato completo con tags, parámetros, retornos y cross-links.
- Mucho mantenimiento y depende de docstrings estructurados (#11 opción B).

### C. No generar

- `symbols.json` es el contrato; spec/LLM redacta desde ahí.
- Cero mantenimiento; el usuario puede renderizar.

### D. JSON + renderer externo

- Mantener JSON como fuente y ofrecer un renderer separado.
- Buena separación, pero requiere otra herramienta.

## Recomendación

**No generar API docs completas ahora (C).** `symbols.json` es suficiente como contrato.
Si #11 se implementa, agregar una vista **liviana** `agent/API.md` con una línea por símbolo
exportado (nombre, firma, summary) y dejar Sphinx/Doxygen para una herramienta externa.
No agregar parámetros/retornos estructurados sin docstrings estructurados.

## Criterios para revisar

- Demanda real de docs de API en repos de usuarios.
- Que #11 haya entregado summaries confiables.
- Que el `API.md` liviano no supere el presupuesto de líneas/paginación.

## Decisión

Diferir API docs completas; aprobar como máximo un `API.md` derivado de `symbols.json` cuando
exista #11. No implementar Sphinx/Doxygen en el core.
