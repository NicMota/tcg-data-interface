import fs from 'fs';
import {Pool} from 'pg';
import path from 'path';
import { fileURLToPath } from 'url';
import axios from 'axios';
import { search_filter, SearchFilters } from './utils.js';
import "dotenv/config";
import prisma from './db/db.js';
import { parser } from 'stream-json';
import { streamArray } from 'stream-json/streamers/stream-array.js';
import chain from 'stream-chain';




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

  console.log('loading cards...');

  const bulkInfo = await axios.get(
    'https://api.scryfall.com/bulk-data/default_cards'
  );

  const url = bulkInfo.data.download_uri;

  const response = await axios({
    method: 'GET',
    url,
    responseType: 'stream'
  });

  const pipeline = chain([
    response.data,
    parser(),
    streamArray()
  ]);

  const batch: any[] = [];
  const batchSize = 100;

  for await (const item of pipeline) {

    const card = item.value;

    batch.push({
      name: card.name,
      card_id: card.id,
      released_at: card.released_at
        ? new Date(card.released_at)
        : null,
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
    });

    if (batch.length >= batchSize) {

      await prisma.cards.createMany({
        data: batch,
        skipDuplicates: true
      });

      console.log(`Inserted ${batch.length}`);

      batch.length = 0;
    }
  }

  if (batch.length > 0) {

    await prisma.cards.createMany({
      data: batch,
      skipDuplicates: true
    });
  }

  console.log('loaded!');
}
export async function get_price(id: string) {
  try {
    const prices = await prisma.card_prices.findMany({
      where: { card_id: id },
      orderBy: { date: 'desc' },
      take: 30
    });

    console.log(prices);
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

  const cards = await axs.get(url,{
    responseType:'stream'
  });

  const pipeline = chain([
    cards.data,
    parser(),
    streamArray()
  ])

  const batch: any[] = [];
  const batchSize = 100;
  for await (const item of pipeline) {
    const card = item.value;
    const price = card.prices?.usd;
    batch.push({
      card_id: card.id,
      price_usd: price ? Number(price) : null,
      date: new Date()
    })
    if(batch.length>=batchSize)
    {
      await prisma.card_prices.createMany({
        data:batch,
        skipDuplicates:true
      })
      console.log(`Updated ${batch.length}`);

      batch.length = 0;
    }
  }


  if (batch.length > 0) {

    await prisma.card_prices.createMany({
      data: batch,
      skipDuplicates: true
    });
  }
  console.log('updated')
}




export async function get_cards(page = 1, limit = 20,filter : SearchFilters = {}) {
  try {
    const where : any = {};
    if(filter.name)
    {
      where.name = {contains:filter.name,mode:'insensitive'}
    }
    if(filter.foil)
    {
      where.foil = filter.foil;
    }


    const data = await prisma.cards.findMany({
      where,
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

