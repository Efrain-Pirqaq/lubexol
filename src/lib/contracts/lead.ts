import { z } from 'zod';

export const FuelCompatibility = z.enum(['GNV', 'GLP', 'Gasolina', 'Diesel']);

/**
 * Orígenes válidos de un lead.
 * - direct_whatsapp_catalog: portada (tarjetas con selector de cajas)
 * - catalogo_direct: página /catalogo
 * - blog_related_product: producto recomendado en un artículo del blog
 * - podcast_related_product: producto recomendado en un episodio del podcast
 *
 * Nota: `product_card_direct` se eliminó por ser una fuente muerta (nunca se
 * emitió desde el frontend). Ver handoff §82.
 */
export const LeadSource = z.enum([
  'direct_whatsapp_catalog',
  'catalogo_direct',
  'blog_related_product',
  'podcast_related_product',
]);

export type LeadSourceType = z.infer<typeof LeadSource>;

/** Fuentes editoriales: exigen `contentSlug` para atribuir el lead a su artículo/episodio. */
export const EDITORIAL_SOURCES = ['blog_related_product', 'podcast_related_product'] as const;

/** Slug seguro: minúsculas, números y guiones (mismos slugs de Astro). */
export const ContentSlugSchema = z
  .string()
  .min(1)
  .max(120)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Slug de contenido inválido');

export const CreateLeadPayloadSchema = z
  .object({
    productId: z.string().min(1).max(100),
    productName: z.string().min(1).max(150),
    fuelCompatibility: z.array(FuelCompatibility).min(1),
    containerSize: z.string().min(1),
    boxUnits: z.number().int().positive(),
    boxCount: z.number().int().min(1).max(999),
    totalUnits: z.number().int().positive(),
    source: LeadSource,
    contentSlug: ContentSlugSchema.optional(),
    timestamp: z.string().datetime(),
    renderTimestamp: z.number().int().optional(),
    website_hp: z.string().optional(),
  })
  .superRefine((data, ctx) => {
    if (data.totalUnits !== data.boxUnits * data.boxCount) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'totalUnits debe ser igual a boxUnits * boxCount',
        path: ['totalUnits'],
      });
    }

    const requiresSlug = (EDITORIAL_SOURCES as readonly string[]).includes(data.source);
    if (requiresSlug && !data.contentSlug) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'contentSlug es obligatorio para fuentes editoriales (blog/podcast)',
        path: ['contentSlug'],
      });
    }
  });

export type CreateLeadPayload = z.infer<typeof CreateLeadPayloadSchema>;
