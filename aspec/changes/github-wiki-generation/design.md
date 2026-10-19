# Design: GitHub wiki generation

## Approach

¿Writer debe publicar una GitHub wiki?

A. No implementar.
B. Comando `wiki` que renderice páginas en un directorio local.
C. Publicación opcional vía `gh` con permisos explícitos.
D. Copiar docs a wiki en CI del usuario.

## Architecture

No aplica implementación. Se relevan el código actual y la referencia de ReadMenator para el ADR.

- `agent/INDEX.md`, `SYMBOLS.md`, `GOTCHAS.md`, `ARCHITECTURE.md`.
- No hay integración con GitHub wiki.

## Validation

ADR con decisión. No implementar.

- Valor vs costo de permisos/autenticación.
- Solapamiento con GitHub Pages/docs.
- Mantenimiento de enlaces y sidebar.
