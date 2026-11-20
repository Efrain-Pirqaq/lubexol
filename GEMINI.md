# Contexto y Reglas de Proyecto — Aceite de Motor Lima

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

- **Nombre del Proyecto:** Aceite de Motor Lima (Distribuidor Mayorista Lubexol).
- **Dominio Oficial:** `https://aceitedemotorlima.com` (producción activa en Cloudflare Pages).
- **Modelo Comercial:** Venta mayorista por caja cerrada de 15 o 20 unidades (1L) para taxistas, particulares y talleres mecánicos en Lima y Callao.
- **Marca y Fórmulas:** Marca comercial del distribuidor: "Aceite de Motor Lima". Catálogo oficial: 6 fórmulas homologadas Lubexol con precinto de inviolabilidad y trazabilidad de fábrica.
- **Canal de Ventas / Contacto:** WhatsApp oficial del vendedor parametrizado en `.env` (`PUBLIC_WHATSAPP_NUMBER="51987448943"`).
- **Archivo de trabajo para auditoría entre agentes:** `handoff.md` (bitácora viva). `CONTROL-DE-DECISIONES.md` y `GEMINI.md` son referencias sincrónicas obligatorias.

---

## 3. Stack Tecnológico (Aprobado D-11)

- **Arquitectura Base:** Astro 5 + Tailwind CSS + Cloudflare Pages (Edge SSR / SSG).
- **Backend / Integraciones:** Endpoint serverless `/api/lead` + Resend SDK (Alertas email a Admin `zoevarcasd@gmail.com`). Integración con Google Sheets Webhook preparada en código (Fase 1: alertas por email operativas; enlace de webhook pendiente de URL en producción).
- **Canal de Ventas:** WhatsApp directo (`wa.me`) con mensaje pre-armado y flujo ágil de 1 clic (modal descartado para maximizar conversión CRO y eliminar fricción en móviles).
- **Control de Versiones:** Git (Commits atómicos descriptivos).

---

## 4. Comandos Físicos de Verificacion

- **Compilación de Producción:** `npm run build`
- **Chequeo de Tipos y Linter:** `npm run lint`
- **Suite de Pruebas Automatizadas:** `npm run test`
