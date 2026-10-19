# Spec: uml-class-diagram

## Purpose

Generación de diagramas Mermaid classDiagram desde clases, interfaces, métodos y herencia.

## Requirements

### Requirement: Diagrama UML Mermaid

El sistema SHALL generar un diagrama Mermaid `classDiagram` desde clases, interfaces, métodos y aristas de herencia.

#### Scenario: Clases y herencia

- **WHEN** el repositorio contiene una clase que hereda de otra
- **THEN** el diagrama muestra ambas clases y la relación de herencia

#### Scenario: Interfaces

- **WHEN** existe una interfaz implementada por una clase
- **THEN** el diagrama refleja la relación correspondiente

#### Scenario: División por tamaño

- **WHEN** la cantidad de clases supera el máximo configurado
- **THEN** el diagrama se divide en bloques deterministas
