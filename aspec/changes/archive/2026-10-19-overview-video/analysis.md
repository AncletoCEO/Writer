# Analysis: Overview video generation

> Issue: [#21](https://github.com/AncletoCEO/Writer/issues/21)
> Change: `overview-video`
> Fecha: 2026-10-19

## Pregunta

¿Tiene sentido que Writer genere un video de overview del repo?

## Evidencia

- Writer produce JSON/Markdown/Mermaid para agentes y humanos.
- No hay pipeline de render, frames, audio ni edición.
- ReadMenator genera un video synthwave de marketing/demostración; no es contexto para
  agentes.
- Un video agrega dependencias de render, assets, música y mantenimiento.

## Opciones

### A. No implementar

- Mantener el foco en datos deterministas.

### B. Script externo opcional

- Un script que consuma `graph.json` y genere frames; fuera del paquete/core.

### C. Integrar ReadMenator

- Acopla a Python/AGPL y a su pipeline de video.

### D. Generar frames/HTML y dejar el render al usuario

- Menos dependencias, pero igual requiere diseño de escenas y assets.

## Recomendación

**A.** No generar video en Writer. Es una feature de marketing, no de contexto, y desvía del
core. Si se necesita, un script externo puede consumir `graph.json`; no debe vivir en el
paquete.

## Criterios para revisar

- Objetivo de marketing con presupuesto y responsable.
- Un script externo que no agregue dependencias al core.

## Decisión

No implementar video. Mantener `graph.json` como fuente para cualquier herramienta externa.
