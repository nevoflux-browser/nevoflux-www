# PackHub Registry — Stage 3: Publish Pipeline — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: superpowers:executing-plans. Steps use checkbox (`- [ ]`) syntax.

**Goal:** Let a logged-in user publish a pack from a GitHub URL — server fetches and parses `pack.toml`, shows a preview, and on confirm persists it to D1 (instant-live).

**Architecture:** Pure helpers parse the source URL, derive the install deep-link `src`, the official flag, and validate/extract the manifest. A server GitHub client (uses `GITHUB_TOKEN`) fetches `pack.toml` + repo metadata + the skills dir. Two SSR endpoints: `/api/packs/publish` (resolve+parse+preview, no write) and `/api/packs/confirm` (auth-gated upsert into D1). A `/packs/publish` page drives input → preview → confirm via the browser.

**Tech Stack:** Astro 5 SSR, Cloudflare D1, `smol-toml`, Better Auth (session gate), GitHub REST API.

## Global Constraints

- pnpm; Node 22.22.0; Conventional Commits ≤ 100 chars; `~/*` → `src/*`; TS strict; ESLint `--max-warnings=0`.
- i18n strings in BOTH locale files, identical shape (shallow merge).
- SSR routes `export const prerender = false`; D1 binding via `getRuntimeEnv(locals).DB`; server token `env.GITHUB_TOKEN`.
- Official iff `github_owner === 'nevoflux-browser'`.
- Each task ends green on the relevant subset of typecheck/lint/format/spell/test/build.

## Data shapes (shared, defined here, used across tasks)

```ts
// src/lib/packs/types.ts
export interface PackSource {
  owner: string;
  repo: string;
  ref?: string; // branch/tag; undefined = default branch
  subdir?: string; // path within repo; undefined = root
}
export interface PackManifest {
  name: string;
  version: string;
  protocol: string;
  minNevoflux: string;
  description?: string;
  license?: string;
  authors?: string[];
  namespace?: string;
}
export interface PackComponents {
  skills: { name: string; description?: string }[];
  seed: string[]; // slugs
  dashboard: boolean;
  canvasTools: string[];
}
export interface PackPreview {
  source: PackSource;
  manifest: PackManifest;
  components: PackComponents;
  githubUrl: string;
  installSrc: string;
  isOfficial: boolean;
  stars: number;
  repoLicense?: string;
}
```

---

## File Structure

- `src/lib/packs/types.ts` — shared interfaces (above).
- `src/lib/packs/source.ts` — `parseSource`, `deriveInstallSrc`, `isOfficial`, `githubUrlOf`.
- `src/lib/packs/manifest.ts` — `validateManifest`, `extractComponents` (operate on parsed TOML object).
- `src/lib/packs/github.ts` — `fetchPackPreview(env, source, fetchImpl?)` GitHub client.
- `src/lib/packs/db.ts` — D1 layer: `upsertPack`, `getPackById`, `searchPacks`, `incrementDownload`.
- `migrations/0002_pack.sql` — `pack` table.
- `src/pages/api/packs/publish.ts` — POST preview.
- `src/pages/api/packs/confirm.ts` — POST persist (auth).
- `src/pages/[...locale]/packs/publish.astro` — publish UI.
- i18n `publish` block (both locales).
- Tests: `source.test.ts`, `manifest.test.ts`, `github.test.ts`.

---

### Task 1: Source parsing, install-src, official (TDD, pure)

**Files:** Create `src/lib/packs/types.ts`, `src/lib/packs/source.ts`; Test `src/tests/source.test.ts`.

**Interfaces (Produces):**

- `parseSource(input: string): PackSource` — throws `Error` on unrecognized input.
- `deriveInstallSrc(s: PackSource): string` — root → `github:owner/repo[@ref]`; subdir → `https://github.com/owner/repo/tree/<ref|main>/<subdir>`.
- `isOfficial(owner: string): boolean` — `owner === 'nevoflux-browser'`.
- `githubUrlOf(s: PackSource): string` — canonical `https://github.com/owner/repo`.

