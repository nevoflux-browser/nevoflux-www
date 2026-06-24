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
    resolve: {
      // react-dom/server's "browser" build needs MessageChannel, which workerd
      // lacks; the "edge" build is built for edge runtimes and works on Workers.
      alias: {
        'react-dom/server': 'react-dom/server.edge',
      },
    },
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
