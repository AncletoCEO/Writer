# Analysis: GitHub wiki generation

> Issue: [#22](https://github.com/AncletoCEO/Writer/issues/22)
> Change: `github-wiki-generation`
> Fecha: 2026-10-19

## Pregunta

¿Writer debe publicar una GitHub wiki?

## Evidencia

- Writer genera `agent/INDEX.md`, `SYMBOLS.md`, `GOTCHAS.md` y `ARCHITECTURE.md` dentro de
  `outputDir`.
- No tiene acceso de escritura al repo del usuario ni credenciales.
- Publicar una wiki requiere permisos, git push, sidebar y sincronización.
- La regla actual es no tocar archivos fuera de `outputDir`.

## Opciones

### A. No implementar

- Los docs quedan en `.ancleto/writer/agent` y el usuario decide publicarlos.

### B. Render local de wiki

- Generar páginas con sidebar en un directorio local, sin publicar.

### C. Publicación opcional vía `gh`

- Requiere permisos explícitos, manejo de conflictos y autenticación.

### D. Copiar docs a wiki en CI del usuario

- El usuario controla permisos y flujo; Writer solo provee Markdown.

## Recomendación

**A ahora; D como patrón documentado.** No publicar wikis automáticamente. Si el usuario
quiere, puede copiar `agent/*.md` a su wiki en CI. Un render local (**B**) queda como follow-up
si hay demanda, sin tocar el repo.

## Criterios para revisar

- Pedidos de wiki con estructura/sidebar específica.
- Un flujo de publicación opt-in con permisos claros y sin efectos laterales por defecto.

## Decisión

No publicar wiki. Documentar el patrón de copia en CI; render local solo si hay demanda.
