# Proposal: Python language adapter spike

> Issue: [#9](https://github.com/AncletoCEO/Writer/issues/9)
> Analysis: [`aspec/changes/multi-language-support/analysis.md`](../multi-language-support/analysis.md)
> Tipo: implementation (spike, sin comportamiento de producción)

## Problem

El análisis #9 recomendó aprobar un spike de Python antes de comprometer un language pack
multi-lenguaje. Hoy Writer solo analiza JS/TS y no hay evidencia de calidad, rendimiento ni
tamaño para un adapter basado en tree-sitter.

## Proposed change

Ejecutar un **spike acotado** para evaluar un adapter de Python:

- Comparar `web-tree-sitter` (WASM) vs `tree-sitter` nativo.
- Parsear un corpus de repos Python reales (fixtures locales).
- Medir archivos parseados, errores fatales, tiempo y tamaño instalado.
- Verificar que el core de Writer siga sin dependencias y funcione sin el adapter.
- Entregar `spike-report.md` con la recomendación y una decisión go/no-go.

## Scope

In scope: prototipo descartable, mediciones, reporte y decisión.
Out of scope: merge a producción, contrato multi-lenguaje, language pack publicado y parsers
para otros lenguajes.

## Risks

- **Supply chain:** tree-sitter/gramáticas agregan dependencias; el spike no se mergea.
- **Build nativo:** puede fallar en Node 24; comparar con WASM.
- **Falsos positivos de parsing:** medir errores y cobertura, no solo “funciona en un archivo”.
- **Sesgo de fixture:** usar repos Python variados y un corpus sintético.

## Nota sobre specs

No se crean delta specs: el spike no especifica comportamiento de producción. La decisión y
los umbrales quedan en `spike-report.md` y en la memoria del proyecto.
