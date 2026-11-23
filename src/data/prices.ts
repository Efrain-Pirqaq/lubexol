/**
 * FUENTE ÚNICA DE PRECIOS DE REFERENCIA — CAJA CERRADA DE 15 UNIDADES (1L).
 *
 * PARA CAMBIAR UN PRECIO:
 *   1. Edita únicamente `BOX_PRICES_15U` en este archivo.
 *   2. La tabla `#equivalencias` de la portada y el JSON-LD (`priceMap`) se
 *      recalculan automáticamente desde aquí.
 *   3. No edites precios en `src/pages/index.astro`, en el Google Sheet ni en
 *      `docs/catalogo_productos_plantilla.csv`.
 *   4. Los artículos de `src/content/blog/*.md` son Markdown estático: si
 *      cambias un precio, actualízalos también a mano (no se derivan de aquí).
 *
 * Decisión PO (22/11/2026):
 *   - La caja de 15u es la única referencia pública de precio.
 *   - La caja de 20u se sigue ofreciendo, pero se cotiza por WhatsApp y no
 *     publica precio de referencia.
 *   - Precios aprobados: S/ 180 (multigrados) y S/ 112 (monogrados) por caja
 *     cerrada de 15 botellas de 1L.
 */

export const REFERENCE_BOX_UNITS = 15;

/** Precio en soles (PEN) de una caja cerrada de 15 botellas de 1L. */
export const BOX_PRICES_15U: Record<string, number> = {
  'lubexol-optimus-premium-20w50': 180,
  'lubexol-ultra-oil-15w40': 180,
  'lubexol-hd50-gnv-glp': 112,
  'lubexol-turbo-vis-25w60': 180,
  'lubexol-hd40-ultra-oil': 112,
  'lubexol-moto-4t-25w60': 180,
};

export interface ComparisonRow {
  id: string;
  label: string;
  referenceBrand: string;
  grifoMin: number;
  grifoMax: number;
  productId: string;
  formula: string;
}

/**
 * Filas de la tabla comparativa de la portada.
 * El precio de grifo es un rango de referencia; el ahorro se calcula con el
 * punto medio del rango para no sobreestimar.
 */
export const COMPARISON_ROWS: ComparisonRow[] = [
  {
    id: 'gnv-glp-gasolina-20w50',
    label: 'GNV / GLP / Gasolina (20W-50)',
    referenceBrand: 'Mobil Super / Castrol GTX',
    grifoMin: 26,
    grifoMax: 29,
    productId: 'lubexol-optimus-premium-20w50',
    formula: 'Optimus Premium 20W-50 (API-SN)',
  },
  {
    id: 'diesel-pesado-15w40',
    label: 'Diésel Pesado / Flotas (15W-40)',
    referenceBrand: 'Rimula R4 / Delvac 1300',
    grifoMin: 28,
    grifoMax: 32,
    productId: 'lubexol-ultra-oil-15w40',
    formula: 'Ultra Oil 15W-40 (API CI-4 Plus)',
  },
  {
    id: 'gas-monogrado-sae50',
    label: 'Gas Monogrado Alto Calor (SAE 50)',
    referenceBrand: 'Mobil Delvac 1350 / Petroperú HD-50',
    grifoMin: 18,
    grifoMax: 22,
    productId: 'lubexol-hd50-gnv-glp',
    formula: 'HD 50 Especial Gas (API-SL/CF)',
  },
];

export interface ComparisonMetrics {
  boxPrice?: number;
  pricePerLiter?: number;
  grifoMid: number;
  grifoBox: number;
  savings?: number;
  savingsPct?: number;
}

export function getBoxPrice15u(productId: string): number | undefined {
  return BOX_PRICES_15U[productId];
}

export function getPricePerLiter15u(productId: string): number | undefined {
  const boxPrice = getBoxPrice15u(productId);
  if (boxPrice === undefined) return undefined;
  return Math.round((boxPrice / REFERENCE_BOX_UNITS) * 100) / 100;
}

export function getComparisonMetrics(row: ComparisonRow): ComparisonMetrics {
  const boxPrice = getBoxPrice15u(row.productId);
  const pricePerLiter = getPricePerLiter15u(row.productId);
  const grifoMid = (row.grifoMin + row.grifoMax) / 2;
  const grifoBox = grifoMid * REFERENCE_BOX_UNITS;
  const savings = boxPrice === undefined ? undefined : Math.round(grifoBox - boxPrice);
  const savingsPct =
    savings === undefined ? undefined : Math.round((savings / grifoBox) * 100);

  return { boxPrice, pricePerLiter, grifoMid, grifoBox, savings, savingsPct };
}

/** Porcentaje máximo de ahorro entre las filas comparativas (para el copy). */
export function getMaxSavingsPct(): number {
  const percentages = COMPARISON_ROWS.map((row) => getComparisonMetrics(row).savingsPct).filter(
    (value): value is number => value !== undefined
  );

  return percentages.length > 0 ? Math.max(...percentages) : 0;
}
