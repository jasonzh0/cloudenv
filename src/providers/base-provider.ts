import { Environment, SecretMetadata, SecretVersion } from "../types";

/**
 * Interface for cloud provider implementations
 * All providers must implement this interface to work with SecretsManager
 */
export interface IProvider {
  /**
   * Get the environment configuration for this provider
   */
  getEnvironment(): Environment;

  /**
   * List all secrets in the environment
   */
  listSecrets(): Promise<SecretMetadata[]>;

  /**
   * Get the value of a specific secret
   */
  getSecret(name: string): Promise<string>;

  /**
   * Set or update a secret value
   */
  setSecret(
    name: string,
    value: string,
    labels?: Record<string, string>,
  ): Promise<void>;

  /**
   * Delete a secret
   */
  deleteSecret(name: string, allVersions?: boolean): Promise<void>;

  /**
   * Check if a secret exists
   */
  secretExists(name: string): Promise<boolean>;

  /**
   * Get all versions of a secret
   */
  getSecretVersions(name: string): Promise<SecretVersion[]>;

  /**
   * Test connection to the cloud provider
   */
  testConnection(): Promise<boolean>;
}

