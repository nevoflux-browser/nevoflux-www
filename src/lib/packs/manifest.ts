import type { PackManifest, PackComponents } from '~/lib/packs/types';

type Obj = Record<string, unknown>;
const asObj = (v: unknown): Obj => (v && typeof v === 'object' ? (v as Obj) : {});
const str = (v: unknown): string | undefined => (typeof v === 'string' ? v : undefined);

export function validateManifest(
  toml: Obj
): { ok: true; manifest: PackManifest } | { ok: false; errors: string[] } {
  const pack = asObj(toml.pack);
  const errors: string[] = [];
  const name = str(pack.name);
  const version = str(pack.version);
  const protocol = str(pack.protocol);
  const minNevoflux = str(pack.min_nevoflux);
  if (!name) errors.push('pack.name is required');
  if (!version) errors.push('pack.version is required');
  if (!protocol) errors.push('pack.protocol is required');
  if (!minNevoflux) errors.push('pack.min_nevoflux is required');
  if (!name || !version || !protocol || !minNevoflux) return { ok: false, errors };

  const authors = Array.isArray(pack.authors)
    ? pack.authors.filter((a): a is string => typeof a === 'string')
    : undefined;
  return {
    ok: true,
    manifest: {
      name,
      version,
      protocol,
      minNevoflux,
      description: str(pack.description),
      license: str(pack.license),
      namespace: str(pack.namespace),
      authors,
    },
  };
}

export function extractComponents(toml: Obj): PackComponents {
  const comp = asObj(toml.components);
  const seedRaw = Array.isArray(comp.seed) ? comp.seed : [];
  const seed = seedRaw.map((s) => str(asObj(s).slug)).filter((s): s is string => Boolean(s));
  const canvas = asObj(comp.canvas_tools);
  const canvasTools = Array.isArray(canvas.files)
    ? canvas.files.filter((f): f is string => typeof f === 'string')
    : [];
  return {
    skills: [], // filled by the GitHub client (needs to read SKILL.md files)
    seed,
    dashboard: Boolean(comp.dashboard),
    canvasTools,
  };
}
