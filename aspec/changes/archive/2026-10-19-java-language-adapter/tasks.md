# Tasks: Java language adapter

> Change de implementación. Issue [#32](https://github.com/AncletoCEO/Writer/issues/32).

## Fase 0 — Relevamiento

- [x] Verificar `tree-sitter-java@0.23.5` con `tree-sitter@0.25.1` en Node 24.
- [x] Inspeccionar `package`, imports, tipos, miembros, herencia y Javadoc.
- [x] Definir resolución por package con caída iterativa.

## Fase 1 — Adapter Java

- [x] Crear `packages/writer-languages/src/java.js`.
- [x] Extraer `package` y publicar `parse.namespaces`.
- [x] Extraer imports normal/static/wildcard.
- [x] Extraer clases, interfaces, enums, records y anotaciones.
- [x] Extraer métodos, constructores, herencia/implementación y llamadas.
- [x] Extraer Javadoc como `summary`.
- [x] Implementar resolver por package.
- [x] Exportar el adapter en `src/index.js`.
- [x] Agregar `tree-sitter-java` a dependencies del pack.

## Fase 2 — Integración y contrato

- [x] Agregar `java` a `ALLOWED_LANGUAGES`.
- [x] Actualizar `docs/contracts/writer-artifacts-v1.md`.
- [x] Actualizar README (lenguajes soportados e instalación).
- [x] Verificar `.java` fuera de unsupported con el pack activo.
- [x] Verificar API/UML/docs con Java.

## Fase 3 — Tests y verificación

- [x] Unit tests de parser y resolver Java.
- [x] Integración `runBuild` con packages locales multi-archivo.
- [x] Verificar `extends` vs `implements`.
- [x] Fallback con pack deshabilitado.
- [x] `npm test`, `npm run lint`, `npm run build`.
- [x] `npm pack --dry-run` del core y del pack.

## Fase 4 — Cierre

- [x] Sincronizar delta specs a `aspec/specs/`.
- [x] `ancleto specs check`.
- [x] Actualizar issue #32 y memoria.
- [x] Archivar el change.
