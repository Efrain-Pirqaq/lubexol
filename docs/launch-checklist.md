# Checklist de Lanzamiento — Lubexol

> Fase 7 (Auditoría y lanzamiento). Completar antes de desplegar a Cloudflare Pages.

## 1. Pruebas
- [ ] `npm run test` → 100% pass (13/13).
- [ ] `npm run lint` → 0 errors, 0 warnings.
- [ ] `npm run build` → exit 0.
- [ ] Flujo E2E manual en móvil (iOS Safari + Android Chrome): tarjeta → modal → WhatsApp.
- [ ] Verificar `/api/lead` registra en Google Sheets y envía correo Resend.

## 2. Datos y configuración
- [ ] Catálogo seed cargado en `src/data/catalog.ts` (mín. 3 productos verificados).
- [ ] `PUBLIC_WHATSAPP_NUMBER` configurado con número real.
- [ ] Secretos configurados en Cloudflare Pages: `RESEND_API_KEY`, `GOOGLE_SHEETS_WEBHOOK_URL`, `GOOGLE_SHEETS_WEBHOOK_SECRET`, `ADMIN_NOTIFICATION_EMAIL`, `RESEND_FROM_EMAIL`.
- [ ] Google Apps Script desplegado y probado (zona `America/Lima`).
- [ ] Dominio verificado en Resend.

## 3. Seguridad
- [ ] Cabeceras de seguridad activas (`_headers`).
- [ ] CSP revisada (eliminar `unsafe-inline` si se usan nonces).
- [ ] Rate limiting en Cloudflare (binding o WAF) configurado.
- [ ] Sin secretos en cliente ni en repositorio.

## 4. SEO y PWA
- [ ] `robots.txt` y sitemap accesibles.
- [ ] OpenGraph validado (Facebook/LinkedIn debugger).
- [ ] Manifest y SW funcionales (instalable en móvil).
- [ ] Meta tags de geolocalización Lima/Callao.

## 5. Respaldo y monitoreo
- [ ] Backup de Google Sheets documentado.
- [ ] Cloudflare Web Analytics o GA4 configurado (respetando privacidad).
- [ ] Alertas de error en `/api/lead` (logs).

## 6. Aprobación
- [ ] PO (Efraín) aprueba el resultado en localhost.
- [ ] Auditor colega emite GO DEFINITIVO.
- [ ] Despliegue a Cloudflare Pages.

---
**Estado:** En preparación. No desplegar hasta completar todos los puntos.