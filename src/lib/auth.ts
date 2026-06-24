import { betterAuth } from 'better-auth';
import { buildAuthOptions } from '~/lib/auth-options';

/** Per-request factory: the D1 binding only exists inside a request on Workers. */
export function createAuth(env: Env) {
  return betterAuth(buildAuthOptions(env, env.DB));
}
