import type { DbCollectionDefinition } from '@ankhorage/contracts/db';

import { toPostgresTableName } from '../utils/toPostgresTableName.js';
import { validatePostgresIdentifier } from '../utils/validatePostgresIdentifier.js';

/** Builds PostgreSQL DDL for a database collection. */
export const buildPostgresCreateCollectionSql = (input: DbCollectionDefinition): string => {
  const fields = input.fields.map(toFieldSql);
  if (input.primaryKey)
    fields.push(`PRIMARY KEY (${validatePostgresIdentifier(input.primaryKey)})`);
  if (fields.length === 0) throw new Error('A collection requires at least one field.');
  return `CREATE TABLE ${input.schema ? toPostgresTableName({ table: input.name, schema: input.schema }) : toPostgresTableName({ table: input.name })} (${fields.join(', ')})`;
};

const toFieldSql = (field: DbCollectionDefinition['fields'][number]): string =>
  `${validatePostgresIdentifier(field.name)} ${toFieldType(field.type)}${field.required ? ' NOT NULL' : ''}${field.unique ? ' UNIQUE' : ''}${field.defaultValue === undefined ? '' : ` DEFAULT ${toDefaultValue(field.defaultValue)}`}`;

const toFieldType = (type: DbCollectionDefinition['fields'][number]['type']): string => {
  switch (type) {
    case 'text':
      return 'TEXT';
    case 'number':
      return 'DOUBLE PRECISION';
    case 'boolean':
      return 'BOOLEAN';
    case 'datetime':
      return 'TIMESTAMPTZ';
    case 'json':
      return 'JSONB';
    case 'uuid':
      return 'UUID';
  }
};

const toDefaultValue = (value: string | number | boolean | null): string => {
  if (value === null) return 'NULL';
  if (typeof value === 'number') return String(value);
  if (typeof value === 'boolean') return value ? 'TRUE' : 'FALSE';
  return `'${value.replaceAll("'", "''")}'`;
};
