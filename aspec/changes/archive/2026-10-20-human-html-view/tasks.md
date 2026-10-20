# Tasks: Self-contained HTML human view

> Issue [#52](https://github.com/AncletoCEO/Writer/issues/52).

## Fase 1 — Render HTML

- [x] Crear `src/human/html.js`.
- [x] Header, cards, tablas y estilos inline.
- [x] SVG de capas y comunidades.
- [x] SVG de UML acotado.
- [x] SVG de imports y ciclo.
- [x] Escaping de todo texto del repo.
- [x] Integrar `index.html` en `runHuman`.

## Fase 2 — Tests

- [x] HTML generado con `<!doctype html>` y `<svg>`.
- [x] Sin `http://`/`https://` ni paths absolutos.
- [x] Determinismo byte a byte.
- [x] Límites de nodos/clases/comunidades.
- [x] CLI JSON incluye `index.html`.

## Fase 3 — Documentación

- [x] README completo con `index.html` y SVG inline.
- [x] Contrato: `human/index.html` derivado.
- [x] Aclarar relación con Mermaid/Markdown.

## Fase 4 — Verificación

- [x] `npm test`, `npm run lint`, `npm run build`.
- [x] Build + human sobre un repo real grande.
- [x] HTML offline, tamaño y sin rutas absolutas.
- [x] `ancleto specs check`.
- [x] Archivar el change y cerrar #52.