- [ ] **Step 1: Write `src/tests/source.test.ts`:**

```ts
import { describe, it, expect } from 'vitest';
import { parseSource, deriveInstallSrc, isOfficial } from '~/lib/packs/source';

describe('parseSource', () => {
  it('parses github:owner/repo', () => {
    expect(parseSource('github:o/r')).toEqual({ owner: 'o', repo: 'r' });
  });
  it('parses github:owner/repo@ref', () => {
    expect(parseSource('github:o/r@v1.0.0')).toEqual({
      owner: 'o',
      repo: 'r',
      ref: 'v1.0.0',
    });
  });
  it('parses https repo root', () => {
    expect(parseSource('https://github.com/o/r')).toEqual({
      owner: 'o',
      repo: 'r',
    });
  });
  it('parses https tree subdir', () => {
    expect(
      parseSource('https://github.com/o/r/tree/main/packs/design')
    ).toEqual({
      owner: 'o',
      repo: 'r',
      ref: 'main',
      subdir: 'packs/design',
    });
  });
  it('strips .git and trailing slash', () => {
    expect(parseSource('https://github.com/o/r.git/')).toEqual({
      owner: 'o',
      repo: 'r',
    });
  });
  it('throws on garbage', () => {
    expect(() => parseSource('not a repo')).toThrow();
  });
});

describe('deriveInstallSrc', () => {
  it('root -> github: shorthand', () => {
    expect(deriveInstallSrc({ owner: 'o', repo: 'r' })).toBe('github:o/r');
  });
  it('root + ref -> @ref', () => {
    expect(deriveInstallSrc({ owner: 'o', repo: 'r', ref: 'v1' })).toBe(
      'github:o/r@v1'
    );
  });
  it('subdir -> tree url', () => {
    expect(
      deriveInstallSrc({ owner: 'o', repo: 'r', ref: 'main', subdir: 'a/b' })
    ).toBe('https://github.com/o/r/tree/main/a/b');
  });
  it('subdir without ref defaults to main', () => {
    expect(deriveInstallSrc({ owner: 'o', repo: 'r', subdir: 'a' })).toBe(
      'https://github.com/o/r/tree/main/a'
    );
  });
});

describe('isOfficial', () => {
  it('true for nevoflux-browser', () =>
    expect(isOfficial('nevoflux-browser')).toBe(true));
  it('false otherwise', () => expect(isOfficial('someone')).toBe(false));
});
```

- [ ] **Step 2: Run → FAIL** (`pnpm vitest run src/tests/source.test.ts`).

- [ ] **Step 3: Implement `src/lib/packs/types.ts`** (the interfaces block above, verbatim).

- [ ] **Step 4: Implement `src/lib/packs/source.ts`:**

```ts
import type { PackSource } from '~/lib/packs/types';

const OFFICIAL_OWNER = 'nevoflux-browser';

function clean(repo: string): string {
  return repo.replace(/\.git$/, '').replace(/\/$/, '');
}

export function parseSource(input: string): PackSource {
  const raw = input.trim();

  // github:owner/repo[@ref]
  const short = /^github:([^/\s]+)\/([^@/\s]+)(?:@(.+))?$/.exec(raw);
  if (short) {
    return {
      owner: short[1],
      repo: clean(short[2]),
      ...(short[3] ? { ref: short[3] } : {}),
    };
  }

  // https://github.com/owner/repo[/tree/<ref>/<subdir>][.git][/]
  const url =
    /^https?:\/\/github\.com\/([^/\s]+)\/([^/\s]+?)(?:\.git)?(?:\/tree\/([^/\s]+)\/(.+))?\/?$/.exec(
      raw.replace(/\/$/, '')
    );
  if (url) {
    const owner = url[1];
    const repo = clean(url[2]);
    const ref = url[3];
    const subdir = url[4]?.replace(/\/$/, '');
    return {
      owner,
      repo,
      ...(ref ? { ref } : {}),
      ...(subdir ? { subdir } : {}),
    };
  }

  throw new Error(`Unrecognized GitHub source: ${input}`);
}

export function githubUrlOf(s: PackSource): string {
  return `https://github.com/${s.owner}/${s.repo}`;
}

