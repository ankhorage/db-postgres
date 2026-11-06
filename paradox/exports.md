# Public API

## createPostgresAdapter

Kind: `value`
Module: `src/features/postgres/createPostgresAdapter.ts`
Source: `src/features/postgres/createPostgresAdapter.ts:7:14`

Creates a provider-neutral PostgreSQL adapter from a standard connection string.

### Signatures

- `(config: PostgresAdapterConfig) => PostgresAdapter`
  - config: `PostgresAdapterConfig`
  - returns: `PostgresAdapter`

## PostgresAdapter

Kind: `unknown`
Module: `src/features/postgres/types.ts`
Source: `src/features/postgres/types.ts:11:1`

## PostgresAdapterConfig

Kind: `type`
Module: `src/features/postgres/types.ts`
Source: `src/features/postgres/types.ts:3:1`

### Members

| Name | Kind | Type | Required | Description |
| --- | --- | --- | --- | --- |
| connectionString | property | `string` | yes |  |

## PostgresAdapterLifecycle

Kind: `type`
Module: `src/features/postgres/types.ts`
Source: `src/features/postgres/types.ts:7:1`

### Members

| Name | Kind | Type | Required | Description |
| --- | --- | --- | --- | --- |
| close | method | `() => Promise<void>` | yes |  |
