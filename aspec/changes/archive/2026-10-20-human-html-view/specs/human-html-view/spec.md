## ADDED Requirements

### Requirement: HTML humano autocontenido

The system SHALL generar `outputDir/human/index.html` como una vista humana autocontenida, con
CSS inline y SVG inline, sin red, CDN, JavaScript externo ni dependencias nuevas.

#### Scenario: Generación

- **WHEN** se ejecuta `ancleto-writer human`
- **THEN** existe `outputDir/human/index.html`
- **AND** contiene `<!doctype html>` y al menos un `<svg>`
- **AND** no contiene `http://` ni `https://`

#### Scenario: Offline

- **WHEN** se abre `index.html` sin conexión
- **THEN** los estilos y diagramas se ven completos

### Requirement: Diagramas humanos

The system SHALL incluir diagramas SVG de capas, comunidades, UML acotado, imports y el ciclo
principal cuando entra en el límite.

#### Scenario: UML acotado

- **WHEN** el grafo tiene más clases que `maxClasses`
- **THEN** el SVG muestra como máximo `maxClasses`
- **AND** las aristas de herencia solo conectan clases visibles

#### Scenario: Imports acotados

- **WHEN** el grafo tiene más archivos que el límite del diagrama
- **THEN** solo se dibujan los top por fan-in
- **AND** se dibujan aristas entre los nodos visibles

#### Scenario: Ciclo grande

- **WHEN** el ciclo principal supera `maxNodes`
- **THEN** no se dibuja su SVG
- **AND** se muestra una tabla resumen

### Requirement: Seguridad y determinismo del HTML

The system SHALL escapar todo texto proveniente del repositorio y SHALL producir un HTML
determinista sin rutas absolutas.

#### Scenario: Path malicioso

- **WHEN** un path o nombre contiene `<script>` o caracteres HTML
- **THEN** aparece escapado y no se ejecuta

#### Scenario: Dos ejecuciones

- **WHEN** se ejecuta `human` dos veces sobre el mismo paquete
- **THEN** `index.html` es byte-idéntico

#### Scenario: Sin rutas absolutas

- **WHEN** se inspecciona el HTML
- **THEN** no aparece el path absoluto del proyecto

### Requirement: Contrato estable del HTML

The system SHALL tratar `human/index.html` como salida derivada opcional fuera del manifest v1.

#### Scenario: Manifest

- **WHEN** se lee `manifest.json`
- **THEN** no contiene una entrada `human/index.html` en `outputs`
- **AND** el consumidor puede ignorar el HTML
