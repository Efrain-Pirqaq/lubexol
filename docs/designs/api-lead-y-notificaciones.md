# Especificación Técnica: Endpoint `/api/lead` y Pipeline de Notificaciones

> **Documento de Diseño y Gobernanza EGM**  
> **Proyecto:** Aceite de Motor Lima (Distribuidor Mayorista Lubexol)  
> **Estado:** Aprobado para Implementación  
> **Autor:** Arquitecto Fullstack / PO Efraín  

---

## 1. Objetivo y Flujo General

Capturar cada intención de cotización generada en el botón de cotización directa (1 clic) de la tarjeta de producto, registrándola de forma inmediata y desacoplada en:
1. **Google Sheets:** Hoja de control de prospectos y trazabilidad comercial (diferida a Fase 2; ver §3).
2. **Resend (Email Transaccional):** Notificación instantánea al correo del Administrador.
3. **Redirección a WhatsApp:** Conexión del cliente con el asesor oficial de Aceite de Motor Lima sin demoras de interfaz.

```
[ Botón "Cotizar por WhatsApp" (1 clic) ]
           │
           │ (Clic directo, sin modal de preselección)
           ▼
┌─────────────────────────────────────────────────────────────┐
│ 1. Client-Side: fetch('/api/lead', { keepalive: true })    │
│    (No bloqueante; redirige en paralelo a WhatsApp)         │
└──────────────────────────────┬──────────────────────────────┘
                               │ POST JSON
                               ▼
┌─────────────────────────────────────────────────────────────┐
│ 2. Backend Serverless: Astro API / Cloudflare Worker        │
│    Valida esquema con Zod / Tipos estrictos                 │
└──────────────────────────────┬──────────────────────────────┘
                               │
               ┌───────────────┴───────────────┐
               ▼                               ▼
┌──────────────────────────────┐ ┌──────────────────────────────┐
│ Adaptador Google Sheets      │ │ Adaptador Resend             │
│ (Append Row en Hoja Leads)   │ │ (Alerta HTML a Admin)        │
└──────────────────────────────┘ └──────────────────────────────┘
```

---

## 2. Contrato de API: `POST /api/lead`

### 2.1. Encabezados HTTP
```http
POST /api/lead HTTP/1.1
Content-Type: application/json
Origin: https://aceitedemotorlima.com
```

### 2.2. Esquema de Entrada (Request Body)

```typescript
export interface CreateLeadPayload {
  productId: string;        // Identificador único (ej. "mobil-super-20w50")
  productName: string;      // Nombre visible (ej. "Mobil Super 20W-50")
  fuelCompatibility: Array<'GNV' | 'GLP' | 'Gasolina' | 'Diesel'>; // Compatibilidad de motor
  containerSize: string;    // Envase unitario estándar "1L"
  boxUnits: number;         // Unidades por caja cerrada (15 o 20)
  boxCount: number;         // Cantidad de cajas solicitadas (entero >= 1)
  totalUnits: number;       // Calculado: boxUnits * boxCount
  source: 'direct_whatsapp_catalog' | 'catalogo_direct' | 'product_card_direct'; // Trazabilidad de UI
  timestamp: string;        // ISO 8601 UTC
  renderTimestamp?: number; // Epoch ms al cargar la página (pageLoadTimestamp, anti-bot)
  website_hp?: string;      // Campo Honeypot (debe llegar vacío)
}
```

### 2.3. Reglas de Validación y Blindaje Anti-Spam (Protección Cuota Resend)
* `productId`: String no vacío, máx. 100 caracteres.
* `productName`: String no vacío, máx. 150 caracteres.
* `fuelCompatibility`: Array no vacío con al menos uno de: `'GNV'`, `'GLP'`, `'Gasolina'`, `'Diesel'`.
* `containerSize`: String válido según catálogo (no nulo).
* `boxUnits`: Entero positivo estrictamente mayor a 0 (15 o 20 según presentación de fábrica).
* `boxCount`: Entero positivo entre 1 y 999.
* `totalUnits`: Debe ser exactamente igual a `boxUnits * boxCount`.
* `timestamp`: Cadena válida en formato ISO 8601.
* **Honeypot Check (`website_hp`):** Si el campo contiene texto, responder inmediatamente con `200 OK` falso pero **abortar silenciosamente** las llamadas a Resend y Google Sheets.
* **Velocidad Inhumana (Timestamp Check):** Si `Date.now() - renderTimestamp < 500`, rechazar o abortar (umbral anti-bot; `renderTimestamp` se captura al cargar la página, no al clic).
* **Rate Limiting:** Máximo 3 peticiones por IP por ventana de 5 minutos en el Edge.

