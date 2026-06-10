# Privacy Policy Page — Design

**Date:** 2026-06-10
**Status:** Approved (design), pending spec review

## Goal

Add a bilingual (en/zh) `/privacy-policy` page to the NevoFlux marketing site,
following the site's established patterns. Content is a **standard template** for a
privacy-focused desktop browser. The page renders a real, professional-looking
document — **not** visible `[TBD]` markers — while keeping the two maintainer-specific
values easy to update in one place:

- **Effective date ("Last updated")** = today, `2026-06-10` (the genuine authoring
  date), stored as a single constant to bump on real launch.
- **Contact** = points readers to the existing community channels (Discord / GitHub),
  with a `PRIVACY_CONTACT_EMAIL` constant left empty + a `// TODO` so a dedicated
  privacy email can be dropped in later (when set, the page shows it instead).

The template is explicitly **not legal advice** and must be reviewed before going live.

## Routes

- `/privacy-policy` (en, default — no prefix)
- `/zh/privacy-policy` (zh)

Emitted by a new flat-file page under the existing `[...locale]` catch-all, reusing
`getStaticPaths()` from `src/utils/i18n.ts` (same mechanism as `release-notes`).

## Architecture (mirrors the release-notes feature)

Long-form bilingual prose is stored as **Markdown** and rendered to HTML with `marked`
(already a dependency), exactly like `src/release-notes/`. Short page-chrome strings
live in the translation JSONs.

### New / changed files

1. **`src/privacy/index.ts`** (new) — content module.
   - Two Markdown constants: the policy in `en` and `zh`.
   - A `contactMarkdown(locale)` helper that emits the Contact section body from
     `PRIVACY_CONTACT_EMAIL` (when set) or the Discord / GitHub channels otherwise,
     appended to the policy Markdown before rendering.
   - `getPrivacyPolicy(locale): { bodyHtml: string; lastUpdated: string }` — renders the
     locale's Markdown via `marked` (`gfm: true`), with `zh` falling back to `en` if
     empty; `lastUpdated` is `PRIVACY_LAST_UPDATED`.
   - Top-of-file comment flags the content as a non-legal template to be reviewed.

2. **`src/pages/[...locale]/privacy-policy.astro`** (new) — the page.
   - `getStaticPaths()` re-exported from `~/utils/i18n`.
   - `const locale = getLocale(Astro.url); const ui = getUI(locale);`
   - `const { bodyHtml } = getPrivacyPolicy(locale);`
   - Layout: `<Layout title={`${ui.privacy.title} · ${ui.site.title}`} description={ui.privacy.subtitle}>`
     wrapping `<NavBar />`, a `<main class="container ... pt-32">` with a centered
     header (`ui.privacy.title` + `ui.privacy.lastUpdated` + placeholder date) and a
     `max-w-3xl` body rendered with `set:html={bodyHtml}` inside a `.prose` container,
     then `<Footer />`. Mirrors `release-notes/index.astro`.

3. **`src/i18n/en/translation.json`** & **`src/i18n/zh/translation.json`** (changed) —
   add, **kept structurally identical** (per CLAUDE.md shallow-merge rule):
   - `privacy: { title, subtitle, lastUpdated }`
     - en: `"Privacy Policy"`, a one-line description (for `<meta description>` / OG),
       `"Last updated"`.
     - zh: `"隐私政策"`, the translated description, `"最后更新"`.
   - `footer.privacy` — footer link label: `"Privacy Policy"` / `"隐私政策"`.

4. **`src/components/Footer.astro`** (changed) — add a locale-aware internal link
   `getPath(locale, '/privacy-policy')` labeled `ui.footer.privacy` to the links row
   (no `target="_blank"`; it's internal).

5. **`src/styles/global.css`** (changed) — rename the existing `.release-prose` block
   to a neutral `.prose` so both the release-notes body and the privacy body share it.

6. **`src/components/ReleaseNoteItem.astro`** (changed) — update the single usage
   `class="release-prose ..."` → `class="prose ..."` to match the renamed CSS.

7. **`src/constants/index.ts`** (changed) — add `PRIVACY_LAST_UPDATED = '2026-06-10'`
   and `PRIVACY_CONTACT_EMAIL = ''` (with a `// TODO` to set a dedicated privacy email).
   These keep the two maintainer-specific values in the established site-constants file.

### Content sections (template, en + zh)

Intro → Information We Collect → How We Use Information → AI / Agent Data Processing →
Third-Party Services → Data Retention → Your Rights → Children's Privacy →
Changes to This Policy → Contact. The Contact section is built in TS (not hardcoded in
the Markdown) so it can render either the `PRIVACY_CONTACT_EMAIL` (when set) or, by
default, links to the existing Discord / GitHub community channels.

The prose reflects a privacy-focused desktop browser built on Zen/Firefox: emphasizes
local-first/on-device handling, no server-side tracking by default, and describes AI/agent
features generically (data sent to AI providers only when the user invokes agent actions).
All specifics are to be verified by the maintainer.

## SEO

Handled automatically by `Layout.astro`: canonical, `hreflang` alternates (en/zh/x-default),
Open Graph, Twitter. Page is indexable (no `noindex`). The `privacy.subtitle` string feeds
`<meta name="description">` and OG/Twitter descriptions.

## Testing

- **Unit (`src/tests/`)**: a test for `getPrivacyPolicy()` — returns a non-empty HTML
  string for both locales, contains an expected heading, and `zh` output differs from
  `en`. Mirrors existing test conventions.
- **Manual**: `pnpm build` succeeds; both routes render; footer link works in both locales.

## Out of scope (YAGNI)

- Cookie-consent banner / cookie management UI.
- A separate Terms of Service page.
- CMS / Markdown-file-on-disk loading (content lives in the TS module like release notes).
- Real legal review (flagged for the maintainer).
