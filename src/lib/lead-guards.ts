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

export function isRateLimited(
  ip: string,
  store: Map<string, number[]>,
  now: number = Date.now(),
  limit: number = 3,
  windowMs: number = 5 * 60 * 1000
): boolean {
  const hits = (store.get(ip) || []).filter((t) => now - t < windowMs);
  if (hits.length >= limit) {
    store.set(ip, hits);
    return true;
  }
  hits.push(now);
  store.set(ip, hits);
  return false;
}
