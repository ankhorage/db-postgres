import type { DbDeleteInput } from '@ankhorage/contracts/db';

import { buildPostgresFilters } from '../utils/buildPostgresFilters.js';
import { toPostgresTableName } from '../utils/toPostgresTableName.js';
import type { PostgresQuery } from './types.js';

/** Builds a parameterized PostgreSQL delete statement. */
export const buildPostgresDeleteQuery = (input: DbDeleteInput): PostgresQuery => {
  const filters = buildPostgresFilters(input.filters);
  return {
    text: `DELETE FROM ${toPostgresTableName(input)}${filters.text} RETURNING *`,
    values: filters.values,
  };
};
