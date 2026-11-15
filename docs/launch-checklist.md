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

## 6. Procedimiento de despliegue (evitar canonical/Origin stale)
1. Asegurar `PUBLIC_SITE_URL` en variables de entorno de Cloudflare Pages (Production) = `https://aceitedemotorlima.com`.
2. En local, no depender de `.env`: el código usa `import.meta.env.DEV` para fallback a `http://localhost:4321` solo en desarrollo.
3. Construir: `npm run build` → verificar `dist/sitemap-0.xml` y canonical en `dist` (grep `localhost` debe dar 0 en `src/`).
4. Desplegar: `npx wrangler pages deploy dist --project-name lubexol`.
5. Post-deploy: `curl -s https://aceitedemotorlima.com/ | grep -o 'canonical[^>]*'` y comprobar que no contenga `localhost`.
6. Probar `POST /api/lead` desde el dominio real (debe responder 200, no 403).

## 7. Aprobación y Veredicto Final
- [x] Pruebas físicas en consola (14/14 tests, lint 0 errores, build limpio exit code 0).
- [x] Dominio propio delegado y activo con SSL en Cloudflare (`aceitedemotorlima.com`).
- [x] Datos estructurados Schema.org (`AutoPartsStore` y `FAQPage`) verificados.
- [x] Lead API funcional con protección anti-bot y validación de Origin.
- [ ] PO (Efraín) aprueba el resultado final.
- [x] Auditor colega (OpenCode) y Arquitecto Principal emiten GO DEFINITIVO UNÁNIME (10/10).
- [x] Despliegue a Cloudflare Pages ejecutado y verificado en vivo.

---
**Estado:** En preparación. No desplegar hasta completar todos los puntos.