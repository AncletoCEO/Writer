# Analysis: Dead code and orphan symbols

> Issue: [#10](https://github.com/AncletoCEO/Writer/issues/10)
> Change: `dead-code-orphan-symbols`
> Fecha: 2026-10-19

## Pregunta

¿Se puede detectar código muerto en JS/TS con suficiente precisión para que sea útil en
`review`, sin generar una lluvia de falsos positivos?

## Evidencia relevada

### Qué tiene Writer hoy

- Grafo de archivos con `fanIn`/`fanOut` y aristas `import`, `call` e `inherits`.
- Llamadas **intra-archivo** solamente.
- `facts/unresolved.json` para imports que no resuelven.
- No hay índice de referencias de símbolos ni resolución cross-file.
- No hay `facts/dead-code.json`.

### Prototipo sobre los grafos reales

Se usaron los `graph.json` ya generados para Writer y para una copia de `spec`:

| Repo | Archivos | Archivos con fan-in 0 | Símbolos no exportados sin inbound | Ejemplos |
|---|---:|---:|---:|---|
| Writer | 86 | 39 | 11 | `escapeCell`, `label`, `stripFile`, constructores |
| spec | 25 | 12 | 39 | `escapeRe`, `fmtCost`, `walk`, callbacks de UI |

**Lectura:**

- Los archivos con fan-in 0 son casi todos tests, scripts, configuración o entrypoints
  (`src/cli/index.js`, `eslint.config.js`, `scripts/*`, `test/*`). Con exclusiones, el
  conjunto de candidatos reales se reduce mucho.
- Los símbolos "sin inbound" son **mayormente falsos positivos**: el parser actual no
  registra llamadas dentro de template literals, JSX, callbacks, `new` ni acceso por miembro.
  Por ejemplo, `escapeCell` se usa dentro de un template literal y aparece como huérfano.

## Definición operativa

### Archivo huérfano (viable)

Archivo sin ninguna arista `import` entrante, que además:

- no es entrypoint (`package.json` → `bin`, `main`, `module`, `exports`);
- no es test (`test/`, `tests/`, `*.test.*`, `*.spec.*`);
- no es config (`*.config.*`, `tsconfig*.json`, `eslint.config.*`, etc.);
- no vive en `scripts/`, `migrations/` ni directorios declarados como entrypoints;
- no es target de un dynamic import no literal (si lo es, baja la confianza).

Salida propuesta:

```json
{
  "schemaVersion": 1,
  "orphanFiles": [
    {
      "path": "src/feature/legacy.js",
      "reason": "no-inbound-imports",
      "confidence": "medium"
    }
  ],
  "excluded": [
    { "path": "src/cli/index.js", "reason": "entrypoint:bin" },
    { "path": "test/a.test.js", "reason": "test" }
  ],
  "dynamicImports": true
}
```

`confidence` sería `medium` cuando no hay dynamic imports ni unresolved, y `low` cuando el
repo tiene imports no literales o ambigüedad.

### Símbolo huérfano (no viable todavía)

Símbolo no exportado sin llamadas/referencias conocidas. **No se recomienda implementarlo
ahora** porque el call graph actual es intra-archivo e incompleto:

- no ve llamadas dentro de template literals, JSX, callbacks ni `new`;
- no ve referencias cross-file;
- no distingue métodos usados por frameworks o por reflexión.

El resultado sería una lista dominada por falsos positivos, justo lo que la feature debería
evitar.

## Opciones

### A. Archivos huérfanos

- **Pros:** datos ya disponibles (`fanIn`), implementación barata, alto valor para `review`.
- **Contras:** requiere exclusiones de entrypoints/config/tests y cuidado con dynamic imports.
- **Veredicto:** **viable y recomendado** para un change de implementación.

### B. Símbolos huérfanos

- **Pros:** detectaría helpers muertos con más precisión que un archivo entero.
- **Contras:** necesita un índice de referencias cross-file y cubrir templates/JSX/callbacks;
  hoy generaría ruido.
- **Veredicto:** **diferir** hasta que exista un reference index y el call graph cubra esos
  casos.

### C. ESLint/TypeScript (`no-unused-vars`)

- **Pros:** reglas maduras para variables/imports locales no usados.
- **Contras:** no detecta archivos muertos; agrega una dependencia opcional; el resultado no
  es el mismo concepto que "código muerto" a nivel repo.
- **Veredicto:** útil como complemento opcional en `review`, **no en el core**.

### D. No implementarlo

- **Pros:** cero costo.
- **Contras:** se pierde una señal barata para `review` y `verify`.
- **Veredicto:** no recomendado para archivos; sí para símbolos por ahora.

## Recomendación

1. **Implementar solo archivos huérfanos** en un change futuro.
2. **No implementar símbolos huérfanos** todavía; primero mejorar el call/reference graph
   (templates, JSX, callbacks, `new`, acceso por miembro y cross-file).
3. **No agregar ESLint/TypeScript al core.** Si se quiere, ofrecer una integración opcional
   para `review`.
4. Salida propuesta: `facts/dead-code.json` + sección en `GOTCHAS.md`.
5. En `lint`, la regla de huérfanos debe ser **opt-in** (`lint.orphanFiles: false` por
   defecto), porque es una señal heurística, no un error de arquitectura.
6. Criterios de aceptación para el change de implementación:
   - excluir entrypoints, tests, config y scripts con tests dedicados;
   - marcar `confidence` y `excluded` en el fact;
   - si hay dynamic imports no literales, bajar la confianza y documentarlo;
   - validar sobre Writer y `spec`: los candidatos restantes deben ser revisables a mano y
     con una tasa de falsos positivos <20% en la muestra.

## Diseño futuro (archivos huérfanos)

```text
src/metrics/orphans.js      # detecta candidatos y exclusiones
src/facts/build.js          # publica facts/dead-code.json
src/render/markdown.js      # sección en GOTCHAS.md
src/cli/commands/lint.js    # regla opt-in lint.orphanFiles
```

- `src/metrics/orphans.js` recibe fileNodes, import edges, package.json y config.
- La lista de exclusiones es determinista y configurable.
- El fact incluye candidatos y excluidos, para que el consumidor vea por qué se descartó un
  archivo.
- No elimina código ni modifica archivos.

## Riesgos

- **Falsos positivos por dynamic imports:** marcar confianza baja y no fallar CI por defecto.
- **Entrypoints no detectados:** permitir `entrypoints` configurables.
- **Framework conventions:** fuera del MVP; documentar.
- **Símbolos:** no implementar hasta mejorar el reference graph.

## Decisión

**Aprobar solo archivos huérfanos para un change de implementación futuro; diferir símbolos
huérfanos.** No agregar dependencias de ESLint/TypeScript al core. La regla de lint será
opt-in y la salida incluirá confianza y exclusiones.
