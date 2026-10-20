# Tasks: Python language adapter spike

> Spike de implementación. Issue #9. No mergea código a producción.

## Fase 0 — Preparación

- [x] Crear un workspace temporal aislado (`spike/` o rama descartable).
- [x] Elegir el corpus Python (≥50 archivos variados).
- [x] Confirmar que `@ancleto/writer` no cambia sus dependencias.

## Fase 1 — Prototipo WASM

- [x] Instalar `web-tree-sitter` y una grammar Python WASM en el workspace del spike (bloqueado por incompatibilidad de ABI; documentado en `spike-report.md`).
- [x] Implementar el prototipo nativo `bench.mjs` para extraer imports/clases/funciones/herencia (WASM no viable).
- [x] Medir archivos parseados, errores, tiempo y tamaño (nativo; WASM bloqueado).

## Fase 2 — Prototipo nativo

- [x] Instalar `tree-sitter` + `tree-sitter-python` en el workspace del spike.
- [x] Medir con el mismo corpus y comparar con WASM.
- [x] Verificar compatibilidad con Node 24.

## Fase 3 — Reporte y decisión

- [x] Escribir `spike-report.md` con tabla comparativa y riesgos.
- [x] Aplicar los umbrales del análisis #9.
- [x] Recomendar go/no-go y, si go, alcance del language pack.
- [x] Actualizar el issue #9 con la conclusión.
- [x] Registrar la decisión en memoria.
