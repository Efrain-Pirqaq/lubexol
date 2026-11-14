# Contexto y Reglas de Proyecto — Lubexol

> Fuente Única de Verdad para este espacio de trabajo (Antigravity AI + Protocolo EGM).
> Estándar de gobernanza mandatoria y desarrollo seguro.

---

## 1. Gobernanza Mandatoria y Reglas de Oro (Genéricas Universales)

1. **Modo Planificación Primero (Cero Código sin Aprobación del PO):**
   - Toda nueva funcionalidad, esquema o cambio estructural debe formularse previamente en `docs/designs/` y validarse bajo el flujo EGM antes de modificar archivos en `src/`.
   - Se requiere autorización explícita del Product Owner (Efraín) antes de implementar.
2. **Seguridad Estricta y Cero Secretos:**
   - Secretos y variables privadas residen exclusivamente en `.env` (ignorado en `.gitignore`).
   - Se debe mantener siempre un `.env.example` con placeholders neutros y descriptivos.
3. **Veto Estricto a la Auto-Certificación:**
   - Queda terminantemente prohibido que el agente que implementa se auto-califique con '10/10' o declare 'listo' sin evidencia física.
   - La validación final exige comprobación en consola con código de salida limpio (`Exit code 0`) mediante los comandos oficiales.
4. **Política Fail-Closed y Cero Datos Demo:**
   - Prohibido quemar teléfonos ficticios (como 51987654321), RUCs inventados o correos demo en componentes.
   - Si un dato no existe en la base de datos o en este archivo, la interfaz debe degradar con gracia sin exponer placeholders.
5. **Costo Mínimo de Infraestructura:**
   - Arquitectura orientada a capas gratuitas/Serverless de alto rendimiento (Cloudflare + Supabase Free Tier).

---

## 2. Identidad y Dominio del Proyecto

- **Nombre del Proyecto:** Lubexol (Venta y cotización de lubricantes por caja/mayor para particulares y taxistas).
- **Estado de Definición:** Marca aprobada (Lubexol). Modelo de cotización ágil vía WhatsApp con destino a vendedor verificado.
- **Canal de Ventas / Contacto:** Por parametrizar en `.env`.
- **Archivo de trabajo para auditoría entre agentes:** `handoff.md` (bitácora viva). `CONTROL-DE-DECISIONES.md` y `GEMINI.md` son referencias; cambios se registran en `handoff.md`.

---

## 3. Stack Tecnológico (Propuesto — pendiente aprobación formal D-11)

- **Arquitectura Base (Aprobado D-11):** Astro 5 + Tailwind CSS + Cloudflare Pages. Alternativa Next.js solo si el PO la aprueba explícitamente.
- **Backend / Integraciones:** Endpoint serverless `/api/lead` + Google Apps Script Webhook (Leads en Google Sheets) + Resend SDK (Alertas email a Admin).
- **Canal de Ventas:** WhatsApp directo (`wa.me`) con mensaje pre-armado y flujo modal en 2 pasos sin selector de ubicación.
- **Control de Versiones:** Git (Commits atómicos descriptivos).

---

## 4. Comandos Físicos de Verificacion

- **Compilación de Producción:** `npm run build`
- **Chequeo de Tipos y Linter:** `npm run lint`
