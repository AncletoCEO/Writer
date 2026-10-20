# Design: Python language adapter spike

## Approach

El spike vive fuera del paquete publicable (workspace temporal o rama descartable). No se
agregan dependencias a `package.json` de Writer. El objetivo es medir, no entregar una feature.

## Architecture

```text
spike/
├── package.json          # dependencias del spike, aisladas
├── parse-python.mjs      # carga grammar, parsea archivos, emite métricas
├── fixtures/             # corpus Python local
└── spike-report.md       # resultados y decisión
```

- Comparar dos variantes:
  - **WASM:** `web-tree-sitter` + grammar WASM.
  - **Nativo:** `tree-sitter` + `tree-sitter-python`.
- Extraer al menos: imports, clases, funciones y herencia para comparar con el contrato de
  Writer.
- Medir:
  - archivos totales y parseados sin error fatal;
  - errores por archivo y tipos de error;
  - tiempo total y p95 por archivo;
  - tamaño instalado (`node_modules` del spike);
  - compatibilidad con Node 24.
- Verificar que `@ancleto/writer` no cambie de dependencias.

## Validation

- Reporte con tabla comparativa WASM vs nativo.
- Corpus de al menos 50 archivos Python variados.
- Conclusión go/no-go con los umbrales del análisis #9:
  - ≥95% de archivos sin errores fatales;
  - <2 s para 2.000 archivos;
  - <15 MB de instalación opcional;
  - core sin dependencias.
- Si no se cumplen, recomendar no implementar el language pack.
