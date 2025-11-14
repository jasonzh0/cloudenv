import { Environment, SecretMetadata, SecretVersion } from "../types";
import { IProvider } from "../providers/base-provider";
import { createProvider } from "../providers/index";

export class SecretsManager {
  private provider: IProvider;

  constructor(environment: Environment) {
    this.provider = createProvider(environment);
  }

  async listSecrets(): Promise<SecretMetadata[]> {
    return this.provider.listSecrets();
  }

  async getSecret(name: string): Promise<string> {
    return this.provider.getSecret(name);
  }

  async setSecret(
    name: string,
    value: string,
    labels?: Record<string, string>,
  ): Promise<void> {
    return this.provider.setSecret(name, value, labels);
  }

  async deleteSecret(
    name: string,
    allVersions: boolean = false,
  ): Promise<void> {
    return this.provider.deleteSecret(name, allVersions);
  }

  async secretExists(name: string): Promise<boolean> {
    return this.provider.secretExists(name);
  }

  async getSecretVersions(name: string): Promise<SecretVersion[]> {
    return this.provider.getSecretVersions(name);
  }

  getEnvironment(): Environment {
    return this.provider.getEnvironment();
  }

  async testConnection(): Promise<boolean> {
    return this.provider.testConnection();
  }
}
