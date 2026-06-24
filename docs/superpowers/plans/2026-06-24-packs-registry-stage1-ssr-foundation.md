# PackHub Registry — Stage 1: SSR-on-Cloudflare Foundation — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Migrate the static Astro site to SSR on Cloudflare Workers without changing any visible behavior, exposing D1 + KV bindings for later stages.

**Architecture:** Add `@astrojs/cloudflare` with `output: 'server'`. Every existing page is explicitly marked `prerender = true`, so the build still emits the same static HTML (served from Workers static assets). Only future routes opt into SSR. A `wrangler.toml` declares D1 (`DB`) and KV (`CACHE`) bindings; `platformProxy` gives `astro dev` local bindings. Preview switches from `astro preview` (unsupported by the adapter) to `wrangler dev`.

**Tech Stack:** Astro 5.7, `@astrojs/cloudflare` v12, Wrangler, Cloudflare Workers (static assets) + D1 + KV.

## Global Constraints

- Node `22.22.0` (`.nvmrc`); pnpm `>= 10` (`packageManager: pnpm@10.8.0`). One line each below copied from the spec / repo conventions:
- Package manager is **pnpm** — never npm/yarn.
- Import alias `~/*` → `src/*`; prefer it over relative paths.
- Conventional Commits, header ≤ 100 chars (`feat`, `fix`, `chore`, `docs`, `refactor`).
- TypeScript Astro **strict** mode. ESLint must pass with `--max-warnings=0`.
- i18n strings live in BOTH `src/i18n/en/translation.json` and `src/i18n/zh/translation.json`; shallow top-level merge — keep them structurally identical (not exercised in Stage 1, but the rule stands).
- Deploy target: **Cloudflare Workers with static assets** (alternative: Pages). Bindings: `DB` (D1), `CACHE` (KV).
- Secrets/credentials never committed: `.dev.vars` and `.wrangler/` are gitignored.
- Every task ends green on the relevant subset of: `pnpm typecheck`, `pnpm lint`, `pnpm format`, `pnpm spell`, `pnpm test`, `pnpm build`.

---

## File Structure

- Modify `astro.config.mjs` — add adapter + `output: 'server'`.
- Modify `package.json` — deps (`@astrojs/cloudflare`), devDep (`wrangler`), `preview` script.
- Create `wrangler.toml` — Worker name, compat, static assets, D1 + KV bindings.
- Create `worker-configuration.d.ts` — generated `Env` interface (from `wrangler types`).
- Modify `src/env.d.ts` — type `App.Locals.runtime` as `Runtime<Env>`.
- Modify each existing page (`src/pages/**/*.astro`) — add `export const prerender = true`.
- Create `src/lib/runtime.ts` — typed `getRuntime(locals)` accessor (the one unit-tested unit).
- Create `src/tests/runtime.test.ts` — unit test for the accessor.
- Modify `.gitignore` — `.dev.vars`, `.wrangler/`.
- Create `.dev.vars.example` — documents required secrets (committed; real `.dev.vars` is not).

---

### Task 1: Install adapter, switch to SSR, keep dev/build green

**Files:**

- Modify: `package.json` (dependencies + devDependencies)
- Modify: `astro.config.mjs`

**Interfaces:**

- Produces: an Astro project in `output: 'server'` mode with the Cloudflare adapter; `pnpm build` produces `dist/_worker.js/`.

- [ ] **Step 1: Install the adapter and wrangler**

```bash
pnpm add @astrojs/cloudflare
pnpm add -D wrangler
```

- [ ] **Step 2: Edit `astro.config.mjs`** — add the import, `output: 'server'`, and the adapter with `platformProxy` (for local bindings). Keep all existing integrations and i18n config unchanged.

```js
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
    fallback: { zh: 'en' },
    routing: { fallbackType: 'rewrite', prefixDefaultLocale: false },
  },
  vite: {
    build: {
      rollupOptions: {
        output: {
          manualChunks: { vendor: ['react', 'react-dom'], astro: ['astro'] },
        },
      },
    },
  },
});
```

- [ ] **Step 3: Verify dev server boots**

Run: `pnpm dev` (then Ctrl-C after it prints the local URL)
Expected: Astro dev server starts on `http://localhost:3000` with no adapter errors.

- [ ] **Step 4: Verify the build produces a Worker**

Run: `pnpm build`
Expected: build completes; `dist/_worker.js/` exists.
Check: `ls dist/_worker.js`

> If `platformProxy` is rejected by the installed adapter version, drop that option
> (`adapter: cloudflare()`); local bindings then require `wrangler dev`. Re-run Step 3–4.

- [ ] **Step 5: Commit**

```bash
git add package.json pnpm-lock.yaml astro.config.mjs
git commit -m "build(packs): add @astrojs/cloudflare adapter and switch to SSR output"
```

---

### Task 2: Prerender every existing page (no behavior change)

**Files:**

