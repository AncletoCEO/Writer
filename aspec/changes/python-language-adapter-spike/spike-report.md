# Spike report: Python language adapter

> Issue: [#9](https://github.com/AncletoCEO/Writer/issues/9)
> Change: `python-language-adapter-spike`
> Fecha: 2026-10-19
> Workspace: `/tmp/opencode/python-spike` (fuera del repo)

## Objetivo

Medir si un adapter de Python basado en tree-sitter es viable antes de comprometer el
language pack multi-lenguaje. Criterios del análisis #9:

- ≥95% de archivos sin errores fatales.
- <2 s para 2.000 archivos.
- <15 MB de instalación opcional.
- Core de Writer intacto (sin dependencias nuevas).

## Setup evaluado

| Variante | Paquetes | Resultado |
|---|---|---|
| Nativo | `tree-sitter@0.25.1` + `tree-sitter-python@0.25.0` | **Funciona en Node 24** |
| WASM | `web-tree-sitter@0.27.1` + `tree-sitter-wasms@0.1.13` | **Bloqueado** por incompatibilidad de ABI/grammar (`getDylinkMetadata`) |
| WASM legacy | `web-tree-sitter@0.20.8` + misma grammar | La API de import no expone `Parser`; no se pudo validar |

La variante nativa se instaló sin scripts de build (prebuilt disponible). `node_modules` del
spike pesa **11.83 MB**.

## Corpus y resultados (nativo)

### Python stdlib 3.14

- 300 archivos `.py` reales.
- **0 errores de parsing** (`rootNode.hasError === false` en todos).
- Extraídos: **1.274 clases**, **5.338 funciones**, **1.282 imports**.
- Tiempo total: **2.736 ms** (~9.1 ms/archivo).

### Corpus sintético

- 2.000 archivos pequeños con import + clase + función.
- **0 errores**.
- Tiempo total: **67 ms**.

## Evaluación contra criterios

| Criterio | Resultado | Veredicto |
|---|---|---|
| ≥95% sin errores fatales | 100% en 300 archivos reales | ✅ |
| <2 s para 2.000 archivos | 67 ms sintético; ~18 s extrapolado en archivos reales | ⚠️ Depende del tamaño |
| <15 MB instalación opcional | 11.83 MB | ✅ |
| Core sin dependencias | Spike aislado; `package.json` de Writer intacto | ✅ |
| Node 24 | Funciona | ✅ |

## Interpretación

- **Calidad:** tree-sitter nativo parsea Python 3.14 sin errores en la muestra y permite
  extraer clases, funciones e imports. La base técnica existe.
- **Rendimiento:** el parser es rápido en archivos chicos (2k sintéticos en 67 ms), pero los
  archivos reales de stdlib son más pesados (~9 ms/archivo). Un repo Python de 2.000 archivos
  reales podría tardar ~18 s, por encima del umbral de 2 s.
- **WASM:** la ruta WASM no es plug-and-play con las versiones actuales; requeriría compilar
  una grammar con el ABI correcto. El tamaño de `tree-sitter-wasms` (54 MB) además supera el
  presupuesto de 15 MB.
- **Riesgo principal:** la resolución de imports y la extracción semántica por lenguaje no las
  resuelve tree-sitter; hay que implementarlas en el adapter.

## Recomendación

**Go condicional para tree-sitter nativo.** Es viable en calidad, tamaño y Node 24. Antes de
implementar el language pack:

1. Definir el presupuesto de rendimiento realista para 2.000 archivos de usuario (¿2 s o
   aceptar 10-20 s con cache/incremental?).
2. Si se exige <2 s en archivos reales, agregar cache de parse o paralelismo antes de
   comprometer el pack; el spike no lo garantiza.
3. Implementar primero el adapter Python con tree-sitter nativo, en un paquete opcional, y
   medir el corpus real de usuarios.
4. No usar la ruta WASM hasta compilar una grammar compatible; el paquete actual de 54 MB no
   cumple el presupuesto.

## Próximo change recomendado

`python-language-adapter` (implementación, no spike) con:

- adapter opcional y tree-sitter nativo como peer;
- extracción de imports/clases/funciones/herencia;
- resolución de imports Python (`import x`, `from x import y`, relativos y `__init__.py`);
- contrato aditivo (`lang: python`, sin romper v1);
- benchmark con corpus real y presupuesto acordado.

## Reproducir

```bash
cd /tmp/opencode/python-spike
npm install tree-sitter@0.25.1 tree-sitter-python@0.25.0
node bench.mjs
```

Los resultados completos están en la salida de `bench.mjs` (real, synthetic, tamaño y versión
de Node).
