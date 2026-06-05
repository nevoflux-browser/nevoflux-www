import { describe, expect, it } from 'vitest';
import { detectArch, detectPlatform, isDownload } from '../../scripts/fetch-release-notes.mjs';

// Real asset names from github.com/dorisgyl/nevoflux releases.
const ASSETS = [
  'linux-aarch64.mar',
  'linux.mar',
  'macos.mar',
  'nevoflux-aarch64.AppImage',
  'nevoflux-aarch64.AppImage.zsync',
  'nevoflux-x86_64.AppImage',
  'nevoflux-x86_64.AppImage.zsync',
  'nevoflux.installer-arm64.exe',
  'nevoflux.installer.exe',
  'nevoflux.linux-aarch64.tar.xz',
  'nevoflux.linux-x86_64.tar.xz',
  'nevoflux.macos-universal.dmg',
  'nevoflux.win-arm64.zip',
  'nevoflux.win-x86_64.zip',
];

describe('isDownload', () => {
  it('excludes update deltas and checksums', () => {
    expect(isDownload('nevoflux-aarch64.AppImage.zsync')).toBe(false);
    expect(isDownload('linux.mar')).toBe(false);
    expect(isDownload('nevoflux.win-x86_64.zip.sha256')).toBe(false);
  });

  it('keeps user-facing installers', () => {
    expect(isDownload('nevoflux.installer.exe')).toBe(true);
    expect(isDownload('nevoflux.macos-universal.dmg')).toBe(true);
    expect(isDownload('nevoflux-x86_64.AppImage')).toBe(true);
  });
});

describe('detectPlatform', () => {
  it('maps each asset to the right OS', () => {
    expect(detectPlatform('nevoflux.win-arm64.zip')).toBe('windows');
    expect(detectPlatform('nevoflux.installer.exe')).toBe('windows');
    expect(detectPlatform('nevoflux.macos-universal.dmg')).toBe('macos');
    expect(detectPlatform('nevoflux-x86_64.AppImage')).toBe('linux');
    expect(detectPlatform('nevoflux.linux-aarch64.tar.xz')).toBe('linux');
  });
});

describe('detectArch', () => {
  it('distinguishes arm64, x64 and universal', () => {
    expect(detectArch('nevoflux-aarch64.AppImage')).toBe('arm64');
    expect(detectArch('nevoflux.installer-arm64.exe')).toBe('arm64');
    expect(detectArch('nevoflux-x86_64.AppImage')).toBe('x64');
    expect(detectArch('nevoflux.win-x86_64.zip')).toBe('x64');
    expect(detectArch('nevoflux.macos-universal.dmg')).toBe('universal');
  });

  it('returns null when no arch tag is present', () => {
    expect(detectArch('nevoflux.installer.exe')).toBeNull();
  });
});

describe('every real download asset classifies cleanly', () => {
  it('has a known platform', () => {
    for (const name of ASSETS.filter(isDownload)) {
      expect(detectPlatform(name)).not.toBe('other');
    }
  });
});
