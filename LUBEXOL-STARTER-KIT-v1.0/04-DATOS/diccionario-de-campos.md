# Diccionario de campos y validaciones

- IDs: únicos, estables y no basados en nombres editables.
- Slugs: únicos por tipo de contenido, normalizados y redireccionables al cambiar.
- Precio: decimal exacto, moneda explícita, vendedor y vigencia obligatorios si se publica.
- Unidades por caja: entero positivo y confirmado.
- WhatsApp: normalizar formato internacional; validar destino antes de publicar.
- URLs de imágenes/audio: validar tipo, tamaño, acceso y propiedad/licencia.
- Artículos: estado borrador/revisión/publicado/archivado; fechas y autor.
- Episodios: estado borrador/revisión/publicado; archivo, duración, portada y RSS.
- Campos opcionales no deben mostrarse como información inventada.
