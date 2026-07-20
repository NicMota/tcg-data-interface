import fs from 'fs';
import {Pool} from 'pg';
import path from 'path';
import { fileURLToPath } from 'url';
import axios from 'axios';
import { search_filter, SearchFilters } from './utils.js';
import "dotenv/config";
import prisma from './db/db.js';
import { Prisma } from '@prisma/client';
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
  // Double-faced / modal / transform cards don't carry a top-level
  // image_uris - each face has its own instead. We fall back to the
  // front face's image so these cards aren't stored without an image.
  card_faces?: {
    image_uris?: {
      small?: string
      normal?: string
      large?: string
    }
  }[]
}

// Scryfall omits image_uris at the top level for double-faced/transform/
// modal cards - the images live under card_faces[0] instead. This picks
// the best available image so every card we persist has one.
function resolveImageUris(card: ScryfallCard) {
  if (card.image_uris) return card.image_uris;

  const frontFace = card.card_faces?.[0];
  if (frontFace?.image_uris) return frontFace.image_uris;

  return undefined;
}


export async function load_cards_data() {

  console.log('loading cards...');

  // Cards already stored without an image - if this run finds a usable
  // image for one of them (e.g. via the card_faces fallback), it gets
  // repaired instead of silently skipped by skipDuplicates.
  const missingImageRows = await prisma.cards.findMany({
    where: { image_uris: { equals: Prisma.DbNull } },
    select: { card_id: true }
  });
  const missingImageIds = new Set(
    missingImageRows
      .map((c: { card_id: string | null }) => c.card_id)
      .filter((id: string | null): id is string => !!id)
  );

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

  const insertBatch: any[] = [];
  const fixBatch: { card_id: string; image_uris: any }[] = [];
  const batchSize = 100;

  let insertedTotal = 0;
  let fixedTotal = 0;

  for await (const item of pipeline) {

    const card: ScryfallCard = item.value;
    const image_uris = resolveImageUris(card);

    if (missingImageIds.has(card.id)) {
      if (image_uris) {
        fixBatch.push({ card_id: card.id, image_uris });
      }
    } else {
      insertBatch.push({
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
        image_uris
      });
    }

    if (insertBatch.length >= batchSize) {
      await prisma.cards.createMany({
        data: insertBatch,
        skipDuplicates: true
      });
      insertedTotal += insertBatch.length;
      console.log(`Inserted ${insertBatch.length}`);
      insertBatch.length = 0;
    }

    if (fixBatch.length >= batchSize) {
      await prisma.$transaction(
        fixBatch.map(row =>
          prisma.cards.update({
            where: { card_id: row.card_id },
            data: { image_uris: row.image_uris }
          })
        )
      );
      fixedTotal += fixBatch.length;
      console.log(`Fixed images for ${fixBatch.length}`);
      fixBatch.length = 0;
    }
  }

  if (insertBatch.length > 0) {
    await prisma.cards.createMany({
      data: insertBatch,
      skipDuplicates: true
    });
    insertedTotal += insertBatch.length;
  }

  if (fixBatch.length > 0) {
    await prisma.$transaction(
      fixBatch.map(row =>
        prisma.cards.update({
          where: { card_id: row.card_id },
          data: { image_uris: row.image_uris }
        })
      )
    );
    fixedTotal += fixBatch.length;
  }

  console.log(`loaded! (${insertedTotal} inserted, ${fixedTotal} images fixed)`);

  return { insertedTotal, fixedTotal };
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




// --- Admin panel support -------------------------------------------------

export type AdminJobName = 'cards' | 'prices';

interface AdminJobStatus {
  running: boolean;
  job: AdminJobName | null;
  startedAt: string | null;
  finishedAt: string | null;
  error: string | null;
  lastResult: { insertedTotal?: number; fixedTotal?: number } | null;
}

export const jobStatus: AdminJobStatus = {
  running: false,
  job: null,
  startedAt: null,
  finishedAt: null,
  error: null,
  lastResult: null
};

export function runCardSync() {
  if (jobStatus.running) {
    return { started: false, message: 'Já existe uma sincronização em andamento.' };
  }

  jobStatus.running = true;
  jobStatus.job = 'cards';
  jobStatus.startedAt = new Date().toISOString();
  jobStatus.finishedAt = null;
  jobStatus.error = null;

  load_cards_data()
    .then(result => {
      jobStatus.lastResult = result;
    })
    .catch(err => {
      console.error(err);
      jobStatus.error = err?.message ?? 'Erro desconhecido ao sincronizar cartas.';
    })
    .finally(() => {
      jobStatus.running = false;
      jobStatus.finishedAt = new Date().toISOString();
    });

  return { started: true, message: 'Sincronização de cartas iniciada.' };
}

export function runPriceSync() {
  if (jobStatus.running) {
    return { started: false, message: 'Já existe uma sincronização em andamento.' };
  }

  jobStatus.running = true;
  jobStatus.job = 'prices';
  jobStatus.startedAt = new Date().toISOString();
  jobStatus.finishedAt = null;
  jobStatus.error = null;

  update_prices()
    .then(() => {
      jobStatus.lastResult = null;
    })
    .catch(err => {
      console.error(err);
      jobStatus.error = err?.message ?? 'Erro desconhecido ao atualizar preços.';
    })
    .finally(() => {
      jobStatus.running = false;
      jobStatus.finishedAt = new Date().toISOString();
    });

  return { started: true, message: 'Atualização de preços iniciada.' };
}

export async function getAdminStats() {
  const [totalCards, totalPriceRecords, totalUsers, cardsWithoutImage, lastPrice] =
    await Promise.all([
      prisma.cards.count(),
      prisma.card_prices.count(),
      prisma.user.count(),
      prisma.cards.count({ where: { image_uris: { equals: Prisma.DbNull } } }),
      prisma.card_prices.findFirst({
        orderBy: { date: 'desc' },
        select: { date: true }
      })
    ]);

  return {
    totalCards,
    totalPriceRecords,
    totalUsers,
    cardsWithoutImage,
    lastPriceUpdate: lastPrice?.date ?? null,
    job: jobStatus
  };
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
    if(filter.set_code)
    {
      where.set_code = filter.set_code;
    }
    if(filter.rarity)
    {
      where.rarity = filter.rarity;
    }
    if(filter.mana_cost)
    {
      // mana_cost is stored as a Scryfall-style string (e.g. "{2}{U}{U}"),
      // so this matches cards whose cost contains the given symbols/text.
      where.mana_cost = {contains:filter.mana_cost,mode:'insensitive'}
    }
    if(filter.colors)
    {
      const colorList = filter.colors
        .split(',')
        .map(c => c.trim().toUpperCase())
        .filter(Boolean);

      if(colorList.length)
      {
        where.colors = {hasSome: colorList};
      }
    }
    if(filter.released_from || filter.released_to)
    {
      where.released_at = {};
      if(filter.released_from) where.released_at.gte = new Date(filter.released_from);
      if(filter.released_to) where.released_at.lte = new Date(filter.released_to);
    }


    const data = await prisma.cards.findMany({
      where,
      skip: (page - 1) * limit,
      take: limit,
      orderBy: {name: 'asc'}
    });

    // NOTE: previously this counted every card regardless of filter, which
    // made totalPages wrong whenever a filter was active.
    const total = await prisma.cards.count({ where });

    return {
      data,
      totalPages: Math.ceil(total / limit)
    };
  } catch (err) {
    console.log(err);
  }
}

export async function get_sets() {
  try {
    const sets = await prisma.cards.findMany({
      where: { set_code: { not: null } },
      distinct: ['set_code'],
      select: { set_code: true, set_name: true },
      orderBy: { set_name: 'asc' }
    });

    return sets;
  } catch (err) {
    console.log(err);
    return [];
  }
}

