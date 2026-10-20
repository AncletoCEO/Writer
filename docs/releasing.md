# Releases de `@ancleto/writer` y `@ancleto/writer-languages`

## Requisitos

- Node.js ≥ 24.
- Acceso de publicación al scope `@ancleto` en npm.
- 2FA habilitado en la cuenta npm.
- Repositorio público en GitHub, para `--provenance`.
- **Trusted Publishing** configurado para ambos paquetes con `npm trust` (ver más abajo).
- npm ≥ 11.15 para usar `npm trust`.

## Versionado

Se usa semver y un único tag de release: `v<versión del core>`.

- `@ancleto/writer` y `@ancleto/writer-languages` versionan por separado.
- En `0.4.0`: core `0.4.0` y pack `0.1.0`.
- El tag `v0.4.0` dispara la publicación del core; el pack se publica solo si cambió su versión.

```bash
npm version 0.4.0 --no-git-tag-version
git add package.json package-lock.json packages/writer-languages/package.json
git commit -m "chore(release): v0.4.0"
```

Todavía **no** crear el tag: primero hay que publicar el pack y configurar su trust.

El workflow verifica que el tag coincida con
`v$(node -p "require('./package.json').version")`.

## Primera publicación del pack y Trusted Publisher por CLI

npm exige que el paquete exista antes de aceptar un Trusted Publisher. `@ancleto/writer` ya
existe y su trust ya está configurado. Para `@ancleto/writer-languages`, la primera vez:

```bash
cd packages/writer-languages
npm login
npm whoami
npm publish --access public
```

Ahora configurar el trust con la CLI (equivalente a la UI de npm):

```bash
npm trust github @ancleto/writer-languages \
  --file publish.yml \
  --repo AncletoCEO/Writer \
  --allow-publish \
  -y
```

`npm trust` abre una URL para aprobar 2FA. Si ya existe un trust para el paquete:

```bash
npm trust list @ancleto/writer-languages
npm trust revoke --id <trust-id> @ancleto/writer-languages
# y volver a ejecutar npm trust github ...
```

Verificar el trust del core y del pack:

```bash
npm trust list @ancleto/writer
npm trust list @ancleto/writer-languages
```

La configuración de un Trusted Publisher nuevo debe validarse con una publicación exitosa
dentro de los 2 días; si expira, se elimina y se crea de nuevo.

## Tag y publicación

Primero mergear `develop` → `main` con un PR y **merge commit**. El tag debe crearse sobre
`main`; el workflow rechaza cualquier tag cuyo commit no sea ancestro de `origin/main`.

```bash
git switch main
git pull --ff-only

git tag -a v0.4.0 -m "v0.4.0: human reports y language pack"
git push origin v0.4.0
```

El workflow verifica que el tag esté en `main`, publica el core `0.4.0` por OIDC y omite el
pack `0.1.0` porque ya existe.

## Publicaciones siguientes (OIDC, sin token)

`.github/workflows/publish.yml` se dispara con tags `v*` y ejecuta:

1. `actions/checkout@v5` con tags.
2. `actions/setup-node@v5` con Node 24.
3. Resolución del tag contra `package.json` del core.
4. `npm ci`.
5. `npm run build`.
6. `npm test`.
7. `npm run lint`.
8. Verificación de cero `dependencies` de runtime en el core.
9. Publicación del core con `npm publish --access public --provenance` (OIDC).
10. Publicación del pack desde `packages/writer-languages` con OIDC/provenance.
11. GitHub Release con las notas del tag.
12. Canaries no bloqueantes de ambos tarballs en npm.

No se usa `NPM_TOKEN`. Si una versión ya existe, su publicación se omite. Si falla build,
tests, lint o la verificación de dependencias, no se publica nada.

## Pre-flight local

```bash
npm ci
npm run build
npm test
npm run lint
npm pack --dry-run
npm publish --dry-run --access public
(cd packages/writer-languages && npm pack --dry-run)
```

El `publish --dry-run` del core no publica; ejecuta `prepublishOnly` (build, tests y lint).

### Smoke de consumidor

Probar el core solo y el core con el pack en directorios temporales:

```bash
CORE_TGZ=$(npm pack --silent | tail -1)
PACK_TGZ=$(cd packages/writer-languages && npm pack --silent | tail -1)

# core solo: Python debe quedar unsupported
mkdir -p /tmp/writer-smoke-core && cd /tmp/writer-smoke-core
npm init -y
npm install "/ruta/al/${CORE_TGZ}"
# crear src/a.ts y src/app.py, ejecutar ancleto-writer build
# esperado: files 1, unsupported 1

# core + pack: Python debe analizarse
mkdir -p /tmp/writer-smoke-pack && cd /tmp/writer-smoke-pack
npm init -y
npm install "/ruta/al/${CORE_TGZ}" "/ruta/al/${PACK_TGZ}"
# crear src/a.ts y src/app.py, ejecutar ancleto-writer build
# esperado: files 2, unsupported 0
```

## Nota sobre peers de grammars

Swift y Kotlin usan grammars con peers de `tree-sitter` más viejos. El repo raíz tiene
`overrides` para forzar `tree-sitter@0.25.1` en desarrollo y CI. En una instalación de
consumidor, npm puede mostrar warnings de peer; con npm 12 la instalación del pack se completó
correctamente y el runtime usa el `tree-sitter@0.25.1` anidado en el pack. Si una versión de
npm rechaza la instalación, usar `npm install --legacy-peer-deps` y reportarlo.

## Verificación posterior

```bash
npm view @ancleto/writer version
npm view @ancleto/writer-languages version
npm view @ancleto/writer license
npm view @ancleto/writer-languages license
npx @ancleto/writer@0.4.0 --version
npx @ancleto/writer@0.4.0 build
```

Revisar en npm:

- nombres, versiones y licencias `AGPL-3.0-only`;
- README, `LICENSE` y `NOTICE` en ambos paquetes;
- repositorio y procedencia;
- que el tarball del core incluya `src/`, `docs/`, `LICENSE`, `NOTICE` y `README.md`;
- que el tarball del pack incluya `src/`, `README.md`, `LICENSE` y `NOTICE`.

## Rollback

Preferir deprecar antes que despublicar:

```bash
npm deprecate @ancleto/writer@0.4.0 "Motivo del retiro; usar 0.4.1"
npm deprecate @ancleto/writer-languages@0.1.0 "Motivo del retiro; usar 0.1.1"
```

`npm unpublish` solo dentro de las 72 horas permitidas y como última opción:

```bash
npm unpublish @ancleto/writer@0.4.0 --force
npm unpublish @ancleto/writer-languages@0.1.0 --force
```

Después de un rollback, publicar un patch con la corrección.

## Checklist de release 0.4.0

1. `@ancleto/writer-languages@0.1.0` publicado manualmente una vez.
2. `npm trust github @ancleto/writer-languages --file publish.yml --repo AncletoCEO/Writer --allow-publish -y` OK.
3. `npm trust list @ancleto/writer` y `npm trust list @ancleto/writer-languages` muestran el trust.
4. `npm ci && npm run build && npm test && npm run lint` OK.
5. Smoke core solo: `.py` unsupported.
6. Smoke core + pack: `.py` analizado.
7. Tag `v0.4.0` con el mensaje de release.
8. Workflow publica core `0.4.0` y omite el pack `0.1.0` porque ya existe.
9. Verificar fichas npm y `npx @ancleto/writer@0.4.0 --version`.
