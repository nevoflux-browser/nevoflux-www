# PackHub Registry — Stages 4+5: Registry UI + Detail/Install — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: superpowers:executing-plans. Steps use checkbox (`- [ ]`).

**Goal:** Make `/packs` a live, searchable registry (list/card views) driven by D1, with a per-pack detail page that shows every field, an install deep link, and download counting.

**Architecture:** `/packs` becomes SSR: it reads `?q=` and renders `searchPacks(db, q)` results in a grid (card) or rows (list), with a view toggle persisted client-side and a Publish button. `/packs/[id]` is SSR: `getPackById` + publisher lookup, renders all manifest/component fields, an `Official` badge, live/cached stars, and an Install button (`nevoflux://pack-install?src=…`) whose click beacons `POST /api/packs/[id]/install` to increment the counter.

**Tech Stack:** Astro 5 SSR, Cloudflare D1, Better Auth (publisher lookup).

## Global Constraints

- pnpm; Node 22.22.0; Conventional Commits ≤ 100 chars; `~/*` → `src/*`; TS strict; ESLint `--max-warnings=0`.
- i18n in BOTH locale files, identical shape.
- `/packs` and `/packs/[id]` are SSR (`prerender = false`); `/packs/publish` stays prerendered.
- Official badge iff `is_official === 1`. Download count lives in D1 (`incrementDownload`).
- Each task ends green on the relevant subset of typecheck/lint/format/spell/test/build.

## File Structure

- Modify `src/lib/packs/db.ts` — add `parsePackRow` (pure), `getPublisher`.
- Create `src/pages/api/packs/[id]/install.ts` — POST increment.
- Rewrite `src/pages/[...locale]/packs.astro` — SSR registry (search + list/card + publish).
- Create `src/pages/[...locale]/packs/[id].astro` — SSR detail + install.
- i18n: add `registry` + `detail` strings (both locales); reuse existing `packs`/`publish`.
- Test: extend `src/tests/packs-db.test.ts` for `parsePackRow`.

---

### Task 1: `parsePackRow` + download endpoint

**Files:** Modify `src/lib/packs/db.ts`; extend `src/tests/packs-db.test.ts`; create `src/pages/api/packs/[id]/install.ts`.

**Interfaces:**

- `parsePackRow(row: PackRow): PackView` — decodes `authors`/`components` JSON into a view model `{ ...row fields, authors: string[], components: PackComponents }`.
- `getPublisher(db, userId): Promise<{ name: string | null; email: string | null } | null>`.

- [ ] **Step 1: Add a failing test** to `src/tests/packs-db.test.ts` for `parsePackRow` (round-trips a row built by `packRowFromPreview`: `components.dashboard === true`, `authors` array decoded).

- [ ] **Step 2: Implement `parsePackRow`** in `db.ts`:

```ts
import type { PackComponents } from '~/lib/packs/types';

export interface PackView extends Omit<PackRow, 'authors' | 'components'> {
  authors: string[];
  components: PackComponents;
}

export function parsePackRow(row: PackRow): PackView {
  const authors = row.authors ? (JSON.parse(row.authors) as string[]) : [];
  const components = row.components
    ? (JSON.parse(row.components) as PackComponents)
    : { skills: [], seed: [], dashboard: false, canvasTools: [] };
  return { ...row, authors, components };
}

export async function getPublisher(
  db: D1Database,
  userId: string
): Promise<{ name: string | null; email: string | null } | null> {
  return await db
    .prepare('SELECT name, email FROM user WHERE id = ?1')
    .bind(userId)
    .first<{ name: string | null; email: string | null }>();
}
```

- [ ] **Step 3: Run the test → PASS** (`pnpm vitest run src/tests/packs-db.test.ts`).

- [ ] **Step 4: Create `src/pages/api/packs/[id]/install.ts`:**

```ts
import type { APIRoute } from 'astro';
import { getRuntimeEnv } from '~/lib/runtime';
import { incrementDownload } from '~/lib/packs/db';
import { jsonResponse } from '~/lib/http';

export const prerender = false;

export const POST: APIRoute = async (ctx) => {
  const id = ctx.params.id;
  if (!id) return jsonResponse({ error: 'id required' }, 400);
  await incrementDownload(getRuntimeEnv(ctx.locals).DB, id);
  return jsonResponse({ ok: true }, 200);
};
```

- [ ] **Step 5: typecheck; commit** `feat(packs): parse pack rows, publisher lookup, install counter endpoint`.

---

### Task 2: Registry UI on `/packs` (search + list/card)

**Files:** Rewrite `src/pages/[...locale]/packs.astro`; add `registry` i18n (both locales).

