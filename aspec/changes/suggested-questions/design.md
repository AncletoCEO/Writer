# Design: Suggested questions

## Approach

¿Las preguntas sugeridas aportan algo sobre el technical seed de spec o son redundantes?

A. Plantillas deterministas a partir de anomalías (ciclos, god nodes, capas, huérfanos).
B. Generación con LLM (fuera del alcance token-free de Writer).
C. No hacerlo; dejarlo a spec.
D. Solo preguntas operativas fijas ("¿por qué este ciclo?").

## Architecture

No aplica implementación. Se relevan el código actual y la referencia de ReadMenator para el ADR.

- `GOTCHAS.md` y `facts/hotspots.json` ofrecen señales.
- No hay `facts/questions.json` ni sección de preguntas.

## Validation

ADR con ejemplos y decisión. No implementar.

- Valor real para el usuario final.
- Solapamiento con el seed de spec.
- Costo de mantenimiento y ruido.

## Result

El análisis y la decisión están en [`analysis.md`](./analysis.md).
