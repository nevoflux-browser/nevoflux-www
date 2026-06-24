/// <reference path="../.astro/types.d.ts" />
/// <reference path="../worker-configuration.d.ts" />

type Runtime = import('@astrojs/cloudflare').Runtime<Env>;

declare namespace App {
  interface Locals extends Runtime {}
}

// Secret bindings (set in .dev.vars locally / Cloudflare secrets in prod).
// Declaration-merged into the generated `Env` so re-running `wrangler types` won't drop them.
interface Env {
  BETTER_AUTH_SECRET: string;
  BETTER_AUTH_URL: string;
  GOOGLE_CLIENT_ID: string;
  GOOGLE_CLIENT_SECRET: string;
  GITHUB_OAUTH_CLIENT_ID: string;
  GITHUB_OAUTH_CLIENT_SECRET: string;
  RESEND_API_KEY: string;
  RESEND_FROM?: string;
}
