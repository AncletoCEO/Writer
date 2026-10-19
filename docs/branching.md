# Branching y protección de `main`

## Estado actual (2026-10-19)

El enforcement server-side está **diferido al final del proyecto**. Mientras tanto:

- El equipo integra directamente en `develop` (rama de trabajo).
- `main` recibe únicamente PRs de release desde `develop`, por convención.
- El workflow `pr-source-guard` ya está en `main`, pero no bloquea merges hasta que se
  aplique el ruleset.
- `scripts/setup-branch-protection.sh` queda listo para ejecutarse cuando haya una cuenta
  admin disponible.

## Modelo de ramas

| Rama | Rol | Protección |
|---|---|---|
| `main` | Releases estables | Solo PR desde `develop`; sin push directo, force push ni borrado |
| `develop` | Integración; rama default | Push directo permitido al equipo |
| `feature/*`, `fix/*`, `chore/*` | Trabajo diario | PR hacia `develop` |

```text
feature/x ──PR──▶ develop ──PR (solo develop)──▶ main
fix/y     ──PR──▶ develop
chore/z   ──PR──▶ develop
```

Reglas:

- Ningún cambio llega a `main` sin pasar por un PR cuyo origen sea `develop`.
- `develop` es la rama default: los PRs de contribución apuntan ahí, no a `main`.
- Un release es un PR `develop → main`. No se crean ramas `release/*` en el MVP.
- `main` no acepta force push ni borrado.

## Capas de enforcement

### 1. Ruleset de GitHub

`scripts/setup-branch-protection.sh` crea o actualiza el ruleset
`main-pr-only-from-develop` con estas reglas sobre `refs/heads/main`:

- `pull_request`: todo cambio entra por PR.
- `required_status_checks`: exige `pr-source-guard` y que la rama esté actualizada.
- `non_fast_forward`: bloquea force push.
- `deletion`: bloquea el borrado de `main`.
- `bypass_actors: []`: sin bypass configurado.

Además, el script crea `develop` desde `main` si no existe y la marca como rama default.

### 2. Workflow `pr-source-guard`

`.github/workflows/pr-source-guard.yml` corre con `pull_request_target` sobre PRs que
apuntan a `main`. No hace checkout del código del PR. Si `github.event.pull_request.head.ref`
no es exactamente `develop`, el job falla y el check requerido bloquea el merge.

Esto cubre lo que el ruleset no puede expresar por sí solo: **restringir la rama de origen**.

### 3. Regla local opcional

Cada integrante puede evitar pushes accidentales a `main` con:

```bash
git config --local branch.main.pushRemote no_push
```

No es enforcement real: se puede omitir. La garantía está en GitHub.

## Configuración inicial (cuando se active el enforcement)

Requiere una cuenta con permiso **admin** sobre el repositorio:

```bash
REPO=AncletoCEO/Writer ./scripts/setup-branch-protection.sh
```

Orden recomendado:

1. Commit inicial en `main` y push de `main`.
2. Push del workflow `pr-source-guard.yml` a `main` (o mergearlo desde `develop`).
3. Crear `develop` desde `main`.
4. Ejecutar el script de ruleset.
5. Verificar en GitHub → Settings → Rules → Rulesets.

Si el ruleset se aplica antes de que el workflow exista en `main`, los PRs a `main`
quedarán bloqueados porque el check requerido nunca corre. El script emite un aviso en ese
caso.

## Flujo diario

```bash
git switch develop
git pull --ff-only

git switch -c feature/mi-cambio
# ... commits ...
git push -u origin feature/mi-cambio
gh pr create --base develop

# release
gh pr create --base main --head develop \
  --title "release: vX.Y.Z" \
  --body "Release desde develop"
```

## Ajustes

- **Revisión obligatoria:** el script deja `required_approving_review_count: 0` para no
  bloquear equipos de una sola persona. Para exigir una aprobación, cambiar ese valor a
  `1` en el payload del script y volver a ejecutarlo.
- **Más checks requeridos:** agregar contextos al array `required_status_checks` cuando
  existan los workflows de test y lint.
- **Administradores:** el ruleset no declara bypass. Si se necesita una excepción de
  emergencia, agregarla explícitamente en `bypass_actors` y documentarla.
