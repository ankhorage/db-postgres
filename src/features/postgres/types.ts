import type { DbAdapter, DbAdminAdapter } from '@ankhorage/contracts/db';

export interface PostgresAdapterConfig {
  readonly connectionString: string;
}

export interface PostgresAdapterLifecycle {
  close(): Promise<void>;
}

export type PostgresAdapter = DbAdapter & DbAdminAdapter & PostgresAdapterLifecycle;
