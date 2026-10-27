import { defineConfig } from 'astro/config';
import node from '@astrojs/node';
import sitemap from '@astrojs/sitemap';
import tailwind from '@astrojs/tailwind';

const base = (process.env.BASE_PATH ?? '/tech-and-security').replace(/\/$/, '');
const site = process.env.PUBLIC_SITE_URL ?? `https://news.dotko.id${base}`;

export default defineConfig({
  site,
  base,
  output: 'server',
  adapter: node({ mode: 'standalone' }),
  integrations: [tailwind(), sitemap()],
  server: { host: '0.0.0.0', port: Number(process.env.WEB_PORT ?? 4321) },
});
