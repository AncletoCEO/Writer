# Analysis: Class stubs in other languages

> Issue: [#23](https://github.com/AncletoCEO/Writer/issues/23)
> Change: `class-stubs`
> Fecha: 2026-10-19

## Pregunta

¿Los usuarios necesitan generar stubs/clases en otros lenguajes desde el grafo?

## Evidencia

- `symbols.json` y el UML Mermaid describen clases, métodos y herencia.
- Writer no genera código.
- ReadMenator traduce a 12 lenguajes; es una feature de scaffolding, no de contexto.
- Generar stubs requiere plantillas por lenguaje, tipos y convenciones; alto riesgo de drift.

## Opciones

### A. No implementar

- Mantener Writer como motor de conocimiento, no de generación de código.

### B. Plantillas para 1-2 lenguajes

- Útil para migraciones puntuales, pero hay que mantener tipos/convenciones y tests.

### C. Motor de templates desde UML

- Más general, pero mucho mantenimiento y decisiones de tipos.

### D. Delegar a herramientas externas

- Un generador dedicado puede consumir `symbols.json`/UML.

## Recomendación

**A.** No generar stubs. Writer publica estructura; si un usuario necesita scaffolding, una
herramienta externa puede consumir `symbols.json` o el UML. No agregar plantillas por lenguaje
al core.

## Criterios para revisar

- Demanda concreta de migración/scaffolding.
- Un consumidor externo que use el contrato sin cambios.

## Decisión

No implementar class stubs multi-lenguaje.
