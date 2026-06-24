import type { APIRoute } from 'astro';
import { getRuntimeEnv } from '~/lib/runtime';
import { incrementDownload } from '~/lib/packs/db';
import { jsonResponse } from '~/lib/http';

export const prerender = false;

/** POST -> increment the pack's download counter (beaconed on install click). */
export const POST: APIRoute = async (ctx) => {
  const id = ctx.params.id;
  if (!id) return jsonResponse({ error: 'id required' }, 400);
  await incrementDownload(getRuntimeEnv(ctx.locals).DB, id);
  return jsonResponse({ ok: true }, 200);
};
