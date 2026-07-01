import type { APIRoute } from 'astro';
import { getRuntimeEnv } from '~/lib/runtime';
import { incrementDownloadBySrc } from '~/lib/packs/db';

export const prerender = false;

// Counts installs reported by the NevoFlux app's in-app pack-install page
// (chrome://…/pack-install.html) once an install actually succeeds. That page
// has the install `src` (not the pack id) and calls this cross-origin, so the
// endpoint is keyed by install_src and speaks CORS. Public, non-sensitive
// counter — application/json also keeps it clear of the form-CSRF origin check.

const CORS: Record<string, string> = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Max-Age': '86400',
};

function json(data: unknown, status: number): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json', ...CORS },
  });
}

export const OPTIONS: APIRoute = () => new Response(null, { status: 204, headers: CORS });

export const POST: APIRoute = async (ctx) => {
  let src = '';
  try {
    const body = (await ctx.request.json()) as { src?: unknown };
    if (typeof body?.src === 'string') src = body.src.trim();
  } catch {
    // malformed/empty body -> handled by the empty check below
  }
  if (!src) return json({ error: 'src required' }, 400);

  const matched = await incrementDownloadBySrc(getRuntimeEnv(ctx.locals).DB, src);
  return json({ ok: matched }, matched ? 200 : 404);
};
