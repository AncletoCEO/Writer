## ADDED Requirements

### Requirement: Publicación del language pack

The system SHALL publicar `@ancleto/writer` y `@ancleto/writer-languages` como paquetes
separados, con versiones independientes, procedencia OIDC y un único tag de release basado en
la versión del core.

#### Scenario: Release 0.3.0

- **WHEN** se crea el tag `v0.3.0` y la versión del core es `0.3.0`
- **THEN** el workflow publica `@ancleto/writer@0.3.0`
- **AND** publica `@ancleto/writer-languages@0.1.0`
- **AND** ambas publicaciones usan `--provenance` y OIDC, sin `NPM_TOKEN`

#### Scenario: Versión ya publicada

- **WHEN** la versión del core o del pack ya existe en npm
- **THEN** su publicación se omite
- **AND** el workflow continúa con el otro paquete y el GitHub Release

#### Scenario: Trusted Publisher faltante

- **WHEN** el pack no tiene Trusted Publisher configurado
- **THEN** la primera publicación se hace manualmente
- **AND** la documentación explica cómo configurarlo antes de usar OIDC

### Requirement: Contenido del language pack

The system SHALL publicar el pack con su código, README, LICENSE y NOTICE, y SHALL declarar
sus dependencias de grammars únicamente en el pack, sin agregar dependencias al core.

#### Scenario: Tarball del pack

- **WHEN** se ejecuta `npm pack --dry-run` en `packages/writer-languages`
- **THEN** el tarball incluye `src/`, `README.md`, `LICENSE` y `NOTICE`
- **AND** no incluye tests ni `@ancleto/writer` como dependencia

#### Scenario: Core sin dependencias

- **WHEN** se inspecciona el `package.json` de `@ancleto/writer@0.3.0`
- **THEN** `dependencies` está ausente o vacío
- **AND** las grammars solo aparecen en el pack

### Requirement: Smoke de release con y sin pack

The system SHALL poder verificarse en un proyecto limpio con el core solo y con el core más el
pack, sin depender de un checkout del repositorio.

#### Scenario: Core solo

- **WHEN** se instala solo el tarball de `@ancleto/writer@0.3.0` en un proyecto limpio
- **AND** el proyecto contiene un `.py`
- **THEN** el build termina
- **AND** el `.py` aparece en `facts/unsupported.json`

#### Scenario: Core + pack

- **WHEN** se instalan los tarballs de core y pack en un proyecto limpio
- **AND** el proyecto contiene un `.py` y un `.ts`
- **THEN** el build analiza ambos
- **AND** `facts/unsupported.json` queda vacío
