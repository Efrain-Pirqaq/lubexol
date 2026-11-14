# Especificación frontend

## Vistas/áreas
- Inicio/landing y acceso al catálogo.
- Catálogo con búsqueda y filtros.
- Tarjeta y ficha/detalle de producto.
- Selección temporal y resumen de cotización.
- Página/listado de vendedores (si el modelo comercial lo requiere; pendiente).
- Blog: listado, categorías y artículo.
- Podcast: listado y detalle de episodio.
- Páginas legales y contacto.

## Componentes reutilizables
Header, navegación, buscador, filtros, ProductCard, PreselectionModal, ProductDetail, QuantitySelector, QuoteSummary, WhatsAppCTA, ArticleCard, AudioPlayer, Breadcrumbs, Footer.

### Especificación de ProductCard (Tarjeta en Catálogo)
1. **Imagen de producto:** Fotografía nítida con badge de viscosidad/tipo.
2. **Descripción breve:** Marca, modelo, aplicación (ej. GNV/Gasolina/Diésel) y especificaciones breves.
3. **Selector de Presentación (Envase):** Chips táctiles (250ml, 500ml, 1L/Cuarto, Galón, etc. según catálogo del producto).
4. **Selector de Caja (Empaque cerrado):** Chips dinámicos según presentación (6u, 12u, 24u) y selector de cantidad de cajas `[ - ] [ N ] [ + ]`.
5. **Botón de Acción:**
   - Texto principal: `Cotizar por WhatsApp`
   - Microcopy descriptivo: `Cotizar con nuestro asesor de Lubexol`
   - Al pulsar: Despliega la ventana/modal de preselección.

### Especificación de PreselectionModal (Modal de Confirmación)
- **Contenido:**
  * Resumen de la selección (Producto, presentación por envase, cantidad de unidades por caja y total de cajas).
  * Mensaje informativo/advertencia: *"Al confirmar con el siguiente clic, serás redirigido a WhatsApp para que nuestro asesor de Lubexol se comunique directamente contigo y coordine precio final, disponibilidad y entrega."*
  * **Sin selector de ubicación:** La entrega y zona se coordinan directamente en la conversación de WhatsApp con el vendedor.
- **Acción de Confirmación:**
  * Al hacer clic en el botón de confirmación:
    1. Se dispara en background el registro del lead hacia `/api/lead` (Google Sheets + notificación por Resend al admin).
    2. Se abre inmediatamente el chat de WhatsApp con el mensaje pre-armado listo para enviar por el usuario.

## Estados obligatorios
Loading, error, vacío, sin resultados, selección vacía, selección válida, dato incompleto y enlace externo no disponible.

No implementar pantallas de administración hasta definir quién administra y qué permisos necesita.
