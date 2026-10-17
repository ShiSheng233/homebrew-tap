import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

// Optional description pages: content/<token>.mdx is shown on the cask's page, between the install
// command and the details generated from Casks/<token>.rb.
const casks = defineCollection({
  loader: glob({ pattern: '*.mdx', base: './content' }),
  schema: ({ image }) =>
    z.object({
      /** Replaces the cask's `desc` in the page's meta description. */
      description: z.string().optional(),
      /** The app icon, next to the name on the home page and the cask's page (a square PNG, 256px). */
      icon: image().optional(),
    }),
});

export const collections = { casks };
