import { Environment } from "../types";
import { IProvider } from "./base-provider";
import { GcpProvider } from "./gcp-provider";
import { AwsProvider } from "./aws-provider";

/**
 * Factory function to create the appropriate provider instance based on environment configuration
 */
export function createProvider(environment: Environment): IProvider {
  switch (environment.provider) {
    case "gcp":
      return new GcpProvider(environment);
    case "aws":
      return new AwsProvider(environment);
    default:
      throw new Error(
        `Unsupported provider: ${environment.provider}. Supported providers are: 'gcp', 'aws'`
      );
  }
}

