import { XMLParser } from 'fast-xml-parser';
import type { FeedItem } from './normalize.js';

export interface FeedProvider { fetch(feedUrl: string): Promise<FeedItem[]>; }
const parser = new XMLParser({ ignoreAttributes: false, removeNSPrefix: true, processEntities: false, htmlEntities: true, stopNodes: ['*.description', '*.content'] });
const text = (value: unknown): string => typeof value === 'string' ? value : typeof value === 'number' ? String(value) : typeof value === 'object' && value && '#text' in value ? String(value['#text']) : '';
const first = (value: unknown): unknown => Array.isArray(value) ? value[0] : value;
const link = (value: unknown): string => {
  const candidate = first(value);
  if (typeof candidate === 'string') return candidate;
  if (candidate && typeof candidate === 'object') {
    const record = candidate as Record<string, unknown>;
    return text(record['@_href'] ?? record.href ?? record['#text']);
  }
  return '';
};

export class RssProvider implements FeedProvider {
  async fetch(feedUrl: string): Promise<FeedItem[]> {
    const response = await fetch(feedUrl, { signal: AbortSignal.timeout(Number(process.env.FETCH_TIMEOUT_MS ?? 15000)), headers: { 'user-agent': 'TechSecurityNews/1.0 (+https://news.dotko.id)' } });
    if (!response.ok) throw new Error(`Feed request failed: ${response.status}`);
    const data = parser.parse(await response.text());
    const entries = data.rss?.channel?.item ?? data.feed?.entry ?? [];
    return (Array.isArray(entries) ? entries : [entries]).map((entry: Record<string, unknown>) => ({
      title: text(entry.title), url: link(entry.link) || text(entry.guid),
      publishedAt: text(entry.pubDate ?? entry.published ?? entry.updated), categories: (Array.isArray(entry.category) ? entry.category : [entry.category]).filter(Boolean).map((category) => text(category && typeof category === 'object' ? (category as Record<string, unknown>)['@_term'] ?? category : category)),
    }));
  }
}

type NvdResponse = { vulnerabilities?: Array<{ cve?: { id?: string; published?: string; descriptions?: Array<{ lang?: string; value?: string }> } }> };

export class NvdApiProvider implements FeedProvider {
  async fetch(apiUrl: string): Promise<FeedItem[]> {
    const url = new URL(apiUrl);
    const days = Number(process.env.NVD_LOOKBACK_DAYS ?? 30);
    url.searchParams.set('resultsPerPage', process.env.NVD_RESULTS_PER_PAGE ?? '2000');
    url.searchParams.set('pubStartDate', new Date(Date.now() - days * 86400000).toISOString());
    url.searchParams.set('pubEndDate', new Date().toISOString());
    const response = await fetch(url, { signal: AbortSignal.timeout(Number(process.env.FETCH_TIMEOUT_MS ?? 15000)), headers: { 'user-agent': 'TechSecurityNews/1.0 (+https://news.dotko.id)' } });
    if (!response.ok) throw new Error(`NVD API request failed: ${response.status}`);
    const data = await response.json() as NvdResponse;
    return (data.vulnerabilities ?? []).flatMap(({ cve }) => {
      if (!cve?.id || !cve.published) return [];
      const description = cve.descriptions?.find((item) => item.lang === 'en')?.value ?? `Security vulnerability ${cve.id}`;
      return [{ title: `${cve.id}: ${description}`, url: `https://nvd.nist.gov/vuln/detail/${cve.id}`, publishedAt: cve.published, categories: ['Cybersecurity'] }];
    });
  }
}

export class XApiProvider implements FeedProvider { async fetch(): Promise<FeedItem[]> { throw new Error('X API provider is not configured'); } }
