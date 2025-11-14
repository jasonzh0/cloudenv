# Cloudsec CLI

[![npm version](https://img.shields.io/npm/v/cloudsec)](https://www.npmjs.com/package/cloudsec)

A command-line tool for managing secrets across multiple cloud providers and environments. Cloudsec simplifies secret management by providing a unified interface to create, read, update, and delete secrets stored in cloud secret management services.

## Features

- ☁️ **Multi-cloud support** - Works with GCP Secret Manager and AWS Secrets Manager (AWS coming soon)
- 🔐 **Multi-environment support** - Manage secrets across dev, staging, and production environments
- 📦 **Bulk operations** - Import and export secrets from JSON files
- 🔄 **Environment variable sync** - Easily sync secrets to local environment variables
- 🏷️ **Automatic labeling** - Secrets are automatically tagged with environment metadata
- ⚡ **Fast and efficient** - Direct integration with cloud provider APIs
- 🔌 **Provider abstraction** - Switch between cloud providers with a single configuration change

## Installation

### Prerequisites

- Node.js >= 18.0.0
- Cloud provider account with secret management service enabled:
  - **GCP**: Secret Manager API enabled
  - **AWS**: Secrets Manager service access (coming soon)
- Cloud provider authentication configured:
  - **GCP**: `gcloud auth application-default login` or service account credentials
  - **AWS**: AWS CLI configured or IAM credentials (coming soon)

### Install from npm

```bash
npm install -g cloudsec
```

After installation, you can use the `cloudsec` command from anywhere.

### Install from source

```bash
cd cli
npm install
npm run build
npm link  # Optional: link globally for `cloudsec` command
```

### Development

```bash
npm run dev  # Run with tsx for development
```

## Quick Start

### 1. Initialize Configuration

First, initialize Cloudsec with your cloud provider settings:

```bash
cloudsec init
```

This creates a `.cloudsec.yaml` configuration file in your current directory. You'll be prompted to configure:
- Cloud provider (GCP or AWS)
- Project/account IDs for each environment
- Regions
- Secret name prefixes
- Default environment

### 2. Configure Cloud Provider Authentication

**For GCP:**
Ensure you're authenticated with GCP:

```bash
gcloud auth application-default login
```

Or set the `GOOGLE_APPLICATION_CREDENTIALS` environment variable to point to a service account key file.

**For AWS (coming soon):**
Configure AWS credentials using the AWS CLI:

```bash
aws configure
```

Or set the `AWS_ACCESS_KEY_ID` and `AWS_SECRET_ACCESS_KEY` environment variables.

### 3. Start Managing Secrets

```bash
# Set a secret
cloudsec set DATABASE_URL "postgresql://localhost:5432/mydb" -e dev

# Get a secret
cloudsec get DATABASE_URL -e dev

# List all secrets
cloudsec list -e dev

# Sync secrets to local environment
cloudsec env -e dev --export
```

## Configuration

The `.cloudsec.yaml` file defines your environments and cloud provider settings:

```yaml
environments:
  - name: dev
    provider: gcp
    projectId: your-dev-project-id
    region: us-central1
    prefix: dev-
    labels:
      environment: development
      managed_by: cloudsec
  - name: staging
    provider: gcp
    projectId: your-staging-project-id
    region: us-central1
    prefix: staging-
    labels:
      environment: staging
      managed_by: cloudsec
  - name: prod
    provider: gcp
    projectId: your-prod-project-id
    region: us-central1
    prefix: prod-
    labels:
      environment: production
      managed_by: cloudsec
defaultEnvironment: dev
defaultProject: your-default-project-id
defaultRegion: us-central1
```

**Provider Options:**
- `gcp` - Google Cloud Platform Secret Manager (fully supported)
- `aws` - AWS Secrets Manager (coming soon)

Each environment can use a different provider, allowing you to mix and match cloud providers across your environments.

## Commands

### `init`

Initialize Cloudsec configuration in the current directory.

```bash
cloudsec init
cloudsec init --force  # Overwrite existing configuration
```

### `list` / `ls`

List all secrets for an environment.

```bash
cloudsec list
cloudsec list -e dev
cloudsec ls -e prod
```

### `get <key>`

Retrieve the value of a specific secret.

```bash
cloudsec get DATABASE_URL
cloudsec get API_KEY -e prod
```

### `set <key> [value]`

Set or update a secret value. If no value is provided, you'll be prompted to enter it securely.

```bash
cloudsec set DATABASE_URL "postgresql://localhost:5432/mydb"
cloudsec set API_KEY -e prod  # Interactive prompt
```

### `delete <key>` / `rm <key>`

Delete a secret.

```bash
cloudsec delete OLD_SECRET
cloudsec rm API_KEY -e dev --force  # Skip confirmation
```

### `import <file>`

Import secrets from a JSON file. The file should contain key-value pairs.

```bash
cloudsec import secrets.json
cloudsec import secrets.json -e prod --force
```

Example `secrets.json`:
```json
{
  "DATABASE_URL": "postgresql://localhost:5432/mydb",
  "API_KEY": "your-api-key-here",
  "JWT_SECRET": "your-jwt-secret"
}
```

### `download [output]` / `pull [output]`

Download all secrets from an environment to a JSON file.

```bash
cloudsec download
cloudsec download secrets-backup.json
cloudsec pull -e prod -o prod-secrets.json
```

### `env`

Set local environment variables from remote secrets. This command outputs shell-compatible variable assignments.

```bash
# Output to stdout (for bash/zsh)
cloudsec env -e dev --export | source /dev/stdin

# Output to stdout (for fish shell)
cloudsec env -e dev --export --shell fish | source

# Filter secrets by pattern
cloudsec env -e dev --filter "API_*" --export

# Remove prefix from secret names
cloudsec env -e dev --prefix "dev-" --export

# Show verbose output
cloudsec env -e dev --verbose
```

**Options:**
- `--filter <pattern>` - Filter secrets by name pattern (supports wildcards)
- `--prefix <prefix>` - Remove prefix from secret names when setting env vars
- `--shell <shell>` - Shell type: `bash`, `fish`, or `zsh` (default: `bash`)
- `--export` - Include `export` keyword in output
- `--verbose` - Show verbose output

## Global Options

These options can be used with any command:

- `-e, --environment <env>` - Environment to use (dev, staging, prod)
- `-p, --project <project>` - Cloud project/account ID (overrides config)
- `-r, --region <region>` - Cloud region (overrides config)
- `--config <path>` - Path to config file (default: `.cloudsec.yaml`)
- `--verbose` - Enable verbose logging

## Examples

### Working with Multiple Environments

```bash
# Set a secret in dev
cloudsec set DATABASE_URL "postgresql://localhost:5432/devdb" -e dev

# Set the same secret in prod with different value
cloudsec set DATABASE_URL "postgresql://prod-db:5432/proddb" -e prod

# List all secrets across environments
cloudsec list -e dev
cloudsec list -e prod
```

### Using Different Cloud Providers

You can configure different environments to use different cloud providers:

```yaml
environments:
  - name: dev
    provider: gcp
    projectId: dev-gcp-project
    # ... other config
  - name: prod
    provider: aws  # Coming soon
    projectId: prod-aws-account
    # ... other config
```

This allows you to leverage the best features of each cloud provider for different environments.

### Bulk Operations

```bash
# Export all dev secrets
cloudsec download dev-secrets.json -e dev

# Import secrets to staging
cloudsec import dev-secrets.json -e staging

# Backup production secrets
cloudsec download prod-backup-$(date +%Y%m%d).json -e prod
```

### Local Development Setup

```bash
# Load all dev secrets as environment variables
eval $(cloudsec env -e dev --export)

# Load only API-related secrets
eval $(cloudsec env -e dev --filter "API_*" --export)

# Load secrets without the "dev-" prefix
eval $(cloudsec env -e dev --prefix "dev-" --export)
```

### CI/CD Integration

```bash
# In your CI pipeline, load secrets before running tests
cloudsec env -e staging --export >> $GITHUB_ENV

# Or for GitLab CI
cloudsec env -e staging --export >> .env
```

## How It Works

Cloudsec uses a provider-based architecture that abstracts cloud-specific implementations behind a unified interface. This allows you to:

- Switch between cloud providers by changing the `provider` field in your configuration
- Use different providers for different environments (e.g., GCP for dev, AWS for prod)
- Maintain consistent commands and workflows regardless of the underlying cloud provider

The tool communicates with cloud secret management services through provider implementations:
- **GCP Provider**: Uses Google Cloud Secret Manager API
- **AWS Provider**: Uses AWS Secrets Manager API (coming soon)

Each provider implements the same interface, ensuring consistent behavior across all supported cloud platforms.

## Troubleshooting

### Authentication Errors

If you see authentication errors, ensure you're properly authenticated with your cloud provider:

**For GCP:**
```bash
# Re-authenticate with GCP
gcloud auth application-default login

# Or set service account credentials
export GOOGLE_APPLICATION_CREDENTIALS=/path/to/service-account-key.json
```

**For AWS (coming soon):**
```bash
# Configure AWS credentials
aws configure

# Or set environment variables
export AWS_ACCESS_KEY_ID=your-access-key
export AWS_SECRET_ACCESS_KEY=your-secret-key
export AWS_DEFAULT_REGION=us-east-1
```

### Secret Not Found

If a secret doesn't exist, Cloudsec will create it automatically when you use `set` or `import`. Use `list` to verify secrets exist.

### Permission Denied

Ensure your cloud provider account has the necessary permissions:

**For GCP:**
- `roles/secretmanager.secretAccessor` (to read secrets)
- `roles/secretmanager.secretVersionManager` (to create/update secrets)

**For AWS (coming soon):**
- `secretsmanager:GetSecretValue` (to read secrets)
- `secretsmanager:CreateSecret` (to create secrets)
- `secretsmanager:UpdateSecret` (to update secrets)
- `secretsmanager:DeleteSecret` (to delete secrets)

## Contributing

Contributions are welcome! Please ensure your code follows the existing style and includes tests where applicable.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
