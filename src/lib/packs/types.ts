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
}
