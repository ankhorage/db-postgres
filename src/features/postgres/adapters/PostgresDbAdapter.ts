import type {
  DbAdapter,
  DbCollectionDefinition,
  DbCollectionReference,
  DbDeleteInput,
  DbFindByIdInput,
  DbInsertInput,
  DbResult,
  DbSelectInput,
  DbUpdateInput,
} from '@ankhorage/contracts/db';

import { buildPostgresDeleteQuery } from '../queries/buildPostgresDeleteQuery.js';
import { buildPostgresFindByIdQuery } from '../queries/buildPostgresFindByIdQuery.js';
import { buildPostgresInsertQuery } from '../queries/buildPostgresInsertQuery.js';
import { buildPostgresSelectQuery } from '../queries/buildPostgresSelectQuery.js';
import { buildPostgresUpdateQuery } from '../queries/buildPostgresUpdateQuery.js';
import { buildPostgresCreateCollectionSql } from '../schema/buildPostgresCreateCollectionSql.js';
import { buildPostgresDeleteCollectionSql } from '../schema/buildPostgresDeleteCollectionSql.js';
import type { PostgresAdapter } from '../types.js';
import { toPostgresAdapterError } from '../utils/toPostgresAdapterError.js';
import type { PostgresClientPort, PostgresPoolPort, PostgresQueryPort } from './ports.js';

/** Implements database and schema contracts with a PostgreSQL pool. */
export class PostgresDbAdapter implements PostgresAdapter {
  public readonly capabilities = {
    transactions: true,
    returning: true,
    realtime: false,
    schemaGeneration: true,
    directExecution: true,
  };

  public constructor(private readonly pool: PostgresPoolPort) {}

  public async close(): Promise<void> {
    await this.pool.end();
  }
  public select<TRecord extends object>(input: DbSelectInput): Promise<DbResult<TRecord[]>> {
    return this.query(buildPostgresSelectQuery(input));
  }
  public insert<TRecord extends object>(
    input: DbInsertInput<TRecord>,
  ): Promise<DbResult<TRecord[]>> {
    return this.query(buildPostgresInsertQuery(input));
  }
  public update<TRecord extends object>(
    input: DbUpdateInput<TRecord>,
  ): Promise<DbResult<TRecord[]>> {
    return this.query(buildPostgresUpdateQuery(input));
  }
  public delete<TRecord extends object>(input: DbDeleteInput): Promise<DbResult<TRecord[]>> {
    return this.query(buildPostgresDeleteQuery(input));
  }

  public async findById<TRecord extends object>(
    input: DbFindByIdInput,
  ): Promise<DbResult<TRecord | null>> {
    const result = await this.query<TRecord>(buildPostgresFindByIdQuery(input));
    return result.ok ? toResult<TRecord | null>(result.data[0] ?? null) : result;
  }

  public async transaction<TResult>(
    run: (adapter: DbAdapter) => Promise<TResult>,
  ): Promise<DbResult<TResult>> {
    const client = await this.connect();
    if (!client.ok) return client;
    try {
      await client.data.query('BEGIN');
    } catch (cause) {
      client.data.release();
      return this.fail(cause);
    }
    try {
      const data = await run(new PostgresTransactionAdapter(client.data));
      await client.data.query('COMMIT');
      return toResult<TResult>(data);
    } catch (cause) {
      await rollbackIgnoringFailure(client.data);
      return this.fail(cause);
    } finally {
      client.data.release();
    }
  }

  public generateCreateCollectionSql(input: DbCollectionDefinition) {
    try {
      return { ok: true as const, executed: false, sql: buildPostgresCreateCollectionSql(input) };
    } catch (cause) {
      return this.adminFail(cause);
    }
  }
  public generateDeleteCollectionSql(input: DbCollectionReference) {
    try {
      return { ok: true as const, executed: false, sql: buildPostgresDeleteCollectionSql(input) };
    } catch (cause) {
      return this.adminFail(cause);
    }
  }
  public async createCollection(input: DbCollectionDefinition) {
    const sql = this.generateCreateCollectionSql(input);
    return sql.ok ? this.executeAdmin(sql.sql) : sql;
  }
  public async deleteCollection(input: DbCollectionReference) {
    const sql = this.generateDeleteCollectionSql(input);
    return sql.ok ? this.executeAdmin(sql.sql) : sql;
  }

  private async connect(): Promise<DbResult<PostgresClientPort>> {
    try {
      return { ok: true, data: await this.pool.connect() };
    } catch (cause) {
      return this.fail<PostgresClientPort>(cause);
    }
  }
  private async query<TRecord extends object>(query: {
    readonly text: string;
    readonly values: readonly unknown[];
  }): Promise<DbResult<TRecord[]>> {
    return queryPostgres<TRecord>(this.pool, query);
  }
  private async executeAdmin(sql: string) {
    try {
      await this.pool.query(sql);
      return { ok: true as const, executed: true, sql };
    } catch (cause) {
      return this.adminFail(cause);
    }
  }
  private fail<TData>(cause: unknown): DbResult<TData> {
    return { ok: false, error: toPostgresAdapterError(cause) };
  }
  private adminFail(cause: unknown) {
    return { ok: false as const, error: toPostgresAdapterError(cause) };
  }
}

class PostgresTransactionAdapter implements DbAdapter {
  public readonly capabilities = { transactions: true, returning: true, realtime: false };
  public constructor(private readonly client: PostgresQueryPort) {}
  public select<TRecord extends object>(input: DbSelectInput): Promise<DbResult<TRecord[]>> {
    return queryPostgres(this.client, buildPostgresSelectQuery(input));
  }
  public insert<TRecord extends object>(
    input: DbInsertInput<TRecord>,
  ): Promise<DbResult<TRecord[]>> {
    return queryPostgres(this.client, buildPostgresInsertQuery(input));
  }
  public update<TRecord extends object>(
    input: DbUpdateInput<TRecord>,
  ): Promise<DbResult<TRecord[]>> {
    return queryPostgres(this.client, buildPostgresUpdateQuery(input));
  }
  public delete<TRecord extends object>(input: DbDeleteInput): Promise<DbResult<TRecord[]>> {
    return queryPostgres(this.client, buildPostgresDeleteQuery(input));
  }
  public async findById<TRecord extends object>(
    input: DbFindByIdInput,
  ): Promise<DbResult<TRecord | null>> {
    const result = await queryPostgres<TRecord>(this.client, buildPostgresFindByIdQuery(input));
    return result.ok ? toResult<TRecord | null>(result.data[0] ?? null) : result;
  }
}

const queryPostgres = async <TRecord extends object>(
  client: PostgresQueryPort,
  query: { readonly text: string; readonly values: readonly unknown[] },
): Promise<DbResult<TRecord[]>> => {
  try {
    const result = await client.query<TRecord>(query.text, query.values);
    return { ok: true, data: result.rows };
  } catch (cause) {
    return { ok: false, error: toPostgresAdapterError(cause) };
  }
};
const rollbackIgnoringFailure = async (client: PostgresQueryPort): Promise<void> => {
  try {
    await client.query('ROLLBACK');
  } catch {
    /* preserves the original operation failure */
  }
};
const toResult = <TData>(data: TData): DbResult<TData> => ({ ok: true, data }) as DbResult<TData>;
