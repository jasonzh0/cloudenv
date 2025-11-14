import chalk from "chalk";
import { EnvOptions } from "../types";
import { setupCommand, getSecretName } from "../utils/command-helpers";

export class EnvCommand {
  async execute(options: EnvOptions & { environment?: string }): Promise<void> {
    // Suppress Google Cloud warnings by temporarily redirecting stdout
    const originalStdout = process.stdout.write;
    const originalStderr = process.stderr.write;
    
    process.stdout.write = (chunk: any) => {
      if (typeof chunk === 'string' && chunk.includes('AutopaginateTrueWarning')) {
        return true;
      }
      return originalStdout.call(process.stdout, chunk);
    };
    
    process.stderr.write = (chunk: any) => {
      if (typeof chunk === 'string' && chunk.includes('AutopaginateTrueWarning')) {
        return true;
      }
      return originalStderr.call(process.stderr, chunk);
    };
    
    const setup = await setupCommand(options.environment);
    if (!setup) {
      return;
    }

    const { environment, secretsManager } = setup;

    if (options.verbose) {
      console.error(
        chalk.blue(
          `Setting local environment variables from: ${environment.name}`,
        ),
      );
    }

    try {
      // Read from the secret file
      const secretName = getSecretName(environment);
      
      let secretsData: Record<string, string>;
      try {
        const jsonContent = await secretsManager.getSecret(secretName);
        secretsData = JSON.parse(jsonContent);
      } catch (error: any) {
        if (error.message?.includes("NOT_FOUND") || error.code === 5) {
          console.error(chalk.red(`Secret "${secretName}" not found`));
          console.error(chalk.yellow("Run: cloudsec set <key> <value> to add secrets"));
          return;
        }
        throw error;
      }

      // Filter secrets if requested
      const filteredEntries = options.filter
        ? Object.entries(secretsData).filter(([key]) => key.includes(options.filter!))
        : Object.entries(secretsData);

      if (filteredEntries.length === 0) {
        // No secrets found, exit silently
        return;
      }

      if (options.verbose) {
        console.error(chalk.green(`Found ${filteredEntries.length} secret(s)`));
      }

      // Get secret values and format them for environment variables
      const envVars: string[] = [];

      for (const [key, value] of filteredEntries) {
        // Remove prefix from key if specified
        let envKey = key;
        if (options.prefix && key.startsWith(options.prefix)) {
          envKey = key.substring(options.prefix.length);
        }
        
        if (options.export) {
          envVars.push(`export ${envKey}="${this.escapeValue(value)}"`);
        } else {
          envVars.push(`${envKey}="${this.escapeValue(value)}"`);
        }
      }

      if (envVars.length === 0) {
        // No environment variables to set, exit silently
        return;
      }

      // Output the environment variables
      const output = envVars.join("\n") + "\n";

      if (options.shell === "fish") {
        // Fish shell uses different syntax
        const fishVars = envVars.map((line) => {
          if (line.startsWith("export ")) {
            const [key, value] = line.replace("export ", "").split("=");
            return `set -gx ${key} ${value}`;
          }
          return line;
        });
        console.log(fishVars.join("\n") + "\n");
      } else {
        console.log(output);
      }

      if (options.verbose) {
        console.error(
          chalk.green(`✅ Generated ${envVars.length} environment variable(s)`),
        );
        console.error(chalk.yellow("\nTo apply these variables:"));
        console.error(chalk.gray('  eval "$(cloudsec env)"'));
        console.error(chalk.gray("  # or"));
        console.error(chalk.gray("  source <(cloudsec env)"));
      }
    } catch (error) {
      console.error(chalk.red(`Error setting environment variables: ${error}`));
    } finally {
      // Restore original stdout and stderr
      process.stdout.write = originalStdout;
      process.stderr.write = originalStderr;
    }
  }

  private escapeValue(value: string): string {
    // Escape quotes, newlines, and other special characters
    return value
      .replace(/\\/g, "\\\\")
      .replace(/"/g, '\\"')
      .replace(/\n/g, "\\n")
      .replace(/\r/g, "\\r")
      .replace(/\t/g, "\\t");
  }
}
