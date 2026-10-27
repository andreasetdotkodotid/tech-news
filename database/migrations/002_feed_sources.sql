UPDATE sources SET active = false WHERE slug IN ('nvd', 'debian-security', 'google-sre');
UPDATE sources SET feed_url = 'https://azure.microsoft.com/en-us/updates/feed/' WHERE slug = 'azure';
