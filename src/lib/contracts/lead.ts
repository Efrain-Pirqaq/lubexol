import { z } from 'zod';

export const FuelCompatibility = z.enum(['GNV', 'GLP', 'Gasolina', 'Diesel']);

export const CreateLeadPayloadSchema = z.object({
  productId: z.string().min(1).max(100),
  productName: z.string().min(1).max(150),
  fuelCompatibility: z.array(FuelCompatibility).min(1),
  containerSize: z.string().min(1),
  boxUnits: z.number().int().positive(),
  boxCount: z.number().int().min(1).max(999),
  totalUnits: z.number().int().positive(),
  source: z.literal('product_card_modal'),
  timestamp: z.string().datetime(),
  renderTimestamp: z.number().int().optional(),
  website_hp: z.string().optional(),
}).refine((data) => data.totalUnits === data.boxUnits * data.boxCount, {
  message: 'totalUnits debe ser igual a boxUnits * boxCount',
  path: ['totalUnits'],
});

export type CreateLeadPayload = z.infer<typeof CreateLeadPayloadSchema>;
