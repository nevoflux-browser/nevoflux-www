import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import sitemap from '@astrojs/sitemap';
import tailwind from '@astrojs/tailwind';
import cloudflare from '@astrojs/cloudflare';

export default defineConfig({
  site: 'https://nevoflux.app',
  output: 'server',
  adapter: cloudflare({ platformProxy: { enabled: true } }),
  integrations: [tailwind(), react(), sitemap()],
  i18n: {
    defaultLocale: 'en',
    locales: ['en', 'zh'],
    fallback: {
      zh: 'en',
    },
    routing: {
      fallbackType: 'rewrite',
      prefixDefaultLocale: false,
    },
  },
  vite: {
    build: {
      rollupOptions: {
        output: {
          manualChunks: {
            vendor: ['react', 'react-dom'],
            astro: ['astro'],
          },
        },
      },
    },
  },
});
