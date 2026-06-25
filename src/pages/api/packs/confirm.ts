import type { APIRoute } from 'astro';
import { getRuntimeEnv } from '~/lib/runtime';
import { getSessionUser } from '~/lib/session';
import { parseSource } from '~/lib/packs/source';
import { fetchPackPreview } from '~/lib/packs/github';
import { packRowFromPreview, upsertPack } from '~/lib/packs/db';
import { jsonResponse } from '~/lib/http';
import type { PackEdits } from '~/lib/packs/types';

export const prerender = false;

const MAX = 100_000; // per-field length cap (defensive)
const str = (v: unknown): string | undefined =>
  typeof v === 'string' ? v.slice(0, MAX) : undefined;
const strArr = (v: unknown): string[] | undefined =>
  Array.isArray(v)
    ? v.filter((x): x is string => typeof x === 'string').map((x) => x.slice(0, 200))
    : undefined;

function coerceEdits(raw: unknown): PackEdits {
  const o = raw && typeof raw === 'object' ? (raw as Record<string, unknown>) : {};
  return {
    displayName: str(o.displayName),
    slug: str(o.slug),
    summary: str(o.summary),
    version: str(o.version),
    releaseTags: strArr(o.releaseTags),
    categories: strArr(o.categories),
    topics: strArr(o.topics),
    readme: str(o.readme),
    skillsText: str(o.skillsText),
    seedText: str(o.seedText),
    dashboardText: str(o.dashboardText),
  };
}

/** POST { source, edits } (auth required) -> persists the pack and returns { id }. */
export const POST: APIRoute = async (ctx) => {
  const env = getRuntimeEnv(ctx.locals);
  const user = await getSessionUser(ctx.locals, ctx.request);
  if (!user) return jsonResponse({ error: 'Authentication required' }, 401);

  let body: { source?: unknown; edits?: unknown };
  try {
    body = await ctx.request.json();
  } catch {
    return jsonResponse({ error: 'Invalid JSON body' }, 400);
  }
  if (typeof body.source !== 'string' || !body.source.trim()) {
    return jsonResponse({ error: 'source is required' }, 400);
  }
  try {
    // Re-fetch GitHub for the immutable bits (source/stars/official/install); trust edits for the rest.
    const preview = await fetchPackPreview(env, parseSource(body.source));
    const id = crypto.randomUUID();
    const row = packRowFromPreview(preview, user.id, id, Date.now(), coerceEdits(body.edits));
    await upsertPack(env.DB, row);
    return jsonResponse({ id }, 200);
  } catch (e) {
    return jsonResponse({ error: (e as Error).message }, 400);
  }
};
