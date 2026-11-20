import { store, confluence, reset } from './helpers';
import test, { beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { seedStorage, seedConfluenceBatch } from '../../src/seed/seedEngine';
import { getPageText } from '../../src/confluence/pages';
import { CUSTOMER_DPAS } from '../../src/data/seedData';

beforeEach(reset);

test('loading the sample puts 41 contracts in the register and no ticket decisions', async () => {
  await seedStorage();
  assert.equal((store.get('dpas:list') as string[]).length, 41);
  assert.equal([...store.keys()].filter((k) => k.startsWith('decision:')).length, 0);
  assert.equal(store.get('dpa:CUST-041').status, 'unclear');
});

test('writes a Confluence page per contract, in batches, and remembers each page id', async () => {
  await seedStorage();
  let offset = 0;
  let steps = 0;
  for (;;) {
    const r = await seedConfluenceBatch(offset, 6);
    steps++;
    offset = r.nextOffset;
    if (r.done) break;
  }
  assert.equal(steps, 7); // 41 contracts, 6 at a time
  const dpaPages = [...confluence.pages.values()].filter((p) => p.title.startsWith('DPA'));
  assert.equal(dpaPages.length, 41);
  assert.ok(store.get('dpa:CUST-001').confluencePageId);
});

test('repeating the load updates pages instead of duplicating them', async () => {
  await seedStorage();
  await seedConfluenceBatch(0, 6);
  const before = confluence.pages.size;
  await seedConfluenceBatch(0, 6);
  assert.equal(confluence.pages.size, before);
  assert.ok(confluence.calls.some((c) => c.startsWith('PUT')));
});

test('a page can be read back as plain text containing the clause', async () => {
  await seedStorage();
  await seedConfluenceBatch(0, 3);
  const id = store.get('dpa:CUST-001').confluencePageId;
  const text = await getPageText(id);
  assert.ok(text.includes(CUSTOMER_DPAS[0].exactClause.slice(0, 40)));
});
