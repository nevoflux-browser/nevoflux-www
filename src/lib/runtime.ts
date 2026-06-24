/**
 * Returns the Cloudflare binding env for the current SSR request.
 * Throws if called where no runtime is attached (e.g. a prerendered context).
 */
export function getRuntimeEnv(locals: App.Locals): Env {
  const env = locals.runtime?.env;
  if (!env) {
    throw new Error('Cloudflare runtime env is unavailable in this context.');
  }
  return env;
}
