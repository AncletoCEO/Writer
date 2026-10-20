# Design: Release 0.3.0

## Versionado

- `@ancleto/writer`: `0.2.0` → `0.3.0`.
- `@ancleto/writer-languages`: `0.1.0` (primera publicación).
- Un solo tag: `v0.3.0`; el workflow valida que coincida con la versión del core.

## Workflow

`.github/workflows/publish.yml` mantiene el flujo actual y agrega:

1. Verificación de cero `dependencies` del core.
2. Publicación del core (`npm publish --provenance` con OIDC).
3. Publicación del pack desde `packages/writer-languages` (`npm publish --provenance`).
   - Si la versión del pack ya existe, se omite.
   - `PACK_VERSION` se exporta a `GITHUB_ENV` para el canary.
4. GitHub Release.
5. Canary del tarball del core.
6. Canary del tarball del pack.

El Trusted Publisher del pack se configura con `npm trust github` (CLI, sin UI):

```bash
npm trust github @ancleto/writer-languages \
  --file publish.yml \
  --repo AncletoCEO/Writer \
  --allow-publish \
  -y
```

La primera publicación del pack es manual, porque npm exige que el paquete exista antes de
aceptar el trust. Después, el mismo comando configura OIDC.

## Contenido del pack

`packages/writer-languages` incluye:

- `src/` con los 11 adapters;
- `README.md` con instalación, lenguajes, límites y peers;
- `LICENSE` (AGPL-3.0-only) y `NOTICE`;
- `package.json` con sus dependencies de tree-sitter;
- sin `@ancleto/writer` como dependencia.

El core mantiene cero `dependencies`; el pack es opcional y se publica por separado.

## Instalación de consumidor

Se validó con `npm 12.2.0` en Node 24:

- core solo: `.py` queda en `facts/unsupported.json`;
- core + pack: `.py` se analiza;
- el pack carga los 11 adapters y parsea una entrada vacía de cada lenguaje.

Los peers viejos de Swift/Kotlin producen warnings; npm 12 completa la instalación y el pack
usa su `tree-sitter@0.25.1` anidado. Si una versión de npm rechaza la instalación, se documenta
`--legacy-peer-deps`.

## Smoke

Pre-flight local:

```bash
npm ci
npm run build
npm test
npm run lint
npm pack --dry-run
npm publish --dry-run --access public
(cd packages/writer-languages && npm pack --dry-run)
```

Smoke de tarballs en directorios temporales:

1. instalar solo el core y verificar que Python no se analiza;
2. instalar core + pack y verificar que Python sí se analiza;
3. ejecutar `ancleto-writer --version` y `build`.

## Documentación

- README: estado `0.3.0`, P1+P2, ejemplos con la nueva versión.
- `docs/releasing.md`: versiones, primer publish del pack, Trusted Publisher, workflow, smoke,
  verificación, peers y rollback de ambos paquetes.

## Rollback

Deprecar `@ancleto/writer@0.3.0` y `@ancleto/writer-languages@0.1.0`; despublicar solo dentro
de las 72 horas y como última opción; publicar patch si hace falta.
