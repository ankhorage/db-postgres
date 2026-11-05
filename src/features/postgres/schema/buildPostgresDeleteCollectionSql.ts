import type { DbCollectionReference } from '@ankhorage/contracts/db';

import { toPostgresTableName } from '../utils/toPostgresTableName.js';

/** Builds PostgreSQL DDL for dropping a database collection. */
export const buildPostgresDeleteCollectionSql = (input: DbCollectionReference): string =>
  `DROP TABLE ${input.schema ? toPostgresTableName({ table: input.name, schema: input.schema }) : toPostgresTableName({ table: input.name })}`;
