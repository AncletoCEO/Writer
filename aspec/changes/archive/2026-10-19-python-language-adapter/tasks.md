# Tasks: Python language adapter

> Change de implementación. Issue [#29](https://github.com/AncletoCEO/Writer/issues/29).

## Fase 0 — Relevamiento

- [x] Confirmar tree-sitter nativo y versiones en Node 24 (spike #9).
- [x] Definir el adapter contract y el layout del pack.
- [x] Confirmar que el core conserva cero dependencias de runtime.

## Fase 1 — Core boundary

- [x] Agregar `src/languages/registry.js` con carga opcional y mapa de extensiones.
- [x] Agregar `languagePack` a la config y validarlo.
- [x] Extender `scanRepository` con extensiones externas.
- [x] Extender `buildGraph` con dispatch parser/resolver.
- [x] Cargar el pack en `analyzeRepository`.

## Fase 2 — Paquete y adapter Python

- [x] Crear `packages/writer-languages` con `package.json` y `src/index.js`.
- [x] Implementar `src/python.js`:
  - [x] imports absolutos/relativos;
  - [x] clases, funciones, métodos y decoradores;
  - [x] herencia;
  - [x] llamadas intra-archivo;
  - [x] docstrings como `summary`;
  - [x] resolver local y `__init__.py`.
- [x] Exportar `adapters` y documentar el contrato del pack.

## Fase 3 — Integración y contrato

- [x] Actualizar `docs/contracts/writer-artifacts-v1.md`.
- [x] Documentar instalación opcional, `lang: python`, fallback y límites.
- [x] Verificar que `.py` sale de `unsupported` solo con el pack activo.
- [x] Verificar API/UML/docs con Python.

## Fase 4 — Tests y verificación

- [x] Unit tests del parser/resolver Python.
- [x] Integración `runBuild` con un repo Python.
- [x] Fallback con `languagePack.enabled=false`.
- [x] Regresión JS/TS.
- [x] `npm test`, `npm run lint`, `npm run build`.
- [x] Actualizar issue #29 y memoria del proyecto.

## Fase 5 — Cierre

- [x] Verificación contra proposal/design/specs/tasks (tests 152/152, `ancleto specs check` canónico, integración Python).
- [x] Sincronizar delta specs a `aspec/specs/` y archivar el change.
