import {z} from 'zod';

export const search_filter = z.object({
    name: z.string().optional(),
    set: z.string().optional(),
    mana_cost: z.string().optional(),
    rarity: z.string().optional(),
    foil: z.coerce.boolean().optional(),
    price: z.coerce.number().optional()
});

export type SearchFilters = {
    "name"?:string,
    "set"?:string,
    "mana_cost"?:string,
    "rarity"?:string,
    "foil"?:boolean,
    "price"?:number
}