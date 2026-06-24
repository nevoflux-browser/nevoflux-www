import { createAuth } from '~/lib/auth';
import { getRuntimeEnv } from '~/lib/runtime';

/** Resolve the signed-in user for an SSR request, or null. */
export async function getSessionUser(locals: App.Locals, request: Request) {
  const auth = createAuth(getRuntimeEnv(locals));
  const session = await auth.api.getSession({ headers: request.headers });
  return session?.user ?? null;
}