- [ ] **Step 1: Add `registry` i18n** (both locales, identical shape): `title`, `subtitle`, `searchPlaceholder`, `searchBtn`, `publish`, `viewList`, `viewCard`, `empty`, `official`, `downloads`, `stars`, `by`.

- [ ] **Step 2: Rewrite `packs.astro`** (`prerender = false`): read `const q = Astro.url.searchParams.get('q') ?? ''`; `const rows = await searchPacks(getRuntimeEnv(Astro.locals).DB, q)`; map `parsePackRow`. Render: hero (title/subtitle), a GET `<form>` search box (`name="q"`), a Publish link (`/packs/publish`), a list/card toggle (two buttons), and the results — a card grid AND a list, toggled by a `data-view` attribute on a wrapper (client script reads/writes `localStorage['packs-view']`). Each result links to `/packs/{id}`, shows name, description, version, `★ stars`, `⤓ downloads`, and an `Official` badge when `is_official`. Empty state when `rows.length === 0`.

- [ ] **Step 3: Verify** `pnpm typecheck && pnpm build`; via wrangler dev: `/packs` → 200, `/packs?q=x` → 200, `/zh/packs` → 200.

- [ ] **Step 4: lint/format/spell; commit** `feat(packs): live registry with search and list/card views`.

---

### Task 3: Pack detail page + install

**Files:** Create `src/pages/[...locale]/packs/[id].astro`; add `detail` i18n (both locales).

- [ ] **Step 1: Add `detail` i18n** (both locales): `install`, `description`, `skills`, `seed`, `dashboard`, `publisher`, `version`, `license`, `stars`, `downloads`, `official`, `source`, `notFound`, `none`.

- [ ] **Step 2: Create `[id].astro`** (`prerender = false`): `getStaticPaths`? No — dynamic SSR route, so NO `getStaticPaths` and `prerender = false`. Read `const id = Astro.params.id`; `const row = await getPackById(db, id)`; if null → `Astro.response.status = 404` and render a not-found message. Else `parsePackRow`, `getPublisher`. Render: name + Official badge; description; a metadata grid (version, license, stars, downloads, publisher name/email, source link to `github_url`); Skills list (name + description or just names) or "None"; Seed slugs or "None"; Dashboard "✓/None"; and an **Install** button: `<a href={`nevoflux://pack-install?src=${row.install_src}`}>`. A small client `<script>` attaches an `onclick` that calls `navigator.sendBeacon('/api/packs/<id>/install')` before the scheme opens.

> Note: `[id].astro` lives under the `[...locale]` tree, so the id is `Astro.params.id` and locale via `getLocale`. Verify routing doesn't collide with `/packs/publish` (static) — explicit `publish.astro` wins over `[id].astro` in Astro's route priority.

- [ ] **Step 3: Verify** `pnpm typecheck && pnpm build`; via wrangler dev with a seeded row (insert one via `wrangler d1 execute --local`): `/packs/<id>` → 200 shows fields; install beacon increments `download_count` (check via `wrangler d1 execute`). Unknown id → 404.

- [ ] **Step 4: lint/format/spell; commit** `feat(packs): pack detail page with install deep link and download beacon`.

---

### Task 4: Full verification + finish

- [ ] **Step 1:** `pnpm typecheck && pnpm lint && pnpm format && pnpm spell && pnpm test && pnpm build` — all green.
- [ ] **Step 2:** wrangler dev end-to-end: seed a pack row; `/packs` lists it; `/packs/<id>` shows it; install beacon bumps the counter; `/packs/publish` still 200; existing routes 200.
- [ ] **Step 3:** Hand off to superpowers:finishing-a-development-branch (merge to main + push).

## Self-Review

**Spec coverage:** search by name/description (T2) ✓; list + card views (T2) ✓; detail with description/skills/seed/dashboard("none")/publisher/downloads/version/license/stars (T3) ✓; install deep link `nevoflux://pack-install?src=…` (T3) ✓; download counting (T1 endpoint + T3 beacon) ✓; official badge (T2 + T3) ✓.

**Placeholder scan:** none — UI tasks reference concrete fields and the existing `searchPacks`/`getPackById`/`incrementDownload`/`parsePackRow` interfaces.

**Type consistency:** `parsePackRow`→`PackView` (T1) consumed by `/packs` (T2) and `/packs/[id]` (T3); `getPublisher` (T1) used in T3; `incrementDownload` (Stage 3) used by the install endpoint (T1) and beaconed from T3; `searchPacks`/`getPackById` (Stage 3) used by T2/T3.

## Out of scope

Production deploy (real D1/KV ids + secrets); live OAuth/email/GitHub-token testing; FTS search, pagination, ratings — post-launch.
