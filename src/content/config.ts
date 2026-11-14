import { defineCollection, z } from 'astro:content';

const blog = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string().min(1).max(120),
    description: z.string().min(1).max(200),
    author: z.string().min(1),
    publishedAt: z.coerce.date(),
    updatedAt: z.coerce.date().optional(),
    status: z.enum(['draft', 'review', 'published', 'archived']).default('draft'),
    tags: z.array(z.string()).default([]),
    relatedProducts: z.array(z.string()).default([]),
    seo: z
      .object({
        canonical: z.string().url().optional(),
        noindex: z.boolean().default(false),
      })
      .optional(),
  }),
});

const podcast = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string().min(1).max(120),
    description: z.string().min(1).max(300),
    host: z.string().min(1),
    publishedAt: z.coerce.date(),
    audioUrl: z.string().url(),
    duration: z.string().optional(),
    cover: z.string().optional(),
    transcript: z.string().optional(),
    status: z.enum(['draft', 'review', 'published', 'archived']).default('draft'),
    relatedProducts: z.array(z.string()).default([]),
  }),
});

export const collections = { blog, podcast };
