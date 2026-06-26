import type { APIRoute } from 'astro';
import { getRuntimeEnv } from '~/lib/runtime';
import { getSessionUser } from '~/lib/session';
import { getPackById, toggleStar } from '~/lib/packs/db';
import { jsonResponse } from '~/lib/http';

export const prerender = false;

/** POST -> toggle the current user's star on a pack. Returns { starred, starCount }. */
export const POST: APIRoute = async (ctx) => {
  const id = ctx.params.id;
  if (!id) return jsonResponse({ error: 'id required' }, 400);

  const env = getRuntimeEnv(ctx.locals);
  const user = await getSessionUser(ctx.locals, ctx.request);
  if (!user) return jsonResponse({ error: 'Authentication required' }, 401);

  const pack = await getPackById(env.DB, id);
  if (!pack) return jsonResponse({ error: 'Not found' }, 404);

  const result = await toggleStar(env.DB, id, user.id);
  return jsonResponse(result, 200);
};
