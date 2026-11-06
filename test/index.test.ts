import { expect, test } from 'bun:test';

import type {
  PostgresClientPort,
  PostgresPoolPort,
} from '../src/features/postgres/adapters/ports.js';
import { PostgresDbAdapter } from '../src/features/postgres/adapters/PostgresDbAdapter.js';
import { createPostgresAdapter } from '../src/index.js';

const createPool = (): PostgresPoolPort & {
  readonly calls: string[];
  readonly closed: { value: boolean };
} => {
  const calls: string[] = [];
  const closed = { value: false };
  const query = <TRecord extends object>(text: string, values?: readonly unknown[]) => {
    calls.push(`${text} :: ${JSON.stringify(values ?? [])}`);
    return Promise.resolve({ rows: [] as TRecord[] });
  };
  const client: PostgresClientPort = { query, release: () => undefined };
  return {
    query,
    connect: () => Promise.resolve(client),
    end: () => {
      closed.value = true;
      return Promise.resolve();
    },
    calls,
    closed,
  };
};

test('rejects an empty PostgreSQL connection string before creating a pool', () => {
  expect(() => createPostgresAdapter({ connectionString: '  ' })).toThrow(
    'PostgreSQL connectionString must not be empty.',
  );
});

test('declares the PostgreSQL capabilities from the database contract', () => {
  const adapter = createPostgresAdapter({ connectionString: 'postgresql://localhost/test' });

  expect(adapter.capabilities).toMatchObject({
    transactions: true,
    returning: true,
    realtime: false,
    schemaGeneration: true,
    directExecution: true,
  });
});

test('parameterizes CRUD queries, filters, and paging', async () => {
  const pool = createPool();
  const adapter = new PostgresDbAdapter(pool);
  await adapter.select({
    table: 'people',
    filters: [{ field: 'name', operator: 'contains', value: 'Ada' }],
    page: { limit: 10, offset: 5 },
  });
  await adapter.insert({ table: 'people', values: { id: '1', name: 'Ada' } });
  await adapter.update({
    table: 'people',
    values: { name: 'Grace' },
    filters: [{ field: 'id', operator: 'in', value: ['1', '2'] }],
  });
  await adapter.delete({ table: 'people', filters: [{ field: 'id', operator: 'eq', value: '1' }] });
  expect(pool.calls).toEqual([
    'SELECT * FROM "people" WHERE "name" LIKE $1 LIMIT 10 OFFSET 5 :: ["%Ada%"]',
    'INSERT INTO "people" ("id", "name") VALUES ($1, $2) RETURNING * :: ["1","Ada"]',
    'UPDATE "people" SET "name" = $1 WHERE "id" IN ($2, $3) RETURNING * :: ["Grace","1","2"]',
    'DELETE FROM "people" WHERE "id" = $1 RETURNING * :: ["1"]',
  ]);
});

test('generates schema SQL and manages transactions and pool lifecycle', async () => {
  const pool = createPool();
  const adapter = new PostgresDbAdapter(pool);
  expect(
    adapter.generateCreateCollectionSql({
      name: 'people',
      fields: [{ name: 'id', type: 'uuid', required: true }],
      primaryKey: 'id',
    }),
  ).toMatchObject({
    ok: true,
    sql: 'CREATE TABLE "people" ("id" UUID NOT NULL, PRIMARY KEY ("id"))',
  });
  expect(
    await adapter.transaction(async (transaction) => {
      await transaction.insert({ table: 'people', values: { id: '1' } });
      return 'done';
    }),
  ).toEqual({ ok: true, data: 'done' });
  await adapter.close();
  expect(pool.closed.value).toBe(true);
  expect(pool.calls.map((call) => call.split(' :: ')[0])).toContain('COMMIT');
});
