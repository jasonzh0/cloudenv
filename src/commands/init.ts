import * as path from "path";
import chalk from "chalk";
import inquirer from "inquirer";
import { ConfigManager } from "../services/config-manager";
import { Environment } from "../types";

export class InitCommand {
  async execute(options: { force?: boolean }): Promise<void> {
    const configManager = new ConfigManager();

    if ((await configManager.configExists()) && !options.force) {
      console.log(
        chalk.yellow(
          "Configuration file already exists. Use --force to overwrite.",
        ),
      );
      return;
    }

    console.log(chalk.blue("Initializing cloudsec configuration...\n"));

    const answers = await inquirer.prompt([
      {
        type: "list",
        name: "defaultProvider",
        message: "Default Cloud Provider:",
        choices: [
          { name: "Google Cloud Platform (GCP)", value: "gcp" },
          { name: "Amazon Web Services (AWS) - Not yet implemented", value: "aws", disabled: true },
        ],
        default: "gcp",
      },
      {
        type: "input",
        name: "defaultProject",
        message: (answers: any) => {
          return answers.defaultProvider === "gcp"
            ? "Default GCP Project ID:"
            : "Default AWS Account ID / Project ID:";
        },
        validate: (input: string) =>
          input.length > 0 || "Project ID is required",
      },
      {
        type: "input",
        name: "defaultRegion",
        message: (answers: any) => {
          return answers.defaultProvider === "gcp"
            ? "Default GCP Region:"
            : "Default AWS Region:";
        },
        default: (answers: any) => {
          return answers.defaultProvider === "gcp" ? "us-central1" : "us-east-1";
        },
        validate: (input: string) => input.length > 0 || "Region is required",
      },
      {
        type: "input",
        name: "configPath",
        message: "Configuration file path:",
        default: ".cloudsec.yaml",
      },
    ]);

    // Get environment configurations
    const environments: Environment[] = [];
    let addMore = true;

    while (addMore) {
      const envAnswers = await inquirer.prompt([
        {
          type: "input",
          name: "name",
          message: "Environment name:",
          validate: (input: string) =>
            input.length > 0 || "Environment name is required",
        },
        {
          type: "list",
          name: "provider",
          message: "Cloud Provider for this environment:",
          choices: [
            { name: "Google Cloud Platform (GCP)", value: "gcp" },
            { name: "Amazon Web Services (AWS) - Not yet implemented", value: "aws", disabled: true },
          ],
          default: answers.defaultProvider,
        },
        {
          type: "input",
          name: "projectId",
          message: (answers: any, prev: any) => {
            return prev.provider === "gcp"
              ? "GCP Project ID for this environment:"
              : "AWS Account ID / Project ID for this environment:";
          },
          default: answers.defaultProject,
          validate: (input: string) =>
            input.length > 0 || "Project ID is required",
        },
        {
          type: "input",
          name: "region",
          message: (answers: any, prev: any) => {
            return prev.provider === "gcp"
              ? "GCP Region for this environment:"
              : "AWS Region for this environment:";
          },
          default: answers.defaultRegion,
          validate: (input: string) => input.length > 0 || "Region is required",
        },
        {
          type: "input",
          name: "prefix",
          message: "Secret name prefix (optional):",
          default: (prev: any) => `${prev.name}-`,
        },
      ]);

      environments.push({
        name: envAnswers.name,
        provider: envAnswers.provider,
        projectId: envAnswers.projectId,
        region: envAnswers.region,
        prefix: envAnswers.prefix || undefined,
        labels: {
          environment: envAnswers.name,
          managed_by: "cloudsec",
        },
      });

      const { continueAdding } = await inquirer.prompt([
        {
          type: "confirm",
          name: "continueAdding",
          message: "Add another environment?",
          default: false,
        },
      ]);

      addMore = continueAdding;
    }

    // Create configuration
    const config = {
      environments,
      defaultEnvironment: environments[0]?.name,
      defaultProject: answers.defaultProject,
      defaultRegion: answers.defaultRegion,
    };

    // Save configuration
    const finalConfigManager = new ConfigManager(answers.configPath);
    await finalConfigManager.saveConfig(config);

    console.log(chalk.green("\n✅ Configuration created successfully!"));
    console.log(
      chalk.blue(`Configuration saved to: ${path.resolve(answers.configPath)}`),
    );
    console.log(chalk.yellow("\nNext steps:"));
    console.log(
      "1. Update the configuration file with your actual project IDs",
    );
    const hasGcp = environments.some((env) => env.provider === "gcp");
    const hasAws = environments.some((env) => env.provider === "aws");
    if (hasGcp) {
      console.log("2. Ensure you have the necessary GCP permissions");
    }
    if (hasAws) {
      console.log(
        chalk.red(
          "2. ⚠️  AWS provider is not yet implemented. Please use 'gcp' for now.",
        ),
      );
    }
    console.log("3. Run `cloudsec list` to test the connection");
  }
}
