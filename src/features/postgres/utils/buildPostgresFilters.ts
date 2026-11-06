import type { DbFilter } from '@ankhorage/contracts/db';

import { validatePostgresIdentifier } from './validatePostgresIdentifier.js';

/** Builds a parameterized PostgreSQL where clause. */
export const buildPostgresFilters = (
  filters: readonly DbFilter[],
  start = 0,
): { readonly text: string; readonly values: readonly unknown[] } => {
  if (filters.length === 0) return { text: '', values: [] };
  const values: unknown[] = [];
  const conditions = filters.map((filter) => buildCondition(filter, values, start)).join(' AND ');
  return { text: ` WHERE ${conditions}`, values };
};

const buildCondition = (filter: DbFilter, values: unknown[], start: number): string => {
  const column = validatePostgresIdentifier(filter.field);
  if (filter.operator === 'in') return buildInCondition(column, filter.value, values, start);
  values.push(toFilterValue(filter));
  return `${column} ${toOperator(filter.operator)} $${start + values.length}`;
};

const buildInCondition = (
  column: string,
  value: unknown,
  values: unknown[],
  start: number,
): string => {
  if (!Array.isArray(value) || value.length === 0)
    throw new Error('An in filter requires a non-empty array.');
  const placeholders = value.map((item) => {
    values.push(item);
    return `$${start + values.length}`;
  });
  return `${column} IN (${placeholders.join(', ')})`;
};

const toFilterValue = (filter: DbFilter): unknown => {
  if (filter.operator === 'contains') return `%${String(filter.value)}%`;
  if (filter.operator === 'startsWith') return `${String(filter.value)}%`;
  if (filter.operator === 'endsWith') return `%${String(filter.value)}`;
  return filter.value;
};

const toOperator = (operator: DbFilter['operator']): string => {
  const operators = {
    eq: '=',
    neq: '<>',
    gt: '>',
    gte: '>=',
    lt: '<',
    lte: '<=',
    contains: 'LIKE',
    startsWith: 'LIKE',
    endsWith: 'LIKE',
  } as const;
  return operators[operator as Exclude<DbFilter['operator'], 'in'>];
};
