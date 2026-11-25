# Especificación de Diseño: Tracking de Leads en Productos de Blog y Podcast

> **Documento de Diseño Formal (Protocolo EGM / Spec-First)**
> **Proyecto:** Aceite de Motor Lima (Distribuidor Mayorista Lubexol)
> **Product Owner (PO):** Efraín
> **Estado:** **IMPLEMENTADO** — 25/11/2026 (pendiente contra-auditoría §82)
> **Origen:** auditoría §81 (hallazgos P1-81-1 y P1-81-2) y orden del PO de corregir hasta 10/10.

---

## 1. Decisiones del PO (mandato)

| # | Decisión | Estado |
|---|---|---|
| 1 | Los **mensajes pre-armados de WhatsApp no se modifican**. | **Intocable** |
| 2 | Los productos recomendados en **blog y podcast** registran lead (Sheets + Resend), igual que el catálogo. | Aprobado |
| 3 | Los botones **header, hero y footer** siguen siendo enlaces directos, sin registro ni correo. | Aprobado |
| 4 | Rate limit **3 leads / 5 min por IP** (decisión ratificada 24/11/2026). | Sin cambios |

## 2. Mensajes de WhatsApp (literales, verificados en producción)

Estos textos **no se tocan**. La instrumentación solo añade atributos `data-*` y un listener de clic.

| Ubicación | Plantilla vigente (código) |
|---|---|
| Header blog (CTA general) | `Hola, leí el artículo "${post.data.title}" en su blog y quisiera cotizar lubricantes por caja.` |
| Header podcast (CTA general) | `Hola, escuché el episodio "${ep.data.title}" en su podcast y quisiera cotizar lubricantes por caja.` |
| Tarjeta de producto — blog | `Hola, quisiera cotizar una caja de ${prod?.name} que vi en su artículo de blog.` |
| Tarjeta de producto — podcast | `Hola, escuché el episodio "${ep.data.title}" y quisiera cotizar una caja de ${prod?.name}.` |

> Guard de regresión: `src/pages/_editorial-tracking.test.ts` falla si alguien altera estos literales o instrumenta el CTA general.

## 3. Contrato de datos (final)

`src/lib/contracts/lead.ts`:

```typescript
export const LeadSource = z.enum([
  'direct_whatsapp_catalog',   // portada
  'catalogo_direct',           // /catalogo
  'blog_related_product',      // producto recomendado en un artículo
  'podcast_related_product',   // producto recomendado en un episodio
]);

contentSlug: z.string().min(1).max(120).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/).optional()
```

* `contentSlug` es **obligatorio** cuando `source` es editorial (validado con `superRefine`).
* La fuente muerta `product_card_direct` se eliminó.
* `/catalogo` ahora emite `catalogo_direct` (antes emitía `direct_whatsapp_catalog` y no se distinguía de la portada).

## 4. Frontend

### 4.1. Atributos de la tarjeta de producto (blog y podcast)

```html
<a
  href="https://wa.me/51987448943?text=..."   <!-- mensaje vigente, sin cambios -->
  target="_blank" rel="noopener noreferrer"
  data-lead-cta
  data-product-id={prod.id}
  data-product-name={prod.name}
  data-fuel={prod.fuelCompatibility.join(',')}
  data-container-size={prod.variants[0]?.volume}
  data-box-units={prod.variants[0]?.allowedBoxUnits[0]}
  data-source="blog_related_product"          <!-- o podcast_related_product -->
  data-content-slug={post.slug}               <!-- o ep.slug -->
>
```

* Se usa la convención existente `data-fuel` (no `data-fuels`).
* `boxUnits` se deriva de `allowedBoxUnits[0]` (nunca se asume 15).
* `renderTimestamp` = `Date.now()` al cargar la página, no al clic.
* El enlace **no** se intercepta: `preventDefault()` no se llama. Si WhatsApp no abre, el `href` sigue funcionando.

### 4.2. Transporte (`src/lib/lead-client.ts`)

1. `navigator.sendBeacon('/api/lead', Blob JSON)` — sobrevive al descargue de la página.
2. Fallback `fetch(..., { keepalive: true })` si el beacon no se puede encolar.
3. La navegación a WhatsApp nunca espera la respuesta del backend.

