/**
 * Cliente de registro de leads.
 *
 * Estrategia de transporte:
 * 1. `navigator.sendBeacon` (fire-and-forget, sobrevive al descargue de la página).
 * 2. Fallback a `fetch(..., { keepalive: true })` si el navegador no puede encolar
 *    el beacon (cola llena / API ausente).
 *
 * En ambos casos la navegación a WhatsApp NO se bloquea: el usuario es lo primero.
 * Ver handoff §81/§82 (P1-81-5: persistencia móvil best-effort).
 */

export interface LeadDraft {
  productId: string;
  productName: string;
  fuelCompatibility: string[];
  containerSize: string;
  boxUnits: number;
  boxCount: number;
  totalUnits: number;
  source: string;
  contentSlug?: string;
  timestamp: string;
  renderTimestamp: number;
  website_hp: string;
}

const ENDPOINT = '/api/lead';

export function sendLead(payload: LeadDraft): boolean {
  const body = JSON.stringify(payload);

  try {
    if (typeof navigator !== 'undefined' && typeof navigator.sendBeacon === 'function') {
      const queued = navigator.sendBeacon(
        ENDPOINT,
        new Blob([body], { type: 'application/json' })
      );
      if (queued) return true;
    }
  } catch {
    // sendBeacon no disponible o bloqueado: se intenta el fallback
  }

  try {
    fetch(ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body,
      keepalive: true,
    }).catch(() => console.warn('Registro de lead no confirmado por el navegador'));
    return true;
  } catch {
    return false;
  }
}

/**
 * Activa el registro de leads en los botones de producto de blog/podcast.
 * El <a> conserva su href y su mensaje de WhatsApp; solo se le añade telemetría.
 */
export function initEditorialLeadCtas(): void {
  if (typeof document === 'undefined') return;

  const pageLoadTimestamp = Date.now();

  document.addEventListener('click', (event) => {
    const target = event.target;
    if (!(target instanceof Element)) return;

    const link = target.closest('[data-lead-cta]');
    if (!(link instanceof HTMLAnchorElement)) return;

    // Solo se registra el clic si realmente abre WhatsApp (no el fallback /catalogo).
    if (!link.href.startsWith('https://wa.me/')) return;

    const productId = link.dataset.productId || '';
    const boxUnits = Number(link.dataset.boxUnits);
    if (!productId || !Number.isFinite(boxUnits) || boxUnits <= 0) return;

    sendLead({
      productId,
      productName: link.dataset.productName || '',
      fuelCompatibility: (link.dataset.fuel || '').split(',').filter(Boolean),
      containerSize: link.dataset.containerSize || '',
      boxUnits,
      boxCount: 1,
      totalUnits: boxUnits,
      source: link.dataset.source || '',
      contentSlug: link.dataset.contentSlug || undefined,
      timestamp: new Date().toISOString(),
      renderTimestamp: pageLoadTimestamp,
      website_hp: '',
    });
  });
}
