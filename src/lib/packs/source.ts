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
    return { owner: short[1], repo: clean(short[2]), ...(short[3] ? { ref: short[3] } : {}) };
  }

  // https://github.com/owner/repo[/tree/<ref>/<subdir>][.git][/]
  const url =
    /^https?:\/\/github\.com\/([^/\s]+)\/([^/\s]+?)(?:\.git)?(?:\/tree\/([^/\s]+)\/(.+))?$/.exec(
      raw.replace(/\/$/, '')
    );
  if (url) {
    const owner = url[1];
    const repo = clean(url[2]);
    const ref = url[3];
    const subdir = url[4]?.replace(/\/$/, '');
    return { owner, repo, ...(ref ? { ref } : {}), ...(subdir ? { subdir } : {}) };
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
  return s.ref ? `github:${s.owner}/${s.repo}@${s.ref}` : `github:${s.owner}/${s.repo}`;
}

export function isOfficial(owner: string): boolean {
  return owner.toLowerCase() === OFFICIAL_OWNER;
}
