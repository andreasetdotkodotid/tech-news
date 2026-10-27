import test from 'node:test';
import assert from 'node:assert/strict';
import { NvdApiProvider } from '../src/providers.js';

test('NVD provider maps CVE API records to metadata', async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async (input) => { const url = String(input); assert.match(url, /pubStartDate=/); return new Response(JSON.stringify({ vulnerabilities: [{ cve: { id: 'CVE-2026-0001', published: '2026-10-27T00:00:00.000Z', descriptions: [{ lang: 'en', value: 'Example vulnerability' }] } }] })); };
  const items = await new NvdApiProvider().fetch('https://services.nvd.nist.gov/rest/json/cves/2.0');
  assert.deepEqual(items[0], { title: 'CVE-2026-0001: Example vulnerability', url: 'https://nvd.nist.gov/vuln/detail/CVE-2026-0001', publishedAt: '2026-10-27T00:00:00.000Z', categories: ['Cybersecurity'] });
  globalThis.fetch = originalFetch;
});
