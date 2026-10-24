// @ts-check
import { defineConfig } from 'astro/config';
import { loadEnv } from 'vite';
import sitemap from '@astrojs/sitemap';
import tailwindcss from '@tailwindcss/vite';

const mode = process.env.NODE_ENV ?? 'development';
const env = loadEnv(mode, process.cwd(), 'DTC_');

export default defineConfig({
  // Absolute URLs for canonical/OG tags and the sitemap. Set at build time on Cloudflare Pages.
  site: env.DTC_SITE_URL || 'http://localhost:4321',
  output: 'static',
  integrations: [sitemap()],
  vite: {
    plugins: [tailwindcss()],
    // Only DTC_-prefixed vars reach the browser bundle. The contact handler's
    // secrets are NOT prefixed: they live only in the Pages Function (context.env).
    envPrefix: 'DTC_',
  },
});
