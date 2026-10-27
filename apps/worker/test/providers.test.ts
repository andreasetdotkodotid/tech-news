import test from 'node:test';
import assert from 'node:assert/strict';
import { RssProvider } from '../src/providers.js';

test('RSS provider parses RSS and Atom links', async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async () => new Response('<rss><channel><item><title>RSS item</title><link>https://example.test/rss</link><pubDate>Tue, 27 Oct 2026 00:00:00 GMT</pubDate></item></channel></rss>');
  const provider = new RssProvider();
  assert.deepEqual(await provider.fetch('https://feed.test/rss'), [{ title: 'RSS item', url: 'https://example.test/rss', publishedAt: 'Tue, 27 Oct 2026 00:00:00 GMT', categories: [] }]);
  globalThis.fetch = async () => new Response('<feed><entry><title>Atom item</title><link href="https://example.test/atom"/><published>2026-10-27T00:00:00Z</published></entry></feed>');
  assert.deepEqual(await provider.fetch('https://feed.test/atom'), [{ title: 'Atom item', url: 'https://example.test/atom', publishedAt: '2026-10-27T00:00:00Z', categories: [] }]);
  globalThis.fetch = originalFetch;
});
