// Fetches release *metadata* (version, date, downloads) from the NevoFlux GitHub
// repo and writes it to src/release-notes/releases.generated.json at build time.
//
// The bilingual prose ("what changed") is NOT fetched here — a GitHub Release has
// only one body field, so it cannot hold both languages. Prose lives in
// src/release-notes/notes.json (keyed by version, with en/zh) and is merged with
// this metadata at build time. See src/release-notes/index.ts.
//
// Run via `pnpm fetch:releases`; also runs automatically before `pnpm build`.
// Set GITHUB_TOKEN in the environment to raise the API rate limit.

import { writeFile, mkdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const REPO = 'nevoflux-browser/nevoflux';
const API = `https://api.github.com/repos/${REPO}/releases?per_page=100`;

const HERE = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.resolve(HERE, '../src/release-notes/releases.generated.json');

// Asset suffixes that are not user-facing downloads (update deltas, checksums…)
const IGNORED_SUFFIXES = ['.zsync', '.mar', '.sig', '.sha256', '.sha512', '.blockmap'];

export function isDownload(name) {
  const n = name.toLowerCase();
  return !IGNORED_SUFFIXES.some((suffix) => n.endsWith(suffix));
}

export function detectPlatform(name) {
  const n = name.toLowerCase();
  if (n.includes('win') || n.endsWith('.exe') || n.endsWith('.msi')) return 'windows';
  if (n.includes('mac') || n.includes('darwin') || n.endsWith('.dmg') || n.endsWith('.pkg'))
    return 'macos';
  if (
    n.includes('linux') ||
    n.endsWith('.appimage') ||
    n.endsWith('.deb') ||
    n.endsWith('.rpm') ||
    n.endsWith('.tar.xz')
  )
    return 'linux';
  return 'other';
}

export function detectArch(name) {
  const n = name.toLowerCase();
  if (n.includes('universal')) return 'universal';
  if (n.includes('aarch64') || n.includes('arm64')) return 'arm64';
  if (n.includes('x86_64') || n.includes('x86-64') || n.includes('x64') || n.includes('amd64'))
    return 'x64';
  return null;
}

export function normalizeRelease(release) {
  const version = (release.tag_name || '').replace(/^v/, '');
  const downloads = (release.assets || [])
    .filter((a) => isDownload(a.name))
    .map((a) => ({
      name: a.name,
      url: a.browser_download_url,
      size: a.size,
      platform: detectPlatform(a.name),
      arch: detectArch(a.name),
    }));
  return {
    version,
    tag: release.tag_name,
    name: release.name || version,
    date: release.published_at,
    prerelease: Boolean(release.prerelease),
    releaseUrl: release.html_url,
    downloads,
  };
}

async function main() {
  const headers = {
    Accept: 'application/vnd.github+json',
    'User-Agent': 'nevoflux-www-build',
  };
  if (process.env.GITHUB_TOKEN) headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;

  let releases;
  try {
    const res = await fetch(API, { headers });
    if (!res.ok) throw new Error(`GitHub API responded ${res.status} ${res.statusText}`);
    const data = await res.json();
    releases = data
      .filter((r) => !r.draft)
      .map(normalizeRelease)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  } catch (err) {
    console.warn(`[release-notes] fetch failed: ${err.message}`);
    if (existsSync(OUT)) {
      console.warn('[release-notes] keeping existing releases.generated.json');
      return;
    }
    console.warn('[release-notes] no cached file — writing an empty release list');
    releases = [];
  }

  await mkdir(path.dirname(OUT), { recursive: true });
  await writeFile(OUT, `${JSON.stringify(releases, null, 2)}\n`);
  console.log(
    `[release-notes] wrote ${releases.length} release(s) to ${path.relative(process.cwd(), OUT)}`
  );
}

const invokedDirectly =
  process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (invokedDirectly) main();
