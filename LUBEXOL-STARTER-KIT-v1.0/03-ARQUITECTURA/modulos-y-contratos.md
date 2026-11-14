# Módulos y contratos

| Módulo | Responsabilidad | Dependencias permitidas |
|---|---|---|
| Catálogo | Productos, presentaciones, búsqueda | Repositorio de catálogo |
| Vendedores | Perfil y canales de contacto | Repositorio de vendedores |
| Cotizaciones | Selección y composición de solicitud | Catálogo + vendedor mediante contratos |
| Blog | Artículos, categorías, autores | Repositorio editorial; referencias comerciales opcionales |
| Podcast | Episodios, audio, transcripción | Repositorio de episodios y proveedor de audio/RSS |
| SEO | Metadatos, sitemap, schema | Datos públicos de cada módulo |
| Analítica | Eventos y consentimiento cuando aplique | Adaptador de analítica |
| PWA | Instalación, caché y actualización | Estrategia de caché; no cachear datos sensibles |

Cada contrato debe definir entradas, salidas, errores, validaciones y versión. Evitar imports directos de SDK de proveedor dentro del núcleo.
