# Tasks: Unsupported language visibility

> Change de implementación. Issue #9.

## Fase 0 — Relevamiento

- [ ] Definir el mapa conservador de extensiones/lenguajes.
- [ ] Confirmar que el scan respeta excludes y no lee contenido innecesario.

## Fase 1 — Implementación

- [ ] Implementar `src/scan/languages.js`.
- [ ] Agregar la colección `unsupported` al scanner.
- [ ] Implementar `src/facts/unsupported.js` y publicar el fact.
- [ ] Mostrar el resumen en `GOTCHAS.md` e `inventory.md`.
- [ ] Configurar `unsupported.enabled` y `unsupported.maxFilesPerLanguage`.

## Fase 2 — Documentación

- [ ] Actualizar contrato con `facts/unsupported.json`.
- [ ] Documentar que los archivos no soportados no se analizan.
- [ ] Enlazar al análisis #9 y al future language pack.

## Fase 3 — Tests

- [ ] `.py` contado y sin nodo.
- [ ] Binario/sin extensión ignorado.
- [ ] Excludes respetados.
- [ ] JS/TS no aparece como unsupported.
- [ ] Límite de archivos por lenguaje.
- [ ] `npm test`, `npm run lint`, `npm run build`.
