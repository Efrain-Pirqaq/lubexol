import { describe, it, expect } from 'vitest';
import { CreateLeadPayloadSchema } from './lead';

describe('CreateLeadPayloadSchema', () => {
  it('acepta payload válido', () => {
    const result = CreateLeadPayloadSchema.safeParse({
      productId: 'mobil-super-20w50',
      productName: 'Mobil Super 20W-50',
      fuelCompatibility: ['Gasolina'],
      containerSize: '1L',
      boxUnits: 15,
      boxCount: 2,
      totalUnits: 30,
      source: 'product_card_modal',
      timestamp: new Date().toISOString(),
    });
    expect(result.success).toBe(true);
  });

  it('rechaza totalUnits incorrecto', () => {
    const result = CreateLeadPayloadSchema.safeParse({
      productId: 'x',
      productName: 'x',
      fuelCompatibility: ['Gasolina'],
      containerSize: '1L',
      boxUnits: 15,
      boxCount: 2,
      totalUnits: 99,
      source: 'product_card_modal',
      timestamp: new Date().toISOString(),
    });
    expect(result.success).toBe(false);
  });
});
