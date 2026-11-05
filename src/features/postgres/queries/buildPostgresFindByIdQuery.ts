import type { DbFindByIdInput } from '@ankhorage/contracts/db';

import { buildPostgresSelectQuery } from './buildPostgresSelectQuery.js';
import type { PostgresQuery } from './types.js';

/** Builds a primary-key select statement. */
export const buildPostgresFindByIdQuery = (input: DbFindByIdInput): PostgresQuery =>
  buildPostgresSelectQuery({
    ...input,
    filters: [{ field: input.idField ?? 'id', operator: 'eq', value: input.id }],
    page: { limit: 1 },
  });
