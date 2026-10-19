# Tasks: Multi-language support

> Change de análisis. Issue #9. No implementa código.

## Fase 0 — Relevamiento

- [ ] Confirmar el estado actual en Writer.
- [ ] Revisar la referencia de ReadMenator.
- [ ] Definir las preguntas y los criterios de decisión.
- [ ] Considerar: Demanda real de usuarios de spec.
- [ ] Considerar: Costo de mantenimiento y tests por lenguaje.
- [ ] Considerar: Impacto en el contrato (symbols, imports, calls, inherits).
- [ ] Considerar: Rendimiento y tamaño del paquete.
- [ ] Considerar: Licencia y dependencias.
- [ ] Considerar: Prioridad de lenguajes (Python, Go, Rust, Java, etc.).

## Fase 1 — Opciones y evidencia

- [ ] Evaluar Parsers propios por lenguaje (como ReadMenator): control total, cero deps, mucho mantenimiento.
- [ ] Evaluar Tree-sitter como peer/optional dependency: cobertura amplia, rompe cero-deps y agrega WASM/binarios.
- [ ] Evaluar Delegar a herramientas externas (ReadMenator, Semgrep, etc.): rápido, pero acopla y puede traer AGPL/entornos.
- [ ] Evaluar Quedarse en JS/TS.
- [ ] Medir o prototipar lo necesario.
- [ ] Identificar riesgos y falsos positivos.

## Fase 2 — Decisión

- [ ] Escribir el ADR/diseño con la recomendación.
- [ ] Definir alcance y criterios de salida.
- [ ] Presentar la decisión para aprobación.

## Fase 3 — Cierre

- [ ] Actualizar el issue con el resultado.
- [ ] Si se aprueba, crear el change de implementación.
