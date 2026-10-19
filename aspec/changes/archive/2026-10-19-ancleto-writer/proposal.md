# Proposal: @ancleto/writer — motor de conocimiento estático para @ancleto/spec

## Problem

`@ancleto/spec` resuelve la orquestación SDD, la memoria de decisiones y el seed técnico, pero su conocimiento estructural del repositorio es limitado y costoso:

- El **discovery** actual produce una topología por directorios (`.discovery-map.json`) y empaqueta el repositorio completo con Repomix. No hay grafo de imports, símbolos, llamadas ni herencia.
- El **affected-set** calcula la clausura de dependientes con expresiones regulares sobre `.js/.mjs/.cjs/.ts/.tsx`. Es determinista, pero no resuelve alias, no distingue tipos de arista y no conoce llamadas ni herencia.
- El **technical seed** se genera con un LLM a partir del pack de Repomix: cada regeneración consume tokens y vuelve a descubrir hechos que son estáticos y medibles.
- No existe una fuente determinista para ciclos, capas arquitectónicas, hotspots, PageRank, blast radius o inventario de símbolos que `review`, `verify` y `propose` puedan consultar sin volver a leer el repositorio.

ReadMenator demuestra que ese conocimiento se puede producir offline, sin LLM y en segundos, pero su implementación es Python, cubre 19 lenguajes y ~44.500 líneas, y está licenciada AGPL-3.0. No es un complemento natural para una CLI Node ≥ 24 con cero dependencias de runtime.

Falta un paquete standalone, instalable aparte, que produzca hechos deterministas en un contrato estable y que `@ancleto/spec` pueda consumir de forma **opcional y con fallback**, sin romper su promesa de cero dependencias.

## Proposed change

Crear `@ancleto/writer` como paquete npm independiente y CLI (`ancleto-writer`) que escanea un repositorio, construye un grafo de código y escribe hechos deterministas en `.ancleto/writer/`, un directorio que `@ancleto/spec` consume cuando está presente y fresco.

El paquete se distribuye bajo **AGPL-3.0-only**, con repositorio público, `LICENSE`, `NOTICE`, avisos de modificación y atribución explícita a ReadMenator. El núcleo portado se limita al análisis estático; las capas visuales, GraphRAG y video quedan fuera del MVP.

El contrato entre ambos paquetes es versionado y desacoplado:

```
.ancleto/writer/
  manifest.json        # schemaVersion, writerVersion, gitCommit, fingerprint, generatedAt, stats
  graph.json           # nodes + edges (imports, calls, inherits)
  symbols.json         # símbolos por archivo con file:line
  facts/
    cycles.json
    layers.json
    hotspots.json
    blast-radius.json
    inventory.md
  agent/
    INDEX.md
    SYMBOLS.md
    GOTCHAS.md
    ARCHITECTURE.md
```

Reglas de convivencia:

- `ancleto-writer` es la única fuente de verdad del grafo; `@ancleto/spec` conserva la propiedad de specs, changes y `memory.db`.
- Writer nunca escribe en `aspec/`, en `docs/technical-discovery/` ni en `memory.db`. Puede leer `memory.db` en modo read-only para enriquecer `GOTCHAS`.
- Si writer no está instalado, está desactualizado o el `schemaVersion` no coincide, `@ancleto/spec` opera exactamente como hoy.
- La integración del lado de `@ancleto/spec` (consumo del contrato en `discovery`, `affected-set`, `technical-discovery`, `review` y `verify`) se implementa como change separado en ese repositorio, gobernado por el contrato definido acá.

Alcance funcional del MVP:

1. Scanner seguro con exclusiones compartidas (`.ancletorc` → `discovery.exclude`) y límites de tamaño/profundidad.
2. Lexer/parser propio para JavaScript, TypeScript, JSX y TSX, sin dependencias de runtime.
3. Aristas de imports estáticos, dinámicos con literal, `require` y `export ... from`; aristas de llamadas intra-archivo y de herencia.
4. Resolución de imports relativos y de alias declarados en `tsconfig.json`/`jsconfig.json`.
5. Métricas: fan-in/fan-out, ciclos (Tarjan), PageRank, capas heurísticas, hotspots y blast radius transitivo.
6. Salidas JSON estables y documentación Markdown accionable (`INDEX`, `SYMBOLS`, `GOTCHAS`, `ARCHITECTURE`) con diagramas Mermaid.
7. `manifest.json` con frescura verificable: commit, fingerprint del contenido y versión de esquema.
8. CLI mínima: `build`, `check`, `init`, `doctor`.
9. Cumplimiento AGPL completo: licencia, avisos, atribución, fuente en npm y GitHub, avisos legales en `--version`/`--help`.

