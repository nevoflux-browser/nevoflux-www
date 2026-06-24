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
      expect(r.manifest.authors).toEqual(['A <a@b>']);
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
    expect(c).toEqual({ skills: [], seed: [], dashboard: false, canvasTools: [] });
  });
});
