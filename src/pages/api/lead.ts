import type { APIRoute } from 'astro';
import { CreateLeadPayloadSchema } from '@/lib/contracts/lead';
import { getCatalog } from '@/services/catalog';
import type { Product } from '@/lib/contracts/catalog';

import { isHoneypotTriggered, isTooFast, isRateLimited, recordLead } from '@/lib/lead-guards';

// Rate limiter en memoria por isolate (best-effort). Ver handoff §81 P1-81-4:
// cuenta solo leads persistidos; los rechazos de validación no consumen cupo.
const rateMap = new Map<string, number[]>();

const DISPATCH_TIMEOUT_MS = 5000;

const SOURCE_LABEL: Record<string, string> = {
  direct_whatsapp_catalog: 'Portada',
  catalogo_direct: 'Catálogo',
  blog_related_product: 'Blog',
  podcast_related_product: 'Podcast',
};

function getEnv(locals: any) {
  const runtimeEnv = locals?.runtime?.env || {};
  return {
    sheetsUrl: runtimeEnv.GOOGLE_SHEETS_WEBHOOK_URL || import.meta.env.GOOGLE_SHEETS_WEBHOOK_URL,
    sheetsSecret: runtimeEnv.GOOGLE_SHEETS_WEBHOOK_SECRET || import.meta.env.GOOGLE_SHEETS_WEBHOOK_SECRET,
    resendKey: runtimeEnv.RESEND_API_KEY || import.meta.env.RESEND_API_KEY,
    resendFrom: runtimeEnv.RESEND_FROM_EMAIL || import.meta.env.RESEND_FROM_EMAIL,
    adminEmail: runtimeEnv.ADMIN_NOTIFICATION_EMAIL || import.meta.env.ADMIN_NOTIFICATION_EMAIL,
    siteUrl: runtimeEnv.PUBLIC_SITE_URL || import.meta.env.PUBLIC_SITE_URL || 'https://aceitedemotorlima.com',
  };
}

