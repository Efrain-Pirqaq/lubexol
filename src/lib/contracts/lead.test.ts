import { describe, it, expect } from 'vitest';
import { CreateLeadPayloadSchema } from './lead';

const base = {
  productId: 'lubexol-optimus-premium-20w50',
  productName: 'Lubexol Optimus Premium SAE 20W-50',
  fuelCompatibility: ['Gasolina'],
  containerSize: '1L',
  boxUnits: 15,
  boxCount: 2,
  totalUnits: 30,
  source: 'direct_whatsapp_catalog',
  timestamp: new Date().toISOString(),
};

describe('CreateLeadPayloadSchema', () => {
  it('acepta payload válido de portada', () => {
    expect(CreateLeadPayloadSchema.safeParse(base).success).toBe(true);
  });

  it('acepta /catalogo como fuente', () => {
    const result = CreateLeadPayloadSchema.safeParse({ ...base, source: 'catalogo_direct' });
    expect(result.success).toBe(true);
  });

  it('rechaza totalUnits incorrecto', () => {
    const result = CreateLeadPayloadSchema.safeParse({ ...base, totalUnits: 99 });
    expect(result.success).toBe(false);
  });

  it('acepta origen editorial con contentSlug válido', () => {
    const result = CreateLeadPayloadSchema.safeParse({
      ...base,
      source: 'blog_related_product',
      contentSlug: 'aceite-para-taxi-gnv-glp-lima',
    });
    expect(result.success).toBe(true);
  });

  it('exige contentSlug en fuentes editoriales', () => {
    const result = CreateLeadPayloadSchema.safeParse({ ...base, source: 'podcast_related_product' });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues.some((i) => i.path.includes('contentSlug'))).toBe(true);
    }
  });

  it('rechaza slugs con caracteres inseguros', () => {
    for (const contentSlug of ['../etc/passwd', 'Blog-Mayusculas', 'con espacio', 'a'.repeat(121)]) {
      const result = CreateLeadPayloadSchema.safeParse({
        ...base,
        source: 'blog_related_product',
        contentSlug,
      });
      expect(result.success, contentSlug).toBe(false);
    }
  });

  it('rechaza fuentes desconocidas o retiradas (product_card_direct)', () => {
    expect(CreateLeadPayloadSchema.safeParse({ ...base, source: 'product_card_direct' }).success).toBe(false);
    expect(CreateLeadPayloadSchema.safeParse({ ...base, source: 'instagram' }).success).toBe(false);
  });
});
