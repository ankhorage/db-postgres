import { Pool } from 'pg';

import { PostgresDbAdapter } from './adapters/PostgresDbAdapter.js';
import type { PostgresAdapter, PostgresAdapterConfig } from './types.js';

/*** Creates a provider-neutral PostgreSQL adapter from a standard connection string. */
export const createPostgresAdapter = (config: PostgresAdapterConfig): PostgresAdapter => {
  if (config.connectionString.trim().length === 0)
    throw new Error('PostgreSQL connectionString must not be empty.');
  const pool = new Pool({ connectionString: config.connectionString });
  return new PostgresDbAdapter({
    query: async <TRecord extends object>(text: string, values?: readonly unknown[]) =>
      pool.query<TRecord>(text, values ? [...values] : []),
    connect: async () => {
      const client = await pool.connect();
      return {
        query: async <TRecord extends object>(text: string, values?: readonly unknown[]) =>
          client.query<TRecord>(text, values ? [...values] : []),
        release: () => client.release(),
      };
    },
    end: async () => pool.end(),
  });
};
