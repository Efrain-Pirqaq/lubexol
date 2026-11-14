# Requisitos del Starter Kit

El Starter Kit debe permitir crear sitios similares para otros clientes mediante configuración, sin duplicar el núcleo.

## Separar
- `core`: modelos, validaciones y reglas comunes.
- `modules`: capacidades funcionales independientes.
- `adapters`: implementaciones concretas de servicios.
- `tenants` o configuración de implementación: marca, contenido, módulos habilitados y reglas particulares.

## Requisitos
- Configuración tipada y validada.
- Contratos versionados.
- Migraciones de datos documentadas.
- Pruebas del núcleo sin depender de servicios externos.
- Adaptadores sustituibles y pruebas de contrato.
- Documentación de instalación, operación, backup y migración.

No introducir multi-tenancy complejo si la primera implementación no lo necesita; mantener el diseño preparado sin sobreingeniería.
