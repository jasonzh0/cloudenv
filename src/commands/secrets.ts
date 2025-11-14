import chalk from "chalk";
import inquirer from "inquirer";
import * as fs from "fs";
import * as path from "path";
import { SecretsManager } from "../services/secrets-manager";
import { maskValue } from "../utils";
import { getSecretName, setupCommand } from "../utils/command-helpers";

export interface SecretsOptions {
  environment?: string;
}

export class SecretsCommand {
  /**
   * Get the secrets as a JSON object
   */
  private async getSecrets(
    secretsManager: SecretsManager,
    secretName: string,
  ): Promise<Record<string, string>> {
    try {
      const jsonContent = await secretsManager.getSecret(secretName);
      return JSON.parse(jsonContent);
    } catch (error: any) {
      if (error.message?.includes("NOT_FOUND") || error.code === 5) {
        return {};
      }
      throw error;
    }
  }

  /**
   * Save the secrets back to Secret Manager
   */
  private async saveSecrets(
    secretsManager: SecretsManager,
    secretName: string,
    secrets: Record<string, string>,
    labels: Record<string, string>,
  ): Promise<void> {
    const jsonContent = JSON.stringify(secrets, null, 2);
    await secretsManager.setSecret(secretName, jsonContent, labels);
  }

  /**
   * List all secrets from the secret file
   */
  async list(options: SecretsOptions): Promise<void> {
    const setup = await setupCommand(options.environment);
    if (!setup) {
      return;
    }

    const { environment, secretsManager } = setup;
    const secretName = getSecretName(environment);
    console.log(chalk.blue(`\nSecrets in ${environment.name} environment:`));
    console.log(chalk.gray(`Secret: ${secretName}\n`));

    try {
      const secrets = await this.getSecrets(secretsManager, secretName);

      if (Object.keys(secrets).length === 0) {
        console.log(chalk.yellow("No secrets found"));
        return;
      }

      // Display secrets in a table format
      console.log(chalk.cyan("Key".padEnd(40) + "Value"));
      console.log("-".repeat(80));

      for (const [key, value] of Object.entries(secrets).sort()) {
        const maskedValue = maskValue(value);
        console.log(`${chalk.white(key.padEnd(40))}${chalk.gray(maskedValue)}`);
      }

      console.log(
        chalk.green(`\n✅ Total: ${Object.keys(secrets).length} secret(s)`),
      );
    } catch (error) {
      console.error(chalk.red(`Error reading secrets: ${error}`));
    }
  }

  /**
   * Get a specific secret value
   */
  async get(key: string, options: SecretsOptions): Promise<void> {
    const setup = await setupCommand(options.environment);
    if (!setup) {
      return;
    }

    const { environment, secretsManager } = setup;
    const secretName = getSecretName(environment);

    try {
      const secrets = await this.getSecrets(secretsManager, secretName);

      if (!(key in secrets)) {
        console.error(chalk.red(`Secret "${key}" not found`));
        return;
      }

      console.log(secrets[key]);
    } catch (error) {
      console.error(chalk.red(`Error getting secret: ${error}`));
    }
  }

  /**
   * Set or update a specific secret value
   */
  async set(
    key: string,
    value: string | undefined,
    options: SecretsOptions,
  ): Promise<void> {
    const setup = await setupCommand(options.environment);
    if (!setup) {
      return;
    }

    const { environment, secretsManager } = setup;
    const secretName = getSecretName(environment);

    try {
      const secrets = await this.getSecrets(secretsManager, secretName);

      // Get value interactively if not provided
      let finalValue = value;
      if (!finalValue) {
        const { secretValue } = await inquirer.prompt([
          {
            type: "password",
            name: "secretValue",
            message: `Enter value for ${key}:`,
            mask: "*",
            validate: (input: string) =>
              input.length > 0 || "Value is required",
          },
        ]);
        finalValue = secretValue;
      }

      const isUpdate = key in secrets;
      secrets[key] = finalValue!;

      // Save back to Secret Manager
      await this.saveSecrets(secretsManager, secretName, secrets, {
        ...environment.labels,
      });

      if (isUpdate) {
        console.log(chalk.green(`✅ Updated secret: ${key}`));
      } else {
        console.log(chalk.green(`✅ Added secret: ${key}`));
      }
    } catch (error) {
      console.error(chalk.red(`Error setting secret: ${error}`));
    }
  }

  /**
   * Delete a specific secret
   */
  async delete(
    key: string,
    options: SecretsOptions & { force?: boolean },
  ): Promise<void> {
    const setup = await setupCommand(options.environment);
    if (!setup) {
      return;
    }

    const { environment, secretsManager } = setup;
    const secretName = getSecretName(environment);

    try {
      const secrets = await this.getSecrets(secretsManager, secretName);

      if (!(key in secrets)) {
        console.error(chalk.red(`Secret "${key}" not found`));
        return;
      }

      // Confirm deletion
      if (!options.force) {
        const { confirm } = await inquirer.prompt([
          {
            type: "confirm",
            name: "confirm",
            message: `Are you sure you want to delete "${key}"?`,
            default: false,
          },
        ]);

        if (!confirm) {
          console.log(chalk.yellow("Operation cancelled"));
          return;
        }
      }

      delete secrets[key];

      // Save back to Secret Manager
      await this.saveSecrets(secretsManager, secretName, secrets, {
        ...environment.labels,
      });

      console.log(chalk.green(`✅ Deleted secret: ${key}`));
    } catch (error) {
      console.error(chalk.red(`Error deleting secret: ${error}`));
    }
  }

