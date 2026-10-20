# Tasks: Multi-language support

> Change de análisis. Issue #9. No implementa código.

## Fase 0 — Relevamiento

- [x] Confirmar el estado actual en Writer.
- [x] Revisar la referencia de ReadMenator.
- [x] Definir las preguntas y los criterios de decisión.
- [x] Considerar: Demanda real de usuarios de spec.
- [x] Considerar: Costo de mantenimiento y tests por lenguaje.
- [x] Considerar: Impacto en el contrato (symbols, imports, calls, inherits).
- [x] Considerar: Rendimiento y tamaño del paquete.
- [x] Considerar: Licencia y dependencias.
- [x] Considerar: Prioridad de lenguajes (Python, Go, Rust, Java, etc.).

## Fase 1 — Opciones y evidencia

- [x] Evaluar Parsers propios por lenguaje (como ReadMenator): control total, cero deps, mucho mantenimiento.
- [x] Evaluar Tree-sitter como peer/optional dependency: cobertura amplia, rompe cero-deps y agrega WASM/binarios.
- [x] Evaluar Delegar a herramientas externas (ReadMenator, Semgrep, etc.): rápido, pero acopla y puede traer AGPL/entornos.
- [x] Evaluar Quedarse en JS/TS.
- [x] Medir o prototipar lo necesario.
- [x] Identificar riesgos y falsos positivos.

## Fase 2 — Decisión

- [x] Escribir el ADR/diseño con la recomendación.
- [x] Definir alcance y criterios de salida.
- [x] Presentar la decisión para aprobación.

## Fase 3 — Cierre

- [x] Actualizar el issue con el resultado.
- [x] Evaluar si se aprueba: no aprobado; multi-lenguaje queda diferido con criterios de revisión.
