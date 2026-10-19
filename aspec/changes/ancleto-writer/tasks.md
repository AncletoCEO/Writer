# Tasks: @ancleto/writer

> Change: `ancleto-writer` — MVP de motor de conocimiento estático, standalone, AGPL-3.0-only.
> Cada tarea debe dejar evidencia verificable en el repo o en la salida de un comando.

## Fase 0 — Licencia y procedencia (antes de portar código)

- [x] Crear `LICENSE` con el texto completo de GNU AGPL-3.0.
- [x] Crear `NOTICE` con upstream (`https://github.com/grisuno/ReadMenator`), autor, commit exacto y fecha de port.
- [x] Crear `docs/provenance.md` con el mapa `módulo ReadMenator → archivo de @ancleto/writer`.
- [x] Definir la cabecera SPDX de archivos derivados y aplicarla a cada archivo portado.
- [x] Confirmar que no se copiarán plantillas HTML/JS/CSS, video, GraphRAG ni wiki del upstream.
- [x] Inicializar repositorio git en la rama `main` y configurar `origin` → `git@github.com:AncletoCEO/Writer.git`.
- [x] Crear `.gitignore` para `node_modules/`, `.ancleto/`, `.opencode/`, logs y artefactos de build.

## Fase 0b — Gobernanza de ramas

- [x] Crear workflow `pr-source-guard` que falla PRs a `main` cuyo origen no sea `develop`.
- [x] Documentar el flujo `feature/* → develop → main` en `docs/branching.md`.
- [x] Crear `scripts/setup-branch-protection.sh` idempotente para ruleset, rama default y check requerido.
- [x] Agregar plantilla de PR con la distinción `develop` / release.
- [x] Pushear `main` y `develop` a `origin`.
- [ ] Aplicar el ruleset en GitHub y marcar `develop` como default (diferido; **no bloquea el MVP**). Requiere admin. Mientras tanto, el equipo integra en `develop` y `main` recibe PRs de release desde `develop`.

## Fase 1 — Scaffold del paquete

- [x] Crear `package.json` con `name: @ancleto/writer`, `version: 0.1.0`, `type: module`, `engines.node >= 24`, `license: AGPL-3.0-only`, `bin.ancleto-writer`, `files` y `publishConfig.access: public`.
- [x] Agregar scripts `test`, `lint`, `build` (no-op o validación de sintaxis) y `prepublishOnly`.
- [x] Configurar ESLint con `eslint` + `globals` como únicas `devDependencies`.
- [x] Crear `README.md` con atribución, aviso AGPL, comandos y contrato de artefactos.
- [x] Verificar que `npm ls --omit=dev` no reporte dependencias de runtime.

## Fase 2 — Configuración y scanner

- [x] Implementar `src/config/glob.js`: matcher mínimo para `*`, `**`, `?` y clases, sin dependencias.
- [x] Implementar `src/config/load.js` con precedencia CLI > `.ancleto-writer.json` > `.ancletorc` (`discovery.exclude`) > defaults.
- [x] Implementar `init` para escribir `.ancleto-writer.json` sin sobrescribir salvo `--force`.
- [x] Implementar `src/scan/scanner.js`: walk determinista, ignores, `lstat`, contención con `realpath`, topes de tamaño/profundidad.
- [x] Registrar `facts/skipped.json` con `reason` para archivos omitidos.
- [x] Implementar hash SHA-256 por archivo durante el scan (una sola lectura).
- [x] Implementar `src/scan/git.js` opcional (`rev-parse`, `diff --name-only`), con fallback silencioso si no hay git.
- [x] Tests: excludes por defecto, symlink rechazado, archivo > 1 MiB omitido, orden estable.

## Fase 3 — Lexer y parser JavaScript/TypeScript

