# Design: Call sites and source viewer

## Approach

¿Vale la pena un índice de call sites y snippets de código, o `file:line` y las firmas son suficientes para agentes?

A. Índice de call sites con `caller`, `callee`, `file:line` y confianza.
B. Snippets de código embebidos en `symbols.json` (con tope de bytes).
C. Source viewer HTML (fuera de alcance).
D. No hacerlo.

## Architecture

No aplica implementación. Se relevan el código actual y la referencia de ReadMenator para el ADR.

- `src/parsers/javascript.js` extrae llamadas intra-archivo.
- `src/graph/build.js` crea aristas `call` con línea.
- `symbols.json` tiene `line`/`endLine` y firma.
- No hay snippets ni call sites cross-file.

## Validation

Diseño de índice/snippets, formato y límites. No implementar.

- Utilidad para agentes vs tamaño de salida.
- Privacidad y ruido de código embebido.
- Resolución cross-file (hoy las llamadas son intra-archivo).
- Solapamiento con el IDE.
