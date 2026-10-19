# Tasks: Python language adapter spike

> Spike de implementación. Issue #9. No mergea código a producción.

## Fase 0 — Preparación

- [ ] Crear un workspace temporal aislado (`spike/` o rama descartable).
- [ ] Elegir el corpus Python (≥50 archivos variados).
- [ ] Confirmar que `@ancleto/writer` no cambia sus dependencias.

## Fase 1 — Prototipo WASM

- [ ] Instalar `web-tree-sitter` y una grammar Python WASM en el workspace del spike.
- [ ] Implementar `parse-python.mjs` para extraer imports/clases/funciones/herencia.
- [ ] Medir archivos parseados, errores, tiempo y tamaño.

## Fase 2 — Prototipo nativo

- [ ] Instalar `tree-sitter` + `tree-sitter-python` en el workspace del spike.
- [ ] Medir con el mismo corpus y comparar con WASM.
- [ ] Verificar compatibilidad con Node 24.

## Fase 3 — Reporte y decisión

- [ ] Escribir `spike-report.md` con tabla comparativa y riesgos.
- [ ] Aplicar los umbrales del análisis #9.
- [ ] Recomendar go/no-go y, si go, alcance del language pack.
- [ ] Actualizar el issue #9 con la conclusión.
- [ ] Registrar la decisión en memoria.