### 2.4. Respuestas HTTP
* **`200 OK` (Procesado con éxito):**
  ```json
  {
    "success": true,
    "leadId": "lead_1731535200_a8f9",
    "message": "Lead registrado y notificado exitosamente"
  }
  ```
* **`400 Bad Request` (Datos inválidos):**
  ```json
  {
    "success": false,
    "error": "Esquema de cotización incompleto o alterado"
  }
  ```
* **`500 Internal Server Error` (Fallo de proveedor externo):**
  ```json
  {
    "success": false,
    "error": "Error interno al despachar notificaciones"
  }
  ```

---

## 3. Adaptador de Google Sheets

### 3.1. Estructura de la Hoja de Cálculo (`Leads_Lubexol`)
La hoja en Google Sheets contendrá las siguientes 10 columnas ordenadas (A a J):

| Columna | Nombre de Cabecera | Tipo de Dato | Ejemplo |
| :---: | :--- | :--- | :--- |
| **A** | `ID_Lead` | String | `lead_1731535200_a8f9` |
| **B** | `Fecha_Hora_PET` | String (UTC-5) | `13/11/2026 19:15:00` |
| **C** | `Producto` | String | `Lubexol Optimus Premium SAE 20W-50` |
| **D** | `Combustible` | String | `GNV, GLP` |
| **E** | `Envase` | String | `1L` |
| **F** | `Unidades_x_Caja` | Number | `15` |
| **G** | `Cajas_Solicitadas`| Number | `2` |
| **H** | `Total_Unidades` | Number | `30` |
| **I** | `Estado` | Enum | `Pendiente Contacto` |
| **J** | `Canal` | String | `WhatsApp Web` |

### 3.2. Mecanismo de Ingesta y Script Canónico (Google Apps Script)
Para no sobrecargar el runtime Edge con el SDK pesado de Google Cloud (googleapis), se usa un Webhook ligero en Google Apps Script:
* Endpoint: `GOOGLE_SHEETS_WEBHOOK_URL`
* Autenticación: Parámetro o cabecera con `GOOGLE_SHEETS_WEBHOOK_SECRET`

**Script de Producción (Pegar en Extensiones > Apps Script de la Hoja):**
```javascript
function doPost(e) {
  try {
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
    const contents = e.postData ? JSON.parse(e.postData.contents) : {};
    const auth = e.parameter.secret || contents.secret;
    const EXPECTED_SECRET = PropertiesService.getScriptProperties().getProperty("LEADS_SECRET");
    
    if (!EXPECTED_SECRET || auth !== EXPECTED_SECRET) {
      return ContentService.createTextOutput(JSON.stringify({ error: "Unauthorized" }))
        .setMimeType(ContentService.MimeType.JSON);
    }
    
    // Formato de hora oficial Perú (UTC-5)
    const timestampLima = Utilities.formatDate(new Date(), "America/Lima", "dd/MM/yyyy HH:mm:ss");
    
    sheet.appendRow([
      contents.leadId,
      timestampLima,
      contents.productName,
      contents.fuelCompatibility ? contents.fuelCompatibility.join(", ") : "N/A",
      contents.containerSize,
      contents.boxUnits,
      contents.boxCount,
      contents.totalUnits,
      "Pendiente Contacto",
      "WhatsApp Web"
    ]);
    
    return ContentService.createTextOutput(JSON.stringify({ success: true }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ error: err.message }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}
```

---

## 4. Adaptador de Resend (Email Transaccional)

### 4.1. Configuración de Envío
* **De (From):** `Aceite de Motor Lima <notificaciones@aceitedemotorlima.com>` (remitente verificado en Resend).
* **Para (To):** `ADMIN_NOTIFICATION_EMAIL` (`zoevarcasd@gmail.com`).
* **Asunto (Subject):** `🚨 [Nuevo Lead] Cotización de {boxCount} caja(s) - {productName}`

