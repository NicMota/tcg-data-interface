import fs from 'fs';
import {Pool} from 'pg';
import path from 'path';
import { fileURLToPath } from 'url';
import axios from 'axios';
import { search_filter, SearchFilters } from './utils.js';
import "dotenv/config";
import { PrismaPg } from '@prisma/adapter-pg';
import {PrismaClient} from '@prisma/client'

const connectionString = `${process.env.DATABASE_URL}`;

const adapter = new PrismaPg({connectionString});
const prisma = new PrismaClient({adapter});


/* ideia: criar uma rotina,
todo dia verificar se bulk data adiciona uma carta nova e adiciona-la a tabela cards
apos isso buscar preco de todas as cartas incluindo as novas
1-verificar novas cartas
2-atualizar precos
*/

const axs = axios.create({
  baseURL: 'https://api.scryfall.com',
  headers:  {
    'User-Agent':'TCGAnal/1.0',
    'Accept':'*/*',
    'Content-Type':'application/json',
  }
})


const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

interface ScryfallCard {
  name: string
  id: string
  released_at: string
  scryfall_uri: string
  mana_cost: string | null
  type_line: string
  colors: string[] | null
  color_identity: string[] | null
  foil: boolean
  nonfoil: boolean
  set: string
  set_name: string
  set_type: string
  set_uri: string
  set_search_uri: string
  scryfall_set_uri: string
  rarity: string
  prices: Record<string, string | null>
  related_uris: Record<string, string>
  image_uris?: {
    small?: string
    normal?: string
    large?: string
  }
}


export async function load_cards_data() {
  try {
    console.log('loading cards...');

    const filepath = path.join(__dirname, 'default_cards.json');
    const data = JSON.parse(fs.readFileSync(filepath, 'utf8'));

    await prisma.cards.createMany({
      data: data.map((card: ScryfallCard) => ({
        name: card.name,
        card_id: card.id,
        released_at: new Date(card.released_at),
        scryfall_uri: card.scryfall_uri,
        mana_cost: card.mana_cost,
        type_line: card.type_line,
        colors: card.colors,
        color_identity: card.color_identity,
        foil: card.foil,
        nonfoil: card.nonfoil,
        set_code: card.set,
        set_name: card.set_name,
        set_type: card.set_type,
        set_uri: card.set_uri,
        set_search_uri: card.set_search_uri,
        scryfall_set_uri: card.scryfall_set_uri,
        rarity: card.rarity,
        prices: card.prices,
        related_uri: card.related_uris,
        image_uris: card.image_uris
      })),
      skipDuplicates: true
    });

    console.log('loaded!');
  } catch (err) {
    console.log(err);
  }
}
export async function get_price(id: string) {
  try {
    const prices = await prisma.card_prices.findMany({
      where: { card_id: id },
      orderBy: { date: 'desc' },
      take: 30
    });

    return prices.length ? prices : null;
  } catch (err) {
    console.log(err);
    return null;
  }
}

export async function get_card(id: string) {
  try {
    const card = await prisma.cards.findUnique({
      where: { card_id: id }
    });

    if (!card) return null;

    const prices = await get_price(id);

    return {
      card_info: card,
      prices
    };
  } catch (err) {
    console.log(err);
  }
}
//melhorar esse metodo
export async function update_prices() {
  const bulkInfo = await axs.get('https://api.scryfall.com/bulk-data/default_cards');
  const url = bulkInfo.data.download_uri;

  const cards = await axs.get(url);

  for (const card of cards.data) {
    const price = card.prices?.usd;

    try {
      await prisma.card_prices.create({
        data: {
          card_id: card.id,
          price_usd: price ? Number(price) : null,
          date: new Date()
        }
      });
    } catch (err) {
      // ignora duplicados
    }
  }
}



export async function filter_cards(filter: SearchFilters) {
  try {
    return await prisma.cards.findMany({
      where: {
        name: filter.name
          ? { contains: filter.name, mode: 'insensitive' }
          : undefined,

        rarity: filter.rarity || undefined,
        foil: filter.foil ?? undefined,

        prices: filter.price
          ? { lte: filter.price }
          : undefined
      }
    });
  } catch (err) {
    console.error(err);
  }
}

export async function get_cards(page = 1, limit = 20) {
  try {
    const data = await prisma.cards.findMany({
      skip: (page - 1) * limit,
      take: limit
    });

    const total = await prisma.cards.count();

    return {
      data,
      totalPages: Math.ceil(total / limit)
    };
  } catch (err) {
    console.log(err);
  }
}

