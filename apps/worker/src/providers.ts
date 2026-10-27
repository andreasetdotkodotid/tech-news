import { XMLParser } from 'fast-xml-parser';
import type { FeedItem } from './normalize.js';

export interface FeedProvider { fetch(feedUrl: string): Promise<FeedItem[]>; }
const parser = new XMLParser({ ignoreAttributes: false, removeNSPrefix: true });
const text = (value: unknown): string => typeof value === 'string' ? value : typeof value === 'object' && value && '#text' in value ? String(value['#text']) : '';

export class RssProvider implements FeedProvider {
  async fetch(feedUrl: string): Promise<FeedItem[]> {
    const response = await fetch(feedUrl, { signal: AbortSignal.timeout(Number(process.env.FETCH_TIMEOUT_MS ?? 15000)), headers: { 'user-agent': 'TechSecurityNews/1.0 (+https://news.dotko.id)' } });
    if (!response.ok) throw new Error(`Feed request failed: ${response.status}`);
    const data = parser.parse(await response.text());
    const entries = data.rss?.channel?.item ?? data.feed?.entry ?? [];
    return (Array.isArray(entries) ? entries : [entries]).map((entry: Record<string, unknown>) => ({
      title: text(entry.title), url: typeof entry.link === 'object' && entry.link ? String((entry.link as Record<string, unknown>)['@_href'] ?? '') : text(entry.link ?? entry.guid),
      publishedAt: text(entry.pubDate ?? entry.published ?? entry.updated), categories: (Array.isArray(entry.category) ? entry.category : [entry.category]).filter(Boolean).map(text),
    }));
  }
}

export class XApiProvider implements FeedProvider { async fetch(): Promise<FeedItem[]> { throw new Error('X API provider is not configured'); } }
