import test from 'node:test';
import assert from 'node:assert/strict';
import { canonicalizeUrl, normalizeArticle } from '../src/normalize.js';

test('canonicalize removes tracking and fragments', () => assert.equal(canonicalizeUrl('https://example.test/a?utm_source=x&keep=y#part'), 'https://example.test/a?keep=y'));
test('normalization validates and creates stable fallback hash', () => { const result = normalizeArticle({ title: ' A   title ', url: 'https://example.test/a', publishedAt: '2026-01-02T00:00:00Z' }, 'Example'); assert.equal(result?.title, 'A title'); assert.equal(result?.dedupeHash.length, 64); });
test('normalization rejects invalid URL', () => assert.equal(normalizeArticle({ title: 'Title', url: 'javascript:alert(1)' }, 'Example'), null));
