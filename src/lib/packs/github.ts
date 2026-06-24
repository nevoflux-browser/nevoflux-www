import { parse } from 'smol-toml';
import type { PackSource, PackPreview } from '~/lib/packs/types';
import { validateManifest, extractComponents } from '~/lib/packs/manifest';
import { deriveInstallSrc, githubUrlOf, isOfficial } from '~/lib/packs/source';

const GH_API = 'https://api.github.com';
const GH_RAW = 'https://raw.githubusercontent.com';

type Obj = Record<string, unknown>;
const asObj = (v: unknown): Obj => (v && typeof v === 'object' ? (v as Obj) : {});

function ghHeaders(env: Env): Record<string, string> {
  const h: Record<string, string> = {
    'User-Agent': 'nevoflux-www',
    Accept: 'application/vnd.github+json',
  };
  if (env.GITHUB_TOKEN) h.Authorization = `Bearer ${env.GITHUB_TOKEN}`;
  return h;
}

/** Resolve a GitHub source into a full pack preview (no DB write). */
export async function fetchPackPreview(
  env: Env,
  source: PackSource,
  fetchImpl: typeof fetch = fetch
): Promise<PackPreview> {
  const { owner, repo } = source;

  // 1. Repo metadata (stars, default branch, license).
  const repoRes = await fetchImpl(`${GH_API}/repos/${owner}/${repo}`, { headers: ghHeaders(env) });
  if (!repoRes.ok) {
    throw new Error(`GitHub repo not found: ${owner}/${repo} (${repoRes.status})`);
  }
  const meta = asObj(await repoRes.json());
  const license = asObj(meta.license);
  const ref =
    source.ref ?? (typeof meta.default_branch === 'string' ? meta.default_branch : 'main');
  const subdirPrefix = source.subdir ? `${source.subdir}/` : '';

  // 2. pack.toml (raw).
  const tomlRes = await fetchImpl(`${GH_RAW}/${owner}/${repo}/${ref}/${subdirPrefix}pack.toml`);
  if (!tomlRes.ok) throw new Error('pack.toml not found at the given source');
  const tomlText = await tomlRes.text();
  let toml: Obj;
  try {
    toml = asObj(parse(tomlText));
  } catch (e) {
    throw new Error(`Invalid pack.toml: ${(e as Error).message}`);
  }

  const validated = validateManifest(toml);
  if (!validated.ok) throw new Error(`Invalid pack.toml: ${validated.errors.join('; ')}`);
  const components = extractComponents(toml);

  // 3. Skills dir listing (best-effort; names only).
  const skillsConf = asObj(asObj(toml.components).skills);
  const skillsDir = typeof skillsConf.dir === 'string' ? skillsConf.dir : undefined;
  if (skillsDir) {
    const path = `${subdirPrefix}${skillsDir}`.replace(/\/$/, '');
    const listRes = await fetchImpl(
      `${GH_API}/repos/${owner}/${repo}/contents/${path}?ref=${ref}`,
      { headers: ghHeaders(env) }
    );
    if (listRes.ok) {
      const data = await listRes.json();
      const entries = Array.isArray(data) ? (data as { name: string; type: string }[]) : [];
      components.skills = entries
        .filter((e) => e.type === 'dir' || e.name.endsWith('.md'))
        .map((e) => ({ name: e.name.replace(/\.md$/, '') }));
    }
  }

  const installSrc = source.subdir
    ? deriveInstallSrc({ ...source, ref })
    : deriveInstallSrc(source);

  return {
    source,
    manifest: validated.manifest,
    components,
    githubUrl: githubUrlOf(source),
    installSrc,
    isOfficial: isOfficial(owner),
    stars: typeof meta.stargazers_count === 'number' ? meta.stargazers_count : 0,
    repoLicense: typeof license.spdx_id === 'string' ? license.spdx_id : undefined,
  };
}