export function deriveInstallSrc(s: PackSource): string {
  if (s.subdir) {
    return `https://github.com/${s.owner}/${s.repo}/tree/${s.ref ?? 'main'}/${s.subdir}`;
  }
  return s.ref
    ? `github:${s.owner}/${s.repo}@${s.ref}`
    : `github:${s.owner}/${s.repo}`;
}

export function isOfficial(owner: string): boolean {
  return owner.toLowerCase() === OFFICIAL_OWNER;
}
```

- [ ] **Step 5: Run → PASS.** Then `pnpm typecheck`.

- [ ] **Step 6: Commit** `git add src/lib/packs/types.ts src/lib/packs/source.ts src/tests/source.test.ts && git commit -m "feat(packs): parse github source, derive install-src and official flag"`

---

### Task 2: Manifest validation + components (TDD, pure)

**Files:** Create `src/lib/packs/manifest.ts`; Test `src/tests/manifest.test.ts`.

**Interfaces:**

- `validateManifest(toml: Record<string, unknown>): { ok: true; manifest: PackManifest } | { ok: false; errors: string[] }`.
- `extractComponents(toml: Record<string, unknown>): PackComponents`.

- [ ] **Step 1: Write `src/tests/manifest.test.ts`:**

```ts
import { describe, it, expect } from 'vitest';
import { validateManifest, extractComponents } from '~/lib/packs/manifest';

const good = {
  pack: {
    name: 'design-pack',
    version: '0.1.0',
    protocol: 'pack-protocol/0.1',
    min_nevoflux: '0.3.0',
    description: 'UI gen',
    license: 'MIT',
    authors: ['A <a@b>'],
  },
};

describe('validateManifest', () => {
  it('accepts a valid manifest', () => {
    const r = validateManifest(good);
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.manifest.name).toBe('design-pack');
      expect(r.manifest.minNevoflux).toBe('0.3.0');
    }
  });
  it('rejects when [pack] missing', () => {
    expect(validateManifest({}).ok).toBe(false);
  });
  it('rejects when required fields missing', () => {
    const r = validateManifest({ pack: { name: 'x' } });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.errors.length).toBeGreaterThan(0);
  });
});

describe('extractComponents', () => {
  it('reads seed slugs and dashboard presence', () => {
    const c = extractComponents({
      pack: good.pack,
      components: {
        seed: [{ slug: 'my/cv', from: 'x.md' }],
        dashboard: { artifact_id: 'design-pack-dash' },
      },
    });
    expect(c.seed).toEqual(['my/cv']);
    expect(c.dashboard).toBe(true);
    expect(c.skills).toEqual([]);
  });
  it('defaults everything empty when no components', () => {
    const c = extractComponents({ pack: good.pack });
    expect(c).toEqual({
      skills: [],
      seed: [],
      dashboard: false,
      canvasTools: [],
    });
  });
});
```

- [ ] **Step 2: Run → FAIL.**

- [ ] **Step 3: Implement `src/lib/packs/manifest.ts`:**

```ts
import type { PackManifest, PackComponents } from '~/lib/packs/types';

type Obj = Record<string, unknown>;
const asObj = (v: unknown): Obj =>
  v && typeof v === 'object' ? (v as Obj) : {};
const str = (v: unknown): string | undefined =>
  typeof v === 'string' ? v : undefined;

