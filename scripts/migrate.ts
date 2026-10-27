import fs from 'node:fs/promises';
import path from 'node:path';
import postgres from 'postgres';

const sql = postgres(process.env.DATABASE_URL ?? '');
const directory = path.resolve('database/migrations');
const files = (await fs.readdir(directory)).filter((file) => file.endsWith('.sql')).sort();
await sql`CREATE TABLE IF NOT EXISTS schema_migrations (filename TEXT PRIMARY KEY, applied_at TIMESTAMPTZ NOT NULL DEFAULT now())`;
for (const file of files) {
  const [applied] = await sql`SELECT filename FROM schema_migrations WHERE filename = ${file}`;
  if (!applied) {
    await sql.begin(async (transaction) => {
      await transaction.unsafe(await fs.readFile(path.join(directory, file), 'utf8'));
      await transaction`INSERT INTO schema_migrations (filename) VALUES (${file})`;
    });
  }
}
await sql.end();
