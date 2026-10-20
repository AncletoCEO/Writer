# Tasks: README injection and self-describing folders

> Change de análisis. Issue #25. No implementa código.

## Fase 0 — Relevamiento

- [x] Confirmar el estado actual en Writer.
- [x] Revisar la referencia de ReadMenator.
- [x] Definir las preguntas y los criterios de decisión.
- [x] Considerar: Confianza del usuario y conflictos de merge.
- [x] Considerar: Idempotencia y reversibilidad.
- [x] Considerar: Valor real del link.
- [x] Considerar: Coherencia con la regla de no tocar el repo.

## Fase 1 — Opciones y evidencia

- [x] Evaluar Mantener cero efectos laterales (actual).
- [x] Evaluar Inyección opt-in con bloque marcado e idempotente.
- [x] Evaluar READMEs solo dentro de `.ancleto/writer/` (no en el repo del usuario).
- [x] Evaluar No hacerlo.
- [x] Medir o prototipar lo necesario.
- [x] Identificar riesgos y falsos positivos.

## Fase 2 — Decisión

- [x] Escribir el ADR/diseño con la recomendación.
- [x] Definir alcance y criterios de salida.
- [x] Presentar la decisión para aprobación.

## Fase 3 — Cierre

- [x] Actualizar el issue con el resultado.
- [x] Evaluar aprobación: ver `analysis.md`; no se crea change de implementación todavía.
