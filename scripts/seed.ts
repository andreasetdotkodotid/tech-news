import postgres from 'postgres';
const sql = postgres(process.env.DATABASE_URL ?? '');
const categories = ['AI', 'Cloud', 'Linux', 'Cybersecurity', 'Kubernetes', 'DevOps', 'SRE'];
const sources = [
 ['CISA Advisories','cisa','https://www.cisa.gov/cybersecurity-advisories/all.xml','https://www.cisa.gov/'],
 ['NVD','nvd','https://nvd.nist.gov/feeds/xml/cve/misc/nvd-rss.xml','https://nvd.nist.gov/'],
 ['Ubuntu Security','ubuntu-security','https://ubuntu.com/security/notices/rss.xml','https://ubuntu.com/security/notices'],
 ['Debian Security','debian-security','https://www.debian.org/security/dsa','https://www.debian.org/security/'],
 ['Red Hat Blog','red-hat','https://www.redhat.com/en/rss/blog/channel/red-hat-enterprise-linux','https://www.redhat.com/en/blog'],
 ['AWS What’s New','aws','https://aws.amazon.com/about-aws/whats-new/recent/feed/','https://aws.amazon.com/new/'],
 ['Azure Updates','azure','https://azurecomcdn.azureedge.net/en-us/updates/feed/','https://azure.microsoft.com/updates/'],
 ['Google Cloud Blog','google-cloud','https://cloudblog.withgoogle.com/rss/','https://cloud.google.com/blog'],
 ['Kubernetes Blog','kubernetes','https://kubernetes.io/feed.xml','https://kubernetes.io/blog/'],
 ['CNCF Blog','cncf','https://www.cncf.io/feed/','https://www.cncf.io/blog/'],
 ['Google SRE','google-sre','https://sre.google/rss/','https://sre.google/'],
];
for (const name of categories) await sql`INSERT INTO categories (slug, name) VALUES (${name.toLowerCase()}, ${name}) ON CONFLICT (slug) DO NOTHING`;
for (const [name, slug, feedUrl, homepageUrl] of sources) await sql`INSERT INTO sources (name, slug, feed_url, homepage_url) VALUES (${name}, ${slug}, ${feedUrl}, ${homepageUrl}) ON CONFLICT (slug) DO UPDATE SET feed_url = EXCLUDED.feed_url, homepage_url = EXCLUDED.homepage_url`;
await sql.end();
