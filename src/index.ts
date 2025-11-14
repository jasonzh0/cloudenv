#!/usr/bin/env node

import { Command } from "commander";
import chalk from "chalk";
import { InitCommand } from "./commands/init";
import { EnvCommand } from "./commands/env";
import { SecretsCommand } from "./commands/secrets";

const program = new Command();

program
  .name("cloudsec")
  .description("CLI tool for managing cloud secrets across multiple environments")
  .version("1.0.0");

// Global options
program
  .option("-e, --environment <env>", "Environment to use (dev, staging, prod)")
  .option("-p, --project <project>", "Cloud project ID (GCP project ID or AWS account ID)")
  .option("-r, --region <region>", "Cloud region (GCP region or AWS region)")
  .option("--config <path>", "Path to config file", ".cloudsec.yaml")
  .option("--verbose", "Enable verbose logging");

// Initialize configuration
program
  .command("init")
  .description("Initialize cloudsec configuration")
  .option("-f, --force", "Overwrite existing configuration")
  .action(async (options) => {
    try {
      const initCommand = new InitCommand();
      await initCommand.execute(options);
    } catch (error) {
      console.error(chalk.red("Error initializing configuration:"), error);
      process.exit(1);
    }
  });

// List all secrets
program
  .command("list")
  .alias("ls")
  .description("List all secrets from the secret file")
  .option("-e, --environment <env>", "Environment to use (dev, prod)")
  .action(async (options) => {
    try {
      const secretsCommand = new SecretsCommand();
      await secretsCommand.list({
        environment: options.environment || program.opts().environment,
      });
    } catch (error) {
      console.error(chalk.red("Error listing secrets:"), error);
      process.exit(1);
    }
  });

// Get a specific secret value
program
  .command("get <key>")
  .description("Get the value of a specific secret")
  .option("-e, --environment <env>", "Environment to use (dev, prod)")
  .action(async (key, options) => {
    try {
      const secretsCommand = new SecretsCommand();
      await secretsCommand.get(key, {
        environment: options.environment || program.opts().environment,
      });
    } catch (error) {
      console.error(chalk.red("Error getting secret:"), error);
      process.exit(1);
    }
  });

// Set or update a secret
program
  .command("set <key> [value]")
  .description("Set or update a secret value")
  .option("-e, --environment <env>", "Environment to use (dev, prod)")
  .action(async (key, value, options) => {
    try {
      const secretsCommand = new SecretsCommand();
      await secretsCommand.set(key, value, {
        environment: options.environment || program.opts().environment,
      });
    } catch (error) {
      console.error(chalk.red("Error setting secret:"), error);
      process.exit(1);
    }
  });

// Delete a secret
program
  .command("delete <key>")
  .alias("rm")
  .description("Delete a secret")
  .option("-e, --environment <env>", "Environment to use (dev, prod)")
  .option("--force", "Skip confirmation prompt")
  .action(async (key, options) => {
    try {
      const secretsCommand = new SecretsCommand();
      await secretsCommand.delete(key, {
        environment: options.environment || program.opts().environment,
        force: options.force,
      });
    } catch (error) {
      console.error(chalk.red("Error deleting secret:"), error);
      process.exit(1);
    }
  });

// Import secrets from a JSON file
program
  .command("import <file>")
  .description("Import secrets from a JSON file")
  .option("-e, --environment <env>", "Environment to use (dev, staging, prod)")
  .option("--force", "Skip confirmation prompts")
  .action(async (file, options) => {
    try {
      const secretsCommand = new SecretsCommand();
      await secretsCommand.import(file, {
        environment: options.environment || program.opts().environment,
        force: options.force,
      });
    } catch (error) {
      console.error(chalk.red("Error importing secrets:"), error);
      process.exit(1);
    }
  });

// Download secrets to a JSON file
program
  .command("download [output]")
  .alias("pull")
  .description("Download secrets to a JSON file")
  .option("-e, --environment <env>", "Environment to use (dev, staging, prod)")
  .option("-o, --output <path>", "Output file path")
  .action(async (output, options) => {
    try {
      const secretsCommand = new SecretsCommand();
      await secretsCommand.download(
        options.output || output,
        {
          environment: options.environment || program.opts().environment,
        },
      );
    } catch (error) {
      console.error(chalk.red("Error downloading secrets:"), error);
      process.exit(1);
    }
  });

// Set local environment variables from remote secrets
program
  .command("env")
  .description("Set local environment variables from remote secrets")
  .option("-e, --environment <env>", "Environment to use (dev, staging, prod)")
  .option("--filter <pattern>", "Filter secrets by name pattern")
  .option("--prefix <prefix>", "Prefix to remove from secret names")
  .option("--shell <shell>", "Shell type (bash, fish, zsh)", "bash")
  .option("--export", "Include 'export' keyword in output")
  .option("--verbose", "Show verbose output")
  .action(async (options) => {
    try {
      const envCommand = new EnvCommand();
      await envCommand.execute({
        ...options,
        environment: options.environment || program.opts().environment,
      });
    } catch (error) {
      console.error(chalk.red("Error setting environment variables:"), error);
      process.exit(1);
    }
  });

// Parse command line arguments
program.parse();

// Show help if no command provided
if (!process.argv.slice(2).length) {
  program.outputHelp();
}
