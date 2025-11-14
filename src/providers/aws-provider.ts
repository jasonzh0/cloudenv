import { Environment, SecretMetadata, SecretVersion } from "../types";
import { IProvider } from "./base-provider";

export class AwsProvider implements IProvider {
  private environment: Environment;

  constructor(environment: Environment) {
    this.environment = environment;
  }

  getEnvironment(): Environment {
    return this.environment;
  }

  async listSecrets(): Promise<SecretMetadata[]> {
    throw new Error(
      "AWS provider support is not yet implemented. Please use 'gcp' as the provider for now."
    );
  }

  async getSecret(name: string): Promise<string> {
    throw new Error(
      "AWS provider support is not yet implemented. Please use 'gcp' as the provider for now."
    );
  }

  async setSecret(
    name: string,
    value: string,
    labels?: Record<string, string>,
  ): Promise<void> {
    throw new Error(
      "AWS provider support is not yet implemented. Please use 'gcp' as the provider for now."
    );
  }

  async deleteSecret(
    name: string,
    allVersions: boolean = false,
  ): Promise<void> {
    throw new Error(
      "AWS provider support is not yet implemented. Please use 'gcp' as the provider for now."
    );
  }

  async secretExists(name: string): Promise<boolean> {
    throw new Error(
      "AWS provider support is not yet implemented. Please use 'gcp' as the provider for now."
    );
  }

  async getSecretVersions(name: string): Promise<SecretVersion[]> {
    throw new Error(
      "AWS provider support is not yet implemented. Please use 'gcp' as the provider for now."
    );
  }

  async testConnection(): Promise<boolean> {
    throw new Error(
      "AWS provider support is not yet implemented. Please use 'gcp' as the provider for now."
    );
  }
}

