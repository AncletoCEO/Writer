# Proposal: Release 0.3.0 with language pack P1+P2

> Issue: [#48](https://github.com/AncletoCEO/Writer/issues/48)
> Base: changes archivados de Python, Go, Rust, C#, Java, C, C++, PHP, Ruby, Swift y Kotlin.
> Tipo: release

## Problem

P1+P2 están implementados y verificados (193 tests), pero el paquete publicado sigue en
`0.2.0` y el language pack no tiene pipeline de publicación. Falta versionar, documentar y
preparar la publicación conjunta de:

- `@ancleto/writer@0.3.0`
- `@ancleto/writer-languages@0.1.0`

## Proposed change

- Subir el core a `0.3.0`; el pack queda en `0.1.0`.
- Extender `publish.yml` para publicar el pack con OIDC/provenance después del core.
- Agregar README, LICENSE y NOTICE al tarball del pack.
- Actualizar README y `docs/releasing.md` con versiones, lenguajes, Trusted Publisher del pack,
  smoke de consumidor y rollback de ambos paquetes.
- Verificar que el core siga sin `dependencies` y que el pack incluya sus grammars.
- Smoke real: instalar tarballs en un proyecto limpio con y sin pack.

## Scope

In scope: versiones, workflow, documentación, contenido del pack y verificación de release.

Out of scope: cambios de comportamiento de parsers, P3, nuevos lenguajes, cambios de contrato.

## Risks

- **Peers de Swift/Kotlin:** el pack puede emitir warnings de peer al instalar; se documenta y
  se valida con npm 12.
- **Primera publicación del pack:** requiere publicar manualmente `0.1.0` y configurar su
  Trusted Publisher antes de que el workflow pueda usar OIDC.
- **Publicación parcial:** el workflow publica core y pack en el mismo job; si falla el core,
  no se intenta el pack. Si el core ya existe, se omite y se sigue con el pack.
- **Tag:** el tag `v0.3.0` debe coincidir con la versión del core.
