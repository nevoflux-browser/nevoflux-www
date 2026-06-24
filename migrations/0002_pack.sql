-- Pack registry. github_subdir uses '' (not NULL) for repo-root packs so the
-- uniqueness constraint dedupes them (SQLite treats NULLs as distinct).
CREATE TABLE pack (
  id                TEXT PRIMARY KEY,
  name              TEXT NOT NULL,
  namespace         TEXT,
  description       TEXT,
  version           TEXT NOT NULL,
  license           TEXT,
  protocol          TEXT NOT NULL,
  min_nevoflux      TEXT NOT NULL,
  github_owner      TEXT NOT NULL,
  github_repo       TEXT NOT NULL,
  github_ref        TEXT,
  github_subdir     TEXT NOT NULL DEFAULT '',
  github_url        TEXT NOT NULL,
  install_src       TEXT NOT NULL,
  is_official       INTEGER NOT NULL DEFAULT 0,
  publisher_user_id TEXT NOT NULL,
  authors           TEXT,
  components        TEXT,
  download_count    INTEGER NOT NULL DEFAULT 0,
  stars_cached      INTEGER,
  stars_fetched_at  INTEGER,
  created_at        INTEGER NOT NULL,
  updated_at        INTEGER NOT NULL
);

CREATE UNIQUE INDEX idx_pack_source ON pack (github_owner, github_repo, github_subdir);
CREATE INDEX idx_pack_name ON pack (name);
CREATE INDEX idx_pack_downloads ON pack (download_count);
