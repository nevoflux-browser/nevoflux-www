import { describe, it, expect } from 'vitest';
import { buildAuthOptions } from '~/lib/auth-options';

const env = {
  BETTER_AUTH_SECRET: 'x'.repeat(32),
  BETTER_AUTH_URL: 'http://localhost:3000',
  GOOGLE_CLIENT_ID: 'g',
  GOOGLE_CLIENT_SECRET: 'gs',
  GITHUB_OAUTH_CLIENT_ID: 'h',
  GITHUB_OAUTH_CLIENT_SECRET: 'hs',
  RESEND_API_KEY: '',
} as unknown as Env;

describe('buildAuthOptions', () => {
  it('wires google + github providers and secret from env', () => {
    const opts = buildAuthOptions(env, {});
    expect(opts.secret).toBe('x'.repeat(32));
    expect(opts.baseURL).toBe('http://localhost:3000');
    // Better Auth types each provider as object | function; we always pass objects.
    const google = opts.socialProviders?.google as { clientId?: string } | undefined;
    const github = opts.socialProviders?.github as { clientId?: string } | undefined;
    expect(google?.clientId).toBe('g');
    expect(github?.clientId).toBe('h');
  });

  it('enables account linking and registers a magic-link plugin', () => {
    const opts = buildAuthOptions(env, {});
    expect(opts.account?.accountLinking?.enabled).toBe(true);
    expect(opts.account?.accountLinking?.trustedProviders).toContain('google');
    expect((opts.plugins ?? []).length).toBeGreaterThan(0);
  });

  it('passes through the database argument', () => {
    const db = { marker: true };
    expect(buildAuthOptions(env, db).database).toBe(db);
  });
});
