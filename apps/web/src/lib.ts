import postgres from 'postgres';
const sql = postgres(import.meta.env.DATABASE_URL);
export type Article = { id: number; title: string; canonical_url: string; published_at: string; source_name: string; source_slug: string; categories: string[] };
export type FilterOption = { slug: string; name: string };
export type ArticleResult = { articles: Article[]; total: number };
export async function getArticles(page = 1, query = '', source = '', category = '') {
 const offset = (page - 1) * 20;
 const articles = await sql<Article[]>`SELECT a.id, a.title, a.canonical_url, a.published_at, s.name AS source_name, s.slug AS source_slug, coalesce(array_agg(DISTINCT c.name) FILTER (WHERE c.name IS NOT NULL), '{}') AS categories FROM articles a JOIN sources s ON s.id = a.source_id LEFT JOIN article_categories ac ON ac.article_id = a.id LEFT JOIN categories c ON c.id = ac.category_id WHERE (${query} = '' OR a.title ILIKE ${'%' + query + '%'}) AND (${source} = '' OR s.slug = ${source}) AND (${category} = '' OR EXISTS (SELECT 1 FROM article_categories ac2 JOIN categories c2 ON c2.id=ac2.category_id WHERE ac2.article_id=a.id AND c2.slug=${category})) GROUP BY a.id, s.id ORDER BY a.published_at DESC LIMIT 20 OFFSET ${offset}`;
 const [count] = await sql<{ total: number }[]>`SELECT count(*)::int AS total FROM articles a JOIN sources s ON s.id=a.source_id WHERE (${query} = '' OR a.title ILIKE ${'%' + query + '%'}) AND (${source} = '' OR s.slug=${source}) AND (${category} = '' OR EXISTS (SELECT 1 FROM article_categories ac JOIN categories c ON c.id=ac.category_id WHERE ac.article_id=a.id AND c.slug=${category}))`;
 return { articles, total: count.total };
}
export async function filters() { return { sources: await sql`SELECT slug, name FROM sources WHERE active ORDER BY name`, categories: await sql`SELECT slug, name FROM categories ORDER BY name` }; }
