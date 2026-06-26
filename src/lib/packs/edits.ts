import type { PackEdits } from '~/lib/packs/types';

const MAX = 100_000; // per-field length cap (defensive)
const str = (v: unknown): string | undefined =>
  typeof v === 'string' ? v.slice(0, MAX) : undefined;
const strArr = (v: unknown): string[] | undefined =>
  Array.isArray(v)
    ? v.filter((x): x is string => typeof x === 'string').map((x) => x.slice(0, 200))
    : undefined;

/** Defensively coerce an untrusted JSON body into a PackEdits object. */
export function coerceEdits(raw: unknown): PackEdits {
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
