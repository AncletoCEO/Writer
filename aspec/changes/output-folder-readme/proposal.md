# Proposal: Self-describing output folder README

> Issue: [#25](https://github.com/AncletoCEO/Writer/issues/25)
> Analysis: [`aspec/changes/readme-injection-folders/analysis.md`](../readme-injection-folders/analysis.md)
> Tipo: implementation

## Problem

El paquete `.ancleto/writer/` tiene muchos artefactos, pero no se explica a sí mismo. El
análisis #25 recomendó mantener la regla de no tocar el README del usuario y agregar un
README **dentro** de `outputDir`.

## Proposed change

- Generar `README.md` dentro de `outputDir`.
- Explicar qué es cada artefacto, cómo regenerarlo y la licencia.
- Listar solo los archivos que existen en el paquete.
- No tocar el README del usuario ni generar READMEs fuera de `outputDir`.
- Config `outputReadme: { enabled: true }`.

## Scope

In scope: README autodescriptivo dentro de `outputDir`, contrato, README del proyecto y tests.
Out of scope: inyección en el README del usuario, READMEs por carpeta del proyecto y links
automáticos.

## Risks

- **Archivos desactualizados:** el README se genera en cada build y solo lista salidas reales.
- **Confusión con el README del usuario:** el archivo vive en `outputDir` y lo aclara.
- **Ruido en el tarball:** el README es parte del paquete, no del repo del usuario.
