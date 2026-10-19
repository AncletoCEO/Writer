# Analysis: Multi-language support

> Issue: [#9](https://github.com/AncletoCEO/Writer/issues/9)
> Change: `multi-language-support`
> Fecha: 2026-10-19

## Pregunta

¿Qué lenguajes adicionales justifican el costo y cómo implementarlos sin romper cero
dependencias, rendimiento y mantenibilidad?

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
- `@ancleto/spec` es un proyecto Node/JS; no hay evidencia de usuarios que necesiten
  analizar repos Python/Go/Rust/Java hoy.

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

- **Pros:** alineado con `@ancleto/spec`, cero deps, paquete pequeño, calidad y mantenimiento.
- **Contras:** no analiza repos políglotas.
- **Veredicto:** opción recomendada para el estado actual del producto.

## Matriz de decisión

| Criterio | A. Parsers propios | B. Tree-sitter opcional | C. Herramienta externa | D. JS/TS |
|---|---|---|---|---|
| Demanda actual | Baja | Baja | Baja | Alta (spec es JS/TS) |
| Mantenimiento | Muy alto | Medio (gramáticas) | Bajo en Writer | Nulo |
| Cero deps del core | Sí | Sí, si es opcional | No | Sí |
| Tamaño | Bajo | ~12 MB por lenguaje | Depende del runtime | ~50 KB |
| Rendimiento | Bueno | Medio; medir WASM/nativo | Overhead de proceso | Muy bueno |
| Licencia | AGPL por código derivado | MIT/Apache en gramáticas | Variable | AGPL propio |
| Time to first language | Semanas | Días/semanas | Días | 0 |
| Riesgo principal | Correctitud y deuda | Packaging/supply chain | Runtime externo | Limitación de producto |

## Recomendación

1. **No implementar multi-lenguaje en el core ahora.** Mantener JS/TS y la promesa de cero
   dependencias.
2. **No portar los 19 parsers de ReadMenator.** El costo de mantenimiento y la deuda AGPL no
   se justifican sin demanda.
3. Si aparece demanda, implementar un **adapter opcional** con tree-sitter como peer, en un
   paquete separado. El core debe seguir funcionando sin ese paquete.
4. Prioridad tentativa si se aprueba: **Python → Go → Rust → Java**. Python primero por
   volumen de usuarios; Go/Rust por adopción en tooling.
5. Antes de comprometer el adapter, ejecutar un **spike de 2-3 días** con Python:
   - elegir `web-tree-sitter` (WASM, más portable) vs `tree-sitter` nativo;
   - medir archivos parseados, errores fatales, tiempo y tamaño instalado;
   - validar que el core sin adapter siga en cero deps.

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

## Criterios para revisar la decisión

Reabrir la implementación solo si se cumple al menos uno:

- 3+ pedidos concretos de usuarios de `@ancleto/spec` para un lenguaje específico.
- Un repo objetivo de spec que sea mayoritariamente no-JS.
- Un spike de Python que parsee ≥95% de archivos sin errores fatales, en <2 s para 2.000
  archivos, con core intacto y <15 MB de instalación opcional.

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

**Diferir multi-lenguaje.** Mantener JS/TS en el core y dejar preparado el boundary de
adapters. No se crea change de implementación hasta que se cumplan los criterios de revisión.
