import { describe, it, expect } from 'vitest';
import { parseSource, deriveInstallSrc, isOfficial } from '~/lib/packs/source';

describe('parseSource', () => {
  it('parses github:owner/repo', () => {
    expect(parseSource('github:o/r')).toEqual({ owner: 'o', repo: 'r' });
  });
  it('parses github:owner/repo@ref', () => {
    expect(parseSource('github:o/r@v1.0.0')).toEqual({ owner: 'o', repo: 'r', ref: 'v1.0.0' });
  });
  it('parses https repo root', () => {
    expect(parseSource('https://github.com/o/r')).toEqual({ owner: 'o', repo: 'r' });
  });
  it('parses https tree subdir', () => {
    expect(parseSource('https://github.com/o/r/tree/main/packs/design')).toEqual({
      owner: 'o',
      repo: 'r',
      ref: 'main',
      subdir: 'packs/design',
    });
  });
  it('strips .git and trailing slash', () => {
    expect(parseSource('https://github.com/o/r.git/')).toEqual({ owner: 'o', repo: 'r' });
  });
  it('throws on garbage', () => {
    expect(() => parseSource('not a repo')).toThrow();
  });
});

describe('deriveInstallSrc', () => {
  it('root -> github: shorthand', () => {
    expect(deriveInstallSrc({ owner: 'o', repo: 'r' })).toBe('github:o/r');
  });
  it('root + ref -> @ref', () => {
    expect(deriveInstallSrc({ owner: 'o', repo: 'r', ref: 'v1' })).toBe('github:o/r@v1');
  });
  it('subdir -> tree url', () => {
    expect(deriveInstallSrc({ owner: 'o', repo: 'r', ref: 'main', subdir: 'a/b' })).toBe(
      'https://github.com/o/r/tree/main/a/b'
    );
  });
  it('subdir without ref defaults to main', () => {
    expect(deriveInstallSrc({ owner: 'o', repo: 'r', subdir: 'a' })).toBe(
      'https://github.com/o/r/tree/main/a'
    );
  });
});

describe('isOfficial', () => {
  it('true for nevoflux-browser', () => expect(isOfficial('nevoflux-browser')).toBe(true));
  it('false otherwise', () => expect(isOfficial('someone')).toBe(false));
});
