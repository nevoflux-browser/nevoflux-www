import type { APIRoute } from 'astro';
import { createAuth } from '~/lib/auth';
import { getRuntimeEnv } from '~/lib/runtime';

export const prerender = false;

export const ALL: APIRoute = async (ctx) => {
  const auth = createAuth(getRuntimeEnv(ctx.locals));
  return auth.handler(ctx.request);
};
