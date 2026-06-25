-- Admin email allowlist. Managed via wrangler, e.g.:
--   wrangler d1 execute nevoflux-www --remote --command \
--     "INSERT OR IGNORE INTO admin (email) VALUES ('you@example.com')"
--   wrangler d1 execute nevoflux-www --remote --command \
--     "DELETE FROM admin WHERE email = 'you@example.com'"
-- An admin may delete any pack; comparison is case-insensitive.
CREATE TABLE admin (
  email      TEXT PRIMARY KEY,
  created_at INTEGER NOT NULL DEFAULT (unixepoch())
);
