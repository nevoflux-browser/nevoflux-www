import type { APIRoute } from 'astro';
import { getRuntimeEnv } from '~/lib/runtime';
import { getSessionUser } from '~/lib/session';
import { getPackById, deletePack, deletePackById, isAdmin } from '~/lib/packs/db';
import { jsonResponse } from '~/lib/http';

export const prerender = false;

/** POST -> delete a pack. Allowed for the publisher, or any allowlisted admin. */
export const POST: APIRoute = async (ctx) => {
  const id = ctx.params.id;
  if (!id) return jsonResponse({ error: 'id required' }, 400);

  const env = getRuntimeEnv(ctx.locals);
  const user = await getSessionUser(ctx.locals, ctx.request);
  if (!user) return jsonResponse({ error: 'Authentication required' }, 401);

  const pack = await getPackById(env.DB, id);
  if (!pack) return jsonResponse({ error: 'Not found' }, 404);

  const isOwner = pack.publisher_user_id === user.id;
  const admin = await isAdmin(env.DB, user.email);
  if (!isOwner && !admin) {
    return jsonResponse({ error: 'You can only delete packs you published' }, 403);
  }

  // Owner self-delete stays scoped (defense in depth); admin deletes unconditionally.
  if (isOwner) await deletePack(env.DB, id, user.id);
  else await deletePackById(env.DB, id);

  return jsonResponse({ ok: true }, 200);
};
