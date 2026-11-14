# Integraciones y contratos

## Integraciones Aprobadas (Flujo de Leads):
- **Email Transaccional (Resend):** Notificación inmediata al admin (Efraín) cuando un usuario confirma una cotización. Manejado en servidor (`/api/lead`).
- **Registro de Leads (Google Sheets):** Inserción de cada lead con timestamp, producto, envase, cajas y origen para seguimiento de ventas.
- **WhatsApp Web / App:** Enlace `https://wa.me/{NUMERO_ASESOR}?text={MENSAJE}` con texto pre-armado y codificación segura de URI.

## Integraciones en Evaluación / Fase Posterior:
- **Persistencia de Catálogo:** Supabase PostgreSQL o Cloudflare D1.
- **Object storage:** Cloudflare R2 para imágenes de bidones y fichas técnicas.
- **Analítica:** Eventos internos y Cloudflare Web Analytics / GA4 (respetando privacidad).
- **Podcast hosting/RSS:** En evaluación posterior.

Cada adaptador debe documentar configuración, límites, errores, coste, tratamiento de datos, exportación y pruebas. Mantener secretos (claves de Resend y Google Service Account) estrictamente en variables de entorno de servidor (`.env`), nunca accesibles al navegador del cliente.
