import { describe, it, expect } from 'vitest';
import { packRowFromPreview } from '~/lib/packs/db';
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
