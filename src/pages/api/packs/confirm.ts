import type { APIRoute } from 'astro';
import { getRuntimeEnv } from '~/lib/runtime';
import { getSessionUser } from '~/lib/session';
import { parseSource } from '~/lib/packs/source';
import { fetchPackPreview } from '~/lib/packs/github';
import { packRowFromPreview, upsertPack } from '~/lib/packs/db';
import { jsonResponse } from '~/lib/http';

export const prerender = false;

/** POST { source } (auth required) -> persists the pack and returns { id }. */
export const POST: APIRoute = async (ctx) => {
  const env = getRuntimeEnv(ctx.locals);
  const user = await getSessionUser(ctx.locals, ctx.request);
  if (!user) return jsonResponse({ error: 'Authentication required' }, 401);

  let body: { source?: unknown };
  try {
    body = await ctx.request.json();
  } catch {
    return jsonResponse({ error: 'Invalid JSON body' }, 400);
  }
  if (typeof body.source !== 'string' || !body.source.trim()) {
    return jsonResponse({ error: 'source is required' }, 400);
  }
  try {
    const preview = await fetchPackPreview(env, parseSource(body.source));
    const id = crypto.randomUUID();
    const row = packRowFromPreview(preview, user.id, id, Date.now());
    await upsertPack(env.DB, row);
    return jsonResponse({ id }, 200);
  } catch (e) {
    return jsonResponse({ error: (e as Error).message }, 400);
  }
};
