INSERT INTO sources (name, slug, feed_url, homepage_url, provider, active)
VALUES ('NVD CVE', 'nvd-cve', 'https://services.nvd.nist.gov/rest/json/cves/2.0', 'https://nvd.nist.gov/vuln/search', 'nvd-api', true)
ON CONFLICT (slug) DO UPDATE SET feed_url = EXCLUDED.feed_url, homepage_url = EXCLUDED.homepage_url, provider = EXCLUDED.provider, active = true;
