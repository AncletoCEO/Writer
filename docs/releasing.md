# Releases de `@ancleto/writer`

## Requisitos

- Node.js ≥ 24.
- Acceso de publicación al scope `@ancleto` en npm.
- 2FA habilitado en la cuenta npm.
- Repositorio público en GitHub, para `--provenance`.
- **Trusted Publishing** configurado en npmjs.com para publicar desde GitHub Actions sin
  `NPM_TOKEN` (ver más abajo).

## Versionado

Se usa semver y un único tag por release: `v<versión>`.

```bash
npm version 0.1.0 --no-git-tag-version
git add package.json package-lock.json
git commit -m "chore(release): v0.1.0"
git tag -a v0.1.0 -m "v0.1.0"
git push origin develop --tags
```

El workflow verifica que el tag coincida con `v$(node -p "require('./package.json').version")`.

## Primera publicación (manual, una sola vez)

npm exige que el paquete exista antes de poder configurar un Trusted Publisher. Por eso la
primera versión se publica manualmente:

```bash
npm login
npm whoami
npm publish --access public
```

Eso reserva `@ancleto/writer` y crea la página del paquete.

Después, en npmjs.com:

1. Abrir `@ancleto/writer` → **Settings** → **Trusted Publisher**.
2. Elegir **GitHub Actions**.
3. Organización/usuario: `AncletoCEO`.
4. Repositorio: `Writer`.
5. Workflow: `publish.yml`.
6. Habilitar el permiso de publicación.

La configuración de un Trusted Publisher nuevo debe validarse con una publicación exitosa
dentro de los 2 días; si expira, se elimina y se crea de nuevo.

## Publicaciones siguientes (OIDC, sin token)

`.github/workflows/publish.yml` se dispara con tags `v*` y ejecuta:

1. `actions/checkout@v5` con tags.
2. `actions/setup-node@v5` con Node 24.
3. Resolución del tag contra `package.json`.
4. `npm ci`.
5. `npm run build`.
6. `npm test`.
7. `npm run lint`.
8. Verificación de cero `dependencies` de runtime.
9. `npm publish --access public --provenance` usando OIDC (`id-token: write`).
10. GitHub Release con las notas del tag.
11. Canary no bloqueante del tarball en npm.

No se usa `NPM_TOKEN`. Si la versión ya existe, el publish se omite. Si falla build, tests,
lint o la verificación de dependencias, no se publica.

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

## Checklist de primera release

1. `npm login` + `npm whoami` OK.
2. `npm publish --access public` de `0.1.0`.
3. Configurar el Trusted Publisher en npmjs.com.
4. Verificar la ficha de npm.
5. Smoke `npx @ancleto/writer@0.1.0 --version`.
6. Para la siguiente versión, usar tag y workflow OIDC.