  /**
   * Import secrets from a JSON file
   */
  async import(
    filePath: string,
    options: SecretsOptions & { force?: boolean },
  ): Promise<void> {
    const setup = await setupCommand(options.environment);
    if (!setup) {
      return;
    }

    const { environment, secretsManager } = setup;
    const secretName = getSecretName(environment);

    // Resolve file path
    const resolvedPath = path.resolve(filePath);
    if (!fs.existsSync(resolvedPath)) {
      console.error(chalk.red(`Error: File not found: ${resolvedPath}`));
      return;
    }

    try {
      // Read and parse JSON file
      const fileContent = fs.readFileSync(resolvedPath, "utf8");
      const importedSecrets = JSON.parse(fileContent);

      if (typeof importedSecrets !== "object" || Array.isArray(importedSecrets)) {
        console.error(chalk.red("Error: JSON file must contain an object with key-value pairs"));
        return;
      }

      const secretKeys = Object.keys(importedSecrets);
      if (secretKeys.length === 0) {
        console.log(chalk.yellow("No secrets found in file"));
        return;
      }

      console.log(
        chalk.blue(`\nImporting ${secretKeys.length} secrets to ${environment.name} environment...\n`),
      );

      // Get existing secrets
      const existingSecrets = await this.getSecrets(secretsManager, secretName);
      const existingKeys = Object.keys(existingSecrets);
      const newKeys = secretKeys.filter((key) => !(key in existingSecrets));
      const updatedKeys = secretKeys.filter((key) => key in existingSecrets);

      // Show summary if there are existing secrets
      if (existingKeys.length > 0 && !options.force) {
        console.log(chalk.yellow(`Found ${existingKeys.length} existing secrets`));
        if (updatedKeys.length > 0) {
          console.log(
            chalk.yellow(
              `⚠️  ${updatedKeys.length} secrets will be updated: ${updatedKeys.join(", ")}`,
            ),
          );
        }
        if (newKeys.length > 0) {
          console.log(
            chalk.cyan(
              `${newKeys.length} new secrets will be added: ${newKeys.join(", ")}`,
            ),
          );
        }

        const { confirm } = await inquirer.prompt([
          {
            type: "confirm",
            name: "confirm",
            message: `Continue with import?`,
            default: true,
          },
        ]);

        if (!confirm) {
          console.log(chalk.yellow("Operation cancelled"));
          return;
        }
      }

      // Merge imported secrets with existing secrets
      const mergedSecrets = { ...existingSecrets, ...importedSecrets };

      // Save all secrets back to Secret Manager
      await this.saveSecrets(secretsManager, secretName, mergedSecrets, {
        ...environment.labels,
      });

      // Report results
      for (const key of secretKeys) {
        if (key in existingSecrets) {
          console.log(chalk.green(`✅ Updated secret: ${key}`));
        } else {
          console.log(chalk.green(`✅ Added secret: ${key}`));
        }
      }

      console.log(
        chalk.green(
          `\n✅ Successfully imported ${secretKeys.length} secret(s) to ${environment.name} environment`,
        ),
      );
    } catch (error: any) {
      if (error instanceof SyntaxError) {
        console.error(chalk.red(`Error: Invalid JSON file: ${error.message}`));
      } else {
        console.error(chalk.red(`Error importing secrets: ${error.message}`));
      }
    }
  }

  /**
   * Download secrets to a JSON file
   */
  async download(
    outputPath: string | undefined,
    options: SecretsOptions,
  ): Promise<void> {
    const setup = await setupCommand(options.environment);
    if (!setup) {
      return;
    }

    const { environment, secretsManager } = setup;
    const secretName = getSecretName(environment);

    try {
      const secrets = await this.getSecrets(secretsManager, secretName);

      if (Object.keys(secrets).length === 0) {
        console.log(chalk.yellow("No secrets found to download"));
        return;
      }

      // Determine output path
      const resolvedPath = outputPath
        ? path.resolve(outputPath)
        : path.resolve(`${environment.name}-secrets.json`);

      // Write secrets to file
      const jsonContent = JSON.stringify(secrets, null, 2);
      fs.writeFileSync(resolvedPath, jsonContent, "utf8");

      console.log(
        chalk.green(
          `✅ Successfully downloaded ${Object.keys(secrets).length} secret(s) from ${environment.name} environment to ${resolvedPath}`,
        ),
      );
    } catch (error: any) {
      console.error(chalk.red(`Error downloading secrets: ${error.message}`));
    }
  }
}
