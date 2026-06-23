# PackHub + Operator-layer Redesign — Design Spec

**Date:** 2026-06-23
**Status:** Approved for planning
**Scope:** `nevoflux-www` marketing site only (P0 + P1 of the optimization plan)

## Context & Direction

The site currently elevates **OpenClaw** to co-headline status (standalone hero-level
section + co-branded "Open Source × Open Source"). But `nevoflux-agent`'s own
capabilities (browser / computer / file / memory / skills / multi-LLM) almost fully
overlap OpenClaw's, and OpenClaw's brand pull is larger than NevoFlux's — so the current
framing advertises the strongest substitute.

This redesign does two things in this repo:

1. **P0** — Reframe the Stack's third layer from "borrowing OpenClaw's narrative" to
   NevoFlux's own native story (**Loops + Pack + GBrain + Agent Mode**). OpenClaw is
   demoted to one clause. Align the three role-verbs to **Brain / Creator / Operator**.
2. **P1** — Add a user-facing **PackHub** showcase as a dedicated `/packs` page (preview
   showcase form, placeholder visuals).

Out of scope (confirmed): README/docs term alignment; `nevoflux://pack-install` deep link
(P2, browser-side); third-party pack registry (P3).

## Decisions (locked)

| Decision | Choice |
| --- | --- |
| Implementation scope this pass | P0 + P1 (PackHub preview showcase) |
| PackHub form | Dedicated page `/packs` |
| Pack card visuals | Placeholder visuals (gradient block + icon + "Dashboard preview"), real screenshots later |
| README term alignment | Deferred (not this pass) |
| `The Operator` Chinese role word | 执行者 |
| OKF Pack positioning | Around Google's **OKF** open standard — the universal format for AI-agent knowledge exchange (NOT generic knowledge management) |

## i18n ground rule (critical)

`getUI` does a **shallow** top-level merge (`{ ...en, ...zh }`). Any section that exists in
`zh` fully replaces the English one — so **every** string change must be applied to BOTH
`src/i18n/en/translation.json` and `src/i18n/zh/translation.json`, keeping them
structurally identical. This applies to the `agentArch` rename, the new `packs` section,
the new `nav.packs` key, and the `openclaw` deletion.

---

## P0 — Stack third layer rewrite

### `agentArch` i18n changes (both locales)

Rename key `agentArch.personal` → `agentArch.operator`. Update `AgentArchitecture.astro`
to spread `...ui.agentArch.operator` (line ~23); keep the existing purple
color/border/iconBg and the person icon.

**EN (`agentArch.operator`):**
- `role`: `The Operator`
- `label`: `Loops & GBrain`
- `description`: `Set a Loop and it runs on its own — on a schedule or a trigger, watching pages, capturing changes, and saving them to your GBrain while you sleep. When a task needs hands, Agent Mode clicks and fills for you. Extend any of it with Packs — or reach it hands-free from WhatsApp and Telegram via OpenClaw, native inside NevoFlux with no external browser to drive.`

**ZH (`agentArch.operator`):**
- `role`: `执行者`
- `label`: `Loops 与 GBrain`
- `description`: `设个 Loop 它就自己跑 —— 定时或触发，盯着网页、抓取变化，在你睡觉时写进你的 GBrain。需要动手时，Agent 模式替你点击、替你填写。用 Pack 扩展这一切 —— 或者接上 OpenClaw，从 WhatsApp、Telegram 直接喊它，原生跑在 NevoFlux 里，无需外接浏览器。`

> This description absorbs the two confirmed OpenClaw points (§六.2): the one capability
> worth keeping (reach from chat apps) + the supporting credibility detail (runs natively,
> no external Playwright/headless browser). No standalone OpenClaw section remains.

### Formula (both locales)

- EN `agentArch.formula`: `Brain + Creator + Operator = Command Everything`
- ZH `agentArch.formula`: `大脑 + 创造者 + 执行者 = 掌控一切`

(Switches from noun-labels to the three role-verbs so the line reads Brain/Creator/Operator.)

### Delete the OpenClaw standalone section

- `src/pages/[...locale]/index.astro`: remove `import OpenClaw` and the `<OpenClaw />`
  element (it currently renders between `<Comparison />` and `<CallToAction />`).
- Delete `src/components/OpenClaw.astro`.
- Remove the entire `openclaw` section from both translation files.
- **`Comparison.astro` is unchanged** — the `Personal Agent (OpenClaw)` /
  `个人智能体 (OpenClaw)` row stays (this is a true differentiator vs Atlas/Comet/Dia).
- Keep `openclaw` in `cspell.json` (still referenced by the comparison row and the
  Operator description).

---

## P1 — `/packs` PackHub page (preview showcase)

### Page

New file `src/pages/[...locale]/packs.astro`, following the existing `[...locale]` page
pattern (`privacy-policy.astro`): `export const getStaticPaths = getI18nStaticPaths;`,
wrapped in `Layout` with `NavBar` + `Footer`, reading `getLocale`/`getUI`. Page content is
inline (single-purpose page; no separate component needed). All copy comes from a new
`packs` i18n section; structural data (slug, gradient classes, icon) lives in the `.astro`
frontmatter.

### Section structure

1. **Hero** — `PackHub` badge, title, subtitle, primary CTA "Get NevoFlux" linking to the
   homepage (`getPath(locale, '/')`) where the OS-aware download button lives (do not
   reimplement OS detection here).
2. **Pack card grid (4 cards)** — each card: name, one-liner, **placeholder visual**
   (consistent gradient block + pack icon + a "Dashboard preview" caption), scenario tag.
   In preview-showcase form, cards carry **no clickable install button** (avoids a dead
   button); install intent is carried by the page CTA + the "How it works" steps.
