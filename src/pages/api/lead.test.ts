import { describe, it, expect } from 'vitest';
import { POST } from './lead';

describe('POST /api/lead', () => {
  const validPayload = {
    productId: 'lubexol-optimus-premium-20w50',
    productName: 'Lubexol Optimus Premium SAE 20W-50',
    fuelCompatibility: ['Gasolina', 'GNV'],
    containerSize: '1L / Cuarto',
    boxUnits: 12,
    boxCount: 2,
    totalUnits: 24,
    source: 'product_card_modal',
    timestamp: new Date().toISOString(),
    renderTimestamp: Date.now() - 3000, // 3 segundos atrás
    website_hp: '',
  };

  it('procesa cotización legítima y retorna 200', async () => {
    const request = new Request('http://localhost/api/lead', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(validPayload),
    });

    const response = await POST({
      request,
      clientAddress: '127.0.0.1',
      locals: {},
    } as any);

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.success).toBe(true);
    expect(body.leadId).toBeDefined();
  });

  it('detecta honeypot y retorna 200 falso sin procesar', async () => {
    const request = new Request('http://localhost/api/lead', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...validPayload, website_hp: 'bot_text' }),
    });

    const response = await POST({
      request,
      clientAddress: '127.0.0.2',
      locals: {},
    } as any);

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.success).toBe(true);
    expect(body.leadId).toBe('hp');
  });

  it('rechaza si la interacción es demasiado rápida (< 1500ms)', async () => {
    const request = new Request('http://localhost/api/lead', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...validPayload, renderTimestamp: Date.now() - 100 }), // 100ms atrás
    });

    const response = await POST({
      request,
      clientAddress: '127.0.0.3',
      locals: {},
    } as any);

    expect(response.status).toBe(400);
    const body = await response.json();
    expect(body.success).toBe(false);
    expect(body.error).toBe('Solicitud demasiado rápida');
  });

  it('no bloquea si el reloj del cliente está adelantado', async () => {
    const request = new Request('http://localhost/api/lead', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...validPayload, renderTimestamp: Date.now() + 5000 }), // 5s en el futuro
    });

    const response = await POST({
      request,
      clientAddress: '127.0.0.4',
      locals: {},
    } as any);

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.success).toBe(true);
  });

  it('rechaza inconsistencia en totalUnits', async () => {
    const request = new Request('http://localhost/api/lead', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...validPayload, totalUnits: 999 }),
    });

    const response = await POST({
      request,
      clientAddress: '127.0.0.5',
      locals: {},
    } as any);

    expect(response.status).toBe(400);
    const body = await response.json();
    expect(body.success).toBe(false);
  });

  it('rechaza solicitudes de origen no autorizado (Origin !== siteUrl)', async () => {
    const request = new Request('http://localhost/api/lead', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Origin: 'https://malicious-site.com',
      },
      body: JSON.stringify(validPayload),
    });

    const response = await POST({
      request,
      clientAddress: '127.0.0.6',
      locals: {
        runtime: {
          env: { PUBLIC_SITE_URL: 'https://lubexol.pe' },
        },
      },
    } as any);

    expect(response.status).toBe(403);
    const body = await response.json();
    expect(body.success).toBe(false);
    expect(body.error).toBe('Origen no permitido');
  });

  it('bloquea por rate limit tras exceder 3 solicitudes en la ventana de tiempo', async () => {
    const ip = '192.168.1.100';

    for (let i = 0; i < 3; i++) {
      const req = new Request('http://localhost/api/lead', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(validPayload),
      });
      const res = await POST({ request: req, clientAddress: ip, locals: {} } as any);
      expect(res.status).toBe(200);
    }

    // 4ta solicitud desde la misma IP
    const reqBlocked = new Request('http://localhost/api/lead', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(validPayload),
    });
    const resBlocked = await POST({ request: reqBlocked, clientAddress: ip, locals: {} } as any);
    expect(resBlocked.status).toBe(429);
    const body = await resBlocked.json();
    expect(body.success).toBe(false);
    expect(body.error).toBe('Demasiadas solicitudes');
  });
});