## Scope

In scope:

- Scaffold del paquete `@ancleto/writer` (ESM, Node ≥ 24, cero dependencias de runtime, binario `ancleto-writer`).
- Contrato `.ancleto/writer/` con `schemaVersion: 1` y validación de frescura.
- Scanner, lexer y resolución de imports para JS/TS/JSX/TSX.
- Grafo de archivos, símbolos, imports, llamadas intra-archivo y herencia.
- Métricas deterministas: fan-in/out, ciclos, PageRank, capas, hotspots y blast radius.
- Salidas JSON + Markdown + Mermaid, sin HTML interactivo.
- Configuración `.ancleto-writer.json`, con herencia de exclusiones desde `.ancletorc`.
- Lectura opcional read-only de `.ancleto/memory.db` para enriquecer `GOTCHAS`.
- Tests de contrato, conformidad del parser y rendimiento básico en monorepos.
- CI y publicación npm con tag `v*`.
- Documentación de licencia y provenance del port (`NOTICE`, mapa de módulos portados).

Out of scope:

- Soporte de lenguajes fuera de JS/TS/JSX/TSX en el MVP (Python, Go, Rust, Java, etc.).
- Visores vis.js 2D/3D, edge bundling, mapas de fuerza, video, GraphRAG, wiki de GitHub, Obsidian, GraphML, SVG, Sphinx/Doxygen, MCP server y stubs multi-lenguaje.
- Inyección automática de links en el README del usuario.
- Escritura o migración de `memory.db`; inserción automática de reglas o decisiones.
- Modificación del código de `@ancleto/spec` en este change.
- Servicio hospedado o API de red.
- Relectura del código de ReadMenator para una futura reescritura clean-room: este change asume AGPL para el núcleo portado.
- Compatibilidad con otros IDEs más allá de la CLI.

## Risks

- **Fricción de adopción por AGPL**: muchas empresas prohíben AGPL. Mitigación: writer es opcional y local, `@ancleto/spec` sigue MIT y funciona sin él; documentar la licencia en el README y en la salida de `--version`.
- **Incumplimiento AGPL por atribución insuficiente**: decir "basado en ReadMenator" no alcanza. Mitigación: `LICENSE` AGPL-3.0-only, `NOTICE` con upstream y commit, avisos por archivo derivado, fuente completa en el tarball y en el tag de GitHub, avisos legales en la CLI.
- **Puerta de una sola dirección**: una vez portado código AGPL, no se puede relicenciar el paquete a MIT sin reescribir esos archivos y obtener permiso de los contribuyentes. Mitigación: decidir AGPL explícitamente ahora y aislar el núcleo portado del código propio para facilitar una futura reescritura.
- **Scope creep hacia paridad con ReadMenator**: 19 lenguajes y visualizaciones son meses. Mitigación: frontera dura del MVP y fases posteriores con changes propios.
- **Divergencia entre dos motores de grafo**: `affected-set` y writer pueden producir resultados distintos. Mitigación: writer es la fuente preferida; spec mantiene el motor actual como fallback y se agregan tests de contrato entre ambos.
- **Contaminación AGPL de los repos de usuarios**: plantillas HTML/JS copiadas obligarían a licenciar archivos generados. Mitigación: en v1 solo JSON, Markdown y Mermaid propios.
- **Precisión del parser JS/TS sin dependencias**: un lexer propio no cubre todos los casos de TypeScript. Mitigación: marcar aristas con confianza (`extracted`/`inferred`), documentar formas no soportadas y mantener una suite de conformidad.
- **Rendimiento en monorepos**: escanear todo puede ser costoso. Mitigación: exclusiones, límites de tamaño/profundidad, caché por hash de contenido y modo incremental en una fase posterior.
- **Frescura y compatibilidad del contrato**: un manifest viejo o un esquema distinto produciría contexto incorrecto. Mitigación: `manifest.json` con `schemaVersion`, `gitCommit` y fingerprint; spec ignora writer si no coincide.
- **Nombre npm y descubrimiento**: `@ancleto/writer` está libre hoy, pero puede cambiar. Mitigación: reservar/publicar temprano y documentar el binario `ancleto-writer`.
- **Doble fuente de reglas y decisiones**: writer podría tentar a duplicar `memory.db`. Mitigación: leerla solo en modo read-only y emitir sugerencias, nunca escribirla.
