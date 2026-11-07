import { z, defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';

const crystalSchema = z.object({
  name: z.string(),
  slug: z.string(),
  chemicalFormula: z.string(),
  hardness: z.number().min(1).max(10),
  crystalSystem: z.string(),
  chakras: z.array(z.string()),
  zodiac: z.array(z.string()),
  element: z.array(z.string()),
  planet: z.string().optional(),
  origin: z.array(z.string()),
  rarity: z.string(),
  color: z.array(z.string()),
  properties: z.array(z.string()),
  otherNames: z.array(z.string()).optional(),
  description: z.string(),
  history: z.string(),
  healing: z.string(),
  uses: z.array(z.string()),
  care: z.string(),
  combinations: z.array(z.string()),
  affirmation: z.string(),
  image: z.string().optional(),
});

const crystals = defineCollection({
  loader: glob({ base: './src/content/crystals', pattern: '**/*.{mdx,md}' }),
  schema: crystalSchema,
});

export const collections = { crystals };