- [x] Implementar `src/parsers/lexer.js` para JS/TS/JSX/TSX: comentarios, strings, templates, regex vs división, posiciones.
- [x] Extraer imports estáticos, side-effect, `export ... from`, `import()` con literal y `require()` con literal.
- [x] Marcar imports dinámicos no literales como `unresolved` con `reason: non-literal`.
- [x] Extraer símbolos: funciones, clases, métodos, const-arrow, interfaces, types y enums, con `line`, `endLine`, `exported` y `signature`.
- [x] Extraer llamadas intra-archivo resueltas a símbolos locales, con `confidence: inferred`.
- [x] Extraer herencia local e importada (`extends`, `implements`), con `confidence` según resolución.
- [x] Tests con fixtures por construcción: imports, exports, JSX, genéricos, decoradores, regex, templates anidados.

## Fase 4 — Resolución de imports

- [x] Implementar `src/resolve/imports.js` para relativos: extensión explícita, lista de extensiones, `index.*`.
- [x] Implementar parser JSONC para `tsconfig.json`/`jsconfig.json` (comentarios y trailing commas).
- [x] Aplicar `baseUrl` y `paths` en la resolución.
- [x] Clasificar externos y contarlos en `stats.externalImports` + `facts/externals.json`.
- [x] Reportar relativos no resueltos en `facts/unresolved.json` con `reason` (`not-found`, `outside-root`, `ambiguous`).
- [x] Tests: alias, `baseUrl`, extensión `.ts` vs `.js`, index, import fuera del root.

## Fase 5 — Grafo y métricas

- [x] Implementar `src/graph/build.js`: nodos de archivo/símbolo, aristas de import/call/inherits, dedupe y orden estable.
- [x] Implementar Tarjan SCC en `src/metrics/cycles.js` (SCC > 1 y self-loops).
- [x] Implementar PageRank en `src/metrics/pagerank.js` (damping 0.85, tolerancia 1e-6, 100 iteraciones).
- [x] Implementar capas en `src/metrics/layers.js` con defaults por path y overrides de config; marcar `upward-import` como warning.
- [x] Implementar hotspots en `src/metrics/hotspots.js` con la fórmula documentada y desempate por path.
- [x] Implementar blast radius acotado en `src/metrics/blast-radius.js` (top 100 fan-in + cambiados + `impactSeeds`, tope 200 dependientes).
- [x] Tests: ciclo conocido, self-loop, PageRank con suma 1, capas y violaciones, blast radius transitivo.

## Fase 6 — Contrato y publicación atómica

- [x] Implementar `src/contract/manifest.js`: `schemaVersion`, versión, git, fingerprint, stats y hashes de salidas.
- [x] Implementar `src/contract/validate.js`: validación de esquema e integridad de salidas.
- [x] Implementar publicación atómica en `src/contract/writer.js` (temp → backup → swap → cleanup) con restauración ante fallo.
- [x] Escribir `manifest.json` al final del directorio temporal.
- [x] Implementar `check`: fresco (`0`), stale (`3`), esquema incompatible (`4`), sin escribir nada.
- [x] Tests: dos builds idénticos salvo `generatedAt`/`durationMs`; fallo simulado deja el paquete anterior intacto.

## Fase 7 — Hechos, documentos y memoria read-only

- [x] Implementar `src/facts/build.js` para `cycles.json`, `layers.json`, `hotspots.json`, `blast-radius.json`, `inventory.md`, `unresolved.json`, `externals.json` y `skipped.json`.
- [x] Implementar `src/render/mermaid.js` para grafo de imports, ciclos y capas.
- [x] Implementar `src/render/markdown.js` para `INDEX.md`, `SYMBOLS.md`, `GOTCHAS.md` y `ARCHITECTURE.md` con tope de 500 líneas y paginación `_pN.md`.
- [x] Implementar `src/memory/read-only.js` con `node:sqlite` en `readOnly`; leer solo `rule` activas de scope `project`.
- [x] Incluir la sección "Reglas del proyecto" en `GOTCHAS.md` sin mapeo semántico.
- [x] Verificar que `memory.db` no cambia de hash tras un build y que no se abre en modo escritura.
- [x] Tests: paginación con repo sintético grande, memoria ausente/bloqueada no rompe el build.

## Fase 8 — CLI

