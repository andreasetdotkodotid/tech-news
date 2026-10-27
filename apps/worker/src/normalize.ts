import crypto from 'node:crypto';

export type FeedItem = { title: string; url: string; publishedAt?: string; categories?: string[] };
export type NormalizedArticle = { title: string; canonicalUrl: string; publishedAt: Date; categories: string[]; dedupeHash: string };

export function canonicalizeUrl(input: string): string | null {
  try {
    const url = new URL(input);
    if (!['http:', 'https:'].includes(url.protocol)) return null;
    url.hash = '';
    for (const key of [...url.searchParams.keys()]) if (/^(utm_|fbclid$|gclid$)/i.test(key)) url.searchParams.delete(key);
    return url.toString();
  } catch { return null; }
}

export function normalizeArticle(item: FeedItem, source: string): NormalizedArticle | null {
  const title = item.title.replace(/\s+/g, ' ').trim();
  const canonicalUrl = canonicalizeUrl(item.url);
  const publishedAt = item.publishedAt ? new Date(item.publishedAt) : new Date();
  if (!title || !canonicalUrl || Number.isNaN(publishedAt.valueOf())) return null;
  const day = publishedAt.toISOString().slice(0, 10);
  const dedupeHash = crypto.createHash('sha256').update(`${title.toLowerCase()}|${source.toLowerCase()}|${day}`).digest('hex');
  return { title, canonicalUrl, publishedAt, categories: item.categories ?? [], dedupeHash };
}
