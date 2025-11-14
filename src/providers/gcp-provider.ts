import { SecretManagerServiceClient } from "@google-cloud/secret-manager";
import chalk from "chalk";
import { Environment, SecretMetadata, SecretVersion } from "../types";
import { IProvider } from "./base-provider";

export class GcpProvider implements IProvider {
  private client: SecretManagerServiceClient;
  private environment: Environment;

  constructor(environment: Environment) {
    this.environment = environment;
    this.client = new SecretManagerServiceClient();
  }

  getEnvironment(): Environment {
    return this.environment;
  }

  async listSecrets(): Promise<SecretMetadata[]> {
    try {
      const [allSecrets] = await this.client.listSecrets({
        parent: `projects/${this.environment.projectId}`,
      });

      // Filter manually for now
      const filteredSecrets = allSecrets.filter((secret) => {
        const secretName = secret.name?.split("/").pop() || "";
        const hasPrefix =
          !this.environment.prefix ||
          secretName.startsWith(this.environment.prefix);
        return hasPrefix;
      });

      const secretMetadata: SecretMetadata[] = [];

      for (const secret of filteredSecrets) {
        const secretName = secret.name?.split("/").pop() || "";

        // Get latest version info
        const [versions] = await this.client.listSecretVersions({
          parent: secret.name!,
          filter: "state:ENABLED",
          pageSize: 1,
        });

        const latestVersion = versions[0];

        secretMetadata.push({
          name: secretName,
          createTime: secret.createTime?.seconds?.toString() || "",
          updateTime: secret.createTime?.seconds?.toString() || "", // Use createTime as fallback
          labels: secret.labels || {},
          versionCount: 0, // Would need additional call to get this
          latestVersion: latestVersion?.name?.split("/").pop() || "1",
        });
      }

      return secretMetadata;
    } catch (error) {
      throw new Error(`Failed to list secrets: ${error}`);
    }
  }

  async getSecret(name: string): Promise<string> {
    try {
      // If the name already has the prefix, use it as-is, otherwise add the prefix
      const secretName = name.startsWith(this.environment.prefix || "")
        ? `projects/${this.environment.projectId}/secrets/${name}`
        : this.buildSecretName(name);

      const [version] = await this.client.accessSecretVersion({
        name: `${secretName}/versions/latest`,
      });

      return version.payload?.data?.toString() || "";
    } catch (error) {
      throw new Error(`Failed to get secret ${name}: ${error}`);
    }
  }

  async setSecret(
    name: string,
    value: string,
    labels?: Record<string, string>,
  ): Promise<void> {
    try {
      // If the name already has the prefix, use it as-is, otherwise add the prefix
      const secretName = name.startsWith(this.environment.prefix || "")
        ? `projects/${this.environment.projectId}/secrets/${name}`
        : this.buildSecretName(name);

      // Check if secret exists
      try {
        await this.client.getSecret({ name: secretName });
      } catch (error: any) {
        if (error.code === 5) {
          // NOT_FOUND
          // Create the secret
          const secretId = name.startsWith(this.environment.prefix || "")
            ? name
            : this.environment.prefix
            ? `${this.environment.prefix}${name}`
            : name;
          await this.client.createSecret({
            parent: `projects/${this.environment.projectId}`,
            secretId: secretId,
            secret: {
              replication: {
                automatic: {},
              },
              labels: {
                ...this.environment.labels,
                ...labels,
              },
            },
          });
        } else {
          throw error;
        }
      }

      // Add secret version
      await this.client.addSecretVersion({
        parent: secretName,
        payload: {
          data: Buffer.from(value, "utf8"),
        },
      });
    } catch (error) {
      throw new Error(`Failed to set secret ${name}: ${error}`);
    }
  }

  async deleteSecret(
    name: string,
    allVersions: boolean = false,
  ): Promise<void> {
    try {
      // If the name already has the prefix, use it as-is, otherwise add the prefix
      const secretName = name.startsWith(this.environment.prefix || "")
        ? `projects/${this.environment.projectId}/secrets/${name}`
        : this.buildSecretName(name);

      if (allVersions) {
        // Delete all versions first
        const [versions] = await this.client.listSecretVersions({
          parent: secretName,
        });

        for (const version of versions) {
          if (version.name) {
            await this.client.destroySecretVersion({
              name: version.name,
            });
          }
        }
      }

      await this.client.deleteSecret({
        name: secretName,
      });
    } catch (error) {
      throw new Error(`Failed to delete secret ${name}: ${error}`);
    }
  }

  async secretExists(name: string): Promise<boolean> {
    try {
      // If the name already has the prefix, use it as-is, otherwise add the prefix
      const secretName = name.startsWith(this.environment.prefix || "")
        ? `projects/${this.environment.projectId}/secrets/${name}`
        : this.buildSecretName(name);

      await this.client.getSecret({ name: secretName });
      return true;
    } catch (error: any) {
      if (error.code === 5) {
        // NOT_FOUND
        return false;
      }
      throw error;
    }
  }

  async getSecretVersions(name: string): Promise<SecretVersion[]> {
    try {
      const secretName = this.buildSecretName(name);
      const [versions] = await this.client.listSecretVersions({
        parent: secretName,
      });

      return versions.map((version) => ({
        name: version.name || "",
        createTime: version.createTime?.seconds?.toString() || "",
        state: version.state?.toString() || "",
        version: version.name?.split("/").pop() || "",
      }));
    } catch (error) {
      throw new Error(`Failed to get secret versions for ${name}: ${error}`);
    }
  }

  async testConnection(): Promise<boolean> {
    try {
      await this.client.listSecrets({
        parent: `projects/${this.environment.projectId}`,
        pageSize: 1,
      });
      return true;
    } catch (error) {
      console.error(chalk.red(`Connection test failed: ${error}`));
      return false;
    }
  }

  private buildSecretName(name: string): string {
    const prefix = this.environment.prefix || "";
    return `projects/${this.environment.projectId}/secrets/${prefix}${name}`;
  }
}

