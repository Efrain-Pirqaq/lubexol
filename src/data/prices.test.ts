import { describe, expect, it } from 'vitest';
import {
  BOX_PRICES_15U,
  COMPARISON_ROWS,
  getBoxPrice15u,
  getComparisonMetrics,
  getMaxSavingsPct,
  getPricePerLiter15u,
  REFERENCE_BOX_UNITS,
} from './prices';

describe('precios de referencia de la caja de 15u', () => {
  it('usa 15 unidades como referencia', () => {
    expect(REFERENCE_BOX_UNITS).toBe(15);
    expect(Object.keys(BOX_PRICES_15U)).toHaveLength(6);
  });

  it('calcula S/ 12.00/L para los multigrados', () => {
    expect(getPricePerLiter15u('lubexol-optimus-premium-20w50')).toBe(12);
    expect(getPricePerLiter15u('lubexol-ultra-oil-15w40')).toBe(12);
    expect(getPricePerLiter15u('lubexol-turbo-vis-25w60')).toBe(12);
    expect(getPricePerLiter15u('lubexol-moto-4t-25w60')).toBe(12);
  });

  it('calcula S/ 7.47/L para los monogrados', () => {
    expect(getPricePerLiter15u('lubexol-hd50-gnv-glp')).toBe(7.47);
    expect(getPricePerLiter15u('lubexol-hd40-ultra-oil')).toBe(7.47);
  });

  it('no inventa precios para productos sin tarifa', () => {
    expect(getBoxPrice15u('producto-sin-precio')).toBeUndefined();
    expect(getPricePerLiter15u('producto-sin-precio')).toBeUndefined();
  });

  it('mantiene los ahorros corregidos de la tabla comparativa', () => {
    const metrics = COMPARISON_ROWS.map((row) => getComparisonMetrics(row));

    expect(metrics.map((m) => m.boxPrice)).toEqual([180, 180, 112]);
    expect(metrics.map((m) => m.pricePerLiter)).toEqual([12, 12, 7.47]);
    expect(metrics.map((m) => m.savings)).toEqual([233, 270, 188]);
    expect(metrics.map((m) => m.savingsPct)).toEqual([56, 60, 63]);
  });

  it('publica el porcentaje máximo de ahorro para el copy', () => {
    expect(getMaxSavingsPct()).toBe(63);
  });
});
