# Design: Self-contained HTML human view

## Archivos

```text
src/human/report.js   # agrega index.html a la salida
src/human/html.js     # render HTML + SVG inline
test/human.test.js    # cobertura de HTML
```

`index.html` se publica junto a `OVERVIEW.md`, `ARCHITECTURE.md` y `data.json` en
`outputDir/human/`.

## Estructura del HTML

- Header con versión de Writer y totales.
- Cards de resumen: archivos, símbolos, aristas, ciclos, huérfanos, unresolved, no soportados.
- Tabla de lenguajes.
- Diagramas:
  - capas: barras horizontales;
  - comunidades: barras horizontales;
  - UML: cajas en grilla con herencia;
  - imports: nodos en círculo y aristas entre los top;
  - ciclo principal si su tamaño entra en `maxNodes`.
- Tablas de god nodes, hotspots, comunidades, huérfanos, unresolved, unsupported y cobertura.
- Próximos pasos.
- Footer con “vista derivada; el paquete de agentes es la fuente de verdad”.

Sin JavaScript, sin fuentes externas, sin imágenes externas.

## SVG

- Layouts deterministas: orden por score/path; posiciones por índice.
- UML: hasta `maxClasses`, grilla de 3 columnas; métodos acotados.
- Imports: hasta `min(maxNodes, 16)` nodos para legibilidad; círculo.
- Ciclos: hasta `maxNodes`; si el primero es mayor, se muestra tabla.
- Todo texto se escapa con una función HTML.
- `<title>` en nodos para el path completo cuando la etiqueta se acorta.

## XSS

Todos los valores que vienen de paths, nombres, summaries, comunidades o reglas se escapan
antes de insertarse en HTML o SVG. No se usa `innerHTML` ni plantillas del repo.

## Determinismo

- Sin `generatedAt`.
- Orden estable de nodos, tablas y SVG.
- `index.html` byte-idéntico entre dos ejecuciones sobre el mismo paquete.

## Contrato

`human/index.html` es una salida derivada opcional. No se agrega a `manifest.outputs` ni al
fingerprint; `schemaVersion` sigue en 1.

## Validación

- HTML con `<!doctype html>` y `<svg>`.
- Sin `http://`, `https://` ni rutas absolutas.
- Determinismo byte a byte.
- Límites en tablas y diagramas.
- Repo real grande: HTML acotado y abrible offline.
