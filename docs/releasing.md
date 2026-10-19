# Releases de `@ancleto/writer`

## Requisitos

- Node.js ≥ 24.
- Acceso de publicación al scope `@ancleto` en npm.
- Secret `NPM_TOKEN` en GitHub Actions: automation token con permiso de publicación y 2FA
  configurado. Nunca se commitea.
- El repositorio es público, lo que habilita `--provenance` en CI.

## Versionado

Se usa semver y un único tag por release: `v<versión>`.

```bash
npm version 0.1.0 --no-git-tag-version
git add package.json package-lock.json
git commit -m "chore(release): v0.1.0"
git tag -a v0.1.0 -m "v0.1.0"
git push origin develop --tags
```

El tag debe coincidir exactamente con `v$(node -p "require('./package.json').version")`.
El workflow falla si no coincide.

## Pre-flight local

```bash
npm ci
npm run build
npm test
npm run lint
npm publish --dry-run --access public
npm pack --dry-run
```

`npm publish --dry-run` no publica; ejecuta `prepublishOnly` (build, tests y lint) y muestra
el tarball. `npm pack --dry-run` permite revisar archivos, tamaño y que no se incluyan
tests, fixtures ni `node_modules`.

## Publicación por CI

`.github/workflows/publish.yml` se dispara con tags `v*` y ejecuta, en orden:

1. `npm ci`.
2. Verificación de tag contra `package.json`.
3. `npm run build`.
4. `npm test`.
5. `npm run lint`.
6. Verificación de cero `dependencies` de runtime.
7. `npm publish --access public --provenance`.

Si cualquier paso falla, no se publica. El `NPM_TOKEN` se inyecta solo en el paso de
publicación.

## Publicación manual (fallback)

Solo si el CI no está disponible:

```bash
npm login
npm publish --access public
```

La publicación manual no genera provenance de la misma forma que CI. Preferir siempre el
workflow.

## Verificación posterior

```bash
npm view @ancleto/writer version
npm view @ancleto/writer license
npx @ancleto/writer@0.1.0 --version
```

Revisar en npm:

- nombre, versión y licencia `AGPL-3.0-only`;
- README y enlaces a `LICENSE` y `NOTICE`;
- repositorio y procedencia;
- que el tarball incluya `src/`, `docs/`, `LICENSE`, `NOTICE` y `README.md`.

## Rollback

Preferir deprecar antes que despublicar:

```bash
npm deprecate @ancleto/writer@0.1.0 "Motivo del retiro; usar 0.1.1"
```

`npm unpublish` solo dentro de las 72 horas permitidas y como última opción:

```bash
npm unpublish @ancleto/writer@0.1.0 --force
```

Después de un rollback, publicar un patch con la corrección.

## Primera release

1. Confirmar que `@ancleto/writer` sigue disponible en npm.
2. Configurar `NPM_TOKEN`.
3. Ejecutar el pre-flight local.
4. Crear el tag `v0.1.0` y pushearlo.
5. Verificar el workflow y la ficha de npm.
6. Correr el smoke `npx @ancleto/writer@0.1.0 --version`.

La primera publicación reserva el nombre en el scope `@ancleto`.
