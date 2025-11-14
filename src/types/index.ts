export type CloudProvider = "gcp" | "aws";

export interface Environment {
  name: string;
  provider: CloudProvider;
  projectId: string;
  region: string;
  prefix?: string;
  labels?: Record<string, string>;
}

export interface SecretConfig {
  name: string;
  value?: string;
  labels?: Record<string, string>;
  description?: string;
}

export interface CloudsecSecretsConfig {
  environments: Environment[];
  defaultEnvironment?: string;
  defaultProject?: string;
  defaultRegion?: string;
}

export interface SecretMetadata {
  name: string;
  createTime: string;
  updateTime: string;
  labels: Record<string, string>;
  versionCount: number;
  latestVersion: string;
}

export interface SecretVersion {
  name: string;
  createTime: string;
  state: string;
  version: string;
}

export interface PullOptions {
  format: "env" | "json" | "yaml";
  output?: string;
  prefix?: string;
  includeMetadata?: boolean;
  filter?: string;
}

export interface PushOptions {
  file?: string;
  format: "env" | "json" | "yaml";
  dryRun?: boolean;
  force?: boolean;
}

export interface SyncOptions {
  from: string;
  to: string;
  include?: string;
  exclude?: string;
  dryRun?: boolean;
  force?: boolean;
}

export interface SetOptions {
  value?: string;
  fromFile?: string;
  stdin?: boolean;
  labels?: string;
  force?: boolean;
}

export interface DeleteOptions {
  force?: boolean;
  allVersions?: boolean;
}

export interface EnvOptions {
  filter?: string;
  prefix?: string;
  shell?: string;
  export?: boolean;
  verbose?: boolean;
}
