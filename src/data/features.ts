/**
 * Feature flags de portada.
 *
 * Decisión PO (22/11/2026, D-22):
 *   La "Garantía de Primera Botella" se retira. El bloque HTML se conserva
 *   intacto en `src/pages/index.astro` para una reactivación futura, pero no
 *   se renderiza ni se promociona en el blog.
 *
 * Para reactivarla: cambiar `showFirstBottleGuarantee` a `true` y actualizar
 * el test de regresión `src/data/features.test.ts` (cambio deliberado).
 */
export const FEATURES = {
  showFirstBottleGuarantee: false,
} as const;
