# Tasks: Unsupported language visibility

> Change de implementación. Issue #9.

## Fase 0 — Relevamiento

- [x] Definir el mapa conservador de extensiones/lenguajes.
- [x] Confirmar que el scan respeta excludes y no lee contenido innecesario.

## Fase 1 — Implementación

- [x] Implementar `src/scan/languages.js`.
- [x] Agregar la colección `unsupported` al scanner.
- [x] Implementar `src/facts/unsupported.js` y publicar el fact.
- [x] Mostrar el resumen en `GOTCHAS.md` e `inventory.md`.
- [x] Configurar `unsupported.enabled` y `unsupported.maxFilesPerLanguage`.

## Fase 2 — Documentación

- [x] Actualizar contrato con `facts/unsupported.json`.
- [x] Documentar que los archivos no soportados no se analizan.
- [x] Enlazar al análisis #9 y al future language pack.

## Fase 3 — Tests

- [x] `.py` contado y sin nodo.
- [x] Binario/sin extensión ignorado.
- [x] Excludes respetados.
- [x] JS/TS no aparece como unsupported.
- [x] Límite de archivos por lenguaje.
- [x] `npm test`, `npm run lint`, `npm run build`.
