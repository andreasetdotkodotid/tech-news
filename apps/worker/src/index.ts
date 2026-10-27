import { CronJob } from 'cron';
import postgres from 'postgres';
import { normalizeArticle } from './normalize.js';
import { RssProvider } from './providers.js';

const sql = postgres(process.env.DATABASE_URL ?? '');
const log = (event: string, data: Record<string, unknown> = {}) => console.log(JSON.stringify({ level: 'info', event, timestamp: new Date().toISOString(), ...data }));
async function retry<T>(action: () => Promise<T>, attempts = 3): Promise<T> { let error: unknown; for (let i = 0; i < attempts; i++) try { return await action(); } catch (caught) { error = caught; await new Promise((r) => setTimeout(r, 500 * 2 ** i)); } throw error; }

export async function sync(): Promise<void> {
  const sources = await sql`SELECT id, name, feed_url FROM sources WHERE active = true AND provider = 'rss'`;
  const provider = new RssProvider();
  for (const source of sources) {
    const [run] = await sql`INSERT INTO sync_runs (source_id, status) VALUES (${source.id}, 'running') RETURNING id`;
    let seen = 0, added = 0;
    try {
      const items = await retry(() => provider.fetch(source.feed_url)); seen = items.length;
      for (const item of items) {
        const article = normalizeArticle(item, source.name); if (!article) continue;
        const inserted = await sql`INSERT INTO articles (source_id, title, canonical_url, dedupe_hash, published_at, feed_url) VALUES (${source.id}, ${article.title}, ${article.canonicalUrl}, ${article.dedupeHash}, ${article.publishedAt}, ${source.feed_url}) ON CONFLICT DO NOTHING RETURNING id`;
        if (inserted.length) { added++; for (const category of article.categories) await sql`INSERT INTO article_categories (article_id, category_id) SELECT ${inserted[0].id}, id FROM categories WHERE lower(name) = lower(${category}) ON CONFLICT DO NOTHING`; }
      }
      await sql`UPDATE sync_runs SET status = 'success', finished_at = now(), articles_seen = ${seen}, articles_added = ${added} WHERE id = ${run.id}`; log('sync.success', { source: source.name, seen, added });
    } catch (error) { const message = error instanceof Error ? error.message : 'Unknown error'; await sql`UPDATE sync_runs SET status = 'failed', finished_at = now(), articles_seen = ${seen}, articles_added = ${added}, error_message = ${message} WHERE id = ${run.id}`; console.error(JSON.stringify({ level: 'error', event: 'sync.failed', source: source.name, error: message })); }
  }
}

if (process.argv[2] === 'sync') { await sync(); await sql.end(); } else {
  const timezone = 'Asia/Jakarta';
  new CronJob(process.env.SYNC_CRON ?? '1 0 * * *', sync, null, true, timezone);
  new CronJob(process.env.FALLBACK_CRON ?? '1 */6 * * *', sync, null, true, timezone);
  log('scheduler.started', { timezone });
}
