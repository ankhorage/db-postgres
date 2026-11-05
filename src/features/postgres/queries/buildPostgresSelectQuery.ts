import type { DbSelectInput } from '@ankhorage/contracts/db';

import { buildPostgresFilters } from '../utils/buildPostgresFilters.js';
import { toPostgresTableName } from '../utils/toPostgresTableName.js';
import { validatePostgresIdentifier } from '../utils/validatePostgresIdentifier.js';
import type { PostgresQuery } from './types.js';

/** Builds a parameterized PostgreSQL select statement. */
export const buildPostgresSelectQuery = (input: DbSelectInput): PostgresQuery => {
  const filters = buildPostgresFilters(input.filters ?? []);
  const columns = (input.columns ?? ['*'])
    .map((column) => (column === '*' ? '*' : validatePostgresIdentifier(column)))
    .join(', ');
  const sort = input.sort?.length
    ? ` ORDER BY ${input.sort.map(({ field, direction = 'asc' }) => `${validatePostgresIdentifier(field)} ${direction === 'desc' ? 'DESC' : 'ASC'}`).join(', ')}`
    : '';
  const page = input.page
    ? `${input.page.limit === undefined ? '' : ` LIMIT ${positiveInteger(input.page.limit, 'limit')}`}${input.page.offset === undefined ? '' : ` OFFSET ${nonNegativeInteger(input.page.offset, 'offset')}`}`
    : '';
  return {
    text: `SELECT ${columns} FROM ${toPostgresTableName(input)}${filters.text}${sort}${page}`,
    values: filters.values,
  };
};

const positiveInteger = (value: number, name: string): number => {
  if (!Number.isInteger(value) || value < 1) throw new Error(`${name} must be a positive integer.`);
  return value;
};

const nonNegativeInteger = (value: number, name: string): number => {
  if (!Number.isInteger(value) || value < 0)
    throw new Error(`${name} must be a non-negative integer.`);
  return value;
};
