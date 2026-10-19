#!/usr/bin/env bash
# Configura la gobernanza de ramas de @ancleto/writer:
#   - develop como rama default
#   - main protegida: solo PRs, sin push directo, sin force push, sin borrado
#   - check requerido: pr-source-guard (solo PRs desde develop)
#
# Requiere una cuenta con permiso admin sobre el repositorio.
# Uso: REPO=AncletoCEO/Writer ./scripts/setup-branch-protection.sh

set -euo pipefail

REPO="${REPO:-AncletoCEO/Writer}"
RULESET_NAME="main-pr-only-from-develop"
CHECK_CONTEXT="pr-source-guard"

if ! command -v gh >/dev/null 2>&1; then
  echo "ERROR: falta gh (GitHub CLI)." >&2
  exit 1
fi

if ! gh auth status >/dev/null 2>&1; then
  echo "ERROR: gh no está autenticado." >&2
  exit 1
fi

ADMIN=$(gh api "repos/$REPO" --jq '.permissions.admin')
if [ "$ADMIN" != "true" ]; then
  echo "ERROR: la cuenta autenticada no tiene permiso admin sobre $REPO." >&2
  echo "Pedí acceso admin o ejecutá este script con una cuenta admin." >&2
  exit 1
fi

if ! gh api "repos/$REPO/git/ref/heads/main" >/dev/null 2>&1; then
  echo "ERROR: main no existe todavía." >&2
  echo "Hacé el commit inicial y pusheá main antes de correr este script." >&2
  exit 1
fi

if ! gh api "repos/$REPO/git/ref/heads/develop" >/dev/null 2>&1; then
  MAIN_SHA=$(gh api "repos/$REPO/git/ref/heads/main" --jq '.object.sha')
  gh api -X POST "repos/$REPO/git/refs" \
    -f ref="refs/heads/develop" \
    -f sha="$MAIN_SHA" >/dev/null
  echo "develop creada desde main ($MAIN_SHA)"
fi

gh api -X PATCH "repos/$REPO" -f default_branch=develop >/dev/null
echo "rama default: develop"

PAYLOAD=$(cat <<'JSON'
{
  "name": "main-pr-only-from-develop",
  "target": "branch",
  "enforcement": "active",
  "bypass_actors": [],
  "conditions": {
    "ref_name": {
      "include": ["refs/heads/main"],
      "exclude": []
    }
  },
  "rules": [
    { "type": "deletion" },
    { "type": "non_fast_forward" },
    {
      "type": "pull_request",
      "parameters": {
        "required_approving_review_count": 0,
        "dismiss_stale_reviews_on_push": true,
        "require_code_owner_review": false,
        "require_last_push_approval": false,
        "required_review_thread_resolution": true
      }
    },
    {
      "type": "required_status_checks",
      "parameters": {
        "strict_required_status_checks_policy": true,
        "required_status_checks": [
          { "context": "pr-source-guard" }
        ]
      }
    }
  ]
}
JSON
)

RULESET_ID=$(gh api "repos/$REPO/rulesets" \
  --jq "first(.[] | select(.name == \"$RULESET_NAME\") | .id) // empty")

if [ -n "$RULESET_ID" ]; then
  gh api -X PUT "repos/$REPO/rulesets/$RULESET_ID" --input - <<<"$PAYLOAD" >/dev/null
  echo "ruleset actualizado: $RULESET_NAME (id $RULESET_ID)"
else
  gh api -X POST "repos/$REPO/rulesets" --input - <<<"$PAYLOAD" >/dev/null
  echo "ruleset creado: $RULESET_NAME"
fi

if ! gh api "repos/$REPO/contents/.github/workflows/pr-source-guard.yml?ref=main" >/dev/null 2>&1; then
  echo "AVISO: el workflow $CHECK_CONTEXT todavía no está en main." >&2
  echo "Mergeá primero el workflow; hasta entonces el check requerido no corre y los PRs a main quedan bloqueados." >&2
fi

echo "OK: $REPO queda con main solo por PR desde develop."
