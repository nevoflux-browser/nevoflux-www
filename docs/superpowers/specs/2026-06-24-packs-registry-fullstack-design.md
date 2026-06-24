# PackHub Registry — Full-Stack Design Spec

**Date:** 2026-06-24
**Status:** Approved for planning
**Scope:** Turn the static `/packs` showcase into a real, authenticated pack registry on Cloudflare.

## Context

`/packs` currently is a static preview showcase (4 hard-coded first-party cards) inside a
**static** Astro site (`output: static`, no backend, no DB, no auth). The goal is a real
registry where registered users publish packs from GitHub, anyone can search/browse them,
and visitors install via a `nevoflux://` deep link.

This requires standing up a full authenticated backend that does not exist today. The whole
site migrates from static to **Astro SSR on Cloudflare**; existing marketing pages stay
prerendered (no behavior change), only the registry and API run server-side.

## Decisions (locked with user)

| Decision                | Choice                                                                                    |
| ----------------------- | ----------------------------------------------------------------------------------------- |
| Scope                   | Full-stack now (auth + publish + DB), one cohesive build, staged                          |
| Existing account system | None — build from scratch                                                                 |
| Platform                | Cloudflare (Pages/Workers + D1 + KV)                                                      |
| Pack data source        | Dynamic registry in D1, populated by registered users publishing (no static `packs.json`) |
| Rendering               | Astro SSR (`@astrojs/cloudflare`, `output: 'server'`); marketing pages `prerender = true` |
| Email login             | Magic link (Better Auth + Resend)                                                         |
| Publish trust model     | Any logged-in user submits any public GitHub repo; preview → confirm → **instant live**   |
| Auth implementation     | **Better Auth** (Google + GitHub OAuth + email magic link)                                |
| Pack format authority   | `pack.toml` per nevoflux `docs/reference/pack-development.md` (fetched, summarized below) |

## Pack format (`pack.toml`, pack-protocol/0.1) — summary

Required `[pack]`: `name` (`[a-z0-9-]+`), `version` (semver), `protocol` (`pack-protocol/0.1`),
`min_nevoflux` (semver). Optional: `description`, `license`, `authors` (array), `namespace`.

Components (all optional):

- `[components.skills]` `dir = "path"` — markdown skills (`SKILL.md` with YAML frontmatter `name`/`description`).
- `[components.canvas_tools]` `files`, `external_binaries`.
- `[[components.seed]]` `slug`, `from` — seed KB pages (every seed slug must be covered by protected).
- `[components.protected]` `slugs`, `prefixes`.
- `[components.dashboard]` `artifact_id`, `content_type`, `files_from`, `entry` — Canvas dashboard.

