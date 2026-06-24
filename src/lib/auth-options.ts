import type { BetterAuthOptions } from 'better-auth';
import { magicLink } from 'better-auth/plugins';
import { sendMagicLinkEmail } from '~/lib/email';

/** Shared options. `database` is the D1 binding (prod) or a sqlite Database (CLI). */
export function buildAuthOptions(env: Env, database: unknown): BetterAuthOptions {
  return {
    database: database as BetterAuthOptions['database'],
    secret: env.BETTER_AUTH_SECRET,
    baseURL: env.BETTER_AUTH_URL,
    account: { accountLinking: { enabled: true, trustedProviders: ['google', 'github'] } },
    socialProviders: {
      google: { clientId: env.GOOGLE_CLIENT_ID, clientSecret: env.GOOGLE_CLIENT_SECRET },
      github: {
        clientId: env.GITHUB_OAUTH_CLIENT_ID,
        clientSecret: env.GITHUB_OAUTH_CLIENT_SECRET,
      },
    },
    plugins: [
      magicLink({
        sendMagicLink: async ({ email, url }) => {
          await sendMagicLinkEmail(env, { email, url });
        },
      }),
    ],
  };
}
