import { test } from 'bun:test';

import { createPostgresAdapter } from '../src/index.js';

const connectionString = process.env.DATABASE_URL;

test.skipIf(!connectionString)('executes CRUD against DATABASE_URL when configured', async () => {
  if (!connectionString) return;
  const adapter = createPostgresAdapter({ connectionString });
  const table = `adapter_test_${crypto.randomUUID().replaceAll('-', '_')}`;
  const created = await adapter.createCollection({
    name: table,
    fields: [
      { name: 'id', type: 'uuid', required: true },
      { name: 'name', type: 'text', required: true },
    ],
    primaryKey: 'id',
  });
  if (!created.ok) throw new Error(created.error.message);
  const id = crypto.randomUUID();
  try {
    const inserted = await adapter.insert({ table, values: { id, name: 'Ada' } });
    if (!inserted.ok) throw new Error(inserted.error.message);
    const selected = await adapter.findById<{ id: string; name: string }>({ table, id });
    if (!selected.ok || selected.data?.name !== 'Ada')
      throw new Error('Inserted record was not returned.');
  } finally {
    await adapter.deleteCollection({ name: table });
    await adapter.close();
  }
});
