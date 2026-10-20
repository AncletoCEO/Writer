## ADDED Requirements

### Requirement: Comando impact

El sistema SHALL exponer `ancleto-writer impact` para calcular dependientes directos y transitivos de uno o más archivos.

#### Scenario: Dependientes transitivos

- **WHEN** un archivo es importado por una cadena transitiva
- **THEN** `impact` lista los dependientes directos y transitivos
- **AND** respeta el límite de profundidad

#### Scenario: Paquete stale

- **WHEN** el paquete está stale
- **THEN** `impact` devuelve exit `3`
- **AND** recomienda ejecutar `build`
- **AND** con `--build` reconstruye antes de calcular

#### Scenario: Archivo sin dependientes

- **WHEN** el archivo no tiene dependientes
- **THEN** el resultado reporta cero dependientes
- **AND** devuelve exit `0`
