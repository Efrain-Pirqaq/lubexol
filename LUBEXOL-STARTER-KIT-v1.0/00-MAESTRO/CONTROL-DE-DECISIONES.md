> Archivo de trabajo para auditoría entre agentes: `handoff.md`. Este archivo se actualiza **solo** cuando cambia el estado o valor de una decisión; cada cambio se anota también en `handoff.md`.

Estados: `APROBADO`, `PROPUESTA`, `PENDIENTE`, `NO APLICA`.

| ID | Tema | Estado | Información actual / decisión |
|---|---|---|---|
| D-01 | Mercado inicial | APROBADO | Lima Metropolitana y Callao en Fase 1 (arquitectura desacoplada para futura expansión nacional). |
| D-02 | Público | APROBADO | Principalmente particulares y taxistas que buscan ahorrar comprando aceite por caja. |
| D-03 | Modelo comercial | APROBADO | Catálogo con selección por caja y cotización directa por WhatsApp; sin checkout ni pasarela en v1. |
| D-04 | Pago online | APROBADO | No se contempla pasarela de pago en la primera versión. |
| D-05 | Precios | APROBADO | El vendedor define los precios. La web publica precios de referencia en PEN para la **caja cerrada de 15u**: S/ 180 (multigrados) y S/ 112 (monogrados), más el equivalente por litro calculado. El precio final se confirma por WhatsApp. La **caja de 20u** se cotiza y no publica precio de referencia (decisión PO 22/11/2026). Moneda y vigencia obligatorias. |
| D-06 | Venta por caja | APROBADO | Unidad comercial obligatoria: caja cerrada de 15u y 20u (1L) según presentación de fábrica (descartadas 6u, 12u, 24u). |
| D-07 | Vendedores | APROBADO (FASE 1) | Línea centralizada de Lubexol con asesor verificado en WhatsApp; sin directorio de múltiples vendedores en MVP. |
| D-08 | Mínimos y entrega | APROBADO | Venta mínima: 1 caja cerrada. Entrega y condiciones se coordinan directamente en chat de WhatsApp. |
| D-09 | Monetización | APROBADO (FASE 1) | Margen comercial directo por venta de cajas cerrada. Cobro de cuotas a vendedores queda diferido a fase marketplace. |
| D-10 | Datos iniciales | APROBADO | Google Sheets como repositorio de leads y prospectos; catálogo estático tipado en código para MVP. |
| D-11 | Hosting/infraestructura | APROBADO | Astro 5 + Tailwind CSS + Cloudflare Pages (Edge SSR / SSG). |
| D-12 | Blog | APROBADO COMO OBJETIVO | Módulo editorial para educación, confianza y tráfico; enlaza a fichas de productos. |
| D-13 | Podcast | APROBADO COMO OBJETIVO | Audio con portada estática en primera etapa; RSS y distribución por definir. |
| D-14 | Skill editorial | PROPUESTA | Flujo asistido SEO/AEO/GEO con revisión humana obligatoria. |
| D-15 | Analítica | APROBADO COMO PRINCIPIO | Medir visitas, selecciones y contactos; no atribuir ventas sin confirmación. |
| D-16 | PWA | APROBADO (alcance mínimo) | Solo instalable (manifest + service worker básico). Sin capacidades offline avanzadas en fase inicial. |
| D-17 | Marca visible | APROBADO | Marca comercial del distribuidor: "Aceite de Motor Lima" (encabezado/pie). Productos oficiales de catálogo: marca Lubexol. |
| D-18 | Diseño | APROBADO (condicional) | Estilo Industrial Premium, azul petróleo y tarjetas limpias. Aprobación final tras visualizar en localhost. |
| D-19 | SEO | APROBADO COMO OBJETIVO | Indexación técnica y contenido útil; no prometer posiciones ni indexación. |
| D-20 | Captación de Leads y Notificaciones | APROBADO (Fase 1) | Alerta inmediata por Resend al correo del admin (`zoevarcasd@gmail.com`) activa en producción. Google Sheets **DIFERIDO a Fase 2**: adaptador tipado en código; requiere desplegar el Apps Script y configurar `GOOGLE_SHEETS_WEBHOOK_URL`/`SECRET` en Cloudflare (pendiente de confirmación del PO). |
| D-21 | Interfaz de Tarjeta y Cotización | APROBADO | Botón "Cotizar por WhatsApp" con flujo directo en 1 clic. Modal eliminado para evitar abandono en dispositivos móviles (CRO 1-clic). |

---

## 📌 Auditoría Forense al Registro de Decisiones (Auditor Colega) — 13/11/2026

> **Auditor:** Antigravity (Auditoría Cruzada de Consenso)  
> **Revisado contra:** Confirmaciones explícitas del PO (Efraín) en chat, `GEMINI.md`, `handoff.md` y `docs/designs/fase-1-diseno-aprobado.md`.  
> **Estado:** 100% Coherente y Sincronizado.  

### Hallazgos Críticos Auditados y Subsanados

1. **Resolución de Contradicción D-07 vs D-09 (P0 - Modelo de Negocio):**
   * *Problema Detectado:* El registro previo indicaba en D-09 *"Cuota mensual única al vendedor"* mientras que D-07 establecía *"Línea centralizada de Lubexol con asesor propio"*. Si Lubexol opera con asesor directo, no tiene sentido cobrar una cuota mensual a un tercero.
   * *Corrección Aplicada:* D-09 se formalizó como **Margen comercial directo por venta de cajas** para el MVP. Las membresías/cuotas a vendedores externos quedan formalmente diferidas para cuando se active un modelo marketplace.
2. **Cierre Formal de D-01 (P1 - Mercado Inicial):**
   * *Problema Detectado:* Seguía como `PROPUESTA` pese a la confirmación del PO.
   * *Corrección Aplicada:* Marcado como **`APROBADO`** para Lima Metropolitana y Callao.
3. **Validación de Condicionalidad de Diseño (D-18):**
   * Se ratifica la cláusula de seguridad: los componentes visuales de la Fase 1 se someterán a inspección física en `localhost` antes del despliegue en Cloudflare Pages.

### Veredicto de Gobernanza
Tabla de decisiones formalmente blindada, sin contradicciones y alineada a las directrices de `GEMINI.md`. Queda lista para contra-auditoría final del colega OpenCode.

## Regla
Una propuesta no equivale a aprobación. Antigravity debe pedir confirmación de los puntos que afecten estructura, datos o comportamiento antes de implementarlos.

---

## 📌 Nota de sincronización de precios (22/11/2026)

- **D-05 actualizada** por instrucción del PO: la web muestra precios de referencia de la caja cerrada de **15u**; la caja de **20u** se cotiza por WhatsApp sin precio público.
- **Fuente única de precios:** `src/data/prices.ts`. La tabla `#equivalencias` y el JSON-LD de la portada se derivan de ese archivo. El Google Sheet y `docs/catalogo_productos_plantilla.csv` **no** son la fuente de precios.
- **Pendiente de re-baseline:** D-10 (catálogo estático) y D-20 (Sheets diferido) contradicen la implementación descrita en §64–§69 (catálogo dinámico y Sheets operativo). No se modifican sin confirmación explícita del PO.
