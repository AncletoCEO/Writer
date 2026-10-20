# Design: Human-compatible report command

## Architecture

```text
src/human/report.js          # lee el paquete, proyecta datos y renderiza
src/cli/commands/human.js    # flags, validación y salida CLI
src/render/mermaid.js        # reutilizado para grafos acotados
src/render/uml.js            # reutilizado sobre un subgrafo de clases
```

El comando no usa `analyzeRepository`: lee `manifest.json`, `graph.json` y `facts/*` del
`outputDir`. Es una proyección de solo lectura del paquete ya publicado.

## Salida

```text
outputDir/
└── human/
    ├── OVERVIEW.md
    ├── ARCHITECTURE.md
    └── data.json
```

`human/` queda fuera del manifest v1: es derivado, opcional y regenerable. Los consumidores de
agentes lo ignoran. La publicación del comando es atómica a nivel de directorio (temp + swap).

## Límites

Defaults:

- `top: 20` para listas y tablas.
- `maxClasses: 20` para el UML.
- `maxNodes: 30` para imports y ciclos.
- `maxCommunities: 6`.

Todos configurables por flags. Los diagramas se omiten si el ciclo supera `maxNodes`; en ese
caso se muestra una tabla.

## OVERVIEW.md

- resumen del paquete (versión, archivos, símbolos, aristas);
- tabla por lenguaje (archivos, líneas, símbolos);
- top god nodes y hotspots;
- top comunidades;
- ciclos principales;
- candidatos a huérfanos;
- imports no resueltos agrupados por motivo;
- lenguajes no soportados;
- cobertura de documentación;
- próximos pasos deterministas.

## ARCHITECTURE.md

- capas + Mermaid de capas;
- top comunidades + Mermaid acotado;
- UML acotado: selecciona clases/interfaces por pageRank del archivo, fan-in y exportación;
  incluye métodos y aristas de herencia entre las clases seleccionadas;
- top imports + Mermaid;
- primer ciclo si entra en `maxNodes`.

## data.json

Datos curados y deterministas: totales, lenguajes, god nodes, hotspots, comunidades, ciclos,
huérfanos, unresolved, unsupported, doc coverage y límites usados. Sin timestamps ni rutas
absolutas.

## Determinismo

- Orden estable por score/path/línea.
- Sin `generatedAt` en los artefactos humanos.
- Dos ejecuciones sobre el mismo paquete producen byte-idénticos los tres archivos.

## Frontera

- Solo escribe dentro de `outputDir/human`.
- No toca el manifest ni los artefactos de agentes.
- No ejecuta código del repo analizado.
- No requiere red ni nuevas dependencias.

## Validación

- Fixture mixto: build + human, artefactos y secciones.
- Determinismo byte a byte.
- Límites (`--top`, UML, imports).
- Paquete ausente: error claro.
- Repo real grande: salida acotada y sin rutas absolutas.
