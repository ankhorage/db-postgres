/** Validates and quotes a PostgreSQL identifier. */
export const validatePostgresIdentifier = (value: string): string => {
  if (!/^[A-Za-z_][A-Za-z0-9_]*$/u.test(value)) throw new Error(`Invalid SQL identifier: ${value}`);
  return `"${value}"`;
};