3. **How it works (3 steps)** — Pick a Pack → Add to NevoFlux → Use it in Canvas.
4. **Build-your-own line** — one small line linking to docs (`${DOCS_URL}/${locale}/docs`).

### `packs` i18n section (both locales)

```jsonc
"packs": {
  "hero": {
    "badge": "PackHub",
    "title": "...",         // EN: Instant superpowers for your browser
    "subtitle": "...",      // see copy table
    "cta": "..."            // EN: Get NevoFlux / ZH: 下载 NevoFlux
  },
  "items": [                // 4 entries, order: design, career, research, okf
    { "name": "...", "tagline": "...", "tag": "..." }
  ],
  "how": {
    "title": "...",         // EN: How it works / ZH: 怎么用
    "steps": [              // 3 entries
      { "title": "...", "desc": "..." }
    ]
  },
  "build": "..."            // EN: Want to build your own Pack? Read the docs → / ZH: 想自己做 Pack？查看文档 →
}
```

`items` order is fixed and matched positionally to the frontmatter visual config (slug +
gradient + icon) in `packs.astro`.

### Hero copy

| Field | EN | ZH |
| --- | --- | --- |
| badge | PackHub | PackHub |
| title | Instant superpowers for your browser | 给浏览器即装即用的超能力 |
| subtitle | Install a Pack and your browser learns a whole workflow — skills, canvas tools, and a ready-made dashboard, all in one place. | 装上一个 Pack，你的浏览器就学会一整套工作流 —— 技能、画布工具，还有现成的 dashboard，一处搞定。 |
| cta | Get NevoFlux | 下载 NevoFlux |

### Pack cards (4)

| slug | name (EN/ZH) | EN tagline | ZH tagline | tag (EN/ZH) |
| --- | --- | --- | --- | --- |
| design | Design Pack / Design Pack | Pick a design system on a dashboard and let your browser generate the UI. | 在 dashboard 上挑设计规范，让浏览器直接帮你生成 UI。 | Design / 设计 |
| career | Career Pack / Career Pack | Tailor your resume, track applications, and prep interviews — your browser runs the job hunt. | 定制简历、跟踪投递、准备面试 —— 让浏览器替你跑完求职流程。 | Career / 求职 |
| research | Research Pack / Research Pack | Collect sources, extract findings, and build a literature map without leaving the page. | 收集来源、提炼发现、构建文献图谱 —— 全程不用离开页面。 | Research / 研究 |
| okf | OKF Pack / OKF Pack | Package what your browser learns into OKF, the open standard for AI-agent knowledge exchange — so any agent can read and reuse it. | 把浏览器学到的东西打包成 OKF —— 面向 AI 智能体知识交换的开放标准，让任何智能体都能读懂、复用。 | Interop / 互操作 |

### How-it-works steps

| # | EN title / desc | ZH title / desc |
| --- | --- | --- |
| 1 | Pick a Pack — Choose the workflow you need. | 选 Pack —— 挑你需要的那套工作流。 |
| 2 | Add to NevoFlux — One install brings its skills, tools, and dashboard. | 装进 NevoFlux —— 一次安装，技能、工具、dashboard 全到位。 |
| 3 | Use it — Your new workflow is ready in Canvas. | 直接用 —— 新工作流在 Canvas 里立刻就绪。 |

### Build line

- EN: `Want to build your own Pack? Read the docs →`
- ZH: `想自己做 Pack？查看文档 →`

### Navigation

`NavBar.astro`: add a link (in the `hidden ... sm:block` group, alongside Features /
Release Notes) → `getPath(locale, '/packs')`, label `ui.nav.packs`. Add `nav.packs` to
both locales with value `PackHub` (brand name, untranslated in both).

### cspell

Add to `cspell.json` words: `GBrain`, `PackHub`, `OKF`. (`openclaw` stays; `Loops` is a
common word — not added.)

---

## Files touched

**P0**
- `src/i18n/en/translation.json` — rename `agentArch.personal`→`operator` + new copy; `formula`; delete `openclaw`; add `nav.packs`; add `packs`
- `src/i18n/zh/translation.json` — same set
- `src/components/AgentArchitecture.astro` — `...ui.agentArch.personal` → `...ui.agentArch.operator`
- `src/pages/[...locale]/index.astro` — remove OpenClaw import + element
- `src/components/OpenClaw.astro` — **delete**
- `src/components/NavBar.astro` — add PackHub link

**P1**
- `src/pages/[...locale]/packs.astro` — **new**
- `src/i18n/{en,zh}/translation.json` — `packs` + `nav.packs` (listed above)
- `cspell.json` — add `GBrain`, `PackHub`, `OKF`

## Testing / verification

- `pnpm typecheck` — astro check passes (new page types, i18n key access).
- `pnpm lint` — eslint clean (`--max-warnings=0`).
- `pnpm format` — prettier clean.
- `pnpm spell` — cspell clean (new words added).
- `pnpm build` — both `en` and `zh` builds emit; `/packs` and `/zh/packs` exist; no
  reference to removed `openclaw` keys; no broken `OpenClaw` import.
- Manual: homepage Stack card shows Operator/执行者 copy; OpenClaw section gone; comparison
  row intact; `/packs` renders in both locales with 4 cards + nav entry.

## Open items needing real data later (not blocking P1)

- Real Canvas dashboard screenshots for the 4 packs (replace placeholders).
- Exact docs URL for the packs documentation (currently links to docs home).
- P2 deep link to upgrade card/page CTA from "Get NevoFlux" to true one-click install.
