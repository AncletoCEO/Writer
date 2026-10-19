# Provenance — @ancleto/writer

Este documento registra qué partes de `@ancleto/writer` derivan de ReadMenator, con qué
commit y bajo qué licencia. Es la fuente de verdad para la auditoría de procedencia y debe
actualizarse en el mismo commit en que se crea o modifica un archivo derivado.

## Upstream

| Campo | Valor |
|---|---|
| Proyecto | ReadMenator |
| Repositorio | https://github.com/grisuno/ReadMenator |
| Autor | Gris Iscomeback (GitHub: grisun0 / grisuno) |
| Licencia | GNU Affero General Public License v3.0 (AGPL-3.0) |
| Commit | `dac48f868722620f0d01dac0d33102c5a514c03c` |
| Fecha del commit | 2026-10-15 |
| Versión en el commit | 1.6.0 (`pyproject.toml`; `version.json` reporta 1.5.0) |
| Fecha de preparación del port | 2026-10-19 |

El texto completo de la licencia está en `LICENSE`. La atribución y las superficies
excluidas están en `NOTICE`.

## Mapa de port

Estado: `pendiente` = todavía no existe en este repositorio; `portado` = archivo creado con
cabecera SPDX; `propio` = implementación original sin código copiado.

### Núcleo que se puede portar

| Módulo ReadMenator | Destino en @ancleto/writer | Estado |
|---|---|---|
| `readmenator/_scanner.py` | `src/scan/scanner.js` | portado |
| `readmenator/parsers/_base.py` | `src/parsers/lexer.js` | portado |
| `readmenator/parsers/_javascript.py` | `src/parsers/javascript.js` | portado |
| `readmenator/_resolver.py` | `src/resolve/imports.js` | portado |
| `readmenator/_models.py` | `src/graph/build.js` (modelo de nodos/aristas) | portado |
| `readmenator/_analyzer.py` (solo métricas deterministas) | `src/metrics/cycles.js`, `src/metrics/pagerank.js`, `src/metrics/blast-radius.js` | portado |
| `readmenator/_hotspots.py` | `src/metrics/hotspots.js` | portado |
| `readmenator/_layers.py` | `src/metrics/layers.js` | portado |
| `readmenator/_layer_rules.py` | `src/metrics/layers.js` | portado |
| `readmenator/_rank.py` (solo PageRank) | `src/metrics/pagerank.js` | portado |
| `readmenator/_mermaid.py` | `src/render/mermaid.js` | pendiente |
| `readmenator/_documentation.py` (solo Markdown de arquitectura) | `src/render/markdown.js` | pendiente |
| `readmenator/_exporter.py` (solo JSON) | `src/facts/build.js`, `src/contract/*` | pendiente |
| `readmenator/_gitmeta.py` | `src/scan/git.js` | portado |
| `readmenator/_exclusions.py` | `src/config/load.js`, `src/config/glob.js` | portado |

### Referencia conceptual, sin copia de código

Estos módulos se leen solo para entender el comportamiento esperado. La implementación en
JavaScript es propia y no reutiliza expresión, estructura ni comentarios:

| Módulo ReadMenator | Concepto reutilizado | Destino |
|---|---|---|
| `readmenator/_config.py` | defaults y límites | `src/config/load.js` |
| `readmenator/_pipeline.py` | orden del pipeline | `src/cli/commands/build.js` |
| `readmenator/_app.py` | orquestación CLI | `src/cli/index.js` |
| `readmenator/__main__.py` | superficie de comandos | `src/cli/commands/*` |

### Superficies excluidas (no se copian)

- `_forcegraph.py`, `_forcegraph_page.py`, `_bundlegraph.py`, `_bundlegraph_page.py`
- `_explorer.py`, `_graphlayout.py`, `_viewer_ui.py`
- `_flowcharts.py`, `_flowlayout.py`, `_flowpage.py`
- `_diagrams.py`, `_components.py`, `_uml.py`
- `_apidocs.py`, `_apidocs_page.py`, `_apidocs_render.py`
- `_graphrag.py`, `_query.py`, `_explain.py`, `_concepts.py`, `_cpg.py`, `_dataflow.py`
- `_gh_wiki.py`, `_wiki.py`, `_sourceview.py`, `_symindex.py`
- `_memory.py`, `_skill_installer.py`, `_agent_injector.py`, `_agent_output.py`
- `_cursorrules_generator.py`, `_rule_gen.py`, `_refactorizer.py`, `_dead_code.py`
- `_readme_injector.py`, `_folder_readme.py`, `_purpose.py`, `_docstrings.py`
- `_ollama.py`, `_video.py`, `_analytics.py`, `_embed.py`, `_htmlpack.py`
- `_mcp_server.py`, `_watcher.py`, `_cache.py`, `_taint.py`, `_security.py`
- `_sarif.py`, `_linter.py`, `_category.py`, `_projections.py`, `_provenance.py`
- `_pytypes.py`, `_scantext.py`, `_project_config.py`, `_vendor/`, `_skills/`

La lista completa de superficies excluidas y el motivo están en `NOTICE`.

## Cabecera obligatoria

Todo archivo derivado de ReadMenator debe comenzar con:

```text
// SPDX-License-Identifier: AGPL-3.0-only
// Derived from ReadMenator <module> (commit dac48f868722620f0d01dac0d33102c5a514c03c),
// modified 2026-10-19 by AncletoCEO.
```

Reglas:

- `<module>` es la ruta upstream exacta, por ejemplo `readmenator/_scanner.py`.
- La fecha se actualiza en cada modificación sustancial posterior.
- Si un archivo combina código derivado y propio, la cabecera se mantiene y el encabezado
  del archivo debe indicar qué partes son derivadas.
- Los archivos propios no requieren la línea `Derived from`, pero todo el repositorio se
  distribuye bajo AGPL-3.0-only.

## Verificación

`scripts/check-provenance.js` audita este contrato:

- Falla si un archivo listado en `DERIVED_FILES` no existe.
- Falla si un archivo derivado no tiene la cabecera SPDX y la referencia al upstream.
- Falla si un archivo bajo `src/` menciona `ReadMenator` sin la cabecera.
- Falla si aparece un archivo dentro de las superficies excluidas.

Se ejecuta con:

```bash
node scripts/check-provenance.js
```

La lista `DERIVED_FILES` de `scripts/check-provenance.js` se mantiene en sincronía con los
archivos portados. Al 2026-10-19 están portados el scanner, la configuración, el acceso
read-only a git y el lexer/parser de JavaScript/TypeScript (Fases 2 y 3).
