# Analysis: Multi-language support

> Issue: [#9](https://github.com/AncletoCEO/Writer/issues/9)
> Change: `multi-language-support`
> Fecha: 2026-10-19

> **Corrección de alcance (2026-10-19):** Writer analiza el código del **proyecto del
> usuario**, no solo el repositorio de `@ancleto/spec`. La demanda de otros lenguajes no se
> puede inferir de que spec sea JS/TS; es una capacidad de producto y debe medirse. Las
> secciones de demanda, recomendación y decisión se actualizaron con este criterio.

## Pregunta

¿Qué lenguajes adicionales justifican el costo y cómo implementarlos sin romper cero
dependencias, rendimiento y mantenibilidad?

## Objetivo de producto: paridad de cobertura

El objetivo es alcanzar la **misma cobertura de lenguajes que ReadMenator** (19 lenguajes),
sin adoptar su implementación. La cobertura se logra con un **language pack opcional**; el
core JS/TS sigue siendo cero-deps.

Lenguajes objetivo: C, C++, Python, Go, Rust, JavaScript, TypeScript, Java, C#, Shell, PHP,
Dart, GDScript, Nim, Assembly, Ruby, Swift, Kotlin, Scala, Lua y Elixir.

Fases tentativas:

- **P0 (hecho):** JS/TS/JSX/TSX.
- **P1:** Python, Go, Rust, Java.
- **P2:** C#, C/C++, PHP, Ruby, Swift, Kotlin.
- **P3:** Shell, Dart, GDScript, Nim, Assembly, Lua, Elixir, Scala.

Cada lenguaje debe entregar: parser, resolución de imports, símbolos, llamadas/herencia donde
sea posible, tests, contrato y medición de cobertura. No se portan los 19 parsers de
ReadMenator.

## Evidencia relevada

### Estado actual de Writer

- `src/scan/scanner.js` solo reconoce `.js`, `.mjs`, `.cjs`, `.jsx`, `.ts` y `.tsx`.
- `src/parsers/lexer.js` (642 líneas) y `src/parsers/javascript.js` (857 líneas) son un
  lexer/parser propio específico de JS/TS.
- `src/resolve/imports.js` resuelve relativos, extensiones, `index.*`, `baseUrl` y `paths`
  de `tsconfig`/`jsconfig`; no conoce módulos de Python, Go, Rust o Java.
- `src/graph/build.js` llama directamente a `parseJavaScript`.
- `src/config/load.js` valida `languages` contra `['js', 'ts', 'jsx', 'tsx']`.
- El contrato usa `lang` como string (`js`, `ts`, `jsx`, `tsx`) y no tiene metadata de parser.
- Regla vigente: cero dependencias de runtime (`writer-zero-deps`).

### Baseline

- Smoke de 2.000 archivos JS: **~325 ms** (límite 5 s, muy holgado).
- Tamaño del paquete npm: **~50 KB** de tarball, **~181 KB** descomprimido.
- `@ancleto/spec` es un proyecto Node/JS, pero Writer se ejecuta sobre el proyecto del
  usuario, que puede ser políglota. La stack de spec **no** mide la demanda de otros
  lenguajes.
- No hay telemetría, encuestas ni un relevamiento de lenguajes en repos de usuarios. Esa es
  la evidencia que falta antes de priorizar el language pack.

### Metadata de dependencias candidatas

| Paquete | Versión | Unpacked |
|---|---:|---:|
| `tree-sitter` | 0.25.1 | ~4.45 MB |
| `web-tree-sitter` | 0.27.1 | ~4.69 MB |
| `tree-sitter-python` | 0.25.0 | ~7.51 MB |

Agregar un solo lenguaje con tree-sitter + gramática implica ~12 MB adicionales, sin contar
otras gramáticas ni posibles builds nativos. Eso multiplica por ~60 el tamaño actual del
paquete si se incluye en el core.

## Opciones

### A. Parsers propios por lenguaje (modelo ReadMenator)

- **Pros:** cero dependencias, control total, un solo runtime, misma calidad de contrato.
- **Contras:** cada lenguaje requiere lexer/parser/resolver propios; los 19 parsers de
  ReadMenator son semanas/meses de mantenimiento y tests; alto riesgo de incorrectitud;
  el código portado suma obligaciones AGPL.
- **Veredicto:** solo viable para 1-2 lenguajes con demanda comprobada y un contrato estable.

### B. Tree-sitter como peer/optional dependency

- **Pros:** cobertura amplia, gramáticas mantenidas por la comunidad, parsing robusto.
- **Contras:** rompe cero-deps si se instala en el core; ~12 MB por lenguaje; posible build
  nativo o WASM; versionado de gramáticas; supply chain adicional.
- **Veredicto:** la mejor opción **si** multi-lenguaje se vuelve requisito, pero como
  **paquete opcional** (`@ancleto/writer-languages` o peer), nunca en el core.

### C. Delegar a herramientas externas (ReadMenator, Semgrep, etc.)

- **Pros:** rápido de integrar, cobertura amplia, mantenimiento externo.
- **Contras:** dependencia de Python/otro runtime, licencias variables (ReadMenator es AGPL),
  adaptación de esquema, proceso externo, seguridad y UX.
- **Veredicto:** útil como integración puntual/diagnóstico, no como core de Writer.

### D. Quedarse en JS/TS

- **Pros:** cero deps, paquete pequeño, calidad y mantenimiento; cubre el ecosistema JS/TS.
- **Contras:** deja fuera proyectos de usuarios en Python, Go, Rust, Java, etc.; si el repo
  del usuario es mayoritariamente no-JS, Writer no aporta contexto.
- **Veredicto:** válido como **core actual**, pero no como respuesta definitiva al producto.

## Matriz de decisión

| Criterio | A. Parsers propios | B. Tree-sitter opcional | C. Herramienta externa | D. JS/TS |
|---|---|---|---|---|
| Demanda / objetivo | Paridad de cobertura con ReadMenator | Paridad de cobertura | Solo si una herramienta externa cubre el lenguaje | Alta en JS/TS; el resto queda fuera |
| Mantenimiento | Muy alto | Medio (gramáticas) | Bajo en Writer | Nulo |
| Cero deps del core | Sí | Sí, si es opcional | No | Sí |
| Tamaño | Bajo | ~12 MB por lenguaje | Depende del runtime | ~50 KB |
| Rendimiento | Bueno | Medio; medir WASM/nativo | Overhead de proceso | Muy bueno |
| Licencia | AGPL por código derivado | MIT/Apache en gramáticas | Variable | AGPL propio |
| Time to first language | Semanas | Días/semanas | Días | 0 |
| Riesgo principal | Correctitud y deuda | Packaging/supply chain | Runtime externo | Limitación de producto |

## Recomendación

1. **Mantener el core JS/TS y cero deps no significa descartar multi-lenguaje.** Writer
   analiza el código del proyecto del usuario; si ese proyecto es Python/Go/Rust/Java, la
   herramienta queda incompleta. Multi-lenguaje es una **capacidad de producto**, no un
   detalle de integración con spec.
2. **No portar los 19 parsers de ReadMenator.** El costo de mantenimiento y la deuda AGPL no
   se justifican.
3. **Medir antes de priorizar:**
   - agregar visibilidad de archivos no soportados (inventario por extensión/lenguaje) para
     que el usuario vea la cobertura real;
   - relevar lenguajes en repos de usuarios (issues, consultas, telemetría opt-in) y medir
     qué porcentaje del repo queda fuera.
4. Si se avanza, implementar un **language pack opcional** con tree-sitter como peer, en un
   paquete separado; el core sigue funcionando sin él. Prioridad tentativa:
   **Python → Go → Rust → Java**.
5. Ejecutar un **spike de 2-3 días** con Python antes de comprometer el language pack:
   - elegir `web-tree-sitter` (WASM, más portable) vs `tree-sitter` nativo;
   - medir archivos parseados, errores fatales, tiempo y tamaño instalado;
   - validar que el core sin adapter siga en cero deps.
6. **Decisión de producto:** perseguir paridad de cobertura con ReadMenator mediante un
   language pack opcional y fases. Aprobar primero la visibilidad de no soportados y el spike
   de Python; el language pack completo se planifica después del spike.

## Diseño futuro (condicionado)

```text
src/languages/
  registry.js        # detecta adapters instalados; JS/TS siempre presente
  adapter.js         # interface LanguageAdapter
  javascript/        # adapter actual (wrapper del parser existente)
```

Interface propuesta:

```js
// LanguageAdapter
{
  id: 'python',
  extensions: ['.py'],
  parse({ path, source }) -> { imports, symbols, calls, inheritance, unresolved },
  resolveImport(specifier, fromFileAbs, context) -> ResolveResult
}
```

- El core detecta adapters por un registro explícito; si no hay ninguno, solo JS/TS.
- El contrato se mantiene aditivo: `lang` sigue siendo string; si se agrega metadata de
  adapter, hacerlo en `schemaVersion: 2` con fallback para consumidores v1.
- El paquete opcional declara tree-sitter y gramáticas; el core no las importa.
- El resolver de cada lenguaje vive en su adapter; no se mezcla con `tsconfig`.

## Criterios de aceptación por lenguaje

Cada lenguaje del language pack debe cumplir:

- Parsear ≥95% de los archivos del corpus sin errores fatales.
- Resolver imports locales del lenguaje (o documentar la limitación).
- Extraer símbolos, clases/funciones y herencia cuando el lenguaje lo permita.
- No agregar dependencias al core; el pack es opcional.
- Mantener el build de 2.000 archivos del lenguaje por debajo de 2 s.
- Tamaño de instalación opcional <15 MB por lenguaje (o justificar).
- Tests de parser, resolución y determinismo.
- Documentar el contrato y los límites del lenguaje.

## Riesgos

- **Supply chain:** tree-sitter/gramáticas agregan superficie; mitigar con paquete opcional y
  versiones fijas.
- **Contrato:** lenguajes nuevos pueden requerir campos o semántica de resolución distinta;
  mitigar con adapter y schema v2 aditivo.
- **Rendimiento:** WASM/nativo puede degradar el build; medir antes de comprometer.
- **Mantenimiento:** cada gramática y resolución de imports suma tests; priorizar por demanda.
- **Licencias:** tree-sitter y gramáticas son permisivas; ReadMenator es AGPL; no portar su
  código sin decisión explícita.

## Decisión

**Objetivo: paridad de cobertura con ReadMenator (19 lenguajes), por fases.** Mantener el core
JS/TS con cero dependencias y construir un **language pack opcional** con tree-sitter como
peer. Empezar por visibilidad de lenguajes no soportados y un spike de Python; luego P1
(Python/Go/Rust/Java), P2 y P3. No portar los 19 parsers de ReadMenator ni romper el core sin
el pack.
