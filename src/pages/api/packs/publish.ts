import type { APIRoute } from 'astro';
import { getRuntimeEnv } from '~/lib/runtime';
import { parseSource } from '~/lib/packs/source';
import { fetchPackPreview } from '~/lib/packs/github';
import { jsonResponse } from '~/lib/http';

export const prerender = false;

/** POST { source } -> resolved PackPreview (no DB write). */
export const POST: APIRoute = async (ctx) => {
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
    const env = getRuntimeEnv(ctx.locals);
    const preview = await fetchPackPreview(env, parseSource(body.source));
    return jsonResponse(preview, 200);
  } catch (e) {
    return jsonResponse({ error: (e as Error).message }, 400);
  }
};