- Modify: `src/pages/404.astro`
- Modify: `src/pages/[...locale]/index.astro`
- Modify: `src/pages/[...locale]/packs.astro`
- Modify: `src/pages/[...locale]/privacy-policy.astro`
- Modify: `src/pages/[...locale]/release-notes/index.astro`
- Modify: `src/pages/[...locale]/release-notes/[slug].astro`
- Modify: `src/pages/[...locale]/whatsnew.astro`

**Interfaces:**

- Produces: all current routes statically prerendered under `output: 'server'`, so build output matches the pre-migration static HTML.

- [ ] **Step 1: Add `export const prerender = true` to the top of each page's frontmatter.** For pages that already `export const getStaticPaths`, add it alongside. Example for `src/pages/[...locale]/index.astro` (place as the first export in the `---` block):

```astro
---
export const prerender = true;
import Layout from '~/layouts/Layout.astro';
// ...existing imports and getStaticPaths unchanged...
---
```

Apply the same one-line addition to all seven files listed above.

- [ ] **Step 2: Verify the build prerenders them (static HTML emitted)**

Run: `pnpm build`
Expected: build log shows the routes as prerendered; `dist/index.html`, `dist/zh/index.html`, `dist/packs/index.html`, `dist/privacy-policy/index.html`, `dist/release-notes/index.html`, `dist/whatsnew/index.html`, `dist/404.html` all exist.
Check: `ls dist/index.html dist/zh/index.html dist/packs/index.html dist/404.html`

- [ ] **Step 3: Verify existing unit tests still pass**

Run: `pnpm test`
Expected: the 2 existing test files pass (11 tests).

- [ ] **Step 4: Typecheck, lint, format, spell**

Run: `pnpm typecheck && pnpm lint && pnpm format && pnpm spell`
Expected: all clean (0 errors/warnings/issues).

- [ ] **Step 5: Commit**

```bash
git add src/pages
git commit -m "refactor(packs): prerender all existing pages under SSR output"
```

---

### Task 3: Declare D1 + KV bindings and type the runtime

**Files:**

- Create: `wrangler.toml`
- Create: `worker-configuration.d.ts` (generated)
- Modify: `src/env.d.ts`
- Modify: `.gitignore`
- Create: `.dev.vars.example`

**Interfaces:**

- Produces: `App.Locals.runtime: Runtime<Env>` where `Env` has `DB: D1Database` and `CACHE: KVNamespace`. Later stages read bindings via `Astro.locals.runtime.env.DB` / `.CACHE`.

- [ ] **Step 1: Create `wrangler.toml`** with the static-assets Worker layout and local bindings. `database_id` is a placeholder for local dev; the real id is set at deploy time via secrets/CI.

```toml
name = "nevoflux-www"
main = "dist/_worker.js/index.js"
compatibility_date = "2025-04-01"
compatibility_flags = ["nodejs_compat"]

[assets]
directory = "./dist"
binding = "ASSETS"

[[d1_databases]]
binding = "DB"
database_name = "nevoflux-www"
database_id = "00000000-0000-0000-0000-000000000000"

[[kv_namespaces]]
binding = "CACHE"
id = "00000000000000000000000000000000"
```

- [ ] **Step 2: Generate the `Env` types**

Run: `pnpm wrangler types`
Expected: creates/updates `worker-configuration.d.ts` declaring `interface Env { DB: D1Database; CACHE: KVNamespace; ASSETS: Fetcher; }`.

- [ ] **Step 3: Edit `src/env.d.ts`** to type the runtime locals. Keep any existing reference lines.

```ts
/// <reference path="../.astro/types.d.ts" />
/// <reference path="../worker-configuration.d.ts" />

type Runtime = import('@astrojs/cloudflare').Runtime<Env>;

declare namespace App {
  interface Locals extends Runtime {}
}
```

- [ ] **Step 4: Edit `.gitignore`** — append:

```
# Cloudflare
.dev.vars
.wrangler/
```

- [ ] **Step 5: Create `.dev.vars.example`** (committed; documents secrets for later stages):

```
# Copy to .dev.vars (gitignored) and fill in for local dev.
BETTER_AUTH_SECRET=
BETTER_AUTH_URL=http://localhost:3000
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GITHUB_OAUTH_CLIENT_ID=
GITHUB_OAUTH_CLIENT_SECRET=
GITHUB_TOKEN=
RESEND_API_KEY=
```

- [ ] **Step 6: Typecheck**

Run: `pnpm typecheck`
Expected: clean — `Astro.locals.runtime.env.DB` resolves to `D1Database` (verify in a scratch file if desired, then delete it).

- [ ] **Step 7: Commit**

```bash
git add wrangler.toml worker-configuration.d.ts src/env.d.ts .gitignore .dev.vars.example
git commit -m "feat(packs): declare D1/KV bindings and type Cloudflare runtime locals"
```

---

### Task 4: Typed runtime accessor (unit-tested)

**Files:**

- Create: `src/lib/runtime.ts`
- Test: `src/tests/runtime.test.ts`

**Interfaces:**

