# Proposal: ancleto-writer impact command

> Issue: [#8 — ancleto-writer impact command](https://github.com/AncletoCEO/Writer/issues/8)
> Tipo: implementation
> Base: @ancleto/writer 0.1.1; change archivado `ancleto-writer`.

## Problem

El blast radius ya se calcula para semillas en `facts/blast-radius.json`, pero no hay forma de preguntar "si toco este archivo, qué se ve afectado" desde la CLI. Es útil para `@ancleto/spec` en `propose`, `review` y `apply`, y para agentes.

- `src/metrics/blast-radius.js` calcula dependientes directos/transitivos con tope de 200.
- `src/facts/build.js` publica `facts/blast-radius.json` para semillas.
- No hay comando `impact`.

## Proposed change

- `ancleto-writer impact <archivo...> [--root] [--json] [--depth N]`.
- Leer `graph.json` y `manifest.json`; validar frescura. Si está stale, exit `3` con recomendación de `build`, o `--build` para reconstruir antes.
- Salida: dependientes directos, transitivos, ciclos afectados, capas y archivos de test.
- Reutilizar el grafo inverso de `blast-radius.js`; agregar límite de profundidad.
- Tests con cadena transitiva y con archivo sin dependientes.

## Scope

Incluye: comando, salida humana/JSON, frescura y tests.
No incluye: query libre ni path finding (ver issue de analysis).

## Risks

- Dependencia: `graph.json` y frescura ya existen.
- Riesgo: grafos con muchos dependientes; respetar tope y documentar.
