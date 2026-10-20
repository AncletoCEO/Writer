# Proposal: Release 0.3.1 (README del language pack)

> Issue: [#48](https://github.com/AncletoCEO/Writer/issues/48)
> Tipo: release (patch de documentación)

## Problem

`0.3.0` se publicó con el README anterior. El README completo del language pack (por qué es
un paquete separado, tabla de los 11 lenguajes, resolución/límites, configuración, peers,
fallback y FAQ) quedó fuera del tag publicado. npm es inmutable, así que hace falta un patch.

## Proposed change

- Subir el core a `0.3.1`; el pack queda en `0.1.0`.
- Publicar el README completo y la guía de release actualizada.
- No cambiar código, contrato ni dependencias.
- Tag `v0.3.1`; el workflow publica solo el core y omite el pack ya publicado.

## Scope

In scope: README, `docs/releasing.md`, versión `0.3.1`, tag y publicación del core.

Out of scope: cambios de código, nuevos lenguajes, cambios de contrato y republicar el pack.

## Risks

- **Versión extra:** un patch solo por documentación; es preferible a un README incompleto en
  npm.
- **Pack:** no se republica; sigue en `0.1.0`.
