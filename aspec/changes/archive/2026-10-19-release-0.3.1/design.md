# Design: Release 0.3.1

## Approach

Release de documentación. Se reutiliza el workflow OIDC existente.

1. Bump del core a `0.3.1`; pack `0.1.0` sin cambios.
2. README completo: language pack, tabla por lenguaje, resolución/límites, configuración,
   peers, fallback, contrato, artefactos y FAQ.
3. `docs/releasing.md` actualizado a `0.3.1`.
4. Tag `v0.3.1`; el workflow publica `@ancleto/writer@0.3.1` y omite el pack.
5. Verificar README en npm y `npx`.

## Validation

- `npm test`, `npm run lint`, `npm run build`.
- `npm pack --dry-run` y `npm publish --dry-run`.
- `ancleto specs check`.
- Smoke de consumidor con core `0.3.1` + pack `0.1.0`.
