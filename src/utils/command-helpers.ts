import chalk from "chalk";
import { ConfigManager } from "../services/config-manager";
import { SecretsManager } from "../services/secrets-manager";
import { Environment } from "../types";

/**
 * Result of command setup operations
 */
export interface CommandSetupResult {
  configManager: ConfigManager;
  environment: Environment;
  secretsManager: SecretsManager;
}

/**
 * Setup common command dependencies (config, environment, secrets manager)
 * Returns null if setup fails (errors are already logged)
 */
export async function setupCommand(
  environmentName?: string,
): Promise<CommandSetupResult | null> {
  const configManager = new ConfigManager();
  await configManager.loadConfig();

  const environment = environmentName
    ? configManager.getEnvironment(environmentName)
    : configManager.getDefaultEnvironment();

  if (!environment) {
    const envDisplay = environmentName || "default";
    console.error(chalk.red(`Environment '${envDisplay}' not found`));
    return null;
  }

  let secretsManager: SecretsManager;
  try {
    secretsManager = new SecretsManager(environment);
  } catch (error: any) {
    console.error(chalk.red(`Failed to initialize secrets manager: ${error.message}`));
    return null;
  }

  // Only test connection for GCP (AWS will throw error in constructor)
  if (environment.provider === "gcp") {
    if (!(await secretsManager.testConnection())) {
      console.error(chalk.red("Failed to connect to GCP Secret Manager"));
      return null;
    }
  }

  return { configManager, environment, secretsManager };
}

/**
 * Get the full secret name with prefix applied
 */
export function getFullSecretName(
  name: string,
  environment: Environment,
): string {
  if (name.startsWith(environment.prefix || "")) {
    return name;
  }
  return environment.prefix ? `${environment.prefix}${name}` : name;
}

/**
 * Get the secrets secret name for an environment
 */
export function getSecretName(environment: Environment): string {
  return `${environment.prefix || ""}secrets`;
}

