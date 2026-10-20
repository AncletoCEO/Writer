# Proposal: Java language adapter

> Issue: [#32](https://github.com/AncletoCEO/Writer/issues/32)
> Base: [`aspec/changes/archive/2026-10-19-csharp-language-adapter/`](../archive/2026-10-19-csharp-language-adapter/)
> Análisis: [`aspec/changes/multi-language-support/analysis.md`](../multi-language-support/analysis.md)
> Tipo: implementation (P1)

## Problem

Java organiza el código en **packages** y los imports son nombres fully-qualified
(`import com.example.db.Store;`) que pueden referenciar una clase, un miembro estático o un
package completo (`.*`). El índice de namespaces ya existe para C#; Java necesita una
resolución que pruebe el path completo y vaya quitando segmentos hasta encontrar el package.

## Proposed change

- Agregar el adapter `java` a `@ancleto/writer-languages` con `tree-sitter-java`.
- Extraer `package`, imports (normal, `static`, wildcard), clases, interfaces, enums, records,
  anotaciones, métodos, constructores, herencia/implementación, llamadas y Javadoc.
- Resolver imports contra el índice de packages:
  - probar el specifier completo y quitar el último segmento hasta encontrar un package;
  - emitir una arista por cada archivo del package;
  - excluir el archivo actual;
  - dejar `java.*`, third-party y packages inexistentes como externos.
- Mantener `lang: java` aditivo y el core sin dependencias.

## Scope

In scope: extensión `.java`, parser/resolver Java, Javadoc, tests y docs.

Out of scope: resolución semántica de tipos, imports de clases exactas (se resuelven por
package), static members, módulos JPMS, annotation processors, bytecode y P2/P3.

## Risks

- **Package vs archivo:** un import de clase resuelve a todos los archivos del package; la
  arista es de dependencia de package, no de clase exacta. Se documenta.
- **Wildcard/static:** se resuelven por el package; los miembros estáticos no se validan.
- **Visibilidad:** solo `public` cuenta como exportado, salvo métodos de interfaz que son
  públicos por definición.
- **Paquete por defecto:** no se indexa; sus imports quedan externos.
