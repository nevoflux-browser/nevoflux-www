import type { APIRoute } from 'astro';
import { getRuntimeEnv } from '~/lib/runtime';
import { getSessionUser } from '~/lib/session';
import { getPackById, updatePackMetadata, isAdmin } from '~/lib/packs/db';
import { coerceEdits } from '~/lib/packs/edits';
import { jsonResponse } from '~/lib/http';

export const prerender = false;

/** POST { edits } -> update a pack's editable fields. Publisher or admin only. */
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
    return jsonResponse({ error: 'You can only edit packs you published' }, 403);
  }

  let body: { edits?: unknown };
  try {
    body = await ctx.request.json();
  } catch {
    return jsonResponse({ error: 'Invalid JSON body' }, 400);
  }

  await updatePackMetadata(env.DB, id, coerceEdits(body.edits), pack);
  return jsonResponse({ ok: true }, 200);
};
