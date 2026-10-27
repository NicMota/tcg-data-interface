import { z } from 'zod';

const date = z.iso.date();
export const pagination = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});
export const search_filter = z.object({
  name: z.string().trim().max(200).optional(),
  set_code: z.string().trim().max(20).optional(),
  mana_cost: z.string().trim().max(100).optional(),
  rarity: z.enum(['common', 'uncommon', 'rare', 'mythic', 'special', 'bonus']).optional(),
  foil: z.enum(['true', 'false']).transform(v => v === 'true').optional(),
  colors: z.string().regex(/^[WUBRG](,[WUBRG])*$/).optional(),
  released_from: date.optional(),
  released_to: date.optional(),
}).refine(v => !v.released_from || !v.released_to || v.released_from <= v.released_to,
  { message: 'A data inicial deve ser anterior à final.' });
export type SearchFilters = z.infer<typeof search_filter>;
export const loginInput = z.object({
  email: z.email().trim().toLowerCase().max(254),
  password: z.string().min(1).max(72),
});
export const registerInput = loginInput.extend({
  name: z.string().trim().min(1).max(100),
  password: z.string().min(8).max(72).refine(v => Buffer.byteLength(v, 'utf8') <= 72,
    'A senha deve ter no máximo 72 bytes.'),
});
export const profileInput = registerInput.pick({ name: true });
