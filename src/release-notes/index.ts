import { marked } from 'marked';
import type { Locale } from '~/utils/i18n';
import releasesData from './releases.generated.json';
import notesData from './notes.json';

export type ReleaseDownload = {
  name: string;
  url: string;
  size: number;
  platform: 'windows' | 'macos' | 'linux' | 'other';
  arch: 'arm64' | 'x64' | 'universal' | null;
};

/** Metadata fetched from GitHub at build time (see scripts/fetch-release-notes.mjs). */
export type ReleaseMeta = {
  version: string;
  tag: string;
  name: string;
  date: string; // ISO 8601
  prerelease: boolean;
  releaseUrl: string;
  downloads: ReleaseDownload[];
};

/**
 * Bilingual prose, hand-written in notes.json and keyed by version.
 * Each value is a Markdown string per locale, e.g.:
 *   { "0.4.0": { "en": "## Features\n- ...", "zh": "## 新功能\n- ..." } }
 * A missing locale falls back to English; a missing version renders metadata only.
 */
type Notes = Record<string, Partial<Record<Locale, string>>>;

export type ReleaseNote = ReleaseMeta & {
  /** Rendered HTML of the localized prose, or null when no notes exist for this version. */
  bodyHtml: string | null;
};

const releases = releasesData as unknown as ReleaseMeta[];
const notes = notesData as unknown as Notes;

marked.setOptions({ gfm: true });

function renderNote(version: string, locale: Locale): string | null {
  const entry = notes[version];
  if (!entry) return null;
  const markdown = entry[locale] ?? entry.en ?? null; // non-default locales fall back to English
  if (!markdown || !markdown.trim()) return null;
  return marked.parse(markdown) as string;
}

export function getReleaseNotes(locale: Locale): ReleaseNote[] {
  return releases.map((release) => ({
    ...release,
    bodyHtml: renderNote(release.version, locale),
  }));
}

export function getLatestRelease(): ReleaseMeta | null {
  return releases[0] ?? null;
}
