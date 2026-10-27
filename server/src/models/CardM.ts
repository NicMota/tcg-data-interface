import axios from 'axios';
import { search_filter, SearchFilters } from '../utils.js';
import "dotenv/config";
import prisma from '../db/db.js';
import { Prisma } from '@prisma/client';
import { parser } from 'stream-json';
import { streamArray } from 'stream-json/streamers/stream-array.js';
import chain from 'stream-chain';

import axs from '../axios/client.js';
import ScryfallCard from '../interfaces/card.interfaces.js';

function hasValidImage(card : ScryfallCard)
{
    if (!card.image_uris) {
      return false;
    }
    return Boolean(
        card.image_uris.normal ||
        card.image_uris.large ||
        card.image_uris.small
    );
}
function hasValidPrice(card : ScryfallCard)
{
    if (!card.prices?.usd) {
        return false;
    }

    const price = Number(card.prices.usd);

    return Number.isFinite(price) && price > 0;
}
function calculateCardQualityScore(card : ScryfallCard){
      let score = 0;

    if (hasValidImage(card)) {
        score += 50;
    }

    if (hasValidPrice(card)) {
        score += 30;
    }

    if (card.name) {
        score += 10;
    }

    if (card.set_name) {
        score += 10;
    }

    return score;
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
 
  // Snapshot of what's already in the DB, so during the same streaming
  // pass we can detect drift on quality_score (stale) and image_uris
  // (missing) without a second bulk fetch or a per-card query.
  const existingRows = await prisma.cards.findMany({
    select: { card_id: true, quality_score: true, image_uris: true }
  });
  const existingByCardId = new Map(
    existingRows
      .filter((c: { card_id: string | null }) => !!c.card_id)
      .map((c: { card_id: string | null; quality_score: number | null; image_uris: any }) => [c.card_id as string, c])
  );
 
  const bulkInfo = await axios.get(
    'https://api.scryfall.com/bulk-data/default_cards',
    { headers: { 'User-Agent': 'TCGDataInterface/1.0', Accept: 'application/json' }, timeout: 30000 }
  );
 
  const url = bulkInfo.data.download_uri;
 
  const response = await axios({
    method: 'GET',
    url,
    responseType: 'stream',
    headers: { 'User-Agent': 'TCGDataInterface/1.0', Accept: 'application/json' },
    timeout: 120000
  });
 
  const pipeline = chain([
    response.data,
    parser(),
    streamArray()
  ]);
 
  const insertBatch: any[] = [];
  const updateBatch: { card_id: string; quality_score?: number; image_uris?: any }[] = [];
  const batchSize = 100;
 
  let insertedTotal = 0;
  let updatedTotal = 0;
 
  for await (const item of pipeline) {
 
    const card: ScryfallCard = item.value;
    const image_uris = resolveImageUris(card);
    const score = calculateCardQualityScore({ ...card, image_uris });
 
    const existing = existingByCardId.get(card.id);
 
    if (existing) {
      const data: { quality_score?: number; image_uris?: any } = {};
 
      if (existing.quality_score !== score) {
        data.quality_score = score;
      }
 
      // Only repair a missing image - never overwrite one we already have.
      if (!existing.image_uris && image_uris) {
        data.image_uris = image_uris;
      }
 
      if (Object.keys(data).length > 0) {
        updateBatch.push({ card_id: card.id, ...data });
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
        colors: card.colors ?? [],
        color_identity: card.color_identity ?? [],
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
        quality_score:score,
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
 
    if (updateBatch.length >= batchSize) {
      await prisma.$transaction(
        updateBatch.map(row => {
          const { card_id, ...data } = row;
          return prisma.cards.update({ where: { card_id }, data });
        })
      );
      updatedTotal += updateBatch.length;
      console.log(`Updated ${updateBatch.length} existing cards`);
      updateBatch.length = 0;
    }
  }
 
  if (insertBatch.length > 0) {
    await prisma.cards.createMany({
      data: insertBatch,
      skipDuplicates: true
    });
    insertedTotal += insertBatch.length;
  }
 
  if (updateBatch.length > 0) {
    await prisma.$transaction(
      updateBatch.map(row => {
        const { card_id, ...data } = row;
        return prisma.cards.update({ where: { card_id }, data });
      })
    );
    updatedTotal += updateBatch.length;
  }
 
  console.log(`loaded! (${insertedTotal} inserted, ${updatedTotal} atualizados [score/imagem])`);
 
  return { insertedTotal, updatedTotal };
}





export async function get_price(id: string) {
  try {
    const prices = await prisma.card_prices.findMany({
      where: { card_id: id },
      orderBy: { date: 'desc' },
      take: 30
    });

    return prices;
  } catch (err) {
    throw err;
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
    throw err;
  }
}
//melhorar esse metodo
export async function update_prices() {

    const existingCardIds = new Set(
        (await prisma.cards.findMany({ select: { card_id: true } }))
        .map((c: { card_id: string | null }) => c.card_id)
        .filter((id: string | null): id is string => !!id)
    );

    let skippedTotal = 0;

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

  const batch: Prisma.card_pricesCreateManyInput[] = [];
  const snapshots: { card_id: string; prices: Prisma.InputJsonValue }[] = [];
  const date = new Date(new Date().toISOString().slice(0, 10));
  async function flush() {
    await prisma.$transaction([
      prisma.card_prices.createMany({ data: batch, skipDuplicates: true }),
      ...snapshots.map(row => prisma.cards.update({ where: { card_id: row.card_id }, data: { prices: row.prices } })),
    ]);
    batch.length = 0;
    snapshots.length = 0;
  }
  const batchSize = 100;
  for await (const item of pipeline) {
    const card = item.value;

    if (!existingCardIds.has(card.id)) {
      skippedTotal++;
      continue;
    }

    const price = card.prices?.usd;
    snapshots.push({ card_id: card.id, prices: card.prices ?? {} });
    batch.push({
      card_id: card.id,
      price_usd: price != null && Number.isFinite(Number(price)) ? Number(price) : null,
      date
    })
    if(batch.length>=batchSize)
    {
        await flush();
    }
  }
  if (batch.length > 0) await flush();
  console.log('updated')
  console.log(`Updated(${skippedTotal} ignorados - card_id ainda não existe em cards`);
}




// --- Admin panel support -------------------------------------------------

export type AdminJobName = 'cards' | 'prices';

interface AdminJobStatus {
    running: boolean;
    job: AdminJobName | null;
    startedAt: string | null;
    finishedAt: string | null;
    error: string | null;
    lastResult: { insertedTotal?: number; updatedTotal?: number } | null;
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
  jobStatus.lastResult = null;

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
  jobStatus.lastResult = null;

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
    const where: Prisma.cardsWhereInput = {};
    if(filter.name)
    {
      where.name = {contains:filter.name,mode:'insensitive'}
    }
    if(filter.foil !== undefined)
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
      orderBy: [{quality_score: 'desc'}, {card_id: 'asc'}],
      include: { card_prices: { orderBy: { date: 'desc' }, take: 2 } }
    });

    // NOTE: previously this counted every card regardless of filter, which
    // made totalPages wrong whenever a filter was active.
    const total = await prisma.cards.count({ where });

    return {
      data,
      total,
      totalPages: Math.ceil(total / limit)
    };
  } catch (err) {
    throw err;
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
    throw err;
  }
}


export function runDailySync() {
  if (jobStatus.running) return { started: false };
  Object.assign(jobStatus, { running: true, job: 'cards', startedAt: new Date().toISOString(),
    finishedAt: null, error: null, lastResult: null });
  void load_cards_data().then(async result => {
    jobStatus.lastResult = result;
    jobStatus.job = 'prices';
    await update_prices();
  }).catch(error => {
    console.error(error);
    jobStatus.error = error instanceof Error ? error.message : 'Falha na sincronização.';
  }).finally(() => {
    jobStatus.running = false;
    jobStatus.finishedAt = new Date().toISOString();
  });
  return { started: true };
}
