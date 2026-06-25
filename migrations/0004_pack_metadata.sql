-- Publisher-editable metadata as JSON: displayName, slug, releaseTags,
-- categories, topics, readme, skillsText, seedText, dashboardText.
-- (summary -> existing `description`; version -> existing `version`.)
ALTER TABLE pack ADD COLUMN metadata TEXT;
