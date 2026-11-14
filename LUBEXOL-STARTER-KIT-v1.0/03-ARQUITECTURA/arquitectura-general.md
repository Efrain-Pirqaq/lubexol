# Arquitectura general

## Separación obligatoria
1. Núcleo: modelos, reglas de negocio y contratos.
2. Módulos: catálogo, vendedores, cotizaciones, blog, podcast, SEO, analítica y PWA.
3. Adaptadores: base de datos, almacenamiento de archivos, correo, analítica, hosting de audio/RSS.
4. Configuración por cliente: marca, dominio, colores, módulos, proveedores y reglas comerciales.

## Principios
- Dependencias hacia contratos, no hacia proveedores concretos.
- Sustituir un adaptador no debe exigir reescribir reglas de negocio.
- Activar/desactivar módulos mediante configuración y dependencias explícitas.
- No crear abstracciones genéricas sin un caso de uso real.
- Blog y podcast no dependen del catálogo; solo pueden enlazarlo mediante una interfaz opcional de referencias comerciales.

## Antes de elegir tecnología
Comparar coste total, límites, seguridad, facilidad operativa, exportación, migración y lock-in. Documentar decisión y alternativa.
