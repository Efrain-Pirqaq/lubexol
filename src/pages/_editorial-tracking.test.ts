import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const read = (path: string) => readFileSync(new URL(path, import.meta.url), 'utf8');

/**
 * Guard de regresión del mandato del PO (§78.3 / §79.3):
 * los mensajes pre-armados de WhatsApp NO se modifican al añadir tracking.
 * Si alguien cambia el texto, esta prueba falla.
 */
describe('tracking editorial: mensajes de WhatsApp intactos', () => {
  const blog = read('./blog/[slug].astro');
  const podcast = read('./podcast/[slug].astro');

  it('blog conserva literalmente el mensaje pre-armado', () => {
    expect(blog).toContain(
      'Hola, quisiera cotizar una caja de ${prod?.name} que vi en su artículo de blog.'
    );
  });

  it('podcast conserva literalmente el mensaje pre-armado', () => {
    expect(podcast).toContain(
      'Hola, escuché el episodio "${ep.data.title}" y quisiera cotizar una caja de ${prod?.name}.'
    );
  });

  it('blog registra el lead con origen editorial y slug', () => {
    expect(blog).toContain('data-lead-cta');
    expect(blog).toContain('data-source="blog_related_product"');
    expect(blog).toContain('data-content-slug={post.slug}');
    expect(blog).toContain('initEditorialLeadCtas');
  });

  it('podcast registra el lead con origen editorial y slug', () => {
    expect(podcast).toContain('data-lead-cta');
    expect(podcast).toContain('data-source="podcast_related_product"');
    expect(podcast).toContain('data-content-slug={ep.slug}');
    expect(podcast).toContain('initEditorialLeadCtas');
  });

  it('ninguna página editorial llama directamente a /api/lead', () => {
    expect(blog).not.toContain("fetch('/api/lead'");
    expect(podcast).not.toContain("fetch('/api/lead'");
  });

  it('el CTA general del header conserva su mensaje y NO lleva tracking', () => {
    expect(blog).toContain(
      'Hola, leí el artículo "${post.data.title}" en su blog y quisiera cotizar lubricantes por caja.'
    );
    expect(podcast).toContain(
      'Hola, escuché el episodio "${ep.data.title}" en su podcast y quisiera cotizar lubricantes por caja.'
    );
    // Solo la tarjeta de producto se instrumenta (1 por archivo).
    expect((blog.match(/data-lead-cta/g) || []).length).toBe(1);
    expect((podcast.match(/data-lead-cta/g) || []).length).toBe(1);
  });
});
