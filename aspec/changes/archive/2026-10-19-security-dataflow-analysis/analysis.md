# Analysis: Taint, security, SARIF, CPG and dataflow

> Issue: [#17](https://github.com/AncletoCEO/Writer/issues/17)
> Change: `security-dataflow-analysis`
> Fecha: 2026-10-19

## Pregunta

¿Writer debe incorporar análisis de seguridad/dataflow o mantenerse como un motor de
estructura?

## Evidencia

- `src/graph/build.js` solo tiene imports, calls e inherits.
- No hay sources/sinks, sanitización, CPG, taint ni SARIF.
- El análisis de dead code (#10) mostró que incluso el call graph intra-archivo tiene huecos;
  un dataflow fiable requiere mucha más infraestructura.

## Opciones

### A. Taint mínimo

- Marcar imports peligrosos (`child_process`, `eval`, etc.) con confianza baja.
- Barato, pero heurístico y propenso a falsos positivos; no es un análisis de flujo real.

### B. CPG/dataflow completo

- Muy costoso; requiere AST semántico, CFG, SSA, resolución de tipos y sanitización.
- Fuera del alcance de un motor de estructura cero-deps.

### C. Integrar Semgrep/CodeQL

- Herramientas dedicadas, reglas maduras, SARIF.
- Agrega dependencia externa, runtime y mantenimiento de integración.

### D. SARIF solo como salida

- Útil si Writer ya tuviera hallazgos; hoy no los tiene.

### E. No hacerlo

- Mantener el core enfocado en estructura y dejar seguridad a herramientas especializadas.

## Recomendación

**E.** Writer no hace análisis de seguridad ni dataflow. Documentar la frontera y, si un
usuario lo necesita, recomendar Semgrep/CodeQL o una integración externa futura. No agregar
taint heurístico al core: el costo reputacional de los falsos positivos supera el valor.

## Criterios para revisar

- Demanda explícita de un flujo de seguridad integrado.
- Un adapter externo con SARIF que no agregue dependencias al core.
- Evidencia de que el reference graph y la resolución de tipos son suficientes para taint.

## Decisión

No implementar seguridad/dataflow/CPG/SARIF en el core. Mantener la frontera con herramientas
externas.