### 4.2. Plantilla HTML del Correo
```html
<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden;">
  <div style="background-color: #0f172a; padding: 20px; color: #ffffff; text-align: center;">
    <h2 style="margin: 0;">LUBEXOL — Nueva Cotización</h2>
    <p style="margin: 5px 0 0 0; color: #94a3b8; font-size: 14px;">Un cliente ha iniciado contacto en WhatsApp</p>
  </div>
  <div style="padding: 24px; background-color: #ffffff;">
    <table style="width: 100%; border-collapse: collapse;">
      <tr><td style="padding: 8px 0; color: #64748b;">Producto:</td><td style="padding: 8px 0; font-weight: bold; color: #0f172a;">{{productName}}</td></tr>
      <tr><td style="padding: 8px 0; color: #64748b;">Envase unitario:</td><td style="padding: 8px 0; font-weight: bold; color: #0f172a;">{{containerSize}}</td></tr>
      <tr><td style="padding: 8px 0; color: #64748b;">Presentación de caja:</td><td style="padding: 8px 0; font-weight: bold; color: #0f172a;">{{boxUnits}} unidades</td></tr>
      <tr><td style="padding: 8px 0; color: #64748b;">Cajas cotizadas:</td><td style="padding: 8px 0; font-weight: bold; color: #0284c7; font-size: 18px;">{{boxCount}} caja(s)</td></tr>
      <tr><td style="padding: 8px 0; color: #64748b;">Total de unidades:</td><td style="padding: 8px 0; font-weight: bold; color: #0f172a;">{{totalUnits}} unidades</td></tr>
      <tr><td style="padding: 8px 0; color: #64748b;">Fecha y Hora:</td><td style="padding: 8px 0; color: #0f172a;">{{timestamp}}</td></tr>
    </table>
    <div style="margin-top: 24px; padding: 12px; background-color: #f8fafc; border-left: 4px solid #10b981; border-radius: 4px;">
      <p style="margin: 0; font-size: 14px; color: #334155;">El cliente fue redirigido al chat de WhatsApp oficial para coordinar el cierre comercial.</p>
    </div>
  </div>
</div>
```

---

## 5. Implementación en Cliente (Frontend Fail-Soft y Soporte Móvil P0)

El cliente no debe quedar bloqueado por popups en navegadores móviles (iOS Safari) ni esperar a que Resend o Google Sheets respondan:

```javascript
// Disparador al clic directo en "Cotizar por WhatsApp" (1 clic)
async function handleConfirmQuote(payload, whatsappUrl) {
  // 1. Despacho en background con keepalive (garantiza entrega en Edge aún tras descarga de página)
  fetch('/api/lead', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
    keepalive: true
  }).catch((err) => {
    // Log silencioso; fail-soft para nunca interrumpir la venta
    console.warn('Registro asíncrono en proceso');
  });

  // 2. Redirección blindada contra popup blockers
  const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
  
  if (isMobile) {
    // En smartphones: navegación directa en la misma ventana evita popup blocker de Safari
    window.location.href = whatsappUrl;
  } else {
    // En desktop: abre WhatsApp Web en pestaña secundaria limpia
    window.open(whatsappUrl, '_blank', 'noopener,noreferrer');
  }
}
```

---

## 6. Variables de Entorno Requeridas (`.env`)

| Variable | Tipo | Ámbito | Descripción |
| :--- | :--- | :--- | :--- |
| `PUBLIC_SITE_URL` | String | Público (Cliente/Servidor) | Dominio oficial (`https://aceitedemotorlima.com`) |
| `PUBLIC_WHATSAPP_NUMBER` | String | Público | Número del asesor (ej. 519XXXXXXXX) |
| `PUBLIC_WHATSAPP_DEFAULT_PREFIX` | String | Público | Saludo inicial pre-armado |
| `RESEND_API_KEY` | String (Secreto) | Servidor Privado | Clave de API de Resend |
| `RESEND_FROM_EMAIL` | String | Servidor Privado | Remitente verificado en Resend |
| `ADMIN_NOTIFICATION_EMAIL` | String | Servidor Privado | Correo del Administrador receptor |
| `GOOGLE_SHEETS_WEBHOOK_URL`| String (Secreto) | Servidor Privado | Webhook de Google Apps Script |
| `GOOGLE_SHEETS_WEBHOOK_SECRET` | String (Secreto) | Servidor Privado | Token secreto de autenticación |
