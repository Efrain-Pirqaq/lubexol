import Papa from 'papaparse';
import { catalog as fallbackCatalog } from '../data/catalog';
import type { Product } from '../lib/contracts/catalog';

const GOOGLE_SHEET_ID = import.meta.env.GOOGLE_SHEET_ID || '1yIR6FR9Vlc303XRQi7Q7SQrWUvMRhVMGh_MtcLup5ag';
const DEFAULT_WHATSAPP = import.meta.env.PUBLIC_WHATSAPP_NUMBER || '51987448943';

interface SheetProductRow {
  id?: string;
  estado?: string;
  nombre?: string;
  especialidad?: string;
  viscosidad?: string;
  presentacion?: string;
  precio_caja_15u?: string;
  precio_caja_20u?: string;
  precio_caja?: string;
  delivery?: string;
  foto_url?: string;
  descripcion?: string;
}

interface SheetConfigRow {
  Parametro?: string;
  Valor?: string;
}

export interface CatalogData {
  catalog: Product[];
  whatsappNumber: string;
}

/**
 * Obtiene la configuración de ventas (WhatsApp del vendedor) desde Google Sheets.
 */
export async function getSalesConfig(): Promise<{ whatsappNumber: string }> {
  try {
    const url = `https://docs.google.com/spreadsheets/d/${GOOGLE_SHEET_ID}/gviz/tq?tqx=out:csv&sheet=Configuracion`;
    const res = await fetch(url, { headers: { 'Cache-Control': 'no-cache' } });
    if (!res.ok) return { whatsappNumber: DEFAULT_WHATSAPP };

    const csvText = await res.text();
    const parsed = Papa.parse<SheetConfigRow>(csvText, { header: true, skipEmptyLines: true });
    
    const phoneRow = parsed.data.find(
      (r) => r.Parametro?.trim().toLowerCase() === 'telefono_whatsapp'
    );
    const cleanPhone = phoneRow?.Valor?.toString().replace(/\D/g, '').trim();

    return {
      whatsappNumber: cleanPhone && cleanPhone.length >= 9 ? cleanPhone : DEFAULT_WHATSAPP,
    };
  } catch (err) {
    console.warn('Fallo al obtener Configuracion desde Google Sheets; usando fallback:', err);
    return { whatsappNumber: DEFAULT_WHATSAPP };
  }
}

/**
 * Obtiene el catálogo de productos desde Google Sheets con fallback seguro al catálogo estático.
 */
export async function getCatalog(): Promise<Product[]> {
  try {
    const url = `https://docs.google.com/spreadsheets/d/${GOOGLE_SHEET_ID}/gviz/tq?tqx=out:csv&sheet=Catalogo_Productos`;
    const res = await fetch(url, { headers: { 'Cache-Control': 'no-cache' } });
    if (!res.ok) return fallbackCatalog;

    const csvText = await res.text();
    const parsed = Papa.parse<SheetProductRow>(csvText, { header: true, skipEmptyLines: true });

    if (!parsed.data || parsed.data.length === 0) return fallbackCatalog;

    const products: Product[] = [];

    for (const row of parsed.data) {
      const rawId = row.id?.trim();
      if (!rawId) continue;

      const estado = row.estado?.trim().toLowerCase();
      if (estado === 'inactivo') continue;

      // Mapear con el catálogo base por ID exacto, slug o viscosidad
      const baseProduct = fallbackCatalog.find((p) => {
        if (p.id === rawId) return true;
        if (rawId.includes('20w50') && p.id.includes('20w50') && !rawId.includes('moto') && !p.id.includes('moto')) return true;
        if (rawId.includes('15w40') && p.id.includes('15w40')) return true;
        if (rawId.includes('hd50') && p.id.includes('hd50')) return true;
        if (rawId.includes('25w60') && p.id.includes('25w60') && !rawId.includes('moto') && !p.id.includes('moto')) return true;
        if (rawId.includes('hd40') && p.id.includes('hd40')) return true;
        if ((rawId.includes('moto') || rawId.includes('4t')) && (p.id.includes('moto') || p.id.includes('4t'))) return true;
        return false;
      });

      const fuelList: ('GNV' | 'GLP' | 'Gasolina' | 'Diesel')[] = [];
      const spec = (row.especialidad || '').toUpperCase();
      if (spec.includes('GNV')) fuelList.push('GNV');
      if (spec.includes('GLP')) fuelList.push('GLP');
      if (spec.includes('GASOLINA') || spec.includes('GAS')) fuelList.push('Gasolina');
      if (spec.includes('DIESEL') || spec.includes('DIÉSEL')) fuelList.push('Diesel');
      if (fuelList.length === 0) {
        fuelList.push(...(baseProduct?.fuelCompatibility || ['Gasolina']));
      }

      const viscosity = row.viscosidad?.trim() || baseProduct?.variants[0]?.viscosity || '';
      const isMonograde = viscosity.toUpperCase().includes('SAE 40') || viscosity.toUpperCase().includes('SAE 50');

      const product: Product = {
        id: baseProduct?.id || rawId,
        name: row.nombre?.trim() || baseProduct?.name || rawId,
        brand: 'Lubexol',
        description: row.descripcion?.trim() || baseProduct?.description || '',
        imageUrl: row.foto_url?.trim() || baseProduct?.imageUrl || '',
        gradeType: isMonograde ? 'Monogrado' : 'Multigrado',
        fuelCompatibility: fuelList,
        status: estado === 'agotado' ? 'archived' : 'published',
        variants: baseProduct?.variants || [
          {
            id: `${rawId}-1l`,
            productId: rawId,
            viscosity: viscosity,
            volume: '1L',
            unitsPerBox: 15,
            allowedBoxUnits: [15, 20],
            unit: 'botella',
          },
        ],
      };

      products.push(product);
    }

    return products.length > 0 ? products : fallbackCatalog;
  } catch (err) {
    console.warn('Fallo al obtener Catalogo_Productos desde Google Sheets; usando fallback:', err);
    return fallbackCatalog;
  }
}

/**
 * Helper unificado que retorna catálogo y WhatsApp en paralelo
 */
export async function getCatalogData(): Promise<CatalogData> {
  const [catalog, { whatsappNumber }] = await Promise.all([
    getCatalog(),
    getSalesConfig(),
  ]);
  return { catalog, whatsappNumber };
}
