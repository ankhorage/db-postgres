export interface PostgresQuery {
  readonly text: string;
  readonly values: readonly unknown[];
}
