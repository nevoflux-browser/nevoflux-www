export interface PackSource {
  owner: string;
  repo: string;
  ref?: string; // branch/tag; undefined = default branch
  subdir?: string; // path within repo; undefined = root
}

export interface PackManifest {
  name: string;
  version: string;
  protocol: string;
  minNevoflux: string;
  description?: string;
  license?: string;
  authors?: string[];
  namespace?: string;
}

export interface PackComponents {
  skills: { name: string; description?: string }[];
  seed: string[]; // slugs
  dashboard: boolean;
  canvasTools: string[];
}

export interface PackPreview {
  source: PackSource;
  manifest: PackManifest;
  components: PackComponents;
  githubUrl: string;
  installSrc: string;
  isOfficial: boolean;
  stars: number;
  repoLicense?: string;
  readme?: string; // default README.md fetched from the repo (markdown)
}

/** Editable, publisher-controlled metadata stored as JSON in pack.metadata. */
export interface PackMetadata {
  displayName?: string;
  slug?: string;
  releaseTags?: string[];
  categories?: string[];
  topics?: string[];
  readme?: string; // markdown
  skillsText?: string; // markdown
  seedText?: string; // markdown
  dashboardText?: string; // markdown
}

/** The payload the publish form sends to /api/packs/confirm. */
export interface PackEdits extends PackMetadata {
  summary?: string; // -> pack.description
  version?: string; // -> pack.version
}