/** Escapa valores dinámicos antes de interpolarlos en el HTML del correo. */
function escapeHtml(value: unknown): string {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/** Evita inyección de cabeceras en el asunto del correo. */
function sanitizeHeader(value: string): string {
  return value.replace(/[\r\n]+/g, ' ').trim();
}

export const POST: APIRoute = async ({ request, clientAddress, locals }) => {
  const ip = request.headers.get('cf-connecting-ip') || clientAddress || '127.0.0.1';

  // Validación de Origin (producción)
  const origin = request.headers.get('origin');
  const env = getEnv(locals);
  if (origin) {
    const cleanOrigin = origin.replace(/\/$/, '');
    const cleanSiteUrl = (env.siteUrl || 'https://aceitedemotorlima.com').replace(/\/$/, '');
    const allowed = [cleanSiteUrl, 'https://aceitedemotorlima.com', 'https://www.aceitedemotorlima.com'];
    if (import.meta.env.DEV || cleanSiteUrl.includes('localhost')) {
      allowed.push('http://localhost:4321', 'http://127.0.0.1:4321');
    }
    if (!allowed.includes(cleanOrigin)) {
      return new Response(JSON.stringify({ success: false, error: 'Origen no permitido' }), { status: 403 });
    }
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return new Response(JSON.stringify({ success: false, error: 'JSON inválido' }), { status: 400 });
  }

  // Honeypot: si viene con texto, responder 200 falso y abortar silenciosamente.
  if (isHoneypotTriggered(body)) {
    return new Response(JSON.stringify({ success: true, leadId: 'hp', message: 'OK' }), { status: 200 });
  }

  // Velocidad inhumana
  const renderTs = (body as any)?.renderTimestamp;
  if (typeof renderTs === 'number' && Date.now() - renderTs < 0) {
    console.warn('Reloj del cliente adelantado; procesando lead con advertencia.');
  }
  if (isTooFast(renderTs)) {
    return new Response(JSON.stringify({ success: false, error: 'Solicitud demasiado rápida' }), { status: 400 });
  }

  const parsed = CreateLeadPayloadSchema.safeParse(body);
  if (!parsed.success) {
    return new Response(JSON.stringify({ success: false, error: 'Esquema de cotización incompleto o alterado' }), { status: 400 });
  }

  const data = parsed.data;

  // Validación contra catálogo (dinámico desde Google Sheets con fallback seguro)
  let canonical: Product | undefined;
  const currentCatalog = await getCatalog();
  if (currentCatalog.length > 0) {
    canonical = currentCatalog.find(
      (p) => p.id === data.productId || p.id.includes(data.productId) || data.productId.includes(p.id)
    );
    if (!canonical) {
      return new Response(JSON.stringify({ success: false, error: 'Producto no encontrado' }), { status: 400 });
    }
    const variant = canonical.variants.find((v) => v.volume === data.containerSize);
    if (!variant || !variant.allowedBoxUnits.includes(data.boxUnits)) {
      return new Response(JSON.stringify({ success: false, error: 'Combinación envase/caja no válida' }), { status: 400 });
    }
  }

  // Recomputar totalUnits en servidor
  const totalUnits = data.boxUnits * data.boxCount;
  if (totalUnits !== data.totalUnits) {
    return new Response(JSON.stringify({ success: false, error: 'Total de unidades inconsistente' }), { status: 400 });
  }

  // El catálogo es la fuente de verdad: no se confía en nombre/combustible del cliente.
  const lead = {
    ...data,
    productName: canonical?.name || data.productName,
    fuelCompatibility: canonical?.fuelCompatibility || data.fuelCompatibility,
  };

  // Rate limit DESPUÉS de validar: un 400 no debe quemar el cupo del PO/cliente.
  if (isRateLimited(ip, rateMap)) {
    return new Response(JSON.stringify({ success: false, error: 'Demasiadas solicitudes' }), {
      status: 429,
      headers: { 'Retry-After': '300' },
    });
  }

  const leadId = `lead_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;

  // Adaptadores (solo si hay configuración)
  const { sheetsUrl, sheetsSecret, resendKey, resendFrom, adminEmail } = env;

  const dispatches: { name: 'sheets' | 'email'; run: Promise<void> }[] = [];

  if (sheetsUrl && sheetsSecret) {
    dispatches.push({
      name: 'sheets',
      run: fetch(sheetsUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...lead, leadId, timestamp: new Date().toISOString(), secret: sheetsSecret, totalUnits }),
        signal: AbortSignal.timeout(DISPATCH_TIMEOUT_MS),
      }).then(async (r) => {
        if (!r.ok) throw new Error(`Sheets HTTP ${r.status}`);
        // Apps Script responde HTTP 200 incluso cuando rechaza ({"error":"No autorizado"}).
        // Se valida el cuerpo para no reportar éxito falso (handoff §81 P1-81-3).
        const payload = await r.json().catch(() => null);
        if (payload && typeof payload === 'object' && 'error' in payload) {
          throw new Error(`Sheets rechazó el lead: ${String((payload as { error: unknown }).error)}`);
        }
      }),
    });
  }

  if (resendKey && resendFrom && adminEmail) {
    const channel = SOURCE_LABEL[lead.source] || lead.source;
    const contentUrl = lead.contentSlug
      ? `${env.siteUrl}/${lead.source === 'podcast_related_product' ? 'podcast' : 'blog'}/${lead.contentSlug}`
      : '';

    const html = [
      `<p>Lead: ${escapeHtml(leadId)}</p>`,
      `<p>Canal: ${escapeHtml(channel)} (${escapeHtml(lead.source)})</p>`,
      contentUrl ? `<p>Contenido: <a href="${escapeHtml(contentUrl)}">${escapeHtml(contentUrl)}</a></p>` : '',
      `<p>Producto: ${escapeHtml(lead.productName)}</p>`,
      `<p>Combustible: ${escapeHtml(lead.fuelCompatibility.join(', '))}</p>`,
      `<p>Envase: ${escapeHtml(lead.containerSize)}</p>`,
      `<p>Caja: ${escapeHtml(lead.boxUnits)}u</p>`,
      `<p>Cajas: ${escapeHtml(lead.boxCount)}</p>`,
      `<p>Total: ${escapeHtml(totalUnits)}</p>`,
      `<p>Fecha: ${escapeHtml(new Date().toISOString())}</p>`,
    ]
      .filter(Boolean)
      .join('');

    dispatches.push({
      name: 'email',
      run: fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${resendKey}`,
        },
        body: JSON.stringify({
          from: resendFrom,
          to: [adminEmail],
          subject: `🚨 [Nuevo Lead Lubexol] ${channel} · ${lead.boxCount} caja(s) · ${sanitizeHeader(lead.productName)}`,
          html,
        }),
        signal: AbortSignal.timeout(DISPATCH_TIMEOUT_MS),
      }).then((r) => {
        if (!r.ok) throw new Error(`Resend HTTP ${r.status}`);
      }),
    });
  }

  if (dispatches.length === 0) {
    console.warn('Adaptadores no configurados; lead no persistido.');
    recordLead(ip, rateMap);
    return new Response(JSON.stringify({ success: true, leadId, message: 'Lead registrado' }), { status: 200 });
  }

  const results = await Promise.allSettled(dispatches.map((d) => d.run));
  const failures = results.flatMap((r, i) => (r.status === 'rejected' ? [dispatches[i].name] : []));

  if (failures.length > 0) {
    console.error('[lead] despacho fallido', { leadId, failures });
  }

  // Google Sheets es la fuente de verdad del CRM: si falla, no se declara éxito.
  if (failures.includes('sheets')) {
    return new Response(JSON.stringify({ success: false, error: 'No se pudo persistir el lead' }), { status: 502 });
  }

  if (failures.length === dispatches.length) {
    return new Response(JSON.stringify({ success: false, error: 'Error interno al despachar notificaciones' }), { status: 500 });
  }

  recordLead(ip, rateMap);
  return new Response(JSON.stringify({ success: true, leadId, message: 'Lead registrado' }), { status: 200 });
};
