# Design: Self-describing output folder README

## Approach

Generar el README al final del pipeline, cuando ya se conocen los outputs publicados. Se
incluye en el mapa de salidas y en el manifest como un archivo más.

## Architecture

- `src/render/output-readme.js`: `renderOutputReadme({ outputs, config })` → string.
- `src/build/run.js`: agrega `README.md` al mapa de outputs antes del manifest.
- `src/config/load.js`: `outputReadme.enabled` (default `true`).
- `docs/contracts/writer-artifacts-v1.md`: agrega `README.md` al layout.
- `README.md`: documenta que el README del usuario no se toca.

## Contenido

- Qué es `@ancleto/writer`.
- Tabla de artefactos presentes (solo los que existen).
- Cómo regenerar (`ancleto-writer build`).
- Recordatorio de que el paquete es generado y AGPL-3.0-only.
- Link al contrato.

## Validation

- El README existe en `outputDir` después del build.
- Solo lista archivos presentes.
- No modifica el README del usuario (test de frontera).
- Se actualiza en cada build.
- Tests de render y de frontera.
