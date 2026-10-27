import { Readable, pipeline } from 'node:stream';
import { createGunzip } from 'node:zlib';
import { StringDecoder } from 'node:string_decoder';
import { parser } from 'stream-json';
import { streamArray } from 'stream-json/streamers/stream-array.js';
import chain from 'stream-chain';
import type ScryfallCard from './interfaces/card.interfaces.js';

export function bulkDownload(metadata: unknown) {
  const data = metadata as { download_uri?: unknown; jsonl_download_uri?: unknown } | null;
  const jsonl = typeof data?.jsonl_download_uri === 'string';
  const uri = jsonl ? data!.jsonl_download_uri : data?.download_uri;
  if (typeof uri !== 'string') {
    throw new Error('Scryfall não retornou download_uri nem jsonl_download_uri para default_cards.');
  }
  let url: URL;
  try { url = new URL(uri); } catch { throw new Error('URL de download inválida na resposta do Scryfall.'); }
  if (url.protocol !== 'https:') throw new Error('O download do Scryfall deve usar HTTPS.');
  return { url: uri, jsonl, gzip: url.pathname.endsWith('.gz') };
}

export async function* readBulkCards(source: Readable, format: ReturnType<typeof bulkDownload>): AsyncGenerator<ScryfallCard> {
  // pipeline forwards source errors to the decompressor and destroys both streams.
  const input = format.gzip ? pipeline(source, createGunzip(), () => {}) : source;
  if (!format.jsonl) {
    const array = chain([input, parser(), streamArray()]);
    try { for await (const item of array) yield item.value; }
    finally { array.destroy(); input.destroy(); }
    return;
  }
  const decoder = new StringDecoder('utf8');
  let pending = '';
  try {
    for await (const chunk of input) {
      pending += typeof chunk === 'string' ? chunk : decoder.write(chunk);
      let end: number;
      while ((end = pending.indexOf('\n')) !== -1) {
        const line = pending.slice(0, end).trim();
        pending = pending.slice(end + 1);
        if (line) yield JSON.parse(line);
      }
    }
    pending += decoder.end();
    if (pending.trim()) yield JSON.parse(pending);
  } finally { input.destroy(); }
}
