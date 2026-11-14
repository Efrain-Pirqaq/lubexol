# Preparación del mensaje WhatsApp y Flujo de Leads

## Botón y Microcopy en Tarjeta
- **Texto del botón:** `Cotizar por WhatsApp`
- **Descripción de soporte:** `Cotizar con nuestro asesor de Lubexol`

## Modal de Preselección (Two-Step Confirmation)
1. Al hacer clic en la tarjeta, se abre el modal de preselección con el resumen de la selección (sin pedir ubicación, ya que se coordina en el chat).
2. Se muestra la advertencia: *"Al confirmar con el siguiente clic, serás redirigido al chat de WhatsApp para comunicarte directamente con nuestro asesor de Lubexol."*
3. Al pulsar el botón de confirmación en el modal:
   - **Registro Asíncrono de Lead:** Se despacha una petición `POST` al endpoint interno `/api/lead` con `keepalive: true` conteniendo los detalles del producto, presentación, cajas y timestamp.
   - **Automatizaciones de Backend:**
     1. Inserción inmediata de fila en la hoja de **Google Sheets de Leads**.
     2. Envío inmediato de correo de alerta mediante **Resend** a la casilla del administrador (Efraín).
   - **Apertura de WhatsApp:** Se redirige/abre inmediatamente la URL `https://wa.me/{NUMERO_ASESOR}?text={MENSAJE_CODIFICADO}`.

## Contenido del mensaje pre-armado
Hola Lubexol, quisiera cotizar lo siguiente con su asesor:
- Producto: [Nombre del producto y especificación]
- Envase: [Presentación: ej. 1L / Cuarto / Galón]
- Empaque: [Caja x 12 unidades]
- Cantidad: [N] caja(s)

¿Podrían confirmarme precio por caja, disponibilidad y condiciones de entrega?

## Reglas
- No enviar automáticamente en WhatsApp: el usuario revisa en su app y pulsa el botón de enviar.
- La llamada a `/api/lead` se realiza en servidor para proteger la API Key de Resend y las credenciales de Google Sheets (cero secretos en el frontend).
- Usar `fetch(..., { keepalive: true })` para garantizar que la notificación se complete aunque el usuario cambie de pestaña a WhatsApp.
- Registrar evento de clic con datos mínimos y respetar privacidad.
