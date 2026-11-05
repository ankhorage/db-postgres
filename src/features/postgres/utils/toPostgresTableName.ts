import type { DbTableInput } from '@ankhorage/contracts/db';

import { validatePostgresIdentifier } from './validatePostgresIdentifier.js';

/** Converts a database table input into a quoted PostgreSQL relation name. */
export const toPostgresTableName = (input: DbTableInput): string =>
  input.schema
    ? `${validatePostgresIdentifier(input.schema)}.${validatePostgresIdentifier(input.table)}`
    : validatePostgresIdentifier(input.table);
