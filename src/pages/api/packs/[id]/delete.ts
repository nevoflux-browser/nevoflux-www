import type { APIRoute } from 'astro';
import { getRuntimeEnv } from '~/lib/runtime';
import { getSessionUser } from '~/lib/session';
import { getPackById, deletePack } from '~/lib/packs/db';
import { jsonResponse } from '~/lib/http';

export const prerender = false;

/** POST -> delete a pack. Only the publisher may delete their own pack. */
export const POST: APIRoute = async (ctx) => {
  const id = ctx.params.id;
  if (!id) return jsonResponse({ error: 'id required' }, 400);

  const env = getRuntimeEnv(ctx.locals);
  const user = await getSessionUser(ctx.locals, ctx.request);
  if (!user) return jsonResponse({ error: 'Authentication required' }, 401);

  const pack = await getPackById(env.DB, id);
  if (!pack) return jsonResponse({ error: 'Not found' }, 404);
  if (pack.publisher_user_id !== user.id) {
    return jsonResponse({ error: 'You can only delete packs you published' }, 403);
  }

  await deletePack(env.DB, id, user.id);
  return jsonResponse({ ok: true }, 200);
};
