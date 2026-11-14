import { z } from 'zod';

export const ProductVariantSchema = z.object({
  id: z.string(),
  productId: z.string(),
  viscosity: z.string(),
  volume: z.string(),
  unitsPerBox: z.number().int().positive(),
  allowedBoxUnits: z.array(z.number().int().positive()).min(1),
  unit: z.string(),
  sku: z.string().optional(),
});

export const ProductSchema = z.object({
  id: z.string(),
  name: z.string(),
  brand: z.string(),
  description: z.string(),
  imageUrl: z.string().optional(),
  gradeType: z.enum(['Monogrado', 'Multigrado']).optional(),
  fuelCompatibility: z.array(z.enum(['GNV', 'GLP', 'Gasolina', 'Diesel'])).min(1),
  variants: z.array(ProductVariantSchema).min(1),
  status: z.enum(['draft', 'published', 'archived']),
});

export type Product = z.infer<typeof ProductSchema>;
export type ProductVariant = z.infer<typeof ProductVariantSchema>;
