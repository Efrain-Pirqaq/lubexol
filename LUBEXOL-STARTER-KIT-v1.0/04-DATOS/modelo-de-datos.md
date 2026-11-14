# Modelo de datos conceptual

Entidades candidatas:
- Product: id, nombre, marca, descripción, viscosidad, compatibilidad_combustible (GNV, GLP, Gasolina, Diesel), especificaciones verificadas, estado.
- ProductVariant/Pack: id, product_id, viscosidad, volumen, unidades_por_caja, allowed_box_units (enteros permitidos por presentación), unidad, código.
- Seller: id, nombre comercial, contacto, zonas, estado de verificación.
- SellerOffer: id, seller_id, variant_id, precio, moneda, vigencia, disponibilidad declarada, condiciones.
- MediaAsset: id, URL/clave, tipo, texto alternativo, propietario.
- Article: id, slug, título, resumen, cuerpo, autor, estado, fechas, SEO metadata.
- ArticleProductLink: article_id, product/variant_id, texto del enlace.
- PodcastEpisode: id, título, descripción, audio, portada, duración, fecha, transcripción, estado.
- LeadEvent: id, evento, fecha, origen, producto(s), vendedor, consentimiento/contexto permitido.

Los nombres son conceptuales, no esquema físico definitivo. Definir claves, índices, relaciones, borrado, auditoría y validaciones al elegir persistencia.
