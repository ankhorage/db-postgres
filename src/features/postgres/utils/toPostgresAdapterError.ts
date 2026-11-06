import type { DbAdapterError } from '@ankhorage/contracts/db';

/** Converts PostgreSQL client failures to the portable database error contract. */
export const toPostgresAdapterError = (cause: unknown): DbAdapterError => ({
  code:
    cause instanceof Error && 'code' in cause && typeof cause.code === 'string'
      ? cause.code
      : 'POSTGRES_ERROR',
  message: cause instanceof Error ? cause.message : 'Unknown PostgreSQL error.',
  cause,
});
