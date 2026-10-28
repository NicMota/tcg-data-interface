/** Startup diagnostics never print DATABASE_URL, which can contain credentials. */
export function databaseDiagnostic(
  error: unknown,
  databaseUrl: string | undefined,
): string | null {
  const code =
    error && typeof error === "object" && "code" in error
      ? String(error.code)
      : "";
  if (
    [
      "ECONNREFUSED",
      "ENOTFOUND",
      "EHOSTUNREACH",
      "ETIMEDOUT",
      "P1001",
      "P1002",
    ].includes(code)
  ) {
    let address = "the configured database host";
    try {
      const url = new URL(databaseUrl ?? "");
      address = `${url.hostname}:${url.port || "5432"}`;
    } catch {
      /* The configuration validator handles missing or invalid URLs. */
    }
    return (
      `Cannot connect to PostgreSQL at ${address}.\n` +
      "Start the local database from the project root:\n" +
      "  docker compose up -d --wait db\n" +
      "If Docker reports permission denied, run that command with sudo in your terminal.\n" +
      "Then apply the schema:\n" +
      "  npm run db:migrate --prefix server\n" +
      "For an external database, check DATABASE_URL and whether that database is running."
    );
  }
  if (["P1000", "28P01", "28000"].includes(code)) {
    return "PostgreSQL rejected the database credentials. Check DATABASE_URL in server/.env against the database user and password.";
  }
  if (["P2021", "P2022", "42P01", "42703"].includes(code)) {
    return "The database schema is missing or outdated. From the project root, run:\n  npm run db:migrate --prefix server";
  }
  return null;
}
