import { describe, it, expect } from 'vitest';
import { isHoneypotTriggered, isTooFast, isRateLimited } from './lead-guards';

describe('lead guards', () => {
  it('honeypot detecta texto', () => {
    expect(isHoneypotTriggered({ website_hp: 'spam' })).toBe(true);
    expect(isHoneypotTriggered({ website_hp: '' })).toBe(false);
    expect(isHoneypotTriggered({})).toBe(false);
  });

  it('isTooFast bloquea < 1500ms', () => {
    const now = 10000;
    expect(isTooFast(now - 100, now)).toBe(true);
    expect(isTooFast(now - 2000, now)).toBe(false);
  });

  it('isTooFast no bloquea si reloj adelantado (elapsed negativo)', () => {
    const now = 10000;
    expect(isTooFast(now + 5000, now)).toBe(false);
  });

  it('rate limit bloquea tras 3 en ventana', () => {
    const store = new Map();
    const now = 10000;
    expect(isRateLimited('ip1', store, now)).toBe(false);
    expect(isRateLimited('ip1', store, now + 1)).toBe(false);
    expect(isRateLimited('ip1', store, now + 2)).toBe(false);
    expect(isRateLimited('ip1', store, now + 3)).toBe(true);
  });
});
