import type { DbInsertInput } from '@ankhorage/contracts/db';

import { toPostgresTableName } from '../utils/toPostgresTableName.js';
import { validatePostgresIdentifier } from '../utils/validatePostgresIdentifier.js';
import type { PostgresQuery } from './types.js';

/** Builds a parameterized PostgreSQL insert statement. */
export const buildPostgresInsertQuery = <TRecord extends object>(
  input: DbInsertInput<TRecord>,
): PostgresQuery => {
  const records = toRecords(input.values);
  if (records.length === 0) throw new Error('Insert values must not be empty.');
  const [firstRecord] = records;
  if (!firstRecord) throw new Error('Insert values must not be empty.');
  const columns = Object.keys(firstRecord);
  if (columns.length === 0 || records.some((record) => !sameFields(record, columns))) {
    throw new Error('Inserted records must have the same non-empty fields.');
  }
  const values = records.flatMap((record) =>
    columns.map((column) => readRecordValue(record, column)),
  );
  const rows = records
    .map(
      (_, row) =>
        `(${columns.map((_, column) => `$${row * columns.length + column + 1}`).join(', ')})`,
    )
    .join(', ');
  return {
    text: `INSERT INTO ${toPostgresTableName(input)} (${columns.map(validatePostgresIdentifier).join(', ')}) VALUES ${rows} RETURNING *`,
    values,
  };
};

const toRecords = <TRecord extends object>(
  values: TRecord | readonly TRecord[],
): readonly Record<string, unknown>[] =>
  (Array.isArray(values) ? values : [values]) as readonly Record<string, unknown>[];

const sameFields = (record: Record<string, unknown>, fields: readonly string[]): boolean =>
  Object.keys(record).sort().join('\0') === [...fields].sort().join('\0');

const readRecordValue = (record: Record<string, unknown>, field: string): unknown => {
  const entry = Object.entries(record).find(([candidate]) => candidate === field);
  if (!entry) throw new Error(`Missing inserted field: ${field}`);
  return entry[1];
};
