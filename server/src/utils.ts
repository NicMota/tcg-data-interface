import {z} from 'zod';

export const search_filter = z.object({
    name: z.string().optional(),
    set_code: z.string().optional(),
    mana_cost: z.string().optional(),
    rarity: z.string().optional(),
    foil: z.coerce.boolean().optional(),
    colors: z.string().optional(), // comma-separated symbols, e.g. "U,B"
    released_from: z.string().optional(), // ISO date (yyyy-mm-dd)
    released_to: z.string().optional()
});

export type SearchFilters = {
    "name"?:string,
    "set_code"?:string,
    "mana_cost"?:string,
    "rarity"?:string,
    "foil"?:boolean,
    "colors"?:string,
    "released_from"?:string,
    "released_to"?:string
}