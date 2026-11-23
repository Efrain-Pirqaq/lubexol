import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { FEATURES } from './features';

describe('feature flags de portada', () => {
  it('mantiene oculta la Garantía de Primera Botella (decisión PO 22/11/2026)', () => {
    expect(FEATURES.showFirstBottleGuarantee).toBe(false);
  });

  it('no promociona la garantía retirada en los artículos del blog', () => {
    const posts = [
      'aceite-de-motor-por-caja-lima.md',
      'aceite-para-taxi-gnv-glp-lima.md',
      'distribuidor-lubricantes-lima.md',
    ];

    for (const post of posts) {
      const url = new URL(`../content/blog/${post}`, import.meta.url);
      const content = readFileSync(url, 'utf8').toLowerCase();
      expect(content, post).not.toContain('garantía de primera botella');
      expect(content, post).not.toContain('garantia de primera botella');
      expect(content, post).not.toContain('prueba la primera botella');
    }
  });
});
