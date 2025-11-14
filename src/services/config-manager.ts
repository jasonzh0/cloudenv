import * as fs from "fs-extra";
import * as path from "path";
import * as yaml from "yaml";
import chalk from "chalk";
import { CloudsecSecretsConfig, Environment } from "../types";

export class ConfigManager {
  private configPath: string;
  private config: CloudsecSecretsConfig | null = null;

  constructor(configPath: string = ".cloudsec.yaml") {
    this.configPath = path.resolve(configPath);
  }

  async loadConfig(): Promise<CloudsecSecretsConfig> {
    if (this.config) {
      return this.config;
    }

    if (!(await fs.pathExists(this.configPath))) {
      throw new Error(`Configuration file not found: ${this.configPath}`);
    }

    try {
      const configContent = await fs.readFile(this.configPath, "utf8");
      this.config = yaml.parse(configContent) as CloudsecSecretsConfig;

      if (
        !this.config.environments ||
        !Array.isArray(this.config.environments)
      ) {
        throw new Error("Invalid configuration: environments must be an array");
      }

      return this.config;
    } catch (error) {
      throw new Error(`Failed to load configuration: ${error}`);
    }
  }

  async saveConfig(config: CloudsecSecretsConfig): Promise<void> {
    try {
      const configContent = yaml.stringify(config, { indent: 2 });
      await fs.writeFile(this.configPath, configContent);
      this.config = config;
    } catch (error) {
      throw new Error(`Failed to save configuration: ${error}`);
    }
  }

  async createDefaultConfig(): Promise<void> {
    const defaultConfig: CloudsecSecretsConfig = {
      environments: [
        {
          name: "dev",
          provider: "gcp",
          projectId: "your-dev-project-id",
          region: "us-central1",
          prefix: "dev-",
          labels: {
            environment: "development",
            managed_by: "cloudsec",
          },
        },
        {
          name: "staging",
          provider: "gcp",
          projectId: "your-staging-project-id",
          region: "us-central1",
          prefix: "staging-",
          labels: {
            environment: "staging",
            managed_by: "cloudsec",
          },
        },
        {
          name: "prod",
          provider: "gcp",
          projectId: "your-prod-project-id",
          region: "us-central1",
          prefix: "prod-",
          labels: {
            environment: "production",
            managed_by: "cloudsec",
          },
        },
      ],
      defaultEnvironment: "dev",
      defaultProject: "your-default-project-id",
      defaultRegion: "us-central1",
    };

    await this.saveConfig(defaultConfig);
  }

  getEnvironment(name: string): Environment | undefined {
    if (!this.config) {
      throw new Error("Configuration not loaded");
    }
    return this.config.environments.find((env) => env.name === name);
  }

  getDefaultEnvironment(): Environment | undefined {
    if (!this.config) {
      throw new Error("Configuration not loaded");
    }

    if (this.config.defaultEnvironment) {
      return this.getEnvironment(this.config.defaultEnvironment);
    }

    return this.config.environments[0];
  }

  getAllEnvironments(): Environment[] {
    if (!this.config) {
      throw new Error("Configuration not loaded");
    }
    return this.config.environments;
  }

  async configExists(): Promise<boolean> {
    return await fs.pathExists(this.configPath);
  }

  getConfigPath(): string {
    return this.configPath;
  }

  async validateConfig(): Promise<void> {
    const config = await this.loadConfig();

    for (const env of config.environments) {
      if (!env.name || !env.provider || !env.projectId || !env.region) {
        throw new Error(
          `Invalid environment configuration: ${JSON.stringify(env)}`,
        );
      }
      if (env.provider !== "gcp" && env.provider !== "aws") {
        throw new Error(
          `Invalid provider '${env.provider}' for environment '${env.name}'. Supported providers are: 'gcp', 'aws'`,
        );
      }
    }
  }

  async printConfig(): Promise<void> {
    const config = await this.loadConfig();
    console.log(chalk.blue("Current configuration:"));
    console.log(yaml.stringify(config, { indent: 2 }));
  }
}