Portada y `/catalogo` usan el mismo helper (`sendLead`), sin cambiar sus mensajes.

## 5. Backend (`src/pages/api/lead.ts`)

Orden de defensa:

1. Allowlist de `Origin` (CSRF-lite; **no** es anti-bot: se omite si no hay header).
2. JSON válido → honeypot (200 falso) → speed-guard (<500 ms).
3. Esquema Zod (incluye `contentSlug` editorial).
4. Catálogo: producto, envase y caja permitidos. **El servidor impone `productName` y `fuelCompatibility` del catálogo.**
5. `totalUnits` recalculado.
6. **Rate limit** (3 leads persistidos / 5 min). Un `400` no consume cupo; un éxito sí.
7. Despacho paralelo a Sheets y Resend (`AbortSignal.timeout(5000)`).

### 5.1. Contrato con Google Apps Script

* El script responde **HTTP 200 incluso cuando rechaza** (`{"error":"No autorizado"}`).
* El Worker inspecciona el cuerpo: cualquier `error` explícito ⇒ `502` (`No se pudo persistir el lead`). Nunca se reporta éxito falso.
* Sheets es la fuente de verdad del CRM: si Sheets falla, la respuesta es `502` aunque el correo se haya enviado.

### 5.2. Correo (Resend)

* Asunto: `🚨 [Nuevo Lead Lubexol] {Canal} · {cajas} caja(s) · {producto}`.
* Cuerpo: leadId, canal, **URL del artículo/episodio** (si es editorial), producto, combustible, envase, cajas, total, fecha.
* Todos los valores dinámicos se escapan (`escapeHtml`) y el asunto se sanea contra CRLF.

## 6. Persistencia y atribución

| Dato | Dónde queda |
|---|---|
| Canal (`blog_related_product` / `podcast_related_product`) | Columna `Canal` del Sheet + asunto/cuerpo del correo |
| Artículo/episodio (`contentSlug`) | Cuerpo del correo (URL completa) + payload al Apps Script |
| Slug en el Sheet | **Pendiente PO**: requiere columna `Contenido_Origen` + `appendRow` (ver §7) |

## 7. Dependencias externas (no delegables desde el repo)

1. **Rotar `LEADS_SECRET`** en Apps Script (Propiedades del script) y Cloudflare Pages. El token anterior quedó expuesto en un repositorio público (§82). Sin rotación, el P0 sigue abierto aunque el repo esté limpio.
2. **Columna `Contenido_Origen`** en la hoja `Leads` + `contents.contentSlug` en el `doPost` (opcional para el negocio; el correo ya atribuye).
3. **Despliegue**: push a `main` dispara el build de Cloudflare Pages.
4. **Evidencia de entrega Resend**: ID de mensaje en el panel (no verificable desde el repo).

## 8. Matriz de aceptación

| ID | Escenario | Resultado esperado | Evidencia |
|---|---|---|---|
| TC-01 | Clic en producto de blog | Registra `blog_related_product` + slug, envía correo y abre WhatsApp con el mensaje intacto | `src/pages/api/_lead.test.ts` + `editorial-tracking.test.ts` |
| TC-02 | Clic en producto de podcast | Ídem con `podcast_related_product` | ídem |
| TC-03 | Header / hero / footer | WhatsApp directo, sin `/api/lead` | `editorial-tracking.test.ts` (solo 1 `data-lead-cta` por página) |
| TC-04 | Anti-spam | Honeypot 200 falso; <500 ms 400; 4.º lead 429 (los 400 no consumen cupo) | `_lead.test.ts` + `lead-guards.test.ts` |
| TC-05 | Fallback de red | WhatsApp abre aunque Sheets/Resend fallen | `lead-client.ts` (beacon/keepalive sin await) |
| TC-06 | Webhook rechaza | API responde `502`, no `200` falso | `_lead.test.ts` |

## 9. Gobernanza

* Cero cambios en `src/` sin orden explícita del PO (esta implementación responde a la orden "corrige hasta 10/10", §82).
* Verificación obligatoria: `npm run test`, `npm run lint`, `npm run build` (evidencia en §82).
