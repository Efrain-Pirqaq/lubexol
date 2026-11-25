import { afterEach, describe, expect, it, vi } from 'vitest';
import { POST } from './lead';

const validPayload = {
  productId: 'lubexol-optimus-premium-20w50',
  productName: 'Lubexol Optimus Premium SAE 20W-50',
  fuelCompatibility: ['Gasolina', 'GNV'],
  containerSize: '1L',
  boxUnits: 15,
  boxCount: 2,
  totalUnits: 30,
  source: 'direct_whatsapp_catalog',
  timestamp: new Date().toISOString(),
  renderTimestamp: Date.now() - 3000, // 3 segundos atrás
  website_hp: '',
};

const runtimeEnv = {
  GOOGLE_SHEETS_WEBHOOK_URL: 'https://script.google.com/macros/s/test/exec',
  GOOGLE_SHEETS_WEBHOOK_SECRET: 'test_secret',
  RESEND_API_KEY: 're_test',
  RESEND_FROM_EMAIL: 'notificaciones@aceitedemotorlima.com',
  ADMIN_NOTIFICATION_EMAIL: 'admin@example.com',
  PUBLIC_SITE_URL: 'https://aceitedemotorlima.com',
};
const withEnv = { runtime: { env: runtimeEnv } };
const siteEnv = { runtime: { env: { PUBLIC_SITE_URL: 'https://aceitedemotorlima.com' } } };

function buildRequest(payload: unknown, origin?: string) {
  return new Request('http://localhost/api/lead', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(origin ? { Origin: origin } : {}),
    },
    body: JSON.stringify(payload),
  });
}

async function post(payload: unknown, ip: string, locals: any = {}, origin?: string) {
  return POST({ request: buildRequest(payload, origin), clientAddress: ip, locals } as any);
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('POST /api/lead', () => {
  it('procesa cotización legítima y retorna 200', async () => {
    const response = await post(validPayload, '127.0.0.1');
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.success).toBe(true);
    expect(body.leadId).toBeDefined();
  });

  it('detecta honeypot y retorna 200 falso sin procesar', async () => {
    const response = await post({ ...validPayload, website_hp: 'bot_text' }, '127.0.0.2');
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.success).toBe(true);
    expect(body.leadId).toBe('hp');
  });

  it('rechaza si la interacción es demasiado rápida (< 500ms)', async () => {
    const response = await post({ ...validPayload, renderTimestamp: Date.now() - 100 }, '127.0.0.3');
    expect(response.status).toBe(400);
    const body = await response.json();
    expect(body.error).toBe('Solicitud demasiado rápida');
  });

  it('no bloquea si el reloj del cliente está adelantado', async () => {
    const response = await post({ ...validPayload, renderTimestamp: Date.now() + 5000 }, '127.0.0.4');
    expect(response.status).toBe(200);
  });

  it('rechaza inconsistencia en totalUnits', async () => {
    const response = await post({ ...validPayload, totalUnits: 999 }, '127.0.0.5');
    expect(response.status).toBe(400);
  });

  it('acepta un lead editorial de blog con contentSlug', async () => {
    const response = await post(
      { ...validPayload, source: 'blog_related_product', contentSlug: 'aceite-para-taxi-gnv-glp-lima' },
      '127.0.0.20'
    );
    expect(response.status).toBe(200);
  });

  it('rechaza un lead editorial sin contentSlug', async () => {
    const response = await post(
      { ...validPayload, source: 'podcast_related_product' },
      '127.0.0.21'
    );
    expect(response.status).toBe(400);
  });

  it('rechaza solicitudes de origen no autorizado', async () => {
    const response = await post(validPayload, '127.0.0.6', siteEnv, 'https://malicious-site.com');
    expect(response.status).toBe(403);
    const body = await response.json();
    expect(body.error).toBe('Origen no permitido');
  });

  it('permite solicitudes con Origin legítimo de producción', async () => {
    const response = await post(validPayload, '127.0.0.7', siteEnv, 'https://aceitedemotorlima.com');
    expect(response.status).toBe(200);
  });

  it('bloquea por rate limit tras 3 leads persistidos en la ventana', async () => {
    const ip = '192.168.1.100';

    for (let i = 0; i < 3; i++) {
      const res = await post(validPayload, ip);
      expect(res.status).toBe(200);
    }

    const resBlocked = await post(validPayload, ip);
    expect(resBlocked.status).toBe(429);
    expect(resBlocked.headers.get('Retry-After')).toBe('300');
    const body = await resBlocked.json();
    expect(body.error).toBe('Demasiadas solicitudes');
  });

  it('un 400 de validación no consume cupo del rate limit', async () => {
    const ip = '192.168.1.101';

    for (let i = 0; i < 6; i++) {
      const rejected = await post({ ...validPayload, totalUnits: 999 }, ip);
      expect(rejected.status).toBe(400);
    }

    const ok = await post(validPayload, ip);
    expect(ok.status).toBe(200);
  });

  it('no reporta éxito si el webhook responde 200 con {"error": ...}', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async (url: any) => {
        const u = String(url);
        if (u.includes('docs.google.com')) throw new Error('sin red en test');
        if (u.includes('script.google.com')) {
          return { ok: true, status: 200, json: async () => ({ error: 'No autorizado' }) };
        }
        return { ok: true, status: 200, json: async () => ({ id: 'mail_ok' }) };
      })
    );

    const response = await post(validPayload, '127.0.0.30', withEnv);
    expect(response.status).toBe(502);
    const body = await response.json();
    expect(body.success).toBe(false);
  });

  it('persiste canal y contenido en Sheets y escapa el HTML del correo', async () => {
    const calls: { url: string; body: any }[] = [];
    vi.stubGlobal(
      'fetch',
      vi.fn(async (url: any, init: any) => {
        const u = String(url);
        if (u.includes('docs.google.com')) throw new Error('sin red en test');
        calls.push({ url: u, body: JSON.parse(init.body) });
        return { ok: true, status: 200, json: async () => ({ success: true }) };
      })
    );

    const response = await post(
      {
        ...validPayload,
        // El cliente manda un nombre manipulado: el servidor debe imponer el catálogo.
        productName: '<img src=x onerror=alert(1)>',
        source: 'blog_related_product',
        contentSlug: 'aceite-para-taxi-gnv-glp-lima',
      },
      '127.0.0.31',
      withEnv
    );
    expect(response.status).toBe(200);

    const sheets = calls.find((c) => c.url.includes('script.google.com'));
    expect(sheets?.body.source).toBe('blog_related_product');
    expect(sheets?.body.contentSlug).toBe('aceite-para-taxi-gnv-glp-lima');
    expect(sheets?.body.productName).toBe('Lubexol Optimus Premium SAE 20W-50');

    const email = calls.find((c) => c.url.includes('api.resend.com'));
    expect(email?.body.subject).toContain('Blog');
    expect(email?.body.html).toContain('blog/aceite-para-taxi-gnv-glp-lima');
    expect(email?.body.html).not.toContain('<img');
    expect(email?.body.html).toContain('Lubexol Optimus Premium SAE 20W-50');
  });
});
