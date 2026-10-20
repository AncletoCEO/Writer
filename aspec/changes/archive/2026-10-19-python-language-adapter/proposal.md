# Proposal: Python language adapter

> Issue: [#29](https://github.com/AncletoCEO/Writer/issues/29)
> Spike: [`aspec/changes/python-language-adapter-spike/spike-report.md`](../python-language-adapter-spike/spike-report.md)
> Analysis: [`aspec/changes/multi-language-support/analysis.md`](../multi-language-support/analysis.md)
> Tipo: implementation

## Problem

Writer solo analiza JS/TS/JSX/TSX. El análisis #9 y el spike de Python recomiendan un language
pack opcional basado en tree-sitter nativo para empezar a cerrar la brecha de cobertura sin
agregar dependencias al core. Falta el boundary de adapters, el paquete publicable y el primer
adapter real.

## Proposed change

- Definir un boundary de adapters en el core: carga opcional, extensiones, dispatch de parser y
  resolver, y fallback cuando el pack no está instalado.
- Crear el paquete `@ancleto/writer-languages` (workspace) con el adapter de **Python**.
- Parsear imports, clases, funciones, métodos, herencia, llamadas intra-archivo y docstrings.
- Resolver imports locales de Python: absolutos, relativos y `__init__.py`.
- Mantener `@ancleto/writer` sin dependencias de runtime; el pack es opcional.
- Publicar `lang: python` de forma aditiva en `graph.json` y `symbols.json`.
- Sin el pack, `.py` sigue apareciendo en `facts/unsupported.json`.

## Scope

In scope: boundary del language pack, adapter Python, resolver Python, tests, fixtures,
documentación y actualización del contrato.

Out of scope: Go, Rust, Java, P2, P3, publicación del pack, tree-sitter WASM y resolución
completa de imports de terceros.

## Risks

- **Dependencia nativa:** tree-sitter requiere binarios; se aísla en el pack y se valida en
  Node 24.
- **Resolución parcial:** imports absolutos y relativos cubren el caso local; stdlib y
  third-party quedan externos.
- **Falsos positivos:** árbol con errores de sintaxis; se documenta el límite y se testea con
  fixtures reales.
- **Regresión del core:** el pack se carga con `require` opcional y cualquier fallo se degrada a
  “sin adapters”.
