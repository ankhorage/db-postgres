/** Structural ports isolate the PostgreSQL client boundary for deterministic tests. */
export interface PostgresQueryPort {
  query<TRecord extends object>(
    text: string,
    values?: readonly unknown[],
  ): Promise<{ readonly rows: TRecord[] }>;
}

export interface PostgresClientPort extends PostgresQueryPort {
  release(): void;
}
export interface PostgresPoolPort extends PostgresQueryPort {
  connect(): Promise<PostgresClientPort>;
  end(): Promise<void>;
}
