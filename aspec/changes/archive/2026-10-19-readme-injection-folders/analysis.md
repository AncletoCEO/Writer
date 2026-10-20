# Analysis: README injection and self-describing folders

> Issue: [#25](https://github.com/AncletoCEO/Writer/issues/25)
> Change: `readme-injection-folders`
> Fecha: 2026-10-19

## Pregunta

¿Writer debe inyectar links en el README del usuario o generar READMEs por carpeta?

## Evidencia

- Writer solo escribe dentro de `outputDir`.
- No modifica el README del usuario.
- El contrato define la frontera de escritura.
- ReadMenator inyecta un link y genera READMEs por carpeta; eso puede sorprender y genera
  conflictos de merge.

## Opciones

### A. Mantener cero efectos laterales

- El usuario controla su README; Writer solo publica en `outputDir`.

### B. Inyección opt-in en README

- Bloque marcado e idempotente; requiere confirmación explícita y manejo de conflictos.

### C. README dentro de `outputDir`

- Un README que explique `.ancleto/writer/` (qué es cada carpeta/archivo) es seguro y útil.

### D. No hacer nada

- Similar a A, pero sin documentación de salida.

## Recomendación

**A + C.** Mantener la regla de no tocar archivos fuera de `outputDir`; agregar un `README.md`
**dentro** de `.ancleto/writer/` que describa los artefactos y cómo regenerarlos. No inyectar
nada en el README del usuario. Si algún día se ofrece inyección, debe ser opt-in, con bloque
marcado e idempotente.

## Criterios para revisar

- Demanda de un link automático en el README.
- Un mecanismo opt-in que no rompa la idempotencia ni la confianza.

## Decisión

No inyectar en el README del usuario. Aprobar un README autodescriptivo dentro de `outputDir`
como follow-up de bajo costo.
