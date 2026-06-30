import { describe, it, expect } from 'vitest';
import { packRowFromPreview, parsePackRow, parsePackSort, packOrderClause } from '~/lib/packs/db';
import type { PackPreview } from '~/lib/packs/types';

const preview: PackPreview = {
  source: { owner: 'nevoflux-browser', repo: 'packs', subdir: 'design' },
  manifest: {
    name: 'design-pack',
    version: '0.1.0',
    protocol: 'pack-protocol/0.1',
    minNevoflux: '0.3.0',
    description: 'UI gen',
    authors: ['A <a@b>'],
  },
  components: { skills: [{ name: 'evaluate' }], seed: [], dashboard: true, canvasTools: [] },
  githubUrl: 'https://github.com/nevoflux-browser/packs',
  installSrc: 'https://github.com/nevoflux-browser/packs/tree/main/design',
  isOfficial: true,
  stars: 42,
  repoLicense: 'MIT',
};

describe('packRowFromPreview', () => {
  it('maps a preview into a DB row', () => {
    const row = packRowFromPreview(preview, 'user-1', 'pack-1', 1000);
    expect(row.id).toBe('pack-1');
    expect(row.publisher_user_id).toBe('user-1');
    expect(row.is_official).toBe(1);
    expect(row.github_subdir).toBe('design');
    expect(row.license).toBe('MIT'); // falls back to repoLicense
    expect(row.stars_cached).toBe(42);
    expect(row.download_count).toBe(0);
    expect(JSON.parse(row.components!).dashboard).toBe(true);
    expect(JSON.parse(row.authors!)).toEqual(['A <a@b>']);
  });

  it("uses '' subdir for repo-root packs", () => {
    const root = packRowFromPreview(
      { ...preview, source: { owner: 'o', repo: 'r' }, isOfficial: false },
      'u',
      'p',
      1
    );
    expect(root.github_subdir).toBe('');
    expect(root.is_official).toBe(0);
  });
});

describe('parsePackSort', () => {
  it('accepts the known sort modes', () => {
    expect(parsePackSort('popular')).toBe('popular');
    expect(parsePackSort('newest')).toBe('newest');
    expect(parsePackSort('stars')).toBe('stars');
  });

  it('falls back to popular for missing or unknown values', () => {
    expect(parsePackSort(undefined)).toBe('popular');
    expect(parsePackSort(null)).toBe('popular');
    expect(parsePackSort('')).toBe('popular');
    expect(parsePackSort('garbage')).toBe('popular');
    expect(parsePackSort('POPULAR')).toBe('popular'); // exact match only
  });
});

describe('packOrderClause', () => {
  it('keeps the current official-first popularity order as the default', () => {
    expect(packOrderClause('popular')).toBe(
      'is_official DESC, download_count DESC, star_count DESC, created_at DESC, id'
    );
  });

  it('sorts newest by creation time and stars by star count', () => {
    expect(packOrderClause('newest')).toBe('created_at DESC, id');
    expect(packOrderClause('stars')).toBe(
      'star_count DESC, download_count DESC, created_at DESC, id'
    );
  });

  it('ends every mode with a deterministic unique tiebreaker (id)', () => {
    for (const sort of ['popular', 'newest', 'stars'] as const) {
      expect(packOrderClause(sort).endsWith(', id')).toBe(true);
    }
  });
});

describe('parsePackRow', () => {
  it('decodes the authors and components JSON columns', () => {
    const row = packRowFromPreview(preview, 'user-1', 'pack-1', 1000);
    const view = parsePackRow(row);
    expect(view.components.dashboard).toBe(true);
    expect(view.components.skills).toEqual([{ name: 'evaluate' }]);
    expect(view.authors).toEqual(['A <a@b>']);
  });

  it('defaults empty when JSON columns are null', () => {
    const row = packRowFromPreview(preview, 'u', 'p', 1);
    const view = parsePackRow({ ...row, authors: null, components: null });
    expect(view.authors).toEqual([]);
    expect(view.components).toEqual({ skills: [], seed: [], dashboard: false, canvasTools: [] });
  });
});
