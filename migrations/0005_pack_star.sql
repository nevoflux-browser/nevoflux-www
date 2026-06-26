-- User stars: one per (pack, user). star_count on pack is the denormalized total
-- (GitHub stars are no longer used). Toggled by logged-in users.
CREATE TABLE pack_star (
  pack_id    TEXT NOT NULL,
  user_id    TEXT NOT NULL,
  created_at INTEGER NOT NULL DEFAULT (unixepoch()),
  PRIMARY KEY (pack_id, user_id)
);

ALTER TABLE pack ADD COLUMN star_count INTEGER NOT NULL DEFAULT 0;
