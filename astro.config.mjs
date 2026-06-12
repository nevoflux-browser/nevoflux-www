import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import sitemap from '@astrojs/sitemap';
import tailwind from '@astrojs/tailwind';

export default defineConfig({
  site: 'https://nevoflux.app',
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
