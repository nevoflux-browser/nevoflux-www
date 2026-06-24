// CLI-only Better Auth instance for schema generation.
// The Better Auth CLI cannot use a Cloudflare D1 binding (no request context),
// so we point it at an in-memory SQLite. This config must stay schema-compatible
// with src/lib/auth-options.ts: same plugins + account-linking that affect tables.
import Database from 'better-sqlite3';
import { betterAuth } from 'better-auth';
import { magicLink } from 'better-auth/plugins';

export const auth = betterAuth({
  database: new Database(':memory:'),
  secret: 'x'.repeat(32),
  baseURL: 'http://localhost:3000',
  account: { accountLinking: { enabled: true, trustedProviders: ['google', 'github'] } },
  socialProviders: {
    google: { clientId: 'x', clientSecret: 'x' },
    github: { clientId: 'x', clientSecret: 'x' },
  },
  plugins: [magicLink({ sendMagicLink: async () => {} })],
});