Field → display mapping for the detail view (req #5):

| Display field                               | Source                                                                |
| ------------------------------------------- | --------------------------------------------------------------------- |
| description                                 | `[pack].description`                                                  |
| skills                                      | `[components.skills].dir` → enumerate `SKILL.md` `name`/`description` |
| seed                                        | `[[components.seed]]` slugs                                           |
| dashboard example                           | `[components.dashboard]` present → show; absent → "None"              |
| version / license / protocol / min_nevoflux | `[pack].*`                                                            |
| publisher                                   | logged-in user who published (+ `[pack].authors`)                     |
| stars                                       | GitHub API (live, cached in KV/D1)                                    |
| download count                              | registry counter (D1)                                                 |
| official                                    | `github_owner === 'nevoflux-browser'`                                 |

**Deep link:** The pack doc specifies no URI scheme; the `nevoflux://pack-install?src=…`
handler is browser-side (out of repo). The website only constructs the href. Forms:

- root pack: `nevoflux://pack-install?src=github:owner/repo` (or `…@ref`)
- subdir pack: `nevoflux://pack-install?src=https://github.com/owner/repo/tree/<ref>/<path>`

> Open confirmation: the NevoFlux browser's `pack-install` handler must accept the subdir
> (`/tree/<ref>/<path>`) form. Flagged; assumed yes for this design.

## Architecture

```
Astro (output: 'server') + @astrojs/cloudflare
├── prerendered marketing pages (Hero, Features, …, index, release-notes, privacy)  → CDN static
├── /packs                 (SSR)  registry list/card + search + publish entry
├── /packs/[id]            (SSR)  detail + install  (routed by pack id; name is not unique)
├── /api/auth/[...all]      Better Auth (Google/GitHub/magic-link)
├── /api/packs/publish      POST  resolve+parse GitHub source → preview (no write)
├── /api/packs/confirm      POST  persist parsed pack (auth required) → live
├── /api/packs/search       GET   query by name/description
└── /api/packs/[id]/install POST  increment download_count (beacon)

Bindings:  DB = D1 (users/sessions/registry),  CACHE = KV (GitHub cache + rate limit)
Secrets:   GOOGLE_*, GITHUB_OAUTH_*, GITHUB_TOKEN, RESEND_API_KEY, BETTER_AUTH_SECRET, BETTER_AUTH_URL
```

New deps: `@astrojs/cloudflare`, `better-auth`, `smol-toml` (edge-safe TOML parser),
`wrangler` (dev/deploy, devDep).

## Data model (D1)

Better Auth manages `user`, `session`, `account`, `verification` (via its CLI-generated
schema). Account linking unifies Google/GitHub/magic-link to one user keyed by verified email.

```sql
CREATE TABLE pack (
  id              TEXT PRIMARY KEY,        -- generated id
  name            TEXT NOT NULL,           -- pack.toml [pack].name
  namespace       TEXT,
  description     TEXT,
  version         TEXT NOT NULL,
  license         TEXT,
  protocol        TEXT NOT NULL,
  min_nevoflux    TEXT NOT NULL,
  github_owner    TEXT NOT NULL,
  github_repo     TEXT NOT NULL,
  github_ref      TEXT,                    -- branch/tag, nullable = default branch
  github_subdir   TEXT,                    -- nullable = repo root
  github_url      TEXT NOT NULL,
  install_src     TEXT NOT NULL,           -- the deep-link src string
  is_official     INTEGER NOT NULL DEFAULT 0,
  publisher_user_id TEXT NOT NULL REFERENCES user(id),
  authors         TEXT,                    -- JSON array
  components       TEXT,                   -- JSON: {skills:[{name,description}], seed:[slug], dashboard:bool, canvas_tools:[...]}
  download_count  INTEGER NOT NULL DEFAULT 0,
  stars_cached    INTEGER,
  stars_fetched_at INTEGER,
  created_at      INTEGER NOT NULL,
  updated_at      INTEGER NOT NULL,
  UNIQUE (github_owner, github_repo, github_subdir)
);
CREATE INDEX idx_pack_name ON pack(name);
CREATE INDEX idx_pack_downloads ON pack(download_count);
```

Search: D1 `LIKE` on `name`/`description` for v1; upgrade to FTS5 virtual table if needed.

## Auth (Better Auth)

- Astro catch-all `src/pages/api/auth/[...all].ts` delegating to the Better Auth handler.
- Providers: Google, GitHub (OAuth), email magic link (Resend sender).
- `emailAndPassword` disabled; magic link only for email. `account.accountLinking` enabled so
  the same verified email across providers maps to one `user`.
- D1 adapter; session cookie signed with `BETTER_AUTH_SECRET`.
- Server helper `getSession(request)` used by SSR pages and protected API routes.
- NavBar shows login/avatar; a small login modal/page offers the three methods.

## Publish pipeline (instant-publish)

1. **Input** (auth-gated). Accept and normalize: `github:owner/repo`, `github:owner/repo@ref`,
   `https://github.com/owner/repo`, `https://github.com/owner/repo/tree/<ref>/<path>`.
   A parser produces `{owner, repo, ref?, subdir?}`.
2. **Resolve + parse** (`/api/packs/publish`, server, uses `GITHUB_TOKEN`):
   - Fetch `pack.toml` at `<subdir>/pack.toml` (GitHub contents/raw API at `ref` or default branch).
   - Parse TOML (`smol-toml`); validate required `[pack]` fields; reject if missing/invalid.
   - Fetch repo metadata: stars, license, owner, default branch.
   - Enumerate components: list `[components.skills].dir` for `SKILL.md` files (read frontmatter
     `name`/`description`), collect seed slugs, detect dashboard, list canvas tools.
   - Return a **preview** object (no DB write). Rate-limited per user via KV.
3. **Confirm** (`/api/packs/confirm`, auth required): re-validate, compute `install_src` and
   `is_official`, **upsert** into `pack` (unique on owner/repo/subdir) with `publisher_user_id`
   = current user. Live immediately. Re-publish updates version/metadata/`updated_at`.

Errors surfaced to the user: not found, no `pack.toml`, invalid TOML, missing required fields,
GitHub rate limit. Each returns a clear message; nothing persists on failure.

## Registry UI

`/packs` (SSR):

- **Search** box → `/api/packs/search?q=` (or server-side query on initial load); matches
  name/description.
- **View toggle** list ↔ card, persisted in `localStorage`. Card grid: icon, name, description,
  tags, `downloads · stars · version`, Official badge. List: dense rows, same metadata.
- **Publish** button: if logged in → publish flow (URL input → preview → confirm); else → login.
- Empty state when no packs/no results.

The current static 4-card showcase is replaced by registry-driven rendering. Existing `packs`
i18n strings are repurposed/extended; new strings (search placeholder, view toggle, publish,
login, detail labels, install) added to **both** `en` and `zh` (shallow-merge rule still applies).

## Pack detail (`/packs/[id]`, SSR)

> Routed by pack `id` because `name` is not unique across publishers (uniqueness is on
> owner/repo/subdir). A human-readable slug column is deferred to future.

- Renders all mapped fields (§ pack format). Skills listed with name+description; seed slugs;
  dashboard example or "None"; publisher; downloads; version; license; live/cached stars;
  Official badge when applicable; link to the GitHub source.
- **Install** button: `href="nevoflux://pack-install?src=<install_src>"`. An `onclick`
  `navigator.sendBeacon('/api/packs/<id>/install')` increments `download_count` before the
  scheme opens (rate-limited per IP via KV to deduce abuse).

## Security

- Better Auth handles OAuth state, session, CSRF for `/api/auth/*`.
- Publish/confirm require a valid session; validate & whitelist GitHub URL shapes; never execute
  pack contents (we only read metadata).
- GitHub calls server-side with `GITHUB_TOKEN`; responses cached in KV to respect rate limits.
- Rate-limit publish, confirm, and install beacon via KV.
- Secrets only in Cloudflare env / `.dev.vars` (gitignored), never committed.

## Prerequisites (user-provided; external)

Cannot be created from this repo — needed for live auth/email/metadata:

- Cloudflare account; `wrangler` D1 + KV bindings.
- Google OAuth client ID/secret; GitHub OAuth app ID/secret.
- `GITHUB_TOKEN` (PAT, `public_repo`/read) for repo metadata + file fetch.
- `RESEND_API_KEY` + a verified sending domain for magic-link email.
- `BETTER_AUTH_SECRET`, `BETTER_AUTH_URL`.

Local dev uses `wrangler dev` with a local D1 and `.dev.vars`; the build/typecheck/tests are
verifiable without live keys (auth/email/GitHub paths covered by mocks in unit tests).

## Implementation order (staged, one cohesive build)

1. **SSR migration** — add `@astrojs/cloudflare`, `output: 'server'`, mark all marketing pages
   `prerender = true`, add `wrangler.toml` (D1 + KV bindings), verify no regression on existing pages.
2. **Auth** — Better Auth (Google/GitHub/magic-link) + D1 schema + `/api/auth/[...all]` +
   `getSession` helper + NavBar login state + login UI.
3. **Data model + publish** — `pack` table + migration; source parser; `/api/packs/publish`
   (fetch+parse+preview) and `/api/packs/confirm` (persist); publish UI (input → preview → confirm).
4. **Registry UI** — search + list/card toggle on `/packs`, driven by D1.
5. **Detail + install** — `/packs/[id]`, install deep link, download counter, official badge,
   live stars.

Each stage ends green on: `pnpm typecheck`, `pnpm lint`, `pnpm format`, `pnpm spell`,
`pnpm test`, `pnpm build`.

## Testing

- **Unit (vitest):** source-URL parser (all 4 input forms incl. subdir), `pack.toml` validation,
  components extraction, `install_src` + `is_official` derivation, search query building. GitHub
  and email I/O mocked.
- **Build:** `pnpm build` succeeds with the Cloudflare adapter; prerendered pages still emit.
- **E2E (playwright, where feasible):** registry list/card toggle + search render; detail page
  renders fields; install button has correct `href`. Auth/publish E2E gated on test credentials.

## Out of scope / future

- The `nevoflux://` URI handler itself (browser-side).
- Admin moderation / takedown UI (instant-publish for v1).
- Repo-ownership verification, ratings, versions history UI, FTS search, pagination beyond v1
  defaults — revisit after launch.
