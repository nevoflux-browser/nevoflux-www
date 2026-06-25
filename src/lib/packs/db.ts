import type { PackPreview, PackComponents } from '~/lib/packs/types';

export interface PackRow {
  id: string;
  name: string;
  namespace: string | null;
  description: string | null;
  version: string;
  license: string | null;
  protocol: string;
  min_nevoflux: string;
  github_owner: string;
  github_repo: string;
  github_ref: string | null;
  github_subdir: string; // '' = repo root
  github_url: string;
  install_src: string;
  is_official: number; // 0 | 1
  publisher_user_id: string;
  authors: string | null; // JSON-encoded string[]
  components: string | null; // JSON-encoded PackComponents
  download_count: number;
  stars_cached: number | null;
  stars_fetched_at: number | null;
  created_at: number;
  updated_at: number;
}

/** Pure mapping from a resolved preview to a DB row. */
export function packRowFromPreview(
  preview: PackPreview,
  publisherUserId: string,
  id: string,
  now: number
): PackRow {
  return {
    id,
    name: preview.manifest.name,
    namespace: preview.manifest.namespace ?? null,
    description: preview.manifest.description ?? null,
    version: preview.manifest.version,
    license: preview.manifest.license ?? preview.repoLicense ?? null,
    protocol: preview.manifest.protocol,
    min_nevoflux: preview.manifest.minNevoflux,
    github_owner: preview.source.owner,
    github_repo: preview.source.repo,
    github_ref: preview.source.ref ?? null,
    github_subdir: preview.source.subdir ?? '',
    github_url: preview.githubUrl,
    install_src: preview.installSrc,
    is_official: preview.isOfficial ? 1 : 0,
    publisher_user_id: publisherUserId,
    authors: preview.manifest.authors ? JSON.stringify(preview.manifest.authors) : null,
    components: JSON.stringify(preview.components),
    download_count: 0,
    stars_cached: preview.stars,
    stars_fetched_at: now,
    created_at: now,
    updated_at: now,
  };
}

/** Insert or update by (owner, repo, subdir). Preserves download_count, created_at, publisher. */
export async function upsertPack(db: D1Database, p: PackRow): Promise<void> {
  await db
    .prepare(
      `INSERT INTO pack (id,name,namespace,description,version,license,protocol,min_nevoflux,
        github_owner,github_repo,github_ref,github_subdir,github_url,install_src,is_official,
        publisher_user_id,authors,components,download_count,stars_cached,stars_fetched_at,created_at,updated_at)
      VALUES (?1,?2,?3,?4,?5,?6,?7,?8,?9,?10,?11,?12,?13,?14,?15,?16,?17,?18,?19,?20,?21,?22,?23)
      ON CONFLICT (github_owner,github_repo,github_subdir) DO UPDATE SET
        name=excluded.name, namespace=excluded.namespace, description=excluded.description,
        version=excluded.version, license=excluded.license, protocol=excluded.protocol,
        min_nevoflux=excluded.min_nevoflux, github_ref=excluded.github_ref,
        github_url=excluded.github_url, install_src=excluded.install_src,
        is_official=excluded.is_official, authors=excluded.authors, components=excluded.components,
        stars_cached=excluded.stars_cached, stars_fetched_at=excluded.stars_fetched_at,
        updated_at=excluded.updated_at`
    )
    .bind(
      p.id,
      p.name,
      p.namespace,
      p.description,
      p.version,
      p.license,
      p.protocol,
      p.min_nevoflux,
      p.github_owner,
      p.github_repo,
      p.github_ref,
      p.github_subdir,
      p.github_url,
      p.install_src,
      p.is_official,
      p.publisher_user_id,
      p.authors,
      p.components,
      p.download_count,
      p.stars_cached,
      p.stars_fetched_at,
      p.created_at,
      p.updated_at
    )
    .run();
}

export async function getPackById(db: D1Database, id: string): Promise<PackRow | null> {
  return await db.prepare('SELECT * FROM pack WHERE id = ?1').bind(id).first<PackRow>();
}

export async function searchPacks(db: D1Database, q: string, limit = 50): Promise<PackRow[]> {
  const trimmed = q.trim();
  if (trimmed) {
    const like = `%${trimmed}%`;
    const res = await db
      .prepare(
        `SELECT * FROM pack WHERE name LIKE ?1 OR description LIKE ?1
         ORDER BY is_official DESC, download_count DESC LIMIT ?2`
      )
      .bind(like, limit)
      .all<PackRow>();
    return res.results ?? [];
  }
  const res = await db
    .prepare('SELECT * FROM pack ORDER BY is_official DESC, download_count DESC LIMIT ?1')
    .bind(limit)
    .all<PackRow>();
  return res.results ?? [];
}

export async function incrementDownload(db: D1Database, id: string): Promise<void> {
  await db
    .prepare('UPDATE pack SET download_count = download_count + 1 WHERE id = ?1')
    .bind(id)
    .run();
}

/** Delete a pack, but only if it belongs to the given publisher. Returns true if removed. */
export async function deletePack(
  db: D1Database,
  id: string,
  publisherUserId: string
): Promise<boolean> {
  const res = await db
    .prepare('DELETE FROM pack WHERE id = ?1 AND publisher_user_id = ?2')
    .bind(id, publisherUserId)
    .run();
  return (res.meta?.changes ?? 0) > 0;
}

/** A pack row with its JSON columns decoded, ready for rendering. */
export interface PackView extends Omit<PackRow, 'authors' | 'components'> {
  authors: string[];
  components: PackComponents;
}

export function parsePackRow(row: PackRow): PackView {
  const authors = row.authors ? (JSON.parse(row.authors) as string[]) : [];
  const components = row.components
    ? (JSON.parse(row.components) as PackComponents)
    : { skills: [], seed: [], dashboard: false, canvasTools: [] };
  return { ...row, authors, components };
}

export async function getPublisher(
  db: D1Database,
  userId: string
): Promise<{ name: string | null; email: string | null } | null> {
  return await db
    .prepare('SELECT name, email FROM user WHERE id = ?1')
    .bind(userId)
    .first<{ name: string | null; email: string | null }>();
}
