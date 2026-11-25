export const RATE_LIMIT_MAX = 3;
export const RATE_LIMIT_WINDOW_MS = 5 * 60 * 1000;

export function isHoneypotTriggered(body: unknown): boolean {
  const hp = (body as any)?.website_hp;
  return typeof hp === 'string' && hp.trim() !== '';
}

export function isTooFast(renderTs: unknown, now: number = Date.now()): boolean {
  if (typeof renderTs !== 'number') return false;
  const elapsed = now - renderTs;
  if (elapsed < 0) return false; // reloj cliente adelantado: no bloquear
  return elapsed < 500; // umbral anti-bot automatizado (<500ms) evitando falsos positivos en usuarios humanos
}

/**
 * Consulta si la IP ya alcanzó el máximo de leads **persistidos** en la ventana.
 * No registra el intento: los envíos que fallan en validación no consumen cupo.
 * Decisión PO (24/11/2026): 3 leads / 5 min por IP, sin cambios.
 */
export function isRateLimited(
  ip: string,
  store: Map<string, number[]>,
  now: number = Date.now(),
  limit: number = RATE_LIMIT_MAX,
  windowMs: number = RATE_LIMIT_WINDOW_MS
): boolean {
  const hits = (store.get(ip) || []).filter((t) => now - t < windowMs);
  if (hits.length === 0) {
    store.delete(ip); // evita crecimiento indefinido del Map
  } else {
    store.set(ip, hits);
  }
  return hits.length >= limit;
}

/**
 * Registra un lead efectivamente despachado. Solo se llama cuando la
 * persistencia tuvo éxito, para que un `400`/`502` no bloquee al cliente.
 */
export function recordLead(
  ip: string,
  store: Map<string, number[]>,
  now: number = Date.now(),
  windowMs: number = RATE_LIMIT_WINDOW_MS
): void {
  const hits = (store.get(ip) || []).filter((t) => now - t < windowMs);
  hits.push(now);
  store.set(ip, hits);
}
