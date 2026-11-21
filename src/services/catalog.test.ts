import { describe, it, expect } from 'vitest';
import { getCatalog, getSalesConfig, getCatalogData } from './catalog';

describe('Catalog Service from Google Sheets', () => {
  it('obtiene la configuración de ventas y teléfono de WhatsApp', async () => {
    const config = await getSalesConfig();
    expect(config.whatsappNumber).toBeDefined();
    expect(config.whatsappNumber.length).toBeGreaterThanOrEqual(9);
  });

  it('obtiene el catálogo de productos con 6 fórmulas oficiales', async () => {
    const products = await getCatalog();
    expect(products.length).toBeGreaterThanOrEqual(6);
    expect(products[0].name).toContain('Lubexol');
    expect(products[0].variants.length).toBeGreaterThan(0);
  });

  it('obtiene catálogo y teléfono unificados en getCatalogData', async () => {
    const data = await getCatalogData();
    expect(data.catalog.length).toBeGreaterThanOrEqual(6);
    expect(data.whatsappNumber).toBeDefined();
  });
});