- [x] Implementar dispatch en `src/cli/index.js` con `init`, `build`, `check`, `doctor`, `--help`, `--version`.
- [x] Implementar `--root`, `--out`, `--json`, `--quiet` y validación de flags desconocidos.
- [x] Implementar exit codes `0` OK, `1` uso/config, `2` error de análisis, `3` stale, `4` esquema incompatible.
- [x] Implementar `doctor`: Node, git, permisos de escritura, DB de memoria, config efectiva y último manifest.
- [x] Mostrar aviso legal AGPL en `--version` y `--help`.
- [x] Rechazar Node < 24 con mensaje claro y exit `1`.
- [x] Tests de CLI: cada comando, cada exit code, config por flags y `--json`.

## Fase 9 — Suite de validación

- [x] Crear fixtures: repo vacío, repo JS/TS mixto, monorepo con alias, repo con ciclos, repo con archivos omitidos.
- [x] Tests de contrato: validar `graph.json`, `symbols.json`, `manifest.json` y `facts/*` contra `docs/contracts/writer-artifacts-v1.md`.
- [x] Tests de determinismo: dos builds byte-idénticos salvo timestamps declarados.
- [x] Tests de frontera: ninguna escritura fuera de `outputDir`; sin red; sin ejecución de código del repo.
- [x] Harness de consumo en `test/consumers/`: lee el contrato como spec para los casos fresco, stale, ausente y esquema incompatible.
- [x] Smoke de rendimiento con 2.000 archivos sintéticos (< 5 s) y registro del resultado.
- [x] Ejecutar `npm test` y `npm run lint` en verde.

## Fase 10 — Documentación y distribución

- [x] Escribir `docs/contracts/writer-artifacts-v1.md` con layout, esquema, frescura, fallback y ejemplo de consumo.
- [x] Documentar en `README.md` instalación, comandos, contrato, límites, licencia y atribución.
- [x] Verificar `npm pack --dry-run`: incluye `src/`, `LICENSE`, `NOTICE`, `docs/` y `README.md`; no incluye tests ni fixtures.
- [x] Revisar checklist AGPL: licencia, avisos, fuente en tarball, aviso en CLI, sin restricciones adicionales.

## Fase 11 — Verificación final

- [x] Ejecutar `ancleto-writer init && ancleto-writer build` sobre un repo real y revisar los documentos generados.
- [x] Ejecutar `ancleto-writer check` sobre el mismo repo: exit `0`.
- [x] Modificar un archivo y confirmar exit `3`; restaurar y confirmar `0`.
- [x] Confirmar que un consumidor sin writer y otro con writer stale producen el mismo fallback.
- [x] Revisar que no existan `dependencies` en `package.json` y que el build funcione sin red (auditoría estática; `unshare -n` no permitido en este entorno).
- [ ] Cerrar el change con `ancleto-verify` y registrar la decisión de licencia en la memoria del repo (decisión registrada; archivado bloqueado por Fase 12 y el ruleset diferido).

## Fase 12 — Publicación en npm

- [ ] Reservar el nombre `@ancleto/writer` en npm (hoy disponible: 404) y confirmar el acceso al scope `@ancleto`; la reserva efectiva ocurre con la primera publicación.
- [ ] Configurar `NPM_TOKEN` como secret de GitHub Actions con permiso de publicación y 2FA/automation token (npm local sin autenticar: E401).
- [x] Crear `.github/workflows/publish.yml` disparado por tags `v*`: `npm ci`, `npm test`, `npm run lint`, `npm run build`, `npm publish --access public --provenance`.
- [x] Ejecutar `npm publish --dry-run` y revisar el tarball final (fuente, `LICENSE`, `NOTICE`, `README.md`, `docs/`).
- [ ] Publicar la primera versión `0.1.0` y crear el tag `v0.1.0` + GitHub Release.
- [ ] Verificar la ficha de npm: nombre, versión, licencia AGPL-3.0-only, README, repositorio y procedencia.
- [ ] Smoke post-publicación: `npx @ancleto/writer@0.1.0 --version` y `npm view @ancleto/writer`.
- [x] Documentar el proceso de release y rollback (`npm deprecate`) en `docs/releasing.md`.
- [x] Confirmar que el workflow no publica si faltan tests, lint o el build.
