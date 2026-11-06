/** Public PostgreSQL adapter API for `@ankhorage/contracts/db`. */
export { createPostgresAdapter } from './features/postgres/createPostgresAdapter.js';
export type {
  PostgresAdapter,
  PostgresAdapterConfig,
  PostgresAdapterLifecycle,
} from './features/postgres/types.js';
