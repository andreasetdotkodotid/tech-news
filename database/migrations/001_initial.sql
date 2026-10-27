CREATE TABLE categories (id SERIAL PRIMARY KEY, slug TEXT NOT NULL UNIQUE, name TEXT NOT NULL UNIQUE);
CREATE TABLE sources (id SERIAL PRIMARY KEY, name TEXT NOT NULL UNIQUE, slug TEXT NOT NULL UNIQUE, feed_url TEXT NOT NULL UNIQUE, homepage_url TEXT, provider TEXT NOT NULL DEFAULT 'rss', active BOOLEAN NOT NULL DEFAULT true, created_at TIMESTAMPTZ NOT NULL DEFAULT now());
CREATE TABLE articles (id BIGSERIAL PRIMARY KEY, source_id INT NOT NULL REFERENCES sources(id) ON DELETE CASCADE, title TEXT NOT NULL, canonical_url TEXT NOT NULL UNIQUE, dedupe_hash CHAR(64) NOT NULL UNIQUE, published_at TIMESTAMPTZ NOT NULL, feed_url TEXT NOT NULL, fetched_at TIMESTAMPTZ NOT NULL DEFAULT now(), created_at TIMESTAMPTZ NOT NULL DEFAULT now());
CREATE INDEX articles_published_at_idx ON articles (published_at DESC);
CREATE INDEX articles_source_published_idx ON articles (source_id, published_at DESC);
CREATE TABLE article_categories (article_id BIGINT NOT NULL REFERENCES articles(id) ON DELETE CASCADE, category_id INT NOT NULL REFERENCES categories(id) ON DELETE CASCADE, PRIMARY KEY (article_id, category_id));
CREATE INDEX article_categories_category_idx ON article_categories (category_id, article_id);
CREATE TABLE sync_runs (id BIGSERIAL PRIMARY KEY, source_id INT REFERENCES sources(id) ON DELETE SET NULL, started_at TIMESTAMPTZ NOT NULL DEFAULT now(), finished_at TIMESTAMPTZ, status TEXT NOT NULL CHECK (status IN ('running','success','failed')), articles_seen INT NOT NULL DEFAULT 0, articles_added INT NOT NULL DEFAULT 0, error_message TEXT);
