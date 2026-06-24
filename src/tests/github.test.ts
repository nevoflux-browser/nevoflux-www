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

function mockFetch(map: Record<string, { status: number; body: string }>): typeof fetch {
  return (async (url: string | URL) => {
    const key = url.toString();
    // First matching key wins (insertion order) — list specific paths first.
    const hit = Object.keys(map).find((k) => key.includes(k));
    const res = hit ? map[hit] : { status: 404, body: 'not found' };
    return new Response(res.body, { status: res.status });
  }) as unknown as typeof fetch;
}

const env = { GITHUB_TOKEN: 't' } as unknown as Env;

describe('fetchPackPreview', () => {
  it('builds a preview from repo metadata + pack.toml + skills', async () => {
    const f = mockFetch({
      'raw.githubusercontent.com': { status: 200, body: PACK_TOML },
      '/contents/design/components/skills': {
        status: 200,
        body: JSON.stringify([{ name: 'evaluate', type: 'dir' }]),
      },
      'api.github.com/repos/nevoflux-browser/packs': {
        status: 200,
        body: JSON.stringify({
          stargazers_count: 42,
          default_branch: 'main',
          license: { spdx_id: 'MIT' },
        }),
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
    expect(preview.repoLicense).toBe('MIT');
    expect(preview.installSrc).toBe('https://github.com/nevoflux-browser/packs/tree/main/design');
    expect(preview.components.dashboard).toBe(true);
    expect(preview.components.skills).toEqual([{ name: 'evaluate' }]);
  });

  it('throws when pack.toml is missing', async () => {
    const f = mockFetch({
      'api.github.com/repos': {
        status: 200,
        body: JSON.stringify({ stargazers_count: 1, default_branch: 'main' }),
      },
    });
    await expect(fetchPackPreview(env, { owner: 'o', repo: 'r' }, f)).rejects.toThrow();
  });

  it('throws when the repo is not found', async () => {
    const f = mockFetch({});
    await expect(fetchPackPreview(env, { owner: 'o', repo: 'r' }, f)).rejects.toThrow(
      /repo not found/i
    );
  });
});
