import type { DbUpdateInput } from '@ankhorage/contracts/db';

import { buildPostgresFilters } from '../utils/buildPostgresFilters.js';
import { toPostgresTableName } from '../utils/toPostgresTableName.js';
import { validatePostgresIdentifier } from '../utils/validatePostgresIdentifier.js';
import type { PostgresQuery } from './types.js';

/** Builds a parameterized PostgreSQL update statement. */
export const buildPostgresUpdateQuery = <TRecord extends object>(
  input: DbUpdateInput<TRecord>,
): PostgresQuery => {
  const entries = Object.entries(input.values);
  if (entries.length === 0) throw new Error('Updated values must not be empty.');
  const filters = buildPostgresFilters(input.filters, entries.length);
  return {
    text: `UPDATE ${toPostgresTableName(input)} SET ${entries.map(([column], index) => `${validatePostgresIdentifier(column)} = $${index + 1}`).join(', ')}${filters.text} RETURNING *`,
    values: [...entries.map(([, value]) => value), ...filters.values],
  };
};
