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
   - Arquitectura orientada a capas gratuitas/Serverless de alto rendimiento (Cloudflare Pages + Google Sheets / Resend Free Tier).

---

## 2. Identidad y Dominio del Proyecto

- **Nombre del Proyecto:** Aceite de Motor Lima (Distribuidor Mayorista Lubexol).
- **Dominio Oficial:** `https://aceitedemotorlima.com` (producción activa en Cloudflare Pages).
- **Modelo Comercial:** Venta mayorista por caja cerrada de 15 o 20 unidades (1L) para taxistas, particulares y talleres mecánicos en Lima y Callao.
- **Marca y Fórmulas:** Marca comercial del distribuidor: "Aceite de Motor Lima". Catálogo oficial: 6 fórmulas homologadas Lubexol con precinto de inviolabilidad y trazabilidad de fábrica.
- **Canal de Ventas / Contacto:** WhatsApp oficial del vendedor parametrizado en `.env` (`PUBLIC_WHATSAPP_NUMBER="51987448943"`).
- **Archivo de trabajo para auditoría entre agentes:** `handoff.md` (bitácora viva). `GEMINI.md` y `LUBEXOL-STARTER-KIT-v1.0/00-MAESTRO/CONTROL-DE-DECISIONES.md` son referencias sincrónicas obligatorias.
- **Garantía comercial:** la *Garantía de Primera Botella* fue **retirada** por decisión del PO (22/11/2026, D-22). No volver a promocionarla en la web ni en el blog; se mantiene la garantía legal por producto defectuoso.

---

## 3. Stack Tecnológico (Aprobado D-11)

- **Arquitectura Base:** Astro 5 + Tailwind CSS + Cloudflare Pages (Edge SSR / SSG).
- **Backend / Integraciones:** Endpoint serverless `/api/lead` + Resend API (vía `fetch`; alertas email a Admin `zoevarcasd@gmail.com`). **Google Sheets operativo** (`Catalogo_Productos` para catálogo dinámico y `Leads_Lubexol` para leads) con fallback estático tipado. **Precios de referencia centralizados en `src/data/prices.ts`**: caja de 15u pública (S/ 180 multigrado, S/ 112 monogrado) y caja de 20u solo por cotización.
- **Catálogo:** dinámico desde Google Sheets con *deploy hook* de 1 clic; la web degrada al catálogo estático si la hoja falla.
- **Canal de Ventas:** WhatsApp directo (`wa.me`) con mensaje pre-armado y flujo ágil de 1 clic (modal descartado para maximizar conversión CRO y eliminar fricción en móviles).
- **Control de Versiones:** Git (Commits atómicos descriptivos).

---

## 4. Comandos Físicos de Verificacion

- **Compilación de Producción:** `npm run build`
- **Chequeo de Tipos y Linter:** `npm run lint`
- **Suite de Pruebas Automatizadas:** `npm run test`
