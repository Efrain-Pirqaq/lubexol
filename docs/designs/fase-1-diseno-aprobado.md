# Fase 1 — Diseño Aprobado (Lubexol)

> ⚠️ **DOCUMENTO HISTÓRICO (Fase 1).** Describe el diseño original con `PreselectionModal` y cajas 6u/12u/24u. **No implementar.** El flujo vigente es 1-clic a WhatsApp, cajas 15u/20u y precios en `src/data/prices.ts` (ver handoff §14, §57, §70-§75).

> **Estado:** En curso (diseño, sin código)  
> **Decisión de diseño base:** Industrial Premium, azul petróleo, tarjetas limpias (D-18, condicional hasta ver en localhost).  
> **Stack objetivo:** Astro 5 + Tailwind + Cloudflare Pages (D-11).  
> **Persistencia MVP:** Google Sheets (leads) + catálogo estático tipado en código (D-10).  
> **Vendedor inicial:** uno, línea centralizada Lubexol (D-07).  
> **PWA:** solo instalable (D-16).

---

## 1. Vistas y navegación

```
Inicio (landing)
  └─> Catálogo (búsqueda + filtros)
        └─> Tarjeta de producto (ProductCard)
              └─> Modal de preselección (PreselectionModal)
                    └─> WhatsApp (wa.me)  [paralelo: POST /api/lead]
Inicio ──> Páginas legales / Contacto
Inicio ──> (futuro) Blog / Podcast  [desacoplados]
```

Reglas:
- Catálogo accesible desde header en 1 clic.
- Búsqueda y filtros no recargan página (isla ligera, < presupuesto real).
- Modal de preselección es el único punto de salida a WhatsApp.

---

## 2. Wireframes textuales

### 2.1. Inicio / Landing (escritorio)
```
[Header: Logo LUBEXOL | Nav: Catálogo, Contacto | CTA WhatsApp]
[Hero: título + subtítulo + CTA "Ver catálogo"]
[Sección: beneficios (ahorro por caja, asesoría, Lima/Callao)]
[Sección: productos destacados (3-4 ProductCard compactas)]
[Footer: marca, enlaces legales, contacto]
```

### 2.2. Catálogo (escritorio)
```
[Header]
[Barra de búsqueda + filtros: marca, viscosidad, tipo de motor]
[Grid de ProductCard (3 cols desktop / 2 tablet / 1 móvil)]
[Estado vacío / sin resultados]
[Footer]
```

### 2.3. ProductCard (anatomía)
1. Imagen del envase (WebP/AVIF) + badge tipo de motor (GNV/GLP/Gasolina/Diésel).
2. Descripción breve: marca, línea, viscosidad, homologaciones básicas.
3. Selector de envase (chips): 250ml, 500ml, 1L/Cuarto, Galón 4L (según catálogo del producto).
4. Selector de caja (chips dinámicos según envase): 6u, 12u, 24u.
5. Cantidad de cajas: `[ - ] [ N ] [ + ]` (mín. 1).
6. Botón: `Cotizar por WhatsApp` + microcopy `Cotizar con nuestro asesor de Lubexol`.

### 2.4. PreselectionModal (two-step)
```
[Resumen: Producto, envase, unidades/caja, cajas, total unidades]
[Advertencia: "Al confirmar serás redirigido a WhatsApp para coordinar con nuestro asesor de Lubexol (precio, disponibilidad, entrega)."]
[Botón: "Confirmar y abrir WhatsApp"]
[Sin selector de ubicación]
```
Acción confirmar:
1. `fetch('/api/lead', { keepalive: true })` en background (con fallback sendBeacon + reintento).
2. `window.open(wa.me URL, '_blank', 'noopener,noreferrer')`.

### 2.5. Móvil (una mano)
- Chips táctiles ≥ 44px.
- Modal a pantalla completa o bottom-sheet.
- Botón de confirmación sticky inferior.
- Sin hover; estados por tap.

---

## 3. Componentes y props (borrador)

| Componente | Props clave | Notas |
|---|---|---|
| `ProductCard` | `product`, `selectedVariant`, `onSelectVariant`, `onSelectBox`, `boxCount`, `onBoxCountChange`, `onQuote` | Deriva chips de `product.variants[].allowedBoxUnits`. |
| `PreselectionModal` | `payload`, `whatsappUrl`, `onConfirm`, `onClose` | Accesible (focus trap, ESC). |
| `QuantitySelector` | `value`, `min=1`, `max=999`, `onChange` | Validación entera positiva. |
| `WhatsAppCTA` | `href`, `label`, `microcopy` | `rel="noopener noreferrer"`. |

---

## 4. Estados obligatorios

| Vista/Componente | Estados |
|---|---|
| Catálogo | loading (skeleton), error, vacío, sin resultados, listo. |
| ProductCard | sin selección, selección válida, dato incompleto (variante sin cajas), deshabilitado. |
| PreselectionModal | resumen válido, enviando (lead en vuelo), error silencioso (no bloquea WhatsApp). |
| WhatsAppCTA | disponible, no disponible (sin número configurado → degradar con gracia). |
| Global | offline (PWA instalable): aviso no bloqueante. |

---

## 5. Validaciones de entrada

- `boxCount`: entero 1–999.
- `boxUnits`: debe pertenecer a `allowedBoxUnits` del variante seleccionado.
- `totalUnits`: recalculado en servidor (`boxUnits * boxCount`).
- `productId`, `productName`, `containerSize`: no vacíos, longitudes máximas.
- `timestamp`: generado en servidor (UTC).

---

## 6. Mensaje pre-armado de WhatsApp (borrador)

```
Hola Lubexol, quisiera cotizar lo siguiente con su asesor:
- Producto: {productName}
- Envase: {containerSize}
- Empaque: Caja x {boxUnits} unidades
- Cantidad: {boxCount} caja(s) (Total: {totalUnits} unidades)

¿Podrían confirmarme precio por caja, disponibilidad y condiciones de entrega?
```

Reglas: no enviar automáticamente; usuario revisa y pulsa enviar. No incluir precio/stock no verificados.

---

## 7. Criterios de aprobación de Fase 1

- [ ] Wireframes revisados en escritorio/móvil/tablet.
- [ ] Componentes y estados aprobados por PO.
- [ ] Flujo de cotización validado con vendedor real (mensaje WhatsApp).
- [ ] Aprobación explícita del PO antes de Fase 2 (código).

---

## 8. Riesgos y limitaciones

- D-18 condicional: paleta/diseño final se confirma tras ver en localhost.
- D-09 sin precio de cuota: onboarding de vendedor no diseñado aún.
- D-10 Sheets: riesgo de concurrencia; mitigar con append atómico y validación.
- D-11 sin comparativa formal: se acepta Cloudflare por decisión PO.
- Sin contra-auditoría formal del colega sobre §6/§7 del handoff.