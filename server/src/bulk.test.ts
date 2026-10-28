import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Readable } from 'node:stream';
import { gzipSync } from 'node:zlib';
import { bulkDownload, readBulkCards } from './bulk.js';

async function collect(metadata: unknown, chunks: Buffer[]) {
  return Array.fromAsync(readBulkCards(Readable.from(chunks), bulkDownload(metadata)));
}
test('reads the current gzip JSONL bulk format across chunk boundaries', async () => {
  const cards = [{ id: '1', name: 'Fênix' }, { id: '2', name: 'Island' }];
  const bytes = gzipSync(cards.map(card => JSON.stringify(card)).join('\r\n'));
  assert.deepEqual(await collect({ jsonl_download_uri: 'https://data.scryfall.io/cards.jsonl.gz' },
    [bytes.subarray(0, 7), bytes.subarray(7)]), cards);
});
test('keeps support for the previous JSON array bulk format', async () => {
  const cards = [{ id: '1' }];
  assert.deepEqual(await collect({ download_uri: 'https://data.scryfall.io/cards.json' }, [Buffer.from(JSON.stringify(cards))]), cards);
});
test('decodes split UTF-8 characters in uncompressed JSONL', async () => {
  const bytes = Buffer.from('{"id":"1","name":"á"}\n\n');
  assert.deepEqual(await collect({ jsonl_download_uri: 'https://data.scryfall.io/cards.jsonl' },
    [...bytes].map(byte => Buffer.from([byte]))), [{ id: '1', name: 'á' }]);
});
test('rejects missing URLs, malformed JSONL and corrupt gzip', async () => {
  assert.throws(() => bulkDownload({}), /não retornou/);
  assert.throws(() => bulkDownload({ download_uri: 'undefined' }), /inválida/);
  await assert.rejects(collect({ jsonl_download_uri: 'https://data.scryfall.io/cards.jsonl' }, [Buffer.from('not json')]));
  await assert.rejects(collect({ jsonl_download_uri: 'https://data.scryfall.io/cards.jsonl.gz' }, [Buffer.from('not gzip')]));
});
