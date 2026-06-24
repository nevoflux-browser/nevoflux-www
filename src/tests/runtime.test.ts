import { describe, it, expect } from 'vitest';
import { getRuntimeEnv } from '~/lib/runtime';

describe('getRuntimeEnv', () => {
  it('returns the binding env from locals.runtime', () => {
    const fakeEnv = { DB: {}, CACHE: {} } as unknown as Env;
    const locals = { runtime: { env: fakeEnv } } as unknown as App.Locals;
    expect(getRuntimeEnv(locals)).toBe(fakeEnv);
  });

  it('throws a clear error when runtime is missing', () => {
    const locals = {} as unknown as App.Locals;
    expect(() => getRuntimeEnv(locals)).toThrow(/Cloudflare runtime/i);
  });
});