- Produces: `getRuntimeEnv(locals: App.Locals): Env` — returns `locals.runtime.env`, throwing a clear error if the runtime is absent (e.g., called outside an SSR request). Later stages call `const { DB, CACHE } = getRuntimeEnv(Astro.locals)`.

- [ ] **Step 1: Write the failing test** in `src/tests/runtime.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { getRuntimeEnv } from '~/lib/runtime';

describe('getRuntimeEnv', () => {
  it('returns the binding env from locals.runtime', () => {
    const fakeEnv = { DB: {}, CACHE: {} } as unknown as Env;
    const locals = { runtime: { env: fakeEnv } } as unknown as App.Locals;
    expect(getRuntimeEnv(locals)).toBe(fakeEnv);
  });

  it('throws a clear error when runtime is missing', () => {
    const locals = {} as unknown as App.Locals;
    expect(() => getRuntimeEnv(locals)).toThrow(/Cloudflare runtime/i);
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `pnpm vitest run src/tests/runtime.test.ts`
Expected: FAIL — `getRuntimeEnv` is not defined / module not found.

- [ ] **Step 3: Write the minimal implementation** in `src/lib/runtime.ts`:

```ts
/**
 * Returns the Cloudflare binding env for the current SSR request.
 * Throws if called where no runtime is attached (e.g. a prerendered context).
 */
export function getRuntimeEnv(locals: App.Locals): Env {
  const env = locals.runtime?.env;
  if (!env) {
    throw new Error('Cloudflare runtime env is unavailable in this context.');
  }
  return env;
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `pnpm vitest run src/tests/runtime.test.ts`
Expected: PASS (2 tests).

- [ ] **Step 5: Commit**

```bash
git add src/lib/runtime.ts src/tests/runtime.test.ts
git commit -m "feat(packs): add typed Cloudflare runtime env accessor"
```

---

### Task 5: Wire preview to wrangler and verify e2e

**Files:**

- Modify: `package.json` (`preview` script)
- Modify: `playwright.config.ts` (only if the webServer command/port needs adjustment)

**Interfaces:**

- Produces: `pnpm preview` serves the built Worker locally on port 3000 so Playwright's `webServer` (`pnpm run preview`) works.

- [ ] **Step 1: Update the `preview` script** in `package.json` so preview builds then serves via wrangler on port 3000:

```json
"preview": "astro build && wrangler dev --port 3000"
```

- [ ] **Step 2: Verify preview serves the site**

Run: `pnpm preview` (Ctrl-C after verifying)
Expected: wrangler serves on `http://localhost:3000`; `curl -s localhost:3000 | grep -o "<title>[^<]*"` shows the homepage title.

> If `wrangler dev` cannot find the worker entry, confirm `main` in `wrangler.toml` matches
> the adapter's output path (`dist/_worker.js/index.js`); adjust if the installed adapter
> emits a different path, then re-run.

- [ ] **Step 3: Run the Playwright e2e suite**

Run: `pnpm test:playwright`
Expected: existing e2e specs pass against the wrangler-served build (homepage, i18n, etc.).

> If the suite times out waiting for the server, increase `webServer.timeout` in
> `playwright.config.ts` (wrangler's first boot can be slower than `astro preview`).

- [ ] **Step 4: Full verification suite**

Run: `pnpm typecheck && pnpm lint && pnpm format && pnpm spell && pnpm test && pnpm build`
Expected: all green.

- [ ] **Step 5: Commit**

```bash
git add package.json playwright.config.ts
git commit -m "build(packs): preview via wrangler dev for SSR build"
```

---

## Self-Review

**Spec coverage (Stage 1 scope = spec § "Implementation order" item 1):**

- "add `@astrojs/cloudflare`, `output: 'server'`" → Task 1. ✓
- "mark all marketing pages `prerender = true`" → Task 2 (all 7 current pages). ✓
- "add `wrangler.toml` (D1 + KV bindings)" → Task 3. ✓
- "verify no regression on existing pages" → Task 2 (build output) + Task 5 (e2e). ✓
- Runtime binding access (`Astro.locals.runtime.env`) needed by later stages → Task 3 typing + Task 4 accessor. ✓
- Secrets never committed (spec § Security/Prerequisites) → Task 3 `.gitignore` + `.dev.vars.example`. ✓

**Placeholder scan:** No "TBD/TODO". The two `>` notes are concrete fallbacks (real alternative config), not deferred work. The `database_id`/KV `id` zeros are intentional local placeholders, documented as replaced at deploy. ✓

**Type consistency:** `getRuntimeEnv(locals: App.Locals): Env` defined in Task 4 matches its test in Task 4; `Env` (`DB`/`CACHE`/`ASSETS`) defined in Task 3 Step 2 and used consistently. Binding names `DB`/`CACHE` match `wrangler.toml` and the spec. ✓

## Out of scope (later stages, own plans)

Stage 2 Auth (Better Auth), Stage 3 publish pipeline, Stage 4 registry UI, Stage 5 detail/install — each gets its own plan, written just-in-time, and Stages 2/3/5 depend on the external prerequisites (OAuth apps, `GITHUB_TOKEN`, Resend) being provisioned.