export function validateManifest(
  toml: Obj
): { ok: true; manifest: PackManifest } | { ok: false; errors: string[] } {
  const pack = asObj(toml.pack);
  const errors: string[] = [];
  const name = str(pack.name);
  const version = str(pack.version);
  const protocol = str(pack.protocol);
  const minNevoflux = str(pack.min_nevoflux);
  if (!name) errors.push('pack.name is required');
  if (!version) errors.push('pack.version is required');
  if (!protocol) errors.push('pack.protocol is required');
  if (!minNevoflux) errors.push('pack.min_nevoflux is required');
  if (errors.length) return { ok: false, errors };
  const authors = Array.isArray(pack.authors)
    ? pack.authors.filter((a): a is string => typeof a === 'string')
    : undefined;
  return {
    ok: true,
    manifest: {
      name: name!,
      version: version!,
      protocol: protocol!,
      minNevoflux: minNevoflux!,
      description: str(pack.description),
      license: str(pack.license),
      namespace: str(pack.namespace),
      authors,
    },
  };
}

export function extractComponents(toml: Obj): PackComponents {
  const comp = asObj(toml.components);
  const seedRaw = Array.isArray(comp.seed) ? comp.seed : [];
  const seed = seedRaw
    .map((s) => str(asObj(s).slug))
    .filter((s): s is string => Boolean(s));
  const canvas = asObj(comp.canvas_tools);
  const canvasTools = Array.isArray(canvas.files)
    ? canvas.files.filter((f): f is string => typeof f === 'string')
    : [];
  return {
    skills: [], // filled by the GitHub client (needs to read SKILL.md files)
    seed,
    dashboard: Boolean(comp.dashboard),
    canvasTools,
  };
}
```

- [ ] **Step 4: Run → PASS.** Then `pnpm typecheck`.

- [ ] **Step 5: Commit** `git add src/lib/packs/manifest.ts src/tests/manifest.test.ts && git commit -m "feat(packs): validate pack.toml manifest and extract components"`

---

### Task 3: GitHub client (injectable fetch, TDD with mock)

**Files:** Create `src/lib/packs/github.ts`; Test `src/tests/github.test.ts`.

**Interfaces:**

- `fetchPackPreview(env: Env, source: PackSource, fetchImpl?: typeof fetch): Promise<PackPreview>` — fetches `pack.toml` (raw), parses with `smol-toml`, validates, fetches repo metadata (stars/license/default branch), lists the skills dir for `SKILL.md` names; throws `Error` with a clear message on any failure.

- [ ] **Step 1: Install** `pnpm add smol-toml`.

- [ ] **Step 2: Write `src/tests/github.test.ts`** with a mock `fetchImpl` returning canned responses for the repo metadata, the `pack.toml` raw, and the skills dir listing. Assert the returned `PackPreview` has the right manifest, `installSrc`, `isOfficial`, stars, and skills. (Full test body in implementation; cover: success path; missing pack.toml → throws; invalid toml → throws.)

```ts
import { describe, it, expect } from 'vitest';
import { fetchPackPreview } from '~/lib/packs/github';

const PACK_TOML = `
[pack]
name = "design-pack"
version = "0.1.0"
protocol = "pack-protocol/0.1"
min_nevoflux = "0.3.0"
description = "UI gen"
license = "MIT"
[components.skills]
dir = "components/skills"
[components.dashboard]
artifact_id = "design-pack-dash"
`;

function mockFetch(
  map: Record<string, { status: number; body: string }>
): typeof fetch {
  return (async (url: string | URL) => {
    const key = url.toString();
    const hit = Object.keys(map).find((k) => key.includes(k));
    const res = hit ? map[hit] : { status: 404, body: 'not found' };
    return new Response(res.body, { status: res.status });
  }) as unknown as typeof fetch;
}

const env = { GITHUB_TOKEN: 't' } as unknown as Env;

