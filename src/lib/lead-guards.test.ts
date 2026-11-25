import { describe, it, expect } from 'vitest';
import {
  isHoneypotTriggered,
  isTooFast,
  isRateLimited,
  recordLead,
  RATE_LIMIT_WINDOW_MS,
} from './lead-guards';

describe('lead guards', () => {
  it('honeypot detecta texto', () => {
    expect(isHoneypotTriggered({ website_hp: 'spam' })).toBe(true);
    expect(isHoneypotTriggered({ website_hp: '' })).toBe(false);
    expect(isHoneypotTriggered({})).toBe(false);
  });

  it('isTooFast bloquea < 500ms', () => {
    const now = 10000;
    expect(isTooFast(now - 100, now)).toBe(true);
    expect(isTooFast(now - 2000, now)).toBe(false);
  });

  it('isTooFast no bloquea si reloj adelantado (elapsed negativo)', () => {
    const now = 10000;
    expect(isTooFast(now + 5000, now)).toBe(false);
  });

  it('rate limit bloquea tras 3 leads persistidos en la ventana', () => {
    const store = new Map<string, number[]>();
    const now = 10000;
    for (let i = 0; i < 3; i++) {
      expect(isRateLimited('ip1', store, now + i)).toBe(false);
      recordLead('ip1', store, now + i);
    }
    expect(isRateLimited('ip1', store, now + 3)).toBe(true);
  });

  it('los intentos no registrados no consumen cupo (400 no bloquea)', () => {
    const store = new Map<string, number[]>();
    const now = Date.now();
    for (let i = 0; i < 10; i++) {
      expect(isRateLimited('ip2', store, now + i)).toBe(false);
    }
    expect(store.has('ip2')).toBe(false);
  });

  it('la ventana expira y libera el cupo', () => {
    const store = new Map<string, number[]>();
    const now = 1000;
    for (let i = 0; i < 3; i++) recordLead('ip3', store, now + i);
    expect(isRateLimited('ip3', store, now + 3)).toBe(true);
    expect(isRateLimited('ip3', store, now + RATE_LIMIT_WINDOW_MS + 3)).toBe(false);
    expect(store.has('ip3')).toBe(false);
  });
});
