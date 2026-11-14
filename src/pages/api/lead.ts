import type { APIRoute } from 'astro';
import { CreateLeadPayloadSchema } from '@/lib/contracts/lead';
import { catalog } from '@/data/catalog';

import { isHoneypotTriggered, isTooFast, isRateLimited } from '@/lib/lead-guards';

// Rate limiter en memoria (dev). En producción usar Cloudflare Rate Limiting binding.
const rateMap = new Map<string, number[]>();

function getEnv(locals: any) {
  const runtimeEnv = locals?.runtime?.env || {};
  return {
    sheetsUrl: runtimeEnv.GOOGLE_SHEETS_WEBHOOK_URL || import.meta.env.GOOGLE_SHEETS_WEBHOOK_URL,
    sheetsSecret: runtimeEnv.GOOGLE_SHEETS_WEBHOOK_SECRET || import.meta.env.GOOGLE_SHEETS_WEBHOOK_SECRET,
    resendKey: runtimeEnv.RESEND_API_KEY || import.meta.env.RESEND_API_KEY,
    resendFrom: runtimeEnv.RESEND_FROM_EMAIL || import.meta.env.RESEND_FROM_EMAIL,
    adminEmail: runtimeEnv.ADMIN_NOTIFICATION_EMAIL || import.meta.env.ADMIN_NOTIFICATION_EMAIL,
    siteUrl: runtimeEnv.PUBLIC_SITE_URL || import.meta.env.PUBLIC_SITE_URL,
  };
}

export const POST: APIRoute = async ({ request, clientAddress, locals }) => {
  const ip = request.headers.get('cf-connecting-ip') || clientAddress || '127.0.0.1';

  // Validación de Origin (producción)
  const origin = request.headers.get('origin');
  const env = getEnv(locals);
  if (env.siteUrl && origin && origin !== env.siteUrl) {
    return new Response(JSON.stringify({ success: false, error: 'Origen no permitido' }), { status: 403 });
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

  // Rate limit
  if (isRateLimited(ip, rateMap)) {
    return new Response(JSON.stringify({ success: false, error: 'Demasiadas solicitudes' }), { status: 429 });
  }

  const parsed = CreateLeadPayloadSchema.safeParse(body);
  if (!parsed.success) {
    return new Response(JSON.stringify({ success: false, error: 'Esquema de cotización incompleto o alterado' }), { status: 400 });
  }

  const data = parsed.data;

  // Validación contra catálogo (si hay productos cargados)
  if (catalog.length > 0) {
    const product = catalog.find((p) => p.id === data.productId);
    if (!product) {
      return new Response(JSON.stringify({ success: false, error: 'Producto no encontrado' }), { status: 400 });
    }
    const variant = product.variants.find((v) => v.volume === data.containerSize);
    if (!variant || !variant.allowedBoxUnits.includes(data.boxUnits)) {
      return new Response(JSON.stringify({ success: false, error: 'Combinación envase/caja no válida' }), { status: 400 });
    }
  }

  // Recomputar totalUnits en servidor
  const totalUnits = data.boxUnits * data.boxCount;
  if (totalUnits !== data.totalUnits) {
    return new Response(JSON.stringify({ success: false, error: 'Total de unidades inconsistente' }), { status: 400 });
  }

  const timestamp = new Date().toISOString();
  const leadId = `lead_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;

  // Adaptadores (solo si hay configuración)
  const { sheetsUrl, sheetsSecret, resendKey, resendFrom, adminEmail } = env;

  const dispatches: Promise<unknown>[] = [];

  if (sheetsUrl && sheetsSecret) {
    dispatches.push(
      fetch(sheetsUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...data, leadId, timestamp, secret: sheetsSecret, totalUnits }),
      }).then((r) => {
        if (!r.ok) throw new Error('Sheets error');
      })
    );
  }

  if (resendKey && resendFrom && adminEmail) {
    dispatches.push(
      fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${resendKey}`,
        },
        body: JSON.stringify({
          from: resendFrom,
          to: [adminEmail],
          subject: `🚨 [Nuevo Lead Lubexol] Cotización de ${data.boxCount} caja(s) - ${data.productName}`,
          html: `<p>Lead: ${leadId}</p><p>Producto: ${data.productName}</p><p>Combustible: ${data.fuelCompatibility.join(', ')}</p><p>Envase: ${data.containerSize}</p><p>Caja: ${data.boxUnits}u</p><p>Cajas: ${data.boxCount}</p><p>Total: ${totalUnits}</p><p>Fecha: ${timestamp}</p>`,
        }),
      }).then((r) => {
        if (!r.ok) throw new Error('Resend error');
      })
    );
  }

  if (dispatches.length > 0) {
    const results = await Promise.allSettled(dispatches);
    const failed = results.filter((r) => r.status === 'rejected');
    if (failed.length === dispatches.length) {
      return new Response(JSON.stringify({ success: false, error: 'Error interno al despachar notificaciones' }), { status: 500 });
    }
  } else {
    console.warn('Adaptadores no configurados; lead no persistido.');
  }

  return new Response(JSON.stringify({ success: true, leadId, message: 'Lead registrado' }), { status: 200 });
};