describe('fetchPackPreview', () => {
  it('builds a preview from repo metadata + pack.toml + skills', async () => {
    const f = mockFetch({
      'api.github.com/repos/nevoflux-browser/packs': {
        status: 200,
        body: JSON.stringify({
          stargazers_count: 42,
          default_branch: 'main',
          license: { spdx_id: 'MIT' },
        }),
      },
      'raw.githubusercontent.com': { status: 200, body: PACK_TOML },
      'contents/components/skills': {
        status: 200,
        body: JSON.stringify([{ name: 'evaluate', type: 'dir' }]),
      },
    });
    const preview = await fetchPackPreview(
      env,
      { owner: 'nevoflux-browser', repo: 'packs', subdir: 'design' },
      f
    );
    expect(preview.manifest.name).toBe('design-pack');
    expect(preview.isOfficial).toBe(true);
    expect(preview.stars).toBe(42);
    expect(preview.installSrc).toBe(
      'https://github.com/nevoflux-browser/packs/tree/main/design'
    );
  });

  it('throws when pack.toml is missing', async () => {
    const f = mockFetch({
      'api.github.com/repos': {
        status: 200,
        body: JSON.stringify({ stargazers_count: 1, default_branch: 'main' }),
      },
    });
    await expect(
      fetchPackPreview(env, { owner: 'o', repo: 'r' }, f)
    ).rejects.toThrow();
  });
});
```

- [ ] **Step 3: Implement `src/lib/packs/github.ts`** using `parse` from `smol-toml`, `validateManifest`/`extractComponents`, `deriveInstallSrc`/`isOfficial`/`githubUrlOf`. Resolve `ref` from repo `default_branch` when not given. Fetch order: repo metadata → `pack.toml` raw at `<subdir>/pack.toml` → skills dir listing (best-effort; on non-200 leave skills `[]`). GitHub requests send `Authorization: Bearer <token>`, `User-Agent: nevoflux-www`, `Accept: application/vnd.github+json`. (Complete code written during execution; keep functions small.)

- [ ] **Step 4: Run → PASS.** Then `pnpm typecheck`.

- [ ] **Step 5: Commit** `git add src/lib/packs/github.ts src/tests/github.test.ts package.json pnpm-lock.yaml && git commit -m "feat(packs): github client to build a pack preview from a source"`

---

### Task 4: `pack` table + D1 data layer

**Files:** Create `migrations/0002_pack.sql`, `src/lib/packs/db.ts`; Modify nothing else.

**Interfaces:**

- `upsertPack(db: D1Database, p: PackRow): Promise<void>` (unique on owner/repo/subdir).
- `getPackById(db, id): Promise<PackRow | null>`.
- `searchPacks(db, q: string, limit?): Promise<PackRow[]>` (matches name/description; empty `q` → recent/popular).
- `incrementDownload(db, id): Promise<void>`.
- `PackRow` type (mirrors the table; `components`/`authors` JSON-encoded as TEXT).

- [ ] **Step 1: Create `migrations/0002_pack.sql`** per the spec's `pack` schema (id PK, name, namespace, description, version, license, protocol, min_nevoflux, github_owner/repo/ref/subdir, github_url, install_src, is_official, publisher_user_id, authors, components, download_count, stars_cached, stars_fetched_at, created_at, updated_at; UNIQUE(github_owner,github_repo,github_subdir); indexes on name, download_count).

- [ ] **Step 2: Apply locally** `pnpm exec wrangler d1 migrations apply nevoflux-www --local` and verify `pack` table exists.

- [ ] **Step 3: Implement `src/lib/packs/db.ts`** using the D1 prepared-statement API (`db.prepare(sql).bind(...).run()/.first()/.all()`). `searchPacks` uses `WHERE name LIKE ?1 OR description LIKE ?1` with `%q%`, `ORDER BY is_official DESC, download_count DESC` limit 50.

- [ ] **Step 4: Verify** `pnpm typecheck` (no unit test — exercised via the API smoke in Task 5/6).

- [ ] **Step 5: Commit** `git add migrations/0002_pack.sql src/lib/packs/db.ts && git commit -m "feat(packs): add pack table and D1 data layer"`

---

### Task 5: Publish + confirm API endpoints

**Files:** Create `src/pages/api/packs/publish.ts`, `src/pages/api/packs/confirm.ts`.

**Interfaces:**

- `POST /api/packs/publish` body `{ source: string }` → 200 `PackPreview` | 400 `{ error }`.
- `POST /api/packs/confirm` body `{ source: string }` (auth required) → 200 `{ id }` | 401 | 400.

- [ ] **Step 1: Implement `publish.ts`** (`prerender = false`): parse body → `parseSource` → `fetchPackPreview(env, source)` → return preview JSON; catch → 400 with message.

- [ ] **Step 2: Implement `confirm.ts`** (`prerender = false`): require session via `getSessionUser`; 401 if none. Re-`parseSource` + `fetchPackPreview`, build `PackRow` (id = crypto.randomUUID(), publisher = user.id, timestamps via `Date.now()`), `upsertPack`, return `{ id }`.

- [ ] **Step 3: Smoke (local)** `pnpm build` + `wrangler dev`: `POST /api/packs/publish` with a real public pack source (e.g. a nevoflux-browser pack) → expect 200 with manifest (needs network + a `GITHUB_TOKEN` in `.dev.vars`; without a token GitHub allows 60 req/hr unauthenticated — fine for a smoke). `POST /api/packs/confirm` without session → 401.

- [ ] **Step 4: Commit** the two endpoints.

---

### Task 6: Publish page (input → preview → confirm)

**Files:** Create `src/pages/[...locale]/packs/publish.astro`; i18n `publish` block (both locales).

- [ ] **Step 1: i18n `publish` strings** (both locales, identical shape): title, subtitle, sourceLabel, sourcePlaceholder, previewBtn, confirmBtn, official, loginRequired, error labels, success.

- [ ] **Step 2: Implement `publish.astro`** (`prerender = false`): a form with the source input; client script POSTs to `/api/packs/publish`, renders the returned preview (name, version, license, skills, seed, dashboard yes/no, official badge, install src), and a Confirm button POSTing to `/api/packs/confirm` then redirecting to `/packs`. If `/api/packs/confirm` returns 401, link to `/login`.

- [ ] **Step 3: Verify** `pnpm typecheck && pnpm build`; `/packs/publish` + `/zh/packs/publish` reachable via wrangler dev (200).

- [ ] **Step 4: Commit.**

---

### Task 7: Full verification + finish

- [ ] **Step 1:** `pnpm typecheck && pnpm lint && pnpm format && pnpm spell && pnpm test && pnpm build` — all green.
- [ ] **Step 2:** wrangler dev integration smoke — publish preview 200 (with network), confirm 401 unauthenticated, existing routes 200.
- [ ] **Step 3:** Hand off to superpowers:finishing-a-development-branch (merge to main + push).

## Self-Review

**Spec coverage (Stage 3 = spec § publish pipeline):** source forms incl. subdir (T1) ✓; pack.toml parse + validate + components incl. dashboard "none" (T2/T3) ✓; GitHub metadata stars/license (T3) ✓; instant-publish upsert by owner/repo/subdir (T4/T5) ✓; official flag (T1) ✓; install_src deep link (T1) ✓; auth-gated confirm (T5) ✓; publish UI (T6) ✓.

**Placeholder scan:** Task 3 Step 3 and Task 4/6 say "complete code during execution" for the larger I/O modules — these are integration modules verified by tests (T3) and smoke (T5/T6), not deferred requirements. Pure logic (T1/T2) is fully specified with tests.

**Type consistency:** `PackSource`/`PackManifest`/`PackComponents`/`PackPreview` defined in T1 `types.ts`; `parseSource`/`deriveInstallSrc`/`isOfficial` (T1) consumed by `github.ts` (T3) and endpoints (T5); `validateManifest`/`extractComponents` (T2) consumed by T3; `upsertPack`/`getPackById`/`searchPacks` (T4) consumed by T5 and Stage 4.

## Out of scope

Registry list/card/search UI (Stage 4), detail + install + download counting (Stage 5). Live publish needs a `GITHUB_TOKEN` in `.dev.vars` for rate-limited testing; production needs real D1 id + secrets.